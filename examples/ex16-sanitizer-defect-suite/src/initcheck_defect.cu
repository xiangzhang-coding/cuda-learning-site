// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdlib>

#include "cuda_error.hpp"
#include "sanitizer_suite_contract.hpp"

// [ex16-initcheck-defect-start]
namespace {

constexpr std::size_t kElementCount = 16U;

__global__ void increment_values(
    const std::uint32_t* input,
    std::uint32_t* output,
    std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) output[index] = input[index] + 1U;
}

}  // namespace

int main() {
  constexpr std::size_t kBytes = kElementCount * sizeof(std::uint32_t);
  std::array<std::uint32_t, kElementCount> actual{};
  std::uint32_t* device_input = nullptr;
  std::uint32_t* device_output = nullptr;

  if (!cuda_ok(
          cudaMalloc(reinterpret_cast<void**>(&device_input), kBytes),
          "cudaMalloc(input)") ||
      !cuda_ok(
          cudaMalloc(reinterpret_cast<void**>(&device_output), kBytes),
          "cudaMalloc(output)")) {
    return EXIT_FAILURE;
  }

  increment_values<<<1U, static_cast<unsigned int>(kElementCount)>>>(
      device_input, device_output, kElementCount);
  if (!cuda_ok(cudaGetLastError(), "increment_values launch") ||
      !cuda_ok(cudaDeviceSynchronize(), "increment_values completion")) {
    return EXIT_FAILURE;
  }
  if (!cuda_ok(
          cudaMemcpy(actual.data(), device_output, kBytes, cudaMemcpyDeviceToHost),
          "cudaMemcpy(device-to-host)")) {
    return EXIT_FAILURE;
  }
  if (!cuda_ok(cudaFree(device_output), "cudaFree(output)") ||
      !cuda_ok(cudaFree(device_input), "cudaFree(input)")) {
    return EXIT_FAILURE;
  }

  bool passed = true;
  for (const std::uint32_t value : actual) passed = passed && value == 1U;
  std::cout << "scenario=" << ex16::kScenarios[4].id
            << " result=" << (passed ? "PASS" : "FAIL") << '\n';
  return passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
// [ex16-initcheck-defect-end]
