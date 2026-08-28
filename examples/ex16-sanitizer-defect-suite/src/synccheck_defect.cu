// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string_view>

#include "sanitizer_suite_contract.hpp"

// [ex16-synccheck-defect-start]
namespace {

constexpr std::size_t kElementCount = 16U;

bool cuda_ok(cudaError_t status, std::string_view operation) {
  if (status == cudaSuccess) return true;
  std::cerr << "operation=" << operation
            << " status=" << cudaGetErrorName(status)
            << " detail=\"" << cudaGetErrorString(status) << "\"\n";
  return false;
}

__global__ void phase_copy(std::uint32_t* output) {
  __shared__ std::uint32_t scratch[kElementCount];
  const unsigned int lane = threadIdx.x;
  scratch[lane] = 5U * lane + 2U;
  if ((lane & 1U) == 0U) __syncthreads();
  output[lane] = scratch[lane];
}

}  // namespace

int main() {
  constexpr std::size_t kBytes = kElementCount * sizeof(std::uint32_t);
  std::array<std::uint32_t, kElementCount> actual{};
  std::uint32_t* device_output = nullptr;

  if (!cuda_ok(
          cudaMalloc(reinterpret_cast<void**>(&device_output), kBytes),
          "cudaMalloc")) {
    return EXIT_FAILURE;
  }

  phase_copy<<<1U, static_cast<unsigned int>(kElementCount)>>>(device_output);
  if (!cuda_ok(cudaGetLastError(), "phase_copy launch") ||
      !cuda_ok(cudaDeviceSynchronize(), "phase_copy completion")) {
    return EXIT_FAILURE;
  }
  if (!cuda_ok(
          cudaMemcpy(actual.data(), device_output, kBytes, cudaMemcpyDeviceToHost),
          "cudaMemcpy(device-to-host)")) {
    return EXIT_FAILURE;
  }
  if (!cuda_ok(cudaFree(device_output), "cudaFree")) return EXIT_FAILURE;

  bool passed = true;
  for (std::size_t index = 0U; index < actual.size(); ++index) {
    const std::uint32_t expected =
        5U * static_cast<std::uint32_t>(index) + 2U;
    passed = passed && actual[index] == expected;
  }
  std::cout << "scenario=" << ex16::kScenarios[6].id
            << " result=" << (passed ? "PASS" : "FAIL") << '\n';
  return passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
// [ex16-synccheck-defect-end]
