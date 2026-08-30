// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cstddef>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <utility>
#include <vector>

#include "multi_stage_reduction_reference.hpp"

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

// [ex11-multi-stage-reduction-start]
__global__ void reduce_stage(
    const float* input,
    float* partial_sums,
    std::size_t element_count) {
  extern __shared__ float shared_values[];
  const std::size_t thread = threadIdx.x;
  const std::size_t block_begin =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x * 2U;
  const std::size_t first = block_begin + thread;
  const std::size_t second = first + blockDim.x;

  float thread_sum = 0.0F;
  if (first < element_count) thread_sum = input[first];
  if (second < element_count) thread_sum += input[second];
  shared_values[thread] = thread_sum;
  __syncthreads();

  for (unsigned int stride = blockDim.x / 2U;
       stride > 0U;
       stride >>= 1U) {
    if (threadIdx.x < stride) {
      shared_values[thread] += shared_values[thread + stride];
    }
    __syncthreads();
  }

  if (threadIdx.x == 0U) partial_sums[blockIdx.x] = shared_values[0];
}

float run_multi_stage_reduction(
    const float* device_input,
    float* device_partial_a,
    float* device_partial_b,
    std::size_t element_count) {
  const float* stage_input = device_input;
  float* stage_output = device_partial_a;
  std::size_t stage_size = element_count;

  while (stage_size > 1U) {
    const std::size_t next_stage_size = ex11::stage_output_count(stage_size);
    reduce_stage<<<
        static_cast<unsigned int>(next_stage_size),
        static_cast<unsigned int>(ex11::kBlockSize),
        ex11::kBlockSize * sizeof(float)>>>(
        stage_input, stage_output, stage_size);
    CUDA_CHECK(cudaGetLastError());

    stage_size = next_stage_size;
    stage_input = stage_output;
    stage_output = stage_output == device_partial_a
        ? device_partial_b
        : device_partial_a;
  }

  CUDA_CHECK(cudaDeviceSynchronize());
  float result = 0.0F;
  CUDA_CHECK(cudaMemcpy(
      &result, stage_input, sizeof(result), cudaMemcpyDeviceToHost));
  return result;
}
// [ex11-multi-stage-reduction-end]

}  // namespace

int main() {
  std::vector<float> input(ex11::kElementCount);
  if (!ex11::initialize_input(input.data(), input.size())) return EXIT_FAILURE;
  const double reference = ex11::cpu_reference_sum(input.data(), input.size());

  const std::size_t input_bytes = input.size() * sizeof(float);
  const std::size_t partial_capacity =
      ex11::stage_output_count(ex11::kElementCount);
  const std::size_t partial_bytes = partial_capacity * sizeof(float);

  float* device_input = nullptr;
  float* device_partial_a = nullptr;
  float* device_partial_b = nullptr;
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_input), input_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_partial_a), partial_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&device_partial_b), partial_bytes));
  CUDA_CHECK(cudaMemcpy(
      device_input, input.data(), input_bytes, cudaMemcpyHostToDevice));

  const float gpu_sum = run_multi_stage_reduction(
      device_input,
      device_partial_a,
      device_partial_b,
      ex11::kElementCount);
  const ex11::SumComparison comparison =
      ex11::compare_reduction_sum(reference, gpu_sum);

  std::cout << std::setprecision(10)
            << "cpu-reference=" << comparison.reference
            << " gpu-sum=" << comparison.actual
            << " absolute-error=" << comparison.absolute_error
            << " allowed-error=" << comparison.allowed_error << '\n'
            << "result=" << (comparison.matches ? "PASS" : "FAIL") << '\n';

  CUDA_CHECK(cudaFree(device_partial_b));
  CUDA_CHECK(cudaFree(device_partial_a));
  CUDA_CHECK(cudaFree(device_input));
  return comparison.matches ? EXIT_SUCCESS : EXIT_FAILURE;
}
