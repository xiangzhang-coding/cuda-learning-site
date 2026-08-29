// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cstdint>
#include <cstdlib>

#include "cuda_error.hpp"
#include "sanitizer_suite_contract.hpp"

// [ex16-racecheck-defect-start]
namespace {

constexpr std::uint32_t kPublishedValue = 41U;

__global__ void publish_then_read(std::uint32_t* output) {
  __shared__ std::uint32_t shared_value;
  if (threadIdx.x == 0U) shared_value = kPublishedValue;
  if (threadIdx.x == 1U) output[0] = shared_value + 1U;
}

}  // namespace

int main() {
  std::uint32_t* device_output = nullptr;
  std::uint32_t actual = 0U;

  if (!cuda_ok(
          cudaMalloc(reinterpret_cast<void**>(&device_output), sizeof(actual)),
          "cudaMalloc") ||
      !cuda_ok(cudaMemset(device_output, 0, sizeof(actual)), "cudaMemset")) {
    return EXIT_FAILURE;
  }

  publish_then_read<<<1U, 2U>>>(device_output);
  if (!cuda_ok(cudaGetLastError(), "publish_then_read launch") ||
      !cuda_ok(cudaDeviceSynchronize(), "publish_then_read completion")) {
    return EXIT_FAILURE;
  }
  if (!cuda_ok(
          cudaMemcpy(
              &actual, device_output, sizeof(actual), cudaMemcpyDeviceToHost),
          "cudaMemcpy(device-to-host)")) {
    return EXIT_FAILURE;
  }
  if (!cuda_ok(cudaFree(device_output), "cudaFree")) return EXIT_FAILURE;

  const bool passed = actual == kPublishedValue + 1U;
  std::cout << "scenario=" << ex16::kScenarios[2].id
            << " result=" << (passed ? "PASS" : "FAIL") << '\n';
  return passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
// [ex16-racecheck-defect-end]
