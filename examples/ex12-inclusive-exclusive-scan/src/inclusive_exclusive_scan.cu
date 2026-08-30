// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "inclusive_exclusive_scan_reference.hpp"

namespace {

constexpr unsigned int kBlockSize = 256U;
constexpr std::size_t kBlockCount =
    (ex12::kElementCount + kBlockSize - 1U) / kBlockSize;
static_assert(kBlockCount == 17U, "EX12 requires 17 blocks");
static_assert(kBlockCount <= kBlockSize, "block sums must fit one bounded scan");

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

// [ex12-multi-block-scan-start]
__global__ void block_inclusive_scan_kernel(
    const std::uint32_t* input,
    std::uint32_t* inclusive,
    std::uint32_t* block_sums,
    std::size_t count) {
  __shared__ std::uint32_t scratch[kBlockSize];
  const unsigned int lane = threadIdx.x;
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + lane;

  std::uint32_t value = 0U;
  if (index < count) value = input[index];
  scratch[lane] = value;
  __syncthreads();

  for (unsigned int offset = 1U; offset < blockDim.x; offset <<= 1U) {
    std::uint32_t predecessor = 0U;
    if (lane >= offset) predecessor = scratch[lane - offset];
    __syncthreads();
    if (lane >= offset) scratch[lane] += predecessor;
    __syncthreads();
  }

  if (index < count) inclusive[index] = scratch[lane];
  if (lane == blockDim.x - 1U) block_sums[blockIdx.x] = scratch[lane];
}

__global__ void bounded_block_sums_scan_kernel(
    const std::uint32_t* block_sums,
    std::uint32_t* scanned_block_sums,
    std::size_t block_count) {
  __shared__ std::uint32_t scratch[kBlockSize];
  const unsigned int lane = threadIdx.x;

  std::uint32_t value = 0U;
  if (lane < block_count) value = block_sums[lane];
  scratch[lane] = value;
  __syncthreads();

  for (unsigned int offset = 1U; offset < blockDim.x; offset <<= 1U) {
    std::uint32_t predecessor = 0U;
    if (lane >= offset) predecessor = scratch[lane - offset];
    __syncthreads();
    if (lane >= offset) scratch[lane] += predecessor;
    __syncthreads();
  }

  if (lane < block_count) scanned_block_sums[lane] = scratch[lane];
}

__global__ void propagate_block_offsets_kernel(
    std::uint32_t* inclusive,
    const std::uint32_t* scanned_block_sums,
    std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) {
    const std::size_t block_index = index / blockDim.x;
    const std::uint32_t block_offset =
        block_index == 0U ? 0U : scanned_block_sums[block_index - 1U];
    inclusive[index] += block_offset;
  }
}

__global__ void derive_exclusive_kernel(
    const std::uint32_t* input,
    const std::uint32_t* inclusive,
    std::uint32_t* exclusive,
    std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) exclusive[index] = inclusive[index] - input[index];
}

void run_multi_block_scan(
    const std::uint32_t* device_input,
    std::uint32_t* device_inclusive,
    std::uint32_t* device_exclusive,
    std::uint32_t* device_block_sums,
    std::uint32_t* device_scanned_block_sums,
    std::size_t element_count,
    std::size_t block_count) {
  if (block_count == 0U || block_count > kBlockSize) {
    std::cerr << "bounded block-sum scan extent is invalid\n";
    std::exit(EXIT_FAILURE);
  }

  const unsigned int grid_size = static_cast<unsigned int>(block_count);
  block_inclusive_scan_kernel<<<grid_size, kBlockSize>>>(
      device_input, device_inclusive, device_block_sums, element_count);
  CUDA_CHECK(cudaGetLastError());

  bounded_block_sums_scan_kernel<<<1U, kBlockSize>>>(
      device_block_sums, device_scanned_block_sums, block_count);
  CUDA_CHECK(cudaGetLastError());

  propagate_block_offsets_kernel<<<grid_size, kBlockSize>>>(
      device_inclusive, device_scanned_block_sums, element_count);
  CUDA_CHECK(cudaGetLastError());

  derive_exclusive_kernel<<<grid_size, kBlockSize>>>(
      device_input, device_inclusive, device_exclusive, element_count);
  CUDA_CHECK(cudaGetLastError());
}
// [ex12-multi-block-scan-end]

