// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "coalesced_strided_access_reference.hpp"

namespace {

constexpr unsigned int kBlockSize = 128U;

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

// [ex05-access-kernel-start]
__global__ void gather_access(
    const std::uint32_t* input,
    std::uint32_t* output,
    std::size_t logical_count,
    std::size_t offset,
    std::size_t stride) {
  const std::size_t logical_index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (logical_index >= logical_count) return;

  output[logical_index] = input[offset + logical_index * stride];
}
// [ex05-access-kernel-end]

void initialize_input(std::vector<std::uint32_t>& input) {
  for (std::size_t index = 0U; index < input.size(); ++index) {
    input[index] = static_cast<std::uint32_t>(11U + 17U * index);
  }
}

}  // namespace

int main() {
  std::size_t input_elements = 0U;
  for (const ex05::AccessScenario& scenario : ex05::kScenarios) {
    std::size_t required_elements = 0U;
    if (!ex05::try_required_input_count(
            ex05::kLogicalCount, scenario, required_elements)) {
      return EXIT_FAILURE;
    }
    input_elements = std::max(input_elements, required_elements);
  }

  std::vector<std::uint32_t> host_input(input_elements);
  std::vector<std::uint32_t> host_expected(ex05::kLogicalCount);
  std::vector<std::uint32_t> host_actual(ex05::kLogicalCount);
  initialize_input(host_input);

  const std::size_t input_bytes = host_input.size() * sizeof(std::uint32_t);
  const std::size_t output_bytes = host_actual.size() * sizeof(std::uint32_t);
  std::uint32_t* device_input = nullptr;
  std::uint32_t* device_output = nullptr;
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_input), input_bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_output), output_bytes));
  CUDA_CHECK(cudaMemcpy(
      device_input, host_input.data(), input_bytes, cudaMemcpyHostToDevice));

  const unsigned int grid_size = static_cast<unsigned int>(
      (ex05::kLogicalCount + kBlockSize - 1U) / kBlockSize);
  bool all_passed = true;

  // [ex05-scenario-loop-start]
  for (const ex05::AccessScenario& scenario : ex05::kScenarios) {
    const bool reference_ready = ex05::gather_reference(
        host_input.data(),
        host_input.size(),
        host_expected.data(),
        host_expected.size(),
        ex05::kLogicalCount,
        scenario);

    gather_access<<<grid_size, kBlockSize>>>(
        device_input,
        device_output,
        ex05::kLogicalCount,
        scenario.offset,
        scenario.stride);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaDeviceSynchronize());
    CUDA_CHECK(cudaMemcpy(
        host_actual.data(), device_output, output_bytes, cudaMemcpyDeviceToHost));

    const bool passed = reference_ready &&
        ex05::verify_exact(
            host_expected.data(), host_actual.data(), ex05::kLogicalCount).matches;
    std::cout << "scenario=" << scenario.id << " result="
              << (passed ? "PASS" : "FAIL") << '\n';
    all_passed = all_passed && passed;
  }
  // [ex05-scenario-loop-end]

  CUDA_CHECK(cudaFree(device_output));
  CUDA_CHECK(cudaFree(device_input));
  return all_passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
