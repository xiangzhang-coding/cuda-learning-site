// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cub/device/device_reduce.cuh>
#include <cub/device/device_scan.cuh>
#include <cub/version.cuh>

#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <limits>
#include <vector>

#include "cub_device_reduction_scan_reference.hpp"

#ifndef EX17_EXPECTED_CUB_VERSION
#error "EX17_EXPECTED_CUB_VERSION must name the selected CUB_VERSION"
#endif

static_assert(
    CUB_VERSION == EX17_EXPECTED_CUB_VERSION,
    "selected CUB headers do not match EXPECTED_CUB_VERSION");
static_assert(
    ex17::kElementCount <= static_cast<std::size_t>(std::numeric_limits<int>::max()),
    "legacy CUB APIs require the EX17 extent to fit in int");

namespace {

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

struct TemporaryStorage {
  void* data = nullptr;
  std::size_t bytes = 0U;
};

// [ex17-device-reduce-start]
TemporaryStorage query_device_reduce_storage(
    const float* device_input,
    float* device_output,
    int item_count,
    cudaStream_t stream) {
  TemporaryStorage storage;
  CUDA_CHECK(cub::DeviceReduce::Sum(
      nullptr,
      storage.bytes,
      device_input,
      device_output,
      item_count,
      stream));
  CUDA_CHECK(cudaMalloc(&storage.data, storage.bytes));
  return storage;
}

void execute_device_reduce(
    TemporaryStorage& storage,
    const float* device_input,
    float* device_output,
    int item_count,
    cudaStream_t stream) {
  CUDA_CHECK(cub::DeviceReduce::Sum(
      storage.data,
      storage.bytes,
      device_input,
      device_output,
      item_count,
      stream));
}
// [ex17-device-reduce-end]

struct ScanTemporaryStorage {
  TemporaryStorage inclusive;
  TemporaryStorage exclusive;
};

// [ex17-device-scan-start]
ScanTemporaryStorage query_device_scan_storage(
    const std::uint32_t* device_input,
    std::uint32_t* device_inclusive,
    std::uint32_t* device_exclusive,
    int item_count,
    cudaStream_t stream) {
  ScanTemporaryStorage storage;
  CUDA_CHECK(cub::DeviceScan::InclusiveSum(
      nullptr,
      storage.inclusive.bytes,
      device_input,
      device_inclusive,
      item_count,
      stream));
  CUDA_CHECK(cudaMalloc(&storage.inclusive.data, storage.inclusive.bytes));

  CUDA_CHECK(cub::DeviceScan::ExclusiveSum(
      nullptr,
      storage.exclusive.bytes,
      device_input,
      device_exclusive,
      item_count,
      stream));
  CUDA_CHECK(cudaMalloc(&storage.exclusive.data, storage.exclusive.bytes));
  return storage;
}

void execute_device_scan(
    ScanTemporaryStorage& storage,
    const std::uint32_t* device_input,
    std::uint32_t* device_inclusive,
    std::uint32_t* device_exclusive,
    int item_count,
    cudaStream_t stream) {
  CUDA_CHECK(cub::DeviceScan::InclusiveSum(
      storage.inclusive.data,
      storage.inclusive.bytes,
      device_input,
      device_inclusive,
      item_count,
      stream));
  CUDA_CHECK(cub::DeviceScan::ExclusiveSum(
      storage.exclusive.data,
      storage.exclusive.bytes,
      device_input,
      device_exclusive,
      item_count,
      stream));
}
// [ex17-device-scan-end]

bool scan_invariants_hold(
    const std::vector<std::uint32_t>& input,
    const std::vector<std::uint32_t>& inclusive,
    const std::vector<std::uint32_t>& exclusive) {
  if (input.empty() || inclusive.size() != input.size() ||
      exclusive.size() != input.size()) {
    return false;
  }
  if (inclusive.front() != input.front() || exclusive.front() != 0U) return false;
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
  std::vector<float> reduction_input(ex17::kElementCount);
  std::vector<std::uint32_t> scan_input(ex17::kElementCount);
  std::vector<std::uint32_t> expected_inclusive(ex17::kElementCount);
  std::vector<std::uint32_t> expected_exclusive(ex17::kElementCount);
  std::vector<std::uint32_t> actual_inclusive(ex17::kElementCount);
  std::vector<std::uint32_t> actual_exclusive(ex17::kElementCount);

  if (!ex17::initialize_reduction_input(
          reduction_input.data(), reduction_input.size()) ||
      !ex17::initialize_bounded_scan_input(scan_input.data(), scan_input.size()) ||
      !ex17::inclusive_scan_reference(
          scan_input.data(),
          scan_input.size(),
          expected_inclusive.data(),
          expected_inclusive.size(),
          scan_input.size()) ||
      !ex17::exclusive_scan_reference(
          scan_input.data(),
          scan_input.size(),
          expected_exclusive.data(),
          expected_exclusive.size(),
          scan_input.size())) {
    std::cerr << "failed to construct EX17 host references\n";
    return EXIT_FAILURE;
  }
  const double reduction_reference =
      ex17::cpu_reference_sum(reduction_input.data(), reduction_input.size());

  const std::size_t reduction_bytes = reduction_input.size() * sizeof(float);
  const std::size_t scan_bytes = scan_input.size() * sizeof(std::uint32_t);
  const int item_count = static_cast<int>(ex17::kElementCount);

  cudaStream_t stream = nullptr;
  float* device_reduction_input = nullptr;
  float* device_reduction_output = nullptr;
  std::uint32_t* device_scan_input = nullptr;
  std::uint32_t* device_inclusive = nullptr;
  std::uint32_t* device_exclusive = nullptr;

  CUDA_CHECK(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_reduction_input), reduction_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_reduction_output), sizeof(float)));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_scan_input), scan_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_inclusive), scan_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_exclusive), scan_bytes));

  TemporaryStorage reduce_storage = query_device_reduce_storage(
      device_reduction_input,
      device_reduction_output,
      item_count,
      stream);
  ScanTemporaryStorage scan_storage = query_device_scan_storage(
      device_scan_input,
      device_inclusive,
      device_exclusive,
      item_count,
      stream);

  CUDA_CHECK(cudaMemcpyAsync(
      device_reduction_input,
      reduction_input.data(),
      reduction_bytes,
      cudaMemcpyHostToDevice,
      stream));
  CUDA_CHECK(cudaMemcpyAsync(
      device_scan_input,
      scan_input.data(),
      scan_bytes,
      cudaMemcpyHostToDevice,
      stream));

  execute_device_reduce(
      reduce_storage,
      device_reduction_input,
      device_reduction_output,
      item_count,
      stream);
  execute_device_scan(
      scan_storage,
      device_scan_input,
      device_inclusive,
      device_exclusive,
      item_count,
      stream);

  float reduction_result = 0.0F;
  CUDA_CHECK(cudaMemcpyAsync(
      &reduction_result,
      device_reduction_output,
      sizeof(reduction_result),
      cudaMemcpyDeviceToHost,
      stream));
  CUDA_CHECK(cudaMemcpyAsync(
      actual_inclusive.data(),
      device_inclusive,
      scan_bytes,
      cudaMemcpyDeviceToHost,
      stream));
  CUDA_CHECK(cudaMemcpyAsync(
      actual_exclusive.data(),
      device_exclusive,
      scan_bytes,
      cudaMemcpyDeviceToHost,
      stream));

  CUDA_CHECK(cudaStreamSynchronize(stream));

  const ex17::SumComparison reduction_comparison =
      ex17::compare_reduction_sum(reduction_reference, reduction_result);
  const bool inclusive_passed = ex17::compare_exact(
      expected_inclusive.data(), actual_inclusive.data(), actual_inclusive.size()).matches;
  const bool exclusive_passed = ex17::compare_exact(
      expected_exclusive.data(), actual_exclusive.data(), actual_exclusive.size()).matches;
  const bool recurrence_passed =
      scan_invariants_hold(scan_input, actual_inclusive, actual_exclusive);
  const bool last_total_passed =
      actual_inclusive.back() == ex17::kDeterministicScanTotal &&
      actual_exclusive.back() + scan_input.back() == ex17::kDeterministicScanTotal;

  std::cout << "cub-version=" << CUB_VERSION << '\n'
            << std::setprecision(10)
            << "reduction-reference=" << reduction_comparison.reference
            << " reduction-result=" << reduction_comparison.actual
            << " absolute-error=" << reduction_comparison.absolute_error
            << " allowed-error=" << reduction_comparison.allowed_error << '\n'
            << "reduction=" << (reduction_comparison.matches ? "PASS" : "FAIL") << '\n'
            << "inclusive=" << (inclusive_passed ? "PASS" : "FAIL") << '\n'
            << "exclusive=" << (exclusive_passed ? "PASS" : "FAIL") << '\n'
            << "recurrence=" << (recurrence_passed ? "PASS" : "FAIL") << '\n'
            << "last-total=" << (last_total_passed ? "PASS" : "FAIL") << '\n';

  CUDA_CHECK(cudaFree(scan_storage.exclusive.data));
  CUDA_CHECK(cudaFree(scan_storage.inclusive.data));
  CUDA_CHECK(cudaFree(reduce_storage.data));
  CUDA_CHECK(cudaFree(device_exclusive));
  CUDA_CHECK(cudaFree(device_inclusive));
  CUDA_CHECK(cudaFree(device_scan_input));
  CUDA_CHECK(cudaFree(device_reduction_output));
  CUDA_CHECK(cudaFree(device_reduction_input));
  CUDA_CHECK(cudaStreamDestroy(stream));

  return reduction_comparison.matches && inclusive_passed && exclusive_passed &&
          recurrence_passed && last_total_passed
      ? EXIT_SUCCESS
      : EXIT_FAILURE;
}
