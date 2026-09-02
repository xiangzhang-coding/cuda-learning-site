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

#include "multi_stage_reduction_reference.hpp"

namespace {

constexpr unsigned int kWarpSize = 32U;
constexpr unsigned int kFullWarpMask = 0xffffffffU;
constexpr unsigned int kTwoLoadsPerThread = 2U;
constexpr unsigned int kFourLoadsPerThread = 4U;
constexpr std::size_t kMaximumElementCount = 16777219U;

struct Config {
  std::size_t element_count;
};

enum class Stage {
  kCanonicalSharedTree,
  kWarpTailControl,
  kReassociatedWarpOrder,
  kFourLoadStaging,
};

struct StageSpec {
  Stage stage;
  std::string_view id;
  unsigned int loads_per_thread;
};

constexpr std::array<StageSpec, 4> kStages{{
    {Stage::kCanonicalSharedTree, "canonical-shared-tree", kTwoLoadsPerThread},
    {Stage::kWarpTailControl, "warp-tail-control", kTwoLoadsPerThread},
    {Stage::kReassociatedWarpOrder, "reassociated-warp-order", kTwoLoadsPerThread},
    {Stage::kFourLoadStaging, "four-load-staging", kFourLoadsPerThread},
}};

bool cuda_ok(cudaError_t status) noexcept {
  return status == cudaSuccess;
}

constexpr std::size_t stage_output_count(
    std::size_t input_count,
    unsigned int loads_per_thread) noexcept {
  const std::size_t block_input_count =
      ex11::kBlockSize * static_cast<std::size_t>(loads_per_thread);
  return input_count / block_input_count +
      (input_count % block_input_count == 0U ? 0U : 1U);
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
      value == 0U || value > kMaximumElementCount) {
    return false;
  }
  *parsed = value;
  return true;
}

bool parse_cli(int argc, char** argv, Config* config) noexcept {
  if (config == nullptr || argv == nullptr || argc != 6 ||
      std::string_view(argv[1]) != "--all-stages" ||
      std::string_view(argv[2]) != "--elements" ||
      std::string_view(argv[4]) != "--verify" ||
      std::string_view(argv[5]) != "tolerance") {
    return false;
  }

  std::size_t element_count = 0U;
  if (!parse_positive_size(argv[3], &element_count)) return false;
  *config = {element_count};
  return true;
}

__global__ void canonical_shared_tree_stage(
    const float* input,
    float* partial_sums,
    std::size_t element_count) {
  extern __shared__ float shared_values[];
  const unsigned int thread = threadIdx.x;
  const std::size_t block_begin =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x * kTwoLoadsPerThread;
  const std::size_t first = block_begin + thread;
  const std::size_t second = first + blockDim.x;

  float thread_sum = 0.0F;
  if (first < element_count) thread_sum = input[first];
  if (second < element_count) thread_sum += input[second];
  shared_values[thread] = thread_sum;
  __syncthreads();

  for (unsigned int stride = blockDim.x / 2U; stride > 0U; stride >>= 1U) {
    if (thread < stride) shared_values[thread] += shared_values[thread + stride];
    __syncthreads();
  }

  if (thread == 0U) partial_sums[blockIdx.x] = shared_values[0];
}

__global__ void warp_tail_control_stage(
    const float* input,
    float* partial_sums,
    std::size_t element_count) {
  extern __shared__ float shared_values[];
  const unsigned int thread = threadIdx.x;
  const std::size_t block_begin =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x * kTwoLoadsPerThread;
  const std::size_t first = block_begin + thread;
  const std::size_t second = first + blockDim.x;

  float thread_sum = 0.0F;
  if (first < element_count) thread_sum = input[first];
  if (second < element_count) thread_sum += input[second];
  shared_values[thread] = thread_sum;
  __syncthreads();

  for (unsigned int stride = blockDim.x / 2U; stride >= kWarpSize; stride >>= 1U) {
    if (thread < stride) shared_values[thread] += shared_values[thread + stride];
    __syncthreads();
  }

  if (thread < kWarpSize) {
    float value = shared_values[thread];
    __syncwarp(kFullWarpMask);
    for (unsigned int offset = kWarpSize / 2U; offset > 0U; offset >>= 1U) {
      const float partner = __shfl_down_sync(kFullWarpMask, value, offset);
      if (thread < offset) value += partner;
    }
    if (thread == 0U) partial_sums[blockIdx.x] = value;
  }
}

__global__ void reassociated_warp_order_stage(
    const float* input,
    float* partial_sums,
    std::size_t element_count) {
  extern __shared__ float shared_values[];
  const unsigned int thread = threadIdx.x;
  const std::size_t block_begin =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x * kTwoLoadsPerThread;
  const std::size_t first = block_begin + thread;
  const std::size_t second = first + blockDim.x;

  float thread_sum = 0.0F;
  if (first < element_count) thread_sum = input[first];
  if (second < element_count) thread_sum += input[second];
  shared_values[thread] = thread_sum;
  __syncthreads();

  for (unsigned int stride = blockDim.x / 2U; stride >= kWarpSize; stride >>= 1U) {
    if (thread < stride) shared_values[thread] += shared_values[thread + stride];
    __syncthreads();
  }

  if (thread < kWarpSize) {
    float value = shared_values[thread];
    __syncwarp(kFullWarpMask);
    for (unsigned int lane_mask = 1U; lane_mask < kWarpSize; lane_mask <<= 1U) {
      const float partner = __shfl_xor_sync(kFullWarpMask, value, lane_mask);
      const unsigned int active_span = lane_mask << 1U;
      if ((thread & (active_span - 1U)) == 0U) value += partner;
    }
    if (thread == 0U) partial_sums[blockIdx.x] = value;
  }
}

