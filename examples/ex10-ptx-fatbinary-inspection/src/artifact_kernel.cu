// SPDX-License-Identifier: Apache-2.0
#include <cstddef>

// [ex10-artifact-kernel-start]
extern "C" __global__ void artifact_kernel(
    float* output,
    const float* input,
    std::size_t element_count) {
  const std::size_t index = blockIdx.x * blockDim.x + threadIdx.x;
  if (index < element_count) {
    output[index] = input[index] * 2.0F;
  }
}
// [ex10-artifact-kernel-end]
