// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <algorithm>
#include <array>
#include <charconv>
#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <string_view>
#include <system_error>
#include <vector>

#include "tiled_transpose_reference.hpp"

namespace {

constexpr unsigned int kTileExtent = 32U;
constexpr unsigned int kThreadsPerBlock = 256U;
constexpr unsigned int kCooperativeSlots = 4U;
constexpr std::size_t kMaximumElementCount = (std::size_t{1U} << 24U);

struct Config {
  std::size_t rows;
  std::size_t columns;
  std::size_t element_count;
  ex14::MatrixShape output_shape;
};

enum class Stage {
  kBaselineDirect,
  kCoalescingDirection,
  kSharedMemoryTiling,
  kPaddedBankLayout,
};

struct StageSpec {
  Stage stage;
  std::string_view id;
};

constexpr std::array<StageSpec, 4> kStages{{
    {Stage::kBaselineDirect, "baseline-direct"},
    {Stage::kCoalescingDirection, "coalescing-direction"},
    {Stage::kSharedMemoryTiling, "shared-memory-tiling"},
    {Stage::kPaddedBankLayout, "padded-bank-layout"},
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
  if (config == nullptr || argv == nullptr || argc != 8 ||
      std::string_view(argv[1]) != "--all-stages" ||
      std::string_view(argv[2]) != "--rows" ||
      std::string_view(argv[4]) != "--columns" ||
      std::string_view(argv[6]) != "--verify" ||
      std::string_view(argv[7]) != "exact") {
    return false;
  }

  std::size_t rows = 0U;
  std::size_t columns = 0U;
  std::size_t element_count = 0U;
  ex14::MatrixShape output_shape{};
  if (!parse_positive_size(argv[3], &rows) ||
      !parse_positive_size(argv[5], &columns)) {
    return false;
  }

  const ex14::MatrixShape parsed_input_shape{rows, columns};
  if (!ex14::checked_element_count(parsed_input_shape, &element_count) ||
      element_count > kMaximumElementCount ||
      !ex14::transposed_shape(parsed_input_shape, &output_shape)) {
    return false;
  }

  *config = {rows, columns, element_count, output_shape};
  return true;
}

__global__ void baseline_direct(
    const float* input,
    float* output,
    std::size_t rows,
    std::size_t columns) {
  const std::size_t output_tile_row =
      static_cast<std::size_t>(blockIdx.x) * kTileExtent;
  const std::size_t output_tile_column =
      static_cast<std::size_t>(blockIdx.y) * kTileExtent;

  for (unsigned int slot = 0U; slot < kCooperativeSlots; ++slot) {
    const unsigned int local_index =
        threadIdx.x + slot * kThreadsPerBlock;
    const unsigned int output_local_row = local_index / kTileExtent;
    const unsigned int output_local_column = local_index % kTileExtent;
    const std::size_t output_row = output_tile_row + output_local_row;
    const std::size_t output_column =
        output_tile_column + output_local_column;
    if (output_row < columns && output_column < rows) {
      output[output_row * rows + output_column] =
          input[output_column * columns + output_row];
    }
  }
}

__global__ void coalescing_direction(
    const float* input,
    float* output,
    std::size_t rows,
    std::size_t columns) {
  const std::size_t input_tile_row =
      static_cast<std::size_t>(blockIdx.y) * kTileExtent;
  const std::size_t input_tile_column =
      static_cast<std::size_t>(blockIdx.x) * kTileExtent;

  for (unsigned int slot = 0U; slot < kCooperativeSlots; ++slot) {
    const unsigned int local_index =
        threadIdx.x + slot * kThreadsPerBlock;
    const unsigned int local_row = local_index / kTileExtent;
    const unsigned int local_column = local_index % kTileExtent;
    const std::size_t input_row = input_tile_row + local_row;
    const std::size_t input_column = input_tile_column + local_column;
    if (input_row < rows && input_column < columns) {
      output[input_column * rows + input_row] =
          input[input_row * columns + input_column];
    }
  }
}

__global__ void shared_memory_tiling(
    const float* input,
    float* output,
    std::size_t rows,
    std::size_t columns) {
  __shared__ float tile[32][32];

  const std::size_t input_tile_row =
      static_cast<std::size_t>(blockIdx.y) * kTileExtent;
  const std::size_t input_tile_column =
      static_cast<std::size_t>(blockIdx.x) * kTileExtent;
  for (unsigned int slot = 0U; slot < kCooperativeSlots; ++slot) {
    const unsigned int local_index =
        threadIdx.x + slot * kThreadsPerBlock;
    const unsigned int local_row = local_index / kTileExtent;
    const unsigned int local_column = local_index % kTileExtent;
    const std::size_t input_row = input_tile_row + local_row;
    const std::size_t input_column = input_tile_column + local_column;
    if (input_row < rows && input_column < columns) {
      tile[local_row][local_column] =
          input[input_row * columns + input_column];
    }
  }

  __syncthreads();

  const std::size_t output_tile_row =
      static_cast<std::size_t>(blockIdx.x) * kTileExtent;
  const std::size_t output_tile_column =
      static_cast<std::size_t>(blockIdx.y) * kTileExtent;
  for (unsigned int slot = 0U; slot < kCooperativeSlots; ++slot) {
    const unsigned int local_index =
        threadIdx.x + slot * kThreadsPerBlock;
    const unsigned int output_local_row = local_index / kTileExtent;
    const unsigned int output_local_column = local_index % kTileExtent;
    const std::size_t output_row = output_tile_row + output_local_row;
    const std::size_t output_column =
        output_tile_column + output_local_column;
    if (output_row < columns && output_column < rows) {
      output[output_row * rows + output_column] =
          tile[output_local_column][output_local_row];
    }
  }
}

__global__ void padded_bank_layout(
    const float* input,
    float* output,
    std::size_t rows,
    std::size_t columns) {
  __shared__ float tile[32][33];

  const std::size_t input_tile_row =
      static_cast<std::size_t>(blockIdx.y) * kTileExtent;
  const std::size_t input_tile_column =
      static_cast<std::size_t>(blockIdx.x) * kTileExtent;
  for (unsigned int slot = 0U; slot < kCooperativeSlots; ++slot) {
    const unsigned int local_index =
        threadIdx.x + slot * kThreadsPerBlock;
    const unsigned int local_row = local_index / kTileExtent;
    const unsigned int local_column = local_index % kTileExtent;
    const std::size_t input_row = input_tile_row + local_row;
    const std::size_t input_column = input_tile_column + local_column;
    if (input_row < rows && input_column < columns) {
      tile[local_row][local_column] =
          input[input_row * columns + input_column];
    }
  }

  __syncthreads();

  const std::size_t output_tile_row =
      static_cast<std::size_t>(blockIdx.x) * kTileExtent;
  const std::size_t output_tile_column =
      static_cast<std::size_t>(blockIdx.y) * kTileExtent;
  for (unsigned int slot = 0U; slot < kCooperativeSlots; ++slot) {
    const unsigned int local_index =
        threadIdx.x + slot * kThreadsPerBlock;
    const unsigned int output_local_row = local_index / kTileExtent;
    const unsigned int output_local_column = local_index % kTileExtent;
    const std::size_t output_row = output_tile_row + output_local_row;
    const std::size_t output_column =
        output_tile_column + output_local_column;
    if (output_row < columns && output_column < rows) {
      output[output_row * rows + output_column] =
          tile[output_local_column][output_local_row];
    }
  }
}

void launch_stage(
    Stage stage,
    const dim3& grid,
    const dim3& block,
    const float* input,
    float* output,
    std::size_t rows,
    std::size_t columns) {
  switch (stage) {
    case Stage::kBaselineDirect:
      baseline_direct<<<grid, block>>>(input, output, rows, columns);
      break;
    case Stage::kCoalescingDirection:
      coalescing_direction<<<grid, block>>>(input, output, rows, columns);
      break;
    case Stage::kSharedMemoryTiling:
      shared_memory_tiling<<<grid, block>>>(input, output, rows, columns);
      break;
    case Stage::kPaddedBankLayout:
      padded_bank_layout<<<grid, block>>>(input, output, rows, columns);
      break;
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
  const std::size_t bytes = config.element_count * sizeof(float);
  const ex14::MatrixShape input_shape{config.rows, config.columns};
  std::vector<float> input(config.element_count);
  std::vector<float> expected(config.element_count);
  std::vector<float> actual(config.element_count);
  std::vector<float> sentinel_output(
      config.element_count, std::numeric_limits<float>::quiet_NaN());

  for (std::size_t index = 0U; index < config.element_count; ++index) {
    input[index] = static_cast<float>(index + 1U);
  }
  if (!ex14::transpose_reference(
          input.data(),
          input.size(),
          input_shape,
          expected.data(),
          expected.size(),
          config.output_shape)) {
    return false;
  }

  DeviceAllocation device_input;
  DeviceAllocation device_output;
  bool device_ready = device_input.allocate(bytes) &&
                      device_output.allocate(bytes);
  if (device_ready) {
    device_ready = cuda_ok(cudaMemcpy(
        device_input.get(), input.data(), bytes, cudaMemcpyHostToDevice));
  }

  const dim3 block(kThreadsPerBlock, 1U, 1U);
  const dim3 grid(
      static_cast<unsigned int>(
          (config.columns + kTileExtent - 1U) / kTileExtent),
      static_cast<unsigned int>(
          (config.rows + kTileExtent - 1U) / kTileExtent),
      1U);

  bool all_stages_pass = true;
  for (const StageSpec& stage : kStages) {
    bool stage_pass = device_ready;
    if (stage_pass) {
      stage_pass = cuda_ok(cudaMemcpy(
          device_output.get(),
          sentinel_output.data(), bytes, cudaMemcpyHostToDevice));
    }
    if (stage_pass) {
      launch_stage(
          stage.stage,
          grid,
          block,
          device_input.get(),
          device_output.get(),
          config.rows,
          config.columns);
      stage_pass = cuda_ok(cudaGetLastError());
    }
    if (stage_pass) {
      stage_pass = cuda_ok(cudaDeviceSynchronize());
    }
    if (stage_pass) {
      stage_pass = cuda_ok(cudaMemcpy(
          actual.data(),
          device_output.get(), bytes, cudaMemcpyDeviceToHost));
    }
    if (stage_pass) {
      const bool sentinel_remains = std::any_of(
          actual.begin(), actual.end(), [](float value) {
            return std::isnan(value);
          });
      const ex14::VerificationResult verification = ex14::verify_exact(
          expected.data(),
          expected.size(),
          actual.data(),
          actual.size(),
          config.output_shape);
      stage_pass = !sentinel_remains &&
                   verification.valid && verification.matches;
    }

    std::cout << "stage=" << stage.id
              << " shape=" << config.rows << 'x' << config.columns
              << "->" << config.columns << 'x' << config.rows
              << " correctness=" << (stage_pass ? "PASS" : "FAIL")
              << '\n';
    all_stages_pass = stage_pass && all_stages_pass;
  }

  const bool output_released = device_output.release();
  const bool input_released = device_input.release();
  return device_ready && all_stages_pass && output_released && input_released;
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