bool recurrence_invariants_hold(
    const std::vector<std::uint32_t>& input,
    const std::vector<std::uint32_t>& inclusive,
    const std::vector<std::uint32_t>& exclusive) {
  if (input.empty() || inclusive.size() != input.size() ||
      exclusive.size() != input.size()) {
    return false;
  }
  if (inclusive[0] != input[0] || exclusive[0] != 0U) return false;
  for (std::size_t index = 1U; index < input.size(); ++index) {
    if (inclusive[index] != inclusive[index - 1U] + input[index] ||
        exclusive[index] != exclusive[index - 1U] + input[index - 1U] ||
        inclusive[index] != exclusive[index] + input[index]) {
      return false;
    }
  }
  return true;
}

}  // namespace

int main() {
  const std::size_t element_bytes =
      ex12::kElementCount * sizeof(std::uint32_t);
  const std::size_t block_bytes = kBlockCount * sizeof(std::uint32_t);

  std::vector<std::uint32_t> input(ex12::kElementCount);
  std::vector<std::uint32_t> expected_inclusive(ex12::kElementCount);
  std::vector<std::uint32_t> expected_exclusive(ex12::kElementCount);
  std::vector<std::uint32_t> actual_inclusive(ex12::kElementCount);
  std::vector<std::uint32_t> actual_exclusive(ex12::kElementCount);
  if (!ex12::initialize_bounded_input(input.data(), input.size()) ||
      !ex12::inclusive_scan_reference(
          input.data(),
          input.size(),
          expected_inclusive.data(),
          expected_inclusive.size(),
          input.size()) ||
      !ex12::exclusive_scan_reference(
          input.data(),
          input.size(),
          expected_exclusive.data(),
          expected_exclusive.size(),
          input.size())) {
    return EXIT_FAILURE;
  }

  std::uint32_t* device_input = nullptr;
  std::uint32_t* device_inclusive = nullptr;
  std::uint32_t* device_exclusive = nullptr;
  std::uint32_t* device_block_sums = nullptr;
  std::uint32_t* device_scanned_block_sums = nullptr;
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_input), element_bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_inclusive), element_bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_exclusive), element_bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_block_sums), block_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_scanned_block_sums), block_bytes));

  CUDA_CHECK(cudaMemcpy(
      device_input, input.data(), element_bytes, cudaMemcpyHostToDevice));
  run_multi_block_scan(
      device_input,
      device_inclusive,
      device_exclusive,
      device_block_sums,
      device_scanned_block_sums,
      ex12::kElementCount,
      kBlockCount);
  CUDA_CHECK(cudaMemcpy(
      actual_inclusive.data(),
      device_inclusive,
      element_bytes,
      cudaMemcpyDeviceToHost));
  CUDA_CHECK(cudaMemcpy(
      actual_exclusive.data(),
      device_exclusive,
      element_bytes,
      cudaMemcpyDeviceToHost));

  const bool inclusive_passed = ex12::verify_exact(
      expected_inclusive.data(),
      actual_inclusive.data(),
      actual_inclusive.size()).matches;
  const bool exclusive_passed = ex12::verify_exact(
      expected_exclusive.data(),
      actual_exclusive.data(),
      actual_exclusive.size()).matches;
  const bool recurrence_passed = recurrence_invariants_hold(
      input, actual_inclusive, actual_exclusive);
  const bool last_total_passed =
      actual_inclusive.back() == ex12::kDeterministicTotal &&
      actual_exclusive.back() + input.back() == ex12::kDeterministicTotal;

  std::cout << "inclusive=" << (inclusive_passed ? "PASS" : "FAIL") << '\n';
  std::cout << "exclusive=" << (exclusive_passed ? "PASS" : "FAIL") << '\n';
  std::cout << "recurrence=" << (recurrence_passed ? "PASS" : "FAIL") << '\n';
  std::cout << "last-total=" << (last_total_passed ? "PASS" : "FAIL") << '\n';

  CUDA_CHECK(cudaFree(device_scanned_block_sums));
  CUDA_CHECK(cudaFree(device_block_sums));
  CUDA_CHECK(cudaFree(device_exclusive));
  CUDA_CHECK(cudaFree(device_inclusive));
  CUDA_CHECK(cudaFree(device_input));

  return inclusive_passed && exclusive_passed && recurrence_passed &&
                 last_total_passed
             ? EXIT_SUCCESS
             : EXIT_FAILURE;
}
