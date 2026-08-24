// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cerrno>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <vector>

#include "vector_add_reference.hpp"

namespace {

constexpr std::size_t kDefaultElements = 1U << 20U;
constexpr std::size_t kMaximumElements = 1U << 27U;
constexpr unsigned int kThreadsPerBlock = 256U;

// [ex02-error-checking-start]
#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)
// [ex02-error-checking-end]

// [ex02-kernel-start]
__global__ void vector_add(
    const float* left,
    const float* right,
    float* output,
    std::size_t element_count) {
  const std::size_t index = blockIdx.x * blockDim.x + threadIdx.x;
  if (index < element_count) {
    output[index] = left[index] + right[index];
  }
}
// [ex02-kernel-end]

std::size_t parse_element_count(int argc, char** argv) {
  if (argc == 1) return kDefaultElements;
  if (argc != 2 || argv[1][0] == '-') {
    std::cerr << "Usage: ex02-vector-addition [element-count]\n";
    std::exit(EXIT_FAILURE);
  }

  errno = 0;
  char* end = nullptr;
  const unsigned long long parsed = std::strtoull(argv[1], &end, 10);
  if (errno != 0 || end == argv[1] || *end != '\0' || parsed == 0 || parsed > kMaximumElements) {
    std::cerr << "element-count must be between 1 and " << kMaximumElements << '\n';
    std::exit(EXIT_FAILURE);
  }
  return static_cast<std::size_t>(parsed);
}

void initialize_inputs(std::vector<float>& left, std::vector<float>& right) {
  for (std::size_t index = 0; index < left.size(); ++index) {
    left[index] = static_cast<float>(static_cast<int>(index % 257U) - 128) * 0.25F;
    right[index] = static_cast<float>(static_cast<int>(index % 113U) - 56) * 0.5F;
  }
}

}  // namespace

int main(int argc, char** argv) {
  const std::size_t element_count = parse_element_count(argc, argv);
  const std::size_t bytes = element_count * sizeof(float);

  std::vector<float> host_left(element_count);
  std::vector<float> host_right(element_count);
  std::vector<float> host_expected(element_count);
  std::vector<float> host_actual(element_count);
  initialize_inputs(host_left, host_right);
  ex02::vector_add_cpu(host_left.data(), host_right.data(), host_expected.data(), element_count);

  float* device_left = nullptr;
  float* device_right = nullptr;
  float* device_output = nullptr;
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_left), bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_right), bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_output), bytes));
  CUDA_CHECK(cudaMemcpy(device_left, host_left.data(), bytes, cudaMemcpyHostToDevice));
  CUDA_CHECK(cudaMemcpy(device_right, host_right.data(), bytes, cudaMemcpyHostToDevice));

  const std::size_t block_count =
      (element_count + kThreadsPerBlock - 1U) / kThreadsPerBlock;
  if (block_count > std::numeric_limits<unsigned int>::max()) {
    std::cerr << "grid size exceeds the one-dimensional launch boundary\n";
    return EXIT_FAILURE;
  }

  vector_add<<<static_cast<unsigned int>(block_count), kThreadsPerBlock>>>(
      device_left, device_right, device_output, element_count);
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaDeviceSynchronize());
  CUDA_CHECK(cudaMemcpy(host_actual.data(), device_output, bytes, cudaMemcpyDeviceToHost));

  const ex02::ComparisonResult comparison = ex02::compare_vectors(
      host_expected.data(), host_actual.data(), element_count);

  CUDA_CHECK(cudaFree(device_output));
  CUDA_CHECK(cudaFree(device_right));
  CUDA_CHECK(cudaFree(device_left));

  if (!comparison.passed) {
    std::cerr << "FAIL mismatch_index=" << comparison.mismatch_index
              << " maximum_absolute_error=" << comparison.maximum_absolute_error << '\n';
    return EXIT_FAILURE;
  }

  std::cout << "PASS elements=" << element_count
            << " maximum_absolute_error=" << comparison.maximum_absolute_error
            << " absolute_tolerance=" << ex02::kAbsoluteTolerance
            << " relative_tolerance=" << ex02::kRelativeTolerance << '\n';
  return EXIT_SUCCESS;
}
