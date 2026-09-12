// SPDX-License-Identifier: Apache-2.0
// [ex21-kernel-start]
extern "C" __global__ void ex21_vector_add(
    const float* a, const float* b, float* c, unsigned int n) {
  const unsigned int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) {
    c[i] = a[i] + b[i];
  }
}
// [ex21-kernel-end]