__global__ void four_load_staging_stage(
    const float* input,
    float* partial_sums,
    std::size_t element_count) {
  extern __shared__ float shared_values[];
  const unsigned int thread = threadIdx.x;
  const std::size_t block_begin =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x * kFourLoadsPerThread;

  float thread_sum = 0.0F;
  for (unsigned int load = 0U; load < kFourLoadsPerThread; ++load) {
    const std::size_t index = block_begin + thread +
        static_cast<std::size_t>(load) * blockDim.x;
    if (index < element_count) thread_sum += input[index];
  }
  shared_values[thread] = thread_sum;
  __syncthreads();

  for (unsigned int stride = blockDim.x / 2U; stride >= kWarpSize; stride >>= 1U) {
    if (thread < stride) shared_values[thread] += shared_values[thread + stride];
    __syncthreads();
  }

  if (thread < kWarpSize) {
    float value = shared_values[thread];
    __syncwarp(kFullWarpMask);
    for (unsigned int lane_mask = 1U; lane_mask < kWarpSize; lane_mask <<= 1U) {
      const float partner = __shfl_xor_sync(kFullWarpMask, value, lane_mask);
      const unsigned int active_span = lane_mask << 1U;
      if ((thread & (active_span - 1U)) == 0U) value += partner;
    }
    if (thread == 0U) partial_sums[blockIdx.x] = value;
  }
}

void launch_stage(
    Stage stage,
    unsigned int blocks,
    const float* input,
    float* output,
    std::size_t element_count) {
  const unsigned int threads = static_cast<unsigned int>(ex11::kBlockSize);
  const std::size_t shared_bytes = ex11::kBlockSize * sizeof(float);
  switch (stage) {
    case Stage::kCanonicalSharedTree:
      canonical_shared_tree_stage<<<blocks, threads, shared_bytes>>>(
          input, output, element_count);
      break;
    case Stage::kWarpTailControl:
      warp_tail_control_stage<<<blocks, threads, shared_bytes>>>(
          input, output, element_count);
      break;
    case Stage::kReassociatedWarpOrder:
      reassociated_warp_order_stage<<<blocks, threads, shared_bytes>>>(
          input, output, element_count);
      break;
    case Stage::kFourLoadStaging:
      four_load_staging_stage<<<blocks, threads, shared_bytes>>>(
          input, output, element_count);
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

bool run_reduction(
    const StageSpec& spec,
    const float* device_input,
    float* device_partial_a,
    float* device_partial_b,
    std::size_t element_count,
    float* result) {
  if (result == nullptr) return false;
  const float* stage_input = device_input;
  float* stage_output = device_partial_a;
  std::size_t stage_size = element_count;

  while (stage_size > 1U) {
    const std::size_t next_stage_size =
        stage_output_count(stage_size, spec.loads_per_thread);
    launch_stage(
        spec.stage,
        static_cast<unsigned int>(next_stage_size),
        stage_input,
        stage_output,
        stage_size);
    if (!cuda_ok(cudaGetLastError())) return false;

    stage_size = next_stage_size;
    stage_input = stage_output;
    stage_output = stage_output == device_partial_a
        ? device_partial_b
        : device_partial_a;
  }

  return cuda_ok(cudaDeviceSynchronize()) &&
      cuda_ok(cudaMemcpy(result, stage_input, sizeof(*result), cudaMemcpyDeviceToHost));
}

bool run_all_stages(const Config& config) {
  std::vector<float> input(config.element_count);
  if (!ex11::initialize_input(input.data(), input.size())) return false;
  const double reference = ex11::cpu_reference_sum(input.data(), input.size());

  const std::size_t input_bytes = input.size() * sizeof(float);
  const std::size_t partial_capacity =
      stage_output_count(config.element_count, kTwoLoadsPerThread);
  const std::size_t partial_bytes = partial_capacity * sizeof(float);
  const std::vector<float> sentinel(
      partial_capacity, std::numeric_limits<float>::quiet_NaN());

  DeviceAllocation device_input;
  DeviceAllocation device_partial_a;
  DeviceAllocation device_partial_b;
  bool device_ready = device_input.allocate(input_bytes) &&
      device_partial_a.allocate(partial_bytes) &&
      device_partial_b.allocate(partial_bytes);
  if (device_ready) {
    device_ready = cuda_ok(cudaMemcpy(
        device_input.get(), input.data(), input_bytes, cudaMemcpyHostToDevice));
  }

  bool all_stages_pass = device_ready;
  for (const StageSpec& spec : kStages) {
    bool stage_pass = device_ready &&
        cuda_ok(cudaMemcpy(
            device_partial_a.get(), sentinel.data(), partial_bytes,
            cudaMemcpyHostToDevice)) &&
        cuda_ok(cudaMemcpy(
            device_partial_b.get(), sentinel.data(), partial_bytes,
            cudaMemcpyHostToDevice));

    float actual = std::numeric_limits<float>::quiet_NaN();
    if (stage_pass) {
      stage_pass = run_reduction(
          spec,
          device_input.get(),
          device_partial_a.get(),
          device_partial_b.get(),
          config.element_count,
          &actual);
    }
    const ex11::SumComparison comparison =
        ex11::compare_reduction_sum(reference, actual);
    stage_pass = stage_pass && comparison.matches;
    std::cout << "stage=" << spec.id
              << " elements=" << config.element_count
              << " correctness=" << (stage_pass ? "PASS" : "FAIL")
              << '\n';
    all_stages_pass = stage_pass && all_stages_pass;
  }

  const bool partial_b_released = device_partial_b.release();
  const bool partial_a_released = device_partial_a.release();
  const bool input_released = device_input.release();
  return all_stages_pass && partial_b_released && partial_a_released && input_released;
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
