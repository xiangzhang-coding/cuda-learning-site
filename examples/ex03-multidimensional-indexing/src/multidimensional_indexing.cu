// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cerrno>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "multidimensional_indexing_reference.hpp"

namespace {

constexpr ex03::Extent3D kDefaultExtent{1000U, 1U, 1U};
constexpr std::size_t kMaximumElements = 1U << 18U;
constexpr unsigned int kBlockExtent = 8U;

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

// [ex03-indexing-kernel-start]
__global__ void multidimensional_index(
    const std::uint32_t* input,
    std::uint32_t* output,
    std::size_t extent_x,
    std::size_t extent_y,
    std::size_t extent_z) {
  const std::size_t x =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  const std::size_t y =
      static_cast<std::size_t>(blockIdx.y) * blockDim.y + threadIdx.y;
  const std::size_t z =
      static_cast<std::size_t>(blockIdx.z) * blockDim.z + threadIdx.z;

  if (x >= extent_x) return;
  if (y >= extent_y) return;
  if (z >= extent_z) return;

  const std::size_t index = (z * extent_y + y) * extent_x + x;
  output[index] = input[index] + static_cast<std::uint32_t>(x + 3U * y + 7U * z);
}
// [ex03-indexing-kernel-end]

[[noreturn]] void fail_usage() {
  std::cerr << "Usage: ex03-multidimensional-indexing [x [y [z]]]\n"
            << "Each extent must be positive and the product must not exceed "
            << kMaximumElements << ".\n";
  std::exit(EXIT_FAILURE);
}

std::size_t parse_extent(const char* text) {
  if (text[0] == '-') fail_usage();

  errno = 0;
  char* end = nullptr;
  const unsigned long long parsed = std::strtoull(text, &end, 10);
  if (errno != 0 || end == text || *end != '\0' || parsed == 0 ||
      parsed > kMaximumElements) {
    fail_usage();
  }
  return static_cast<std::size_t>(parsed);
}

ex03::Extent3D parse_extents(int argc, char** argv) {
  if (argc > 4) fail_usage();

  ex03::Extent3D extent = kDefaultExtent;
  if (argc >= 2) extent.x = parse_extent(argv[1]);
  if (argc >= 3) extent.y = parse_extent(argv[2]);
  if (argc >= 4) extent.z = parse_extent(argv[3]);

  if (extent.x > kMaximumElements / extent.y ||
      extent.x * extent.y > kMaximumElements / extent.z) {
    fail_usage();
  }
  return extent;
}

void initialize_input(std::vector<std::uint32_t>& input) {
  for (std::size_t index = 0; index < input.size(); ++index) {
    input[index] = static_cast<std::uint32_t>((index * 17U + 3U) % 1009U);
  }
}

struct ComparisonResult {
  bool passed;
  std::size_t mismatch_index;
  std::uint32_t expected;
  std::uint32_t actual;
};

ComparisonResult compare_results(
    const std::vector<std::uint32_t>& expected,
    const std::vector<std::uint32_t>& actual) {
  for (std::size_t index = 0; index < expected.size(); ++index) {
    if (expected[index] != actual[index]) {
      return {false, index, expected[index], actual[index]};
    }
  }
  return {true, expected.size(), 0U, 0U};
}

}  // namespace

int main(int argc, char** argv) {
  const ex03::Extent3D extent = parse_extents(argc, argv);
  const std::size_t elements = ex03::element_count(extent);
  const std::size_t bytes = elements * sizeof(std::uint32_t);

  // [ex03-lifecycle-start]
  std::vector<std::uint32_t> host_input(elements);
  std::vector<std::uint32_t> host_expected(elements);
  std::vector<std::uint32_t> host_actual(elements);
  initialize_input(host_input);
  ex03::multidimensional_reference(host_input.data(), host_expected.data(), extent);

  std::uint32_t* device_input = nullptr;
  std::uint32_t* device_output = nullptr;
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_input), bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_output), bytes));
  CUDA_CHECK(cudaMemcpy(device_input, host_input.data(), bytes, cudaMemcpyHostToDevice));

  const dim3 block(
      kBlockExtent,
      extent.y > 1U ? kBlockExtent : 1U,
      extent.z > 1U ? kBlockExtent : 1U);
  const dim3 grid(
      static_cast<unsigned int>((extent.x + block.x - 1U) / block.x),
      static_cast<unsigned int>((extent.y + block.y - 1U) / block.y),
      static_cast<unsigned int>((extent.z + block.z - 1U) / block.z));
  multidimensional_index<<<grid, block>>>(
      device_input, device_output, extent.x, extent.y, extent.z);
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaDeviceSynchronize());
  CUDA_CHECK(cudaMemcpy(host_actual.data(), device_output, bytes, cudaMemcpyDeviceToHost));

  const ComparisonResult comparison = compare_results(host_expected, host_actual);

  CUDA_CHECK(cudaFree(device_output));
  CUDA_CHECK(cudaFree(device_input));
  // [ex03-lifecycle-end]

  if (!comparison.passed) {
    std::cerr << "FAIL mismatch_index=" << comparison.mismatch_index
              << " expected=" << comparison.expected
              << " actual=" << comparison.actual << '\n';
    return EXIT_FAILURE;
  }

  std::cout << "PASS extent=" << extent.x << 'x' << extent.y << 'x' << extent.z
            << " elements=" << elements << '\n';
  return EXIT_SUCCESS;
}
