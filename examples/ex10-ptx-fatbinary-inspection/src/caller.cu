// SPDX-License-Identifier: Apache-2.0
#include <cstddef>

// [ex10-device-link-contract-start]
extern "C" __device__ float ex10_device_scale(float value);

extern "C" __global__ void ex10_caller_kernel(
    float* output,
    const float* input,
    std::size_t element_count) {
  const std::size_t index = blockIdx.x * blockDim.x + threadIdx.x;
  if (index < element_count) {
    output[index] = ex10_device_scale(input[index]);
  }
}
// [ex10-device-link-contract-end]

int main() noexcept {
  return 0;
}
