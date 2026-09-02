// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <algorithm>
#include <array>
#include <charconv>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <string_view>
#include <system_error>
#include <vector>

#include "tiled_gemm_reference.hpp"

namespace {

constexpr std::size_t kMaximumMatrixElements = std::size_t{1U} << 24U;
constexpr float kMeasurementAlpha = 0.75F;
constexpr float kMeasurementBeta = 0.25F;

struct Config {
  ex15::GemmShape shape;
  std::size_t a_count;
  std::size_t b_count;
  std::size_t c_count;
};

enum class Stage {
  kCanonical16x16x16,
  kKTile16x16x8,
  kRectangular32x8x8,
  kCoarsened32x16x8,
};

struct StageSpec {
  Stage stage;
  std::string_view id;
};

constexpr std::array<StageSpec, 4> kStages{{
    {Stage::kCanonical16x16x16, "canonical-16x16x16"},
    {Stage::kKTile16x16x8, "k-tile-16x16x8"},
    {Stage::kRectangular32x8x8, "rectangular-32x8x8"},
    {Stage::kCoarsened32x16x8, "coarsened-32x16x8"},
}};

bool cuda_ok(cudaError_t status) noexcept {
  return status == cudaSuccess;
}

bool parse_positive_size(std::string_view text, std::size_t* parsed) noexcept {
  if (parsed == nullptr || text.empty() ||
      !std::all_of(text.begin(), text.end(), [](char value) {
        return value >= '0' && value <= '9';
      })) {
    return false;
  }

  std::size_t value = 0U;
  const std::from_chars_result result =
      std::from_chars(text.data(), text.data() + text.size(), value);
  if (result.ec != std::errc{} || result.ptr != text.data() + text.size() ||
      value == 0U) {
    return false;
  }
  *parsed = value;
  return true;
}

bool parse_cli(int argc, char** argv, Config* config) noexcept {
  if (config == nullptr || argv == nullptr || argc != 10 ||
      std::string_view(argv[1]) != "--all-stages" ||
      std::string_view(argv[2]) != "--m" ||
      std::string_view(argv[4]) != "--k" ||
      std::string_view(argv[6]) != "--n" ||
      std::string_view(argv[8]) != "--verify" ||
      std::string_view(argv[9]) != "tolerance") {
    return false;
  }

  ex15::GemmShape shape{};
  std::size_t a_count = 0U;
  std::size_t b_count = 0U;
  std::size_t c_count = 0U;
  if (!parse_positive_size(argv[3], &shape.m) ||
      !parse_positive_size(argv[5], &shape.k) ||
      !parse_positive_size(argv[7], &shape.n) ||
      !ex15::matrix_counts(shape, &a_count, &b_count, &c_count) ||
      a_count > kMaximumMatrixElements ||
      b_count > kMaximumMatrixElements ||
      c_count > kMaximumMatrixElements) {
    return false;
  }

  *config = {shape, a_count, b_count, c_count};
  return true;
}

const ex15::Fixture* canonical_fixture_for(ex15::GemmShape shape) noexcept {
  for (const ex15::Fixture& fixture : ex15::kFixtures) {
    if (fixture.shape.m == shape.m && fixture.shape.k == shape.k &&
        fixture.shape.n == shape.n) {
      return &fixture;
    }
  }
  return nullptr;
}

template <unsigned int BlockRows,
          unsigned int BlockColumns,
          unsigned int TileK,
          unsigned int RowsPerThread>
__device__ void tiled_gemm_candidate_body(
    const float* a,
    const float* b,
    float* c,
    std::size_t m,
    std::size_t k,
    std::size_t n,
    float alpha,
    float beta,
    float* tile_a,
    float* tile_b) {
  static_assert(BlockRows % RowsPerThread == 0U);
  static_assert(BlockColumns * (BlockRows / RowsPerThread) == 256U);

  constexpr unsigned int kThreadsPerBlock = 256U;
  const unsigned int local_thread =
      threadIdx.y * blockDim.x + threadIdx.x;
  const unsigned int local_row_base = threadIdx.y * RowsPerThread;
  const unsigned int local_column = threadIdx.x;
  const std::size_t output_row_base =
      static_cast<std::size_t>(blockIdx.y) * BlockRows + local_row_base;
  const std::size_t output_column =
      static_cast<std::size_t>(blockIdx.x) * BlockColumns + local_column;
  float sums[RowsPerThread];
  for (unsigned int owned_row = 0U; owned_row < RowsPerThread; ++owned_row) {
    sums[owned_row] = 0.0F;
  }

  for (std::size_t tile_start = 0U; tile_start < k; tile_start += TileK) {
    for (unsigned int slot = local_thread;
         slot < BlockRows * TileK;
         slot += kThreadsPerBlock) {
      const unsigned int local_row = slot / TileK;
      const unsigned int local_k = slot % TileK;
      const std::size_t row =
          static_cast<std::size_t>(blockIdx.y) * BlockRows + local_row;
      const std::size_t column = tile_start + local_k;
      tile_a[local_row * TileK + local_k] =
          (row < m && column < k) ? a[row * k + column] : 0.0F;
    }
    for (unsigned int slot = local_thread;
         slot < TileK * BlockColumns;
         slot += kThreadsPerBlock) {
      const unsigned int local_k = slot / BlockColumns;
      const unsigned int local_column_b = slot % BlockColumns;
      const std::size_t row = tile_start + local_k;
      const std::size_t column =
          static_cast<std::size_t>(blockIdx.x) * BlockColumns +
          local_column_b;
      tile_b[local_k * BlockColumns + local_column_b] =
          (row < k && column < n) ? b[row * n + column] : 0.0F;
    }

    __syncthreads();
    for (unsigned int local_k = 0U; local_k < TileK; ++local_k) {
      for (unsigned int owned_row = 0U;
           owned_row < RowsPerThread;
           ++owned_row) {
        sums[owned_row] +=
            tile_a[(local_row_base + owned_row) * TileK + local_k] *
            tile_b[local_k * BlockColumns + local_column];
      }
    }
    __syncthreads();
  }

  if (output_column < n) {
    for (unsigned int owned_row = 0U;
         owned_row < RowsPerThread;
         ++owned_row) {
      const std::size_t output_row = output_row_base + owned_row;
      if (output_row < m) {
        const std::size_t output_index = output_row * n + output_column;
        c[output_index] =
            alpha * sums[owned_row] + beta * c[output_index];
      }
    }
  }
}

__global__ void canonical_16x16x16_kernel(
    const float* a,
    const float* b,
    float* c,
    std::size_t m,
    std::size_t k,
    std::size_t n,
    float alpha,
    float beta) {
  __shared__ float tile_a[16U * 16U];
  __shared__ float tile_b[16U * 16U];
  tiled_gemm_candidate_body<16U, 16U, 16U, 1U>(
      a, b, c, m, k, n, alpha, beta, tile_a, tile_b);
}

__global__ void k_tile_16x16x8_kernel(
    const float* a,
    const float* b,
    float* c,
    std::size_t m,
    std::size_t k,
    std::size_t n,
    float alpha,
    float beta) {
  __shared__ float tile_a[16U * 8U];
  __shared__ float tile_b[8U * 16U];
  tiled_gemm_candidate_body<16U, 16U, 8U, 1U>(
      a, b, c, m, k, n, alpha, beta, tile_a, tile_b);
}

__global__ void rectangular_32x8x8_kernel(
    const float* a,
    const float* b,
    float* c,
    std::size_t m,
    std::size_t k,
    std::size_t n,
    float alpha,
    float beta) {
  __shared__ float tile_a[32U * 8U];
  __shared__ float tile_b[8U * 8U];
  tiled_gemm_candidate_body<32U, 8U, 8U, 1U>(
      a, b, c, m, k, n, alpha, beta, tile_a, tile_b);
}

__global__ void coarsened_32x16x8_kernel(
    const float* a,
    const float* b,
    float* c,
    std::size_t m,
    std::size_t k,
    std::size_t n,
    float alpha,
    float beta) {
  __shared__ float tile_a[32U * 8U];
  __shared__ float tile_b[8U * 16U];
  tiled_gemm_candidate_body<32U, 16U, 8U, 2U>(
      a, b, c, m, k, n, alpha, beta, tile_a, tile_b);
}

template <unsigned int BlockRows, unsigned int BlockColumns>
dim3 stage_grid(ex15::GemmShape shape) {
  return {
      static_cast<unsigned int>(
          (shape.n + BlockColumns - 1U) / BlockColumns),
      static_cast<unsigned int>((shape.m + BlockRows - 1U) / BlockRows),
      1U,
  };
}

void launch_stage(
    Stage stage,
    const float* a,
    const float* b,
    float* c,
    ex15::GemmShape shape,
    float alpha,
    float beta) {
  switch (stage) {
    case Stage::kCanonical16x16x16: {
      const dim3 block(16U, 16U, 1U);
      canonical_16x16x16_kernel<<<stage_grid<16U, 16U>(shape), block>>>(
          a, b, c, shape.m, shape.k, shape.n, alpha, beta);
      break;
    }
    case Stage::kKTile16x16x8: {
      const dim3 block(16U, 16U, 1U);
      k_tile_16x16x8_kernel<<<stage_grid<16U, 16U>(shape), block>>>(
          a, b, c, shape.m, shape.k, shape.n, alpha, beta);
      break;
    }
    case Stage::kRectangular32x8x8: {
      const dim3 block(8U, 32U, 1U);
      rectangular_32x8x8_kernel<<<stage_grid<32U, 8U>(shape), block>>>(
          a, b, c, shape.m, shape.k, shape.n, alpha, beta);
      break;
    }
    case Stage::kCoarsened32x16x8: {
      const dim3 block(16U, 16U, 1U);
      coarsened_32x16x8_kernel<<<stage_grid<32U, 16U>(shape), block>>>(
          a, b, c, shape.m, shape.k, shape.n, alpha, beta);
      break;
    }
  }
}

class DeviceAllocation {
 public:
  DeviceAllocation() = default;
  DeviceAllocation(const DeviceAllocation&) = delete;
  DeviceAllocation& operator=(const DeviceAllocation&) = delete;

