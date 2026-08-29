// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "unified_memory_migration_reference.hpp"

namespace {

constexpr unsigned int kBlockSize = 256U;

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

// [ex08-managed-workload-start]
__global__ void managed_transform(std::uint32_t* values, std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) values[index] ^= 0x5a5a5a5aU;
}

void advise_preferred_device(
    const void* data,
    std::size_t bytes,
    int device) {
#if CUDART_VERSION >= 13000
  cudaMemLocation location{};
  location.type = cudaMemLocationTypeDevice;
  location.id = device;
  CUDA_CHECK(cudaMemAdvise(
      data, bytes, cudaMemAdviseSetPreferredLocation, location));
#else
  CUDA_CHECK(cudaMemAdvise(
      data, bytes, cudaMemAdviseSetPreferredLocation, device));
#endif
}

void prefetch_to_device(
    const void* data,
    std::size_t bytes,
    int device,
    cudaStream_t stream) {
#if CUDART_VERSION >= 13000
  cudaMemLocation location{};
  location.type = cudaMemLocationTypeDevice;
  location.id = device;
  CUDA_CHECK(cudaMemPrefetchAsync(data, bytes, location, 0U, stream));
#else
  CUDA_CHECK(cudaMemPrefetchAsync(data, bytes, device, stream));
#endif
}

void prefetch_to_host(
    const void* data,
    std::size_t bytes,
    cudaStream_t stream) {
#if CUDART_VERSION >= 13000
  cudaMemLocation location{};
  location.type = cudaMemLocationTypeHost;
  location.id = 0;
  CUDA_CHECK(cudaMemPrefetchAsync(data, bytes, location, 0U, stream));
#else
  CUDA_CHECK(cudaMemPrefetchAsync(data, bytes, cudaCpuDeviceId, stream));
#endif
}

struct WorkloadResult {
  bool passed;
  bool advice_used;
  bool prefetch_used;
};

WorkloadResult run_managed_workload(
    int device,
    const cudaDeviceProp& properties) {
  const std::size_t bytes = ex08::kElementCount * sizeof(std::uint32_t);
  std::uint32_t* managed_values = nullptr;
  CUDA_CHECK(cudaMallocManaged(
      reinterpret_cast<void**>(&managed_values), bytes));

  std::vector<std::uint32_t> expected(ex08::kElementCount);
  if (!ex08::initialize_input(managed_values, ex08::kElementCount) ||
      !ex08::transform_reference(
          managed_values,
          ex08::kElementCount,
          expected.data(),
          expected.size(),
          ex08::kElementCount)) {
    CUDA_CHECK(cudaFree(managed_values));
    return {false, false, false};
  }

  cudaStream_t workload_stream = nullptr;
  CUDA_CHECK(cudaStreamCreateWithFlags(
      &workload_stream, cudaStreamNonBlocking));

  const bool use_hints = properties.concurrentManagedAccess != 0;
  if (use_hints) {
    advise_preferred_device(managed_values, bytes, device);
    prefetch_to_device(managed_values, bytes, device, workload_stream);
  }

  const unsigned int grid_size = static_cast<unsigned int>(
      (ex08::kElementCount + kBlockSize - 1U) / kBlockSize);
  managed_transform<<<grid_size, kBlockSize, 0U, workload_stream>>>(
      managed_values, ex08::kElementCount);
  CUDA_CHECK(cudaGetLastError());

  if (use_hints) prefetch_to_host(managed_values, bytes, workload_stream);
  CUDA_CHECK(cudaStreamSynchronize(workload_stream));

  const bool passed = ex08::verify_exact(
      expected.data(), managed_values, ex08::kElementCount).matches;

  CUDA_CHECK(cudaStreamDestroy(workload_stream));
  CUDA_CHECK(cudaFree(managed_values));
  return {passed, use_hints, use_hints};
}
// [ex08-managed-workload-end]

}  // namespace

int main() {
  std::array<ex08::PageAccess, ex08::kAccessCount> accesses{};
  std::array<ex08::Transition, ex08::kExpectedTransitionCount> transitions{};
  ex08::TransitionSummary summary{};
  if (!ex08::write_declared_access_sequence(accesses.data(), accesses.size()) ||
      !ex08::derive_transition_ledger(
          ex08::kPageCount,
          ex08::kPageBytes,
          accesses.data(),
          accesses.size(),
          transitions.data(),
          transitions.size(),
          summary)) {
    return EXIT_FAILURE;
  }

  int device = 0;
  cudaDeviceProp properties{};
  CUDA_CHECK(cudaGetDevice(&device));
  CUDA_CHECK(cudaGetDeviceProperties(&properties, device));

  std::cout << "capability managedMemory=" << properties.managedMemory
            << " concurrentManagedAccess=" << properties.concurrentManagedAccess
            << " interpretation=capability-only\n";
  std::cout << "model transitionCount=" << summary.transition_count
            << " movedPagesProxy=" << summary.moved_pages
            << " movedBytesProxy=" << summary.moved_bytes
            << " interpretation=software-only\n";

  if (properties.managedMemory == 0) {
    std::cout << "workload result=UNAVAILABLE\n";
    return EXIT_FAILURE;
  }

  const WorkloadResult result = run_managed_workload(device, properties);
  std::cout << "hints advice=" << (result.advice_used ? "used" : "skipped")
            << " prefetch=" << (result.prefetch_used ? "used" : "skipped")
            << '\n';
  std::cout << "workload result=" << (result.passed ? "PASS" : "FAIL") << '\n';
  return result.passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
