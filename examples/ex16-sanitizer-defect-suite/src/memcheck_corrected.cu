// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdlib>

#include "cuda_error.hpp"
#include "sanitizer_suite_contract.hpp"

// [ex16-memcheck-corrected-start]
namespace {

constexpr std::size_t kElementCount = 32U;
constexpr unsigned int kThreadCount = 33U;

__global__ void write_sequence(std::uint32_t* output, std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) {
    output[index] = 3U * static_cast<std::uint32_t>(index) + 1U;
  }
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

  write_sequence<<<1U, kThreadCount>>>(device_output, kElementCount);
  if (!cuda_ok(cudaGetLastError(), "write_sequence launch") ||
      !cuda_ok(cudaDeviceSynchronize(), "write_sequence completion")) {
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
        3U * static_cast<std::uint32_t>(index) + 1U;
    passed = passed && actual[index] == expected;
  }

  std::cout << "scenario=" << ex16::kScenarios[1].id
            << " result=" << (passed ? "PASS" : "FAIL") << '\n';
  return passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
// [ex16-memcheck-corrected-end]
