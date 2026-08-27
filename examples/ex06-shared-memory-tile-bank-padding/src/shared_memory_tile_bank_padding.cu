// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "shared_memory_tile_bank_padding_reference.hpp"

namespace {

constexpr unsigned int kWarpSize = static_cast<unsigned int>(ex06::kWarpSize);
constexpr std::size_t kTileColumns = ex06::kTileColumns;
constexpr std::size_t kTileElements = ex06::kTileElements;

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

// [ex06-shared-layouts-start]
template <unsigned int Padding>
struct SharedTile;

template <>
struct SharedTile<0U> {
  float values[32][32];
};

template <>
struct SharedTile<1U> {
  float values[32][33];
};
// [ex06-shared-layouts-end]

// [ex06-tiled-kernels-start]
template <unsigned int Padding>
__global__ void tiled_column_access(
    const float* input,
    float* output,
    std::size_t column) {
  static_assert(Padding <= 1U, "EX06 defines only the two declared layouts");
  if (blockIdx.x != 0U || blockDim.x != kWarpSize) return;

  __shared__ SharedTile<Padding> tile;
  const unsigned int lane = threadIdx.x;

  for (std::size_t linear = lane; linear < kTileElements; linear += kWarpSize) {
    const std::size_t row = linear / kTileColumns;
    const std::size_t source_column = linear % kTileColumns;
    tile.values[row][source_column] = input[linear];
  }

  __syncthreads();
  output[lane] = tile.values[lane][column];
}
// [ex06-tiled-kernels-end]

}  // namespace

int main() {
  std::vector<float> host_input(ex06::kTileElements);
  std::vector<float> host_expected(ex06::kWarpSize);
  std::vector<float> host_unpadded(ex06::kWarpSize);
  std::vector<float> host_padded(ex06::kWarpSize);
  if (!ex06::write_tile_input(host_input.data(), host_input.size()) ||
      !ex06::tiled_reference<0U>(
          host_input.data(),
          host_input.size(),
          ex06::kReadColumn,
          host_expected.data(),
          host_expected.size())) {
    return EXIT_FAILURE;
  }

  const std::size_t input_bytes = host_input.size() * sizeof(float);
  const std::size_t output_bytes = host_expected.size() * sizeof(float);
  float* device_input = nullptr;
  float* device_unpadded = nullptr;
  float* device_padded = nullptr;
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_input), input_bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_unpadded), output_bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_padded), output_bytes));
  CUDA_CHECK(cudaMemcpy(
      device_input, host_input.data(), input_bytes, cudaMemcpyHostToDevice));

  tiled_column_access<0U><<<1U, kWarpSize>>>(
      device_input, device_unpadded, ex06::kReadColumn);
  CUDA_CHECK(cudaGetLastError());
  tiled_column_access<1U><<<1U, kWarpSize>>>(
      device_input, device_padded, ex06::kReadColumn);
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaDeviceSynchronize());

  CUDA_CHECK(cudaMemcpy(
      host_unpadded.data(),
      device_unpadded,
      output_bytes,
      cudaMemcpyDeviceToHost));
  CUDA_CHECK(cudaMemcpy(
      host_padded.data(),
      device_padded,
      output_bytes,
      cudaMemcpyDeviceToHost));

  const bool unpadded_passed = ex06::verify_exact(
      host_expected.data(), host_unpadded.data(), ex06::kWarpSize).matches;
  const bool padded_passed = ex06::verify_exact(
      host_expected.data(), host_padded.data(), ex06::kWarpSize).matches;

  CUDA_CHECK(cudaFree(device_padded));
  CUDA_CHECK(cudaFree(device_unpadded));
  CUDA_CHECK(cudaFree(device_input));

  std::cout << "variant=unpadded result="
            << (unpadded_passed ? "PASS" : "FAIL") << '\n';
  std::cout << "variant=padded result="
            << (padded_passed ? "PASS" : "FAIL") << '\n';
  return unpadded_passed && padded_passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
