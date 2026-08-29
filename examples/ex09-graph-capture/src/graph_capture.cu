// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>

#include "graph_capture_reference.hpp"

namespace {

constexpr unsigned int kBlockSize = 32U;

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

__global__ void accumulate_input(
    const std::uint32_t* input,
    std::uint32_t* state,
    std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) state[index] += input[index];
}

__global__ void affine_transform(
    std::uint32_t* state,
    std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) state[index] = 2U * state[index] + 1U;
}

}  // namespace

int main() {
  if (!ex09::validate_fixed_graph_contract()) return EXIT_FAILURE;

  std::array<std::uint32_t, ex09::kElementCount> host_input{};
  std::array<std::uint32_t, ex09::kElementCount> host_expected{};
  std::array<std::uint32_t, ex09::kElementCount> host_actual{};
  if (!ex09::write_deterministic_input(host_input.data(), host_input.size()) ||
      !ex09::replay_reference(
          host_input.data(),
          host_input.size(),
          host_expected.data(),
          host_expected.size(),
          ex09::kReplayIterations)) {
    return EXIT_FAILURE;
  }

  // [ex09-captured-replay-start]
  const std::size_t bytes = host_input.size() * sizeof(std::uint32_t);
  std::uint32_t* device_input = nullptr;
  std::uint32_t* device_state = nullptr;
  cudaStream_t stream = nullptr;
  cudaGraph_t graph = nullptr;
  cudaGraphExec_t graph_exec = nullptr;

  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_input), bytes));
  CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_state), bytes));
  CUDA_CHECK(cudaMemcpy(
      device_input, host_input.data(), bytes, cudaMemcpyHostToDevice));
  CUDA_CHECK(cudaMemset(device_state, 0, bytes));
  CUDA_CHECK(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking));

  CUDA_CHECK(cudaStreamBeginCapture(stream, cudaStreamCaptureModeGlobal));
  accumulate_input<<<1U, kBlockSize, 0U, stream>>>(
      device_input, device_state, ex09::kElementCount);
  CUDA_CHECK(cudaGetLastError());
  affine_transform<<<1U, kBlockSize, 0U, stream>>>(
      device_state, ex09::kElementCount);
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaStreamEndCapture(stream, &graph));

  CUDA_CHECK(cudaGraphInstantiate(&graph_exec, graph, nullptr, nullptr, 0U));
  for (std::size_t iteration = 0U;
       iteration < ex09::kReplayIterations;
       ++iteration) {
    CUDA_CHECK(cudaGraphLaunch(graph_exec, stream));
  }

  CUDA_CHECK(cudaStreamSynchronize(stream));
  CUDA_CHECK(cudaMemcpy(
      host_actual.data(), device_state, bytes, cudaMemcpyDeviceToHost));
  const ex09::VerificationResult verification = ex09::verify_exact(
      host_expected.data(), host_actual.data(), host_actual.size());

  CUDA_CHECK(cudaGraphExecDestroy(graph_exec));
  CUDA_CHECK(cudaGraphDestroy(graph));
  CUDA_CHECK(cudaStreamDestroy(stream));
  CUDA_CHECK(cudaFree(device_state));
  CUDA_CHECK(cudaFree(device_input));
  // [ex09-captured-replay-end]

  std::cout << "result=" << (verification.matches ? "PASS" : "FAIL") << '\n';
  return verification.matches ? EXIT_SUCCESS : EXIT_FAILURE;
}
