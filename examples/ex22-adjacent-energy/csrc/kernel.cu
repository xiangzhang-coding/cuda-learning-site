// SPDX-License-Identifier: Apache-2.0
#include "contract.h"
#include <torch/library.h>
#include <c10/cuda/CUDAGuard.h>
#include <c10/cuda/CUDAStream.h>
#include <c10/cuda/CUDAException.h>

// [ex22-cuda-start]
template <typename T>
__global__ void adjacent_energy_kernel(const T* x, T* y, int64_t count) {
  const int64_t i = static_cast<int64_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (i < count) {
    const T difference = x[i + 1] - x[i];
    y[i] = difference * difference;
  }
}

at::Tensor adjacent_energy_cuda(const at::Tensor& x) {
  check_input(x);
  TORCH_CHECK(x.is_cuda(), "expected CUDA input");
  const c10::cuda::CUDAGuard guard(x.device());
  auto y = at::empty({x.numel() - 1}, x.options());
  const int64_t count = y.numel();
  if (count == 0) return y;
  const auto stream = c10::cuda::getCurrentCUDAStream(x.get_device());
  AT_DISPATCH_FLOATING_TYPES(x.scalar_type(), "adjacent_energy_cuda", [&] {
    adjacent_energy_kernel<scalar_t><<<(count + 255) / 256, 256, 0, stream.stream()>>>(
        x.const_data_ptr<scalar_t>(), y.mutable_data_ptr<scalar_t>(), count);
  });
  C10_CUDA_KERNEL_LAUNCH_CHECK();
  return y;
}

TORCH_LIBRARY_IMPL(cuda_learning, CUDA, m) {
  m.impl("adjacent_energy", &adjacent_energy_cuda);
}
// [ex22-cuda-end]