  ~DeviceAllocation() {
    static_cast<void>(release());
  }

  bool allocate(std::size_t bytes) noexcept {
    return pointer_ == nullptr &&
           cuda_ok(cudaMalloc(reinterpret_cast<void**>(&pointer_), bytes));
  }

  float* get() noexcept {
    return pointer_;
  }

  bool release() noexcept {
    if (pointer_ == nullptr) return true;
    const bool released = cuda_ok(cudaFree(pointer_));
    pointer_ = nullptr;
    return released;
  }

 private:
  float* pointer_ = nullptr;
};

bool run_all_stages(const Config& config) {
  std::vector<float> a(config.a_count);
  std::vector<float> b(config.b_count);
  std::vector<float> initial_c(config.c_count);
  std::vector<float> actual(config.c_count);
  std::vector<double> expected(config.c_count);

  const ex15::Fixture* canonical_fixture = canonical_fixture_for(config.shape);
  float alpha = kMeasurementAlpha;
  float beta = kMeasurementBeta;
  if (canonical_fixture != nullptr) {
    alpha = canonical_fixture->alpha;
    beta = canonical_fixture->beta;
    if (!ex15::make_fixture(
            canonical_fixture->id,
            a.data(),
            a.size(),
            b.data(),
            b.size(),
            initial_c.data(),
            initial_c.size())) {
      return false;
    }
  } else {
    for (std::size_t index = 0U; index < a.size(); ++index) {
      a[index] =
          static_cast<float>(static_cast<int>(index % 17U) - 8) / 16.0F;
    }
    for (std::size_t index = 0U; index < b.size(); ++index) {
      b[index] =
          static_cast<float>(static_cast<int>(index % 13U) - 6) / 12.0F;
    }
    for (std::size_t index = 0U; index < initial_c.size(); ++index) {
      initial_c[index] =
          static_cast<float>(static_cast<int>(index % 7U) - 3) / 10.0F;
    }
  }

  if (!ex15::gemm_reference(
          a.data(),
          a.size(),
          b.data(),
          b.size(),
          initial_c.data(),
          initial_c.size(),
          config.shape,
          alpha,
          beta,
          expected.data(),
          expected.size())) {
    return false;
  }

  const std::size_t a_bytes = a.size() * sizeof(float);
  const std::size_t b_bytes = b.size() * sizeof(float);
  const std::size_t c_bytes = initial_c.size() * sizeof(float);
  DeviceAllocation device_a;
  DeviceAllocation device_b;
  DeviceAllocation device_c;
  bool device_ready = device_a.allocate(a_bytes) &&
                      device_b.allocate(b_bytes) &&
                      device_c.allocate(c_bytes);
  if (device_ready) {
    device_ready = cuda_ok(cudaMemcpy(
        device_a.get(), a.data(), a_bytes, cudaMemcpyHostToDevice));
  }
  if (device_ready) {
    device_ready = cuda_ok(cudaMemcpy(
        device_b.get(), b.data(), b_bytes, cudaMemcpyHostToDevice));
  }

  bool all_stages_pass = true;
  for (const StageSpec& stage : kStages) {
    bool stage_pass = device_ready && cuda_ok(cudaMemcpy(
        device_c.get(),
        initial_c.data(),
        c_bytes,
        cudaMemcpyHostToDevice));
    if (stage_pass) {
      launch_stage(
          stage.stage,
          device_a.get(),
          device_b.get(),
          device_c.get(),
          config.shape,
          alpha,
          beta);
      stage_pass = cuda_ok(cudaGetLastError());
    }
    if (stage_pass) stage_pass = cuda_ok(cudaDeviceSynchronize());
    if (stage_pass) {
      stage_pass = cuda_ok(cudaMemcpy(
          actual.data(),
          device_c.get(),
          c_bytes,
          cudaMemcpyDeviceToHost));
    }

    if (stage_pass) {
      const ex15::VerificationResult verification = ex15::verify_tolerance(
          expected.data(),
          expected.size(),
          actual.data(),
          actual.size(),
          config.shape.m,
          config.shape.n,
          ex15::kAbsoluteTolerance,
          ex15::kRelativeTolerance);
      stage_pass = verification.valid && verification.matches;
    }

    std::cout << "stage=" << stage.id
              << " shape=" << config.shape.m << 'x' << config.shape.k << 'x'
              << config.shape.n
              << " correctness=" << (stage_pass ? "PASS" : "FAIL")
              << '\n';
    all_stages_pass = stage_pass && all_stages_pass;
  }

  const bool c_released = device_c.release();
  const bool b_released = device_b.release();
  const bool a_released = device_a.release();
  return device_ready && all_stages_pass && c_released && b_released &&
      a_released;
}

}  // namespace

int main(int argc, char** argv) {
  Config config{};
  bool all_pass = false;
  try {
    all_pass = parse_cli(argc, argv, &config) && run_all_stages(config);
  } catch (...) {
    all_pass = false;
  }

  std::cout << "result=" << (all_pass ? "PASS" : "FAIL") << '\n';
  return all_pass ? EXIT_SUCCESS : EXIT_FAILURE;
}
