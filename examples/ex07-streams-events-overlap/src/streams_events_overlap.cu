// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "streams_events_overlap_reference.hpp"

namespace {

constexpr unsigned int kBlockSize = 128U;

#define CUDA_CHECK(call)                                                                    \
  do {                                                                                      \
    const cudaError_t status = (call);                                                       \
    if (status != cudaSuccess) {                                                             \
      std::cerr << "CUDA error at " << __FILE__ << ':' << __LINE__ << ": "                 \
                << cudaGetErrorString(status) << '\n';                                      \
      std::exit(EXIT_FAILURE);                                                               \
    }                                                                                       \
  } while (false)

// [ex07-stream-pipeline-start]
__global__ void transform_kernel(
    const std::uint32_t* input,
    std::uint32_t* output,
    std::size_t count) {
  const std::size_t index =
      static_cast<std::size_t>(blockIdx.x) * blockDim.x + threadIdx.x;
  if (index < count) output[index] = input[index] * 3U + 7U;
}

void enqueue_serial_path(
    const std::uint32_t* host_input,
    std::uint32_t* host_output,
    std::uint32_t* device_input,
    std::uint32_t* device_output,
    std::size_t element_count,
    std::size_t byte_count,
    cudaStream_t serial_stream,
    cudaEvent_t serial_complete) {
  CUDA_CHECK(cudaMemcpyAsync(
      device_input,
      host_input,
      byte_count,
      cudaMemcpyHostToDevice,
      serial_stream));
  const unsigned int grid_size = static_cast<unsigned int>(
      (element_count + kBlockSize - 1U) / kBlockSize);
  transform_kernel<<<grid_size, kBlockSize, 0U, serial_stream>>>(
      device_input, device_output, element_count);
  CUDA_CHECK(cudaGetLastError());
  CUDA_CHECK(cudaMemcpyAsync(
      host_output,
      device_output,
      byte_count,
      cudaMemcpyDeviceToHost,
      serial_stream));
  CUDA_CHECK(cudaEventRecord(serial_complete, serial_stream));
}

void enqueue_chunked_pipeline(
    const std::uint32_t* host_input,
    std::uint32_t* host_output,
    const std::vector<ex07::Chunk>& chunks,
    const std::array<std::uint32_t*, ex07::kChunkStreamCount>& device_inputs,
    const std::array<std::uint32_t*, ex07::kChunkStreamCount>& device_outputs,
    const std::array<cudaStream_t, ex07::kChunkStreamCount>& chunk_streams,
    cudaEvent_t serial_complete,
    const std::array<cudaEvent_t, ex07::kChunkStreamCount>& chunk_complete) {
  for (cudaStream_t stream : chunk_streams) {
    CUDA_CHECK(cudaStreamWaitEvent(stream, serial_complete, 0U));
  }

  for (std::size_t chunk_index = 0U; chunk_index < chunks.size(); ++chunk_index) {
    const ex07::Chunk chunk = chunks[chunk_index];
    const std::size_t stream_index = chunk_index % ex07::kChunkStreamCount;
    std::size_t chunk_bytes = 0U;
    if (!ex07::try_byte_count(chunk.count, chunk_bytes)) std::exit(EXIT_FAILURE);

    const cudaStream_t stream = chunk_streams[stream_index];
    CUDA_CHECK(cudaMemcpyAsync(
        device_inputs[stream_index],
        host_input + chunk.offset,
        chunk_bytes,
        cudaMemcpyHostToDevice,
        stream));
    const unsigned int grid_size = static_cast<unsigned int>(
        (chunk.count + kBlockSize - 1U) / kBlockSize);
    transform_kernel<<<grid_size, kBlockSize, 0U, stream>>>(
        device_inputs[stream_index], device_outputs[stream_index], chunk.count);
    CUDA_CHECK(cudaGetLastError());
    CUDA_CHECK(cudaMemcpyAsync(
        host_output + chunk.offset,
        device_outputs[stream_index],
        chunk_bytes,
        cudaMemcpyDeviceToHost,
        stream));
  }

  for (std::size_t index = 0U; index < ex07::kChunkStreamCount; ++index) {
    CUDA_CHECK(cudaEventRecord(chunk_complete[index], chunk_streams[index]));
  }
}
// [ex07-stream-pipeline-end]

}  // namespace

