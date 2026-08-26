// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string_view>
#include <vector>

#include "error_handling_reference.hpp"

namespace {

constexpr ex04::Extent2D kIndexingExtent{7U, 5U};
constexpr unsigned int kBlockWidth = 8U;
constexpr unsigned int kBlockHeight = 4U;
constexpr unsigned int kInvalidThreadsPerBlock = 1025U;

// [ex04-indexing-kernels-start]
__global__ void launch_configuration_probe() {}

__global__ void deferred_invalid_access(volatile std::uint32_t* address) {
  if (blockIdx.x == 0U && threadIdx.x == 0U) {
    address[0] = 1U;
  }
}

__device__ std::uint32_t device_reference_value(std::size_t x, std::size_t y) {
  return 7U + 17U * static_cast<std::uint32_t>(x) +
      31U * static_cast<std::uint32_t>(y);
}

__global__ void indexing_defect(
    std::uint32_t* output,
    std::size_t width,
    std::size_t height) {
  const std::size_t x =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  const std::size_t y =
      static_cast<std::size_t>(blockIdx.y) * blockDim.y + threadIdx.y;
  if (x >= width || y >= height) return;

  const std::size_t in_bounds_but_wrong = x * height + y;
  output[in_bounds_but_wrong] = device_reference_value(x, y);
}

__global__ void repaired_indexing(
    std::uint32_t* output,
    std::size_t width,
    std::size_t height) {
  const std::size_t x =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  const std::size_t y =
      static_cast<std::size_t>(blockIdx.y) * blockDim.y + threadIdx.y;
  if (x >= width || y >= height) return;

  const std::size_t row_major = y * width + x;
  output[row_major] = device_reference_value(x, y);
}
// [ex04-indexing-kernels-end]

// [ex04-error-lifecycle-start]
void print_cuda_observation(
    std::string_view operation,
    ex04::ObservationStage stage,
    cudaError_t status) {
  std::cout << "stage=" << ex04::stage_label(stage)
            << " operation=" << operation
            << " status=" << cudaGetErrorName(status)
            << " detail=\"" << cudaGetErrorString(status) << "\"\n";
}

void print_cuda_status(std::string_view operation, cudaError_t status) {
  std::cout << "operation=" << operation
            << " status=" << cudaGetErrorName(status)
            << " detail=\"" << cudaGetErrorString(status) << "\"\n";
}

int run_launch_config() {
  launch_configuration_probe<<<1U, kInvalidThreadsPerBlock>>>();

  const cudaError_t peeked = cudaPeekAtLastError();
  print_cuda_observation(
      "cudaPeekAtLastError",
      ex04::ObservationStage::immediate_after_submission,
      peeked);
  if (peeked == cudaSuccess) {
    std::cerr << "Expected the launch configuration to fail at the immediate check.\n";
    return EXIT_FAILURE;
  }

  const cudaError_t cleared = cudaGetLastError();
  print_cuda_observation(
      "cudaGetLastError(clear)",
      ex04::ObservationStage::immediate_after_submission,
      cleared);
  if (cleared != peeked) {
    std::cerr << "The clearing read did not retrieve the state observed by the peek.\n";
    return EXIT_FAILURE;
  }

  const cudaError_t after_clear = cudaPeekAtLastError();
  print_cuda_observation(
      "cudaPeekAtLastError(after-clear)",
      ex04::ObservationStage::immediate_after_submission,
      after_clear);
  if (after_clear != cudaSuccess) {
    std::cerr << "The launch error state remained set after cudaGetLastError.\n";
    return EXIT_FAILURE;
  }

  const cudaError_t synchronized = cudaDeviceSynchronize();
  print_cuda_observation(
      "cudaDeviceSynchronize",
      ex04::ObservationStage::deferred_at_synchronization,
      synchronized);
  if (synchronized != cudaSuccess) {
    std::cerr << "No device work should remain after the rejected launch was cleared.\n";
    return EXIT_FAILURE;
  }
  return EXIT_SUCCESS;
}

int run_deferred_access() {
  auto* invalid_address = reinterpret_cast<volatile std::uint32_t*>(
      static_cast<std::uintptr_t>(1U));
  deferred_invalid_access<<<1U, 1U>>>(invalid_address);

  const cudaError_t immediate = cudaPeekAtLastError();
  print_cuda_observation(
      "cudaPeekAtLastError",
      ex04::ObservationStage::immediate_after_submission,
      immediate);
  if (immediate != cudaSuccess) {
    std::cerr << "The valid launch configuration failed before synchronization.\n";
    return EXIT_FAILURE;
  }

  const cudaError_t synchronized = cudaDeviceSynchronize();
  print_cuda_observation(
      "cudaDeviceSynchronize",
      ex04::ObservationStage::deferred_at_synchronization,
      synchronized);
  if (synchronized == cudaSuccess) {
    std::cerr << "The deliberately invalid device access was not reported at synchronization.\n";
    return EXIT_FAILURE;
  }

  // Do not issue cleanup or recovery calls against a context that may be unusable.
  return EXIT_SUCCESS;
}

int run_indexing(ex04::Scenario scenario) {
  std::size_t elements = 0U;
  if (!ex04::try_element_count(kIndexingExtent, elements)) return EXIT_FAILURE;
  const std::size_t bytes = elements * sizeof(std::uint32_t);

  std::vector<std::uint32_t> expected(elements);
  std::vector<std::uint32_t> actual(elements);
  if (!ex04::write_row_major_reference(
          expected.data(), expected.size(), kIndexingExtent)) {
    return EXIT_FAILURE;
  }

  std::uint32_t* device_output = nullptr;
  const cudaError_t allocated =
      cudaMalloc(reinterpret_cast<void**>(&device_output), bytes);
  print_cuda_status("cudaMalloc", allocated);
  if (allocated != cudaSuccess) return EXIT_FAILURE;

  const dim3 block(kBlockWidth, kBlockHeight);
  const dim3 grid(
      static_cast<unsigned int>((kIndexingExtent.width + block.x - 1U) / block.x),
      static_cast<unsigned int>((kIndexingExtent.height + block.y - 1U) / block.y));
  if (scenario == ex04::Scenario::indexing_defect) {
    indexing_defect<<<grid, block>>>(
        device_output, kIndexingExtent.width, kIndexingExtent.height);
  } else {
    repaired_indexing<<<grid, block>>>(
        device_output, kIndexingExtent.width, kIndexingExtent.height);
  }

  const cudaError_t immediate = cudaPeekAtLastError();
  print_cuda_observation(
      "cudaPeekAtLastError",
      ex04::ObservationStage::immediate_after_submission,
      immediate);
  if (immediate != cudaSuccess) return EXIT_FAILURE;

  const cudaError_t synchronized = cudaDeviceSynchronize();
  print_cuda_observation(
      "cudaDeviceSynchronize",
      ex04::ObservationStage::deferred_at_synchronization,
      synchronized);
  if (synchronized != cudaSuccess) return EXIT_FAILURE;

  const cudaError_t copied = cudaMemcpy(
      actual.data(), device_output, bytes, cudaMemcpyDeviceToHost);
  print_cuda_status("cudaMemcpy(device-to-host)", copied);
  if (copied != cudaSuccess) return EXIT_FAILURE;

  const cudaError_t released = cudaFree(device_output);
  print_cuda_status("cudaFree", released);
  if (released != cudaSuccess) return EXIT_FAILURE;

  const ex04::VerificationResult verification =
      ex04::verify_exact(expected.data(), actual.data(), elements);

  std::cout << "stage="
            << ex04::stage_label(ex04::ObservationStage::host_verification)
            << " result=" << (verification.matches ? "match" : "mismatch");
  if (!verification.matches) {
    std::cout << " index=" << verification.mismatch_index
              << " expected=" << verification.expected
              << " actual=" << verification.actual;
  }
  std::cout << '\n';

  const bool defect_was_detected =
      scenario == ex04::Scenario::indexing_defect && !verification.matches;
  const bool repair_was_verified =
      scenario == ex04::Scenario::repaired_indexing && verification.matches;
  return defect_was_detected || repair_was_verified ? EXIT_SUCCESS : EXIT_FAILURE;
}
// [ex04-error-lifecycle-end]

void print_usage() {
  std::cerr << "Usage: ex04-error-handling-lifecycle <scenario>\n"
            << "Scenarios: launch-config, deferred-access, indexing-defect, "
               "repaired-indexing\n"
            << "Run one scenario per process.\n";
}

}  // namespace

int main(int argc, char** argv) {
  if (argc != 2) {
    print_usage();
    return EXIT_FAILURE;
  }

  ex04::Scenario scenario = ex04::Scenario::launch_config;
  if (!ex04::parse_scenario(argv[1], scenario)) {
    print_usage();
    return EXIT_FAILURE;
  }

  switch (scenario) {
    case ex04::Scenario::launch_config:
      return run_launch_config();
    case ex04::Scenario::deferred_access:
      return run_deferred_access();
    case ex04::Scenario::indexing_defect:
    case ex04::Scenario::repaired_indexing:
      return run_indexing(scenario);
  }
  return EXIT_FAILURE;
}
