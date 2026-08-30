// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string_view>

#include "privatized_histogram_reference.hpp"

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

// [ex13-histogram-kernels-start]
__global__ void global_histogram_kernel(
    const std::uint32_t* values,
    std::size_t value_count,
    std::uint32_t* histogram) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < value_count) {
    const std::uint32_t bin = values[index];
    if (bin < ex13::kBinCount) atomicAdd(&histogram[bin], 1U);
  }
}

__global__ void privatized_histogram_kernel(
    const std::uint32_t* values,
    std::size_t value_count,
    std::uint32_t* histogram) {
  __shared__ std::uint32_t private_bins[ex13::kBinCount];

  for (std::size_t bin = threadIdx.x;
       bin < ex13::kBinCount;
       bin += blockDim.x) {
    private_bins[bin] = 0U;
  }
  __syncthreads();  // Unconditional zero barrier.

  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < value_count) {
    const std::uint32_t bin = values[index];
    if (bin < ex13::kBinCount) atomicAdd(&private_bins[bin], 1U);
  }
  __syncthreads();  // Unconditional update barrier.

  for (std::size_t bin = threadIdx.x;
       bin < ex13::kBinCount;
       bin += blockDim.x) {
    atomicAdd(&histogram[bin], private_bins[bin]);
  }
  __syncthreads();  // Unconditional merge barrier.
}

void launch_histogram_kernels(
    const std::uint32_t* device_values,
    std::uint32_t* device_global_histogram,
    std::uint32_t* device_privatized_histogram,
    ex13::Histogram& global_histogram,
    ex13::Histogram& privatized_histogram) {
  const std::size_t histogram_bytes = ex13::kBinCount * sizeof(std::uint32_t);
  CUDA_CHECK(cudaMemset(device_global_histogram, 0, histogram_bytes));
  CUDA_CHECK(cudaMemset(device_privatized_histogram, 0, histogram_bytes));

  const unsigned int block_count = static_cast<unsigned int>(
      (ex13::kElementCount + kBlockSize - 1U) / kBlockSize);
  global_histogram_kernel<<<block_count, kBlockSize>>>(
      device_values, ex13::kElementCount, device_global_histogram);
  CUDA_CHECK(cudaGetLastError());
  privatized_histogram_kernel<<<block_count, kBlockSize>>>(
      device_values, ex13::kElementCount, device_privatized_histogram);
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaDeviceSynchronize());

  CUDA_CHECK(cudaMemcpy(
      global_histogram.data(),
      device_global_histogram,
      histogram_bytes,
      cudaMemcpyDeviceToHost));
  CUDA_CHECK(cudaMemcpy(
      privatized_histogram.data(),
      device_privatized_histogram,
      histogram_bytes,
      cudaMemcpyDeviceToHost));
}
// [ex13-histogram-kernels-end]

}  // namespace

int main() {
  std::array<ex13::Value, ex13::kElementCount> host_values{};
  ex13::Histogram expected{};
  ex13::Histogram global_histogram{};
  ex13::Histogram privatized_histogram{};

  std::uint32_t* device_values = nullptr;
  std::uint32_t* device_global_histogram = nullptr;
  std::uint32_t* device_privatized_histogram = nullptr;
  const std::size_t value_bytes = host_values.size() * sizeof(ex13::Value);
  const std::size_t histogram_bytes = expected.size() * sizeof(std::uint32_t);

  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_values), value_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_global_histogram), histogram_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_privatized_histogram), histogram_bytes));

  bool all_match = true;
  for (const std::string_view fixture_id : ex13::kFixtureIds) {
    if (!ex13::make_fixture(fixture_id, host_values.data(), host_values.size()) ||
        !ex13::histogram_reference(
            host_values.data(), host_values.size(), &expected)) {
      all_match = false;
      break;
    }

    CUDA_CHECK(cudaMemcpy(
        device_values,
        host_values.data(),
        value_bytes,
        cudaMemcpyHostToDevice));
    launch_histogram_kernels(
        device_values,
        device_global_histogram,
        device_privatized_histogram,
        global_histogram,
        privatized_histogram);

    const bool fixture_matches =
        ex13::verify_exact(expected, global_histogram).matches &&
        ex13::verify_exact(expected, privatized_histogram).matches &&
        ex13::sum_of_bins(global_histogram) == ex13::kElementCount &&
        ex13::sum_of_bins(privatized_histogram) == ex13::kElementCount;
    std::cout << "fixture=" << fixture_id
              << " result=" << (fixture_matches ? "PASS" : "FAIL") << '\n';
    all_match = all_match && fixture_matches;
  }

  CUDA_CHECK(cudaFree(device_privatized_histogram));
  CUDA_CHECK(cudaFree(device_global_histogram));
  CUDA_CHECK(cudaFree(device_values));

  std::cout << "result=" << (all_match ? "PASS" : "FAIL") << '\n';
  return all_match ? EXIT_SUCCESS : EXIT_FAILURE;
}