int main() {
  std::size_t total_bytes = 0U;
  std::size_t chunk_count = 0U;
  if (!ex07::try_byte_count(ex07::kElementCount, total_bytes) ||
      !ex07::try_chunk_count(
          ex07::kElementCount, ex07::kChunkElements, chunk_count)) {
    return EXIT_FAILURE;
  }

  std::vector<ex07::Chunk> chunks(chunk_count);
  std::size_t chunks_written = 0U;
  if (!ex07::build_chunk_partition(
          ex07::kElementCount,
          ex07::kChunkElements,
          chunks.data(),
          chunks.size(),
          chunks_written) ||
      chunks_written != chunks.size()) {
    return EXIT_FAILURE;
  }

  int device = 0;
  cudaDeviceProp properties{};
  CUDA_CHECK(cudaGetDevice(&device));
  CUDA_CHECK(cudaGetDeviceProperties(&properties, device));

  std::uint32_t* host_input = nullptr;
  std::uint32_t* host_serial = nullptr;
  std::uint32_t* host_chunked = nullptr;
  CUDA_CHECK(cudaMallocHost(reinterpret_cast<void**>(&host_input), total_bytes));
  CUDA_CHECK(cudaMallocHost(reinterpret_cast<void**>(&host_serial), total_bytes));
  CUDA_CHECK(cudaMallocHost(reinterpret_cast<void**>(&host_chunked), total_bytes));

  std::vector<std::uint32_t> host_expected(ex07::kElementCount);
  if (!ex07::initialize_input(host_input, ex07::kElementCount) ||
      !ex07::transform_reference(
          host_input,
          ex07::kElementCount,
          host_expected.data(),
          host_expected.size(),
          ex07::kElementCount)) {
    return EXIT_FAILURE;
  }

  std::uint32_t* serial_device_input = nullptr;
  std::uint32_t* serial_device_output = nullptr;
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&serial_device_input), total_bytes));
  CUDA_CHECK(cudaMalloc(
      reinterpret_cast<void**>(&serial_device_output), total_bytes));

  std::size_t slot_bytes = 0U;
  if (!ex07::try_byte_count(ex07::kChunkElements, slot_bytes)) {
    return EXIT_FAILURE;
  }
  std::array<std::uint32_t*, ex07::kChunkStreamCount> device_inputs{};
  std::array<std::uint32_t*, ex07::kChunkStreamCount> device_outputs{};
  std::array<cudaStream_t, ex07::kChunkStreamCount> chunk_streams{};
  std::array<cudaEvent_t, ex07::kChunkStreamCount> chunk_complete{};
  for (std::size_t index = 0U; index < ex07::kChunkStreamCount; ++index) {
    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&device_inputs[index]), slot_bytes));
    CUDA_CHECK(cudaMalloc(
        reinterpret_cast<void**>(&device_outputs[index]), slot_bytes));
    CUDA_CHECK(cudaStreamCreateWithFlags(
        &chunk_streams[index], cudaStreamNonBlocking));
    CUDA_CHECK(cudaEventCreateWithFlags(
        &chunk_complete[index], cudaEventDisableTiming));
  }

  cudaStream_t serial_stream = nullptr;
  cudaEvent_t serial_complete = nullptr;
  CUDA_CHECK(cudaStreamCreateWithFlags(&serial_stream, cudaStreamNonBlocking));
  CUDA_CHECK(cudaEventCreateWithFlags(
      &serial_complete, cudaEventDisableTiming));

  enqueue_serial_path(
      host_input,
      host_serial,
      serial_device_input,
      serial_device_output,
      ex07::kElementCount,
      total_bytes,
      serial_stream,
      serial_complete);
  enqueue_chunked_pipeline(
      host_input,
      host_chunked,
      chunks,
      device_inputs,
      device_outputs,
      chunk_streams,
      serial_complete,
      chunk_complete);

  CUDA_CHECK(cudaEventSynchronize(serial_complete));
  for (cudaEvent_t event : chunk_complete) CUDA_CHECK(cudaEventSynchronize(event));

  const bool serial_passed = ex07::verify_exact(
      host_expected.data(), host_serial, ex07::kElementCount).matches;
  const bool chunked_passed = ex07::verify_exact(
      host_expected.data(), host_chunked, ex07::kElementCount).matches;

  std::cout << "capability asyncEngineCount=" << properties.asyncEngineCount
            << " concurrentKernels=" << properties.concurrentKernels
            << " interpretation=capability-only\n";
  std::cout << "path=serial result="
            << (serial_passed ? "PASS" : "FAIL") << '\n';
  std::cout << "path=chunked result="
            << (chunked_passed ? "PASS" : "FAIL") << '\n';

  CUDA_CHECK(cudaEventDestroy(serial_complete));
  CUDA_CHECK(cudaStreamDestroy(serial_stream));
  for (std::size_t index = 0U; index < ex07::kChunkStreamCount; ++index) {
    CUDA_CHECK(cudaEventDestroy(chunk_complete[index]));
    CUDA_CHECK(cudaStreamDestroy(chunk_streams[index]));
    CUDA_CHECK(cudaFree(device_outputs[index]));
    CUDA_CHECK(cudaFree(device_inputs[index]));
  }
  CUDA_CHECK(cudaFree(serial_device_output));
  CUDA_CHECK(cudaFree(serial_device_input));
  CUDA_CHECK(cudaFreeHost(host_chunked));
  CUDA_CHECK(cudaFreeHost(host_serial));
  CUDA_CHECK(cudaFreeHost(host_input));

  return serial_passed && chunked_passed ? EXIT_SUCCESS : EXIT_FAILURE;
}
