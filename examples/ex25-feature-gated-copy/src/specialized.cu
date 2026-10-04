// SPDX-License-Identifier: Apache-2.0
#include "contract.hpp"
#include "launch.hpp"
// [ex25-specialized-start]
__global__ void bulk_copy(const int* input, int* output) {
  __shared__ __align__(16) int tile[ex25::tile_elements];
  __shared__ __align__(8) unsigned long long barrier;
  const int base = blockIdx.x * ex25::tile_elements;
  if (threadIdx.x == 0) {
    const unsigned dst = static_cast<unsigned>(__cvta_generic_to_shared(tile));
    const unsigned bar = static_cast<unsigned>(__cvta_generic_to_shared(&barrier));
    asm volatile("mbarrier.init.shared::cta.b64 [%0], 1;" :: "r"(bar) : "memory");
    asm volatile("fence.proxy.async.shared::cta;" ::: "memory");
    // One arrival, 1024 expected bytes, one phase; only the issuer waits.
    asm volatile("{ .reg .b64 state; mbarrier.arrive.expect_tx.shared::cta.b64 state, [%0], 1024; }"
                 :: "r"(bar) : "memory");
    asm volatile("cp.async.bulk.shared::cta.global.mbarrier::complete_tx::bytes [%0], [%1], 1024, [%2];"
                 :: "r"(dst), "l"(input + base), "r"(bar) : "memory");
    asm volatile("{ .reg .pred done; wait_copy: mbarrier.try_wait.parity.shared::cta.b64 done, [%0], 0; @!done bra wait_copy; }"
                 :: "r"(bar) : "memory");
  }
  // Publish the issuer's completed transfer to all consumers.
  __syncthreads();
  for (int i = threadIdx.x; i < ex25::tile_elements; i += blockDim.x) {
    const int j = (i + 1) % ex25::tile_elements;
    output[base + j] = tile[j];
  }
  __syncthreads(); // All consumers finish before barrier invalidation/storage exit.
  if (threadIdx.x == 0) {
    const unsigned bar = static_cast<unsigned>(__cvta_generic_to_shared(&barrier));
    asm volatile("mbarrier.inval.shared::cta.b64 [%0];" :: "r"(bar) : "memory");
  }
}
// [ex25-specialized-end]
cudaError_t launch_specialized(const int* input, int* output, int count, cudaStream_t stream) {
  bulk_copy<<<count / ex25::tile_elements, 128, 0, stream>>>(input, output);
  return cudaGetLastError();
}
