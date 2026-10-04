// SPDX-License-Identifier: Apache-2.0
#include "contract.hpp"
#include "launch.hpp"
// [ex25-portable-start]
__global__ void portable_copy(const int* input, int* output) {
  __shared__ int tile[ex25::tile_elements];
  const int base = blockIdx.x * ex25::tile_elements;
  for (int i = threadIdx.x; i < ex25::tile_elements; i += blockDim.x)
    tile[i] = input[base + i];
  __syncthreads();
  // A neighbor permutation prevents per-thread register forwarding of the tile.
  for (int i = threadIdx.x; i < ex25::tile_elements; i += blockDim.x) {
    const int j = (i + 1) % ex25::tile_elements;
    output[base + j] = tile[j];
  }
}
// [ex25-portable-end]
cudaError_t launch_portable(const int* input, int* output, int count, cudaStream_t stream) {
  portable_copy<<<count / ex25::tile_elements, 128, 0, stream>>>(input, output);
  return cudaGetLastError();
}
