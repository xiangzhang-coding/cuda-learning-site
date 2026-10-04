// SPDX-License-Identifier: Apache-2.0
#include "contract.hpp"
#include "launch.hpp"
#include <algorithm>
#include <cstdio>
#include <cstdlib>
#include <exception>

static void check(cudaError_t result) {
  if (result != cudaSuccess) {
    std::fprintf(stderr, "CUDA failure: %s\n", cudaGetErrorString(result));
    std::exit(EXIT_FAILURE); // No retry/fallback after a failed launch.
  }
}

int main(int argc, char** argv) try {
  const std::string_view mode = argc == 2 ? argv[1] : "auto";
  if (argc > 2) throw std::invalid_argument("usage: ex25-copy [auto|portable|specialized]");
  // Validate syntax before touching the driver.
  if (mode != "auto" && mode != "portable" && mode != "specialized")
    throw std::invalid_argument("unknown mode");
  int devices = 0;
  check(cudaGetDeviceCount(&devices));
  if (devices < 1) throw std::runtime_error("no CUDA device");
  check(cudaSetDevice(0));
  cudaDeviceProp prop{};
  check(cudaGetDeviceProperties(&prop, 0));
  const int cc = prop.major * 10 + prop.minor;
  if (cc < 75) throw std::runtime_error("outside CC 7.5+ site scope");
  std::size_t free_bytes = 0, total_bytes = 0;
  check(cudaMemGetInfo(&free_bytes, &total_bytes));
  if (total_bytes < 8000000000ULL || free_bytes < 536870912ULL)
    throw std::runtime_error("requires 8 GB total and 512 MiB free");
  const bool specialized = ex25::select_specialized(mode, EX25_TARGET, cc);
  int driver = 0, runtime = 0;
  check(cudaDriverGetVersion(&driver)); check(cudaRuntimeGetVersion(&runtime));
  std::printf("target=%s cc=%d driver_api=%d runtime=%d free=%zu selected=%s\n",
    EX25_TARGET, cc, driver, runtime, free_bytes, specialized ? "specialized" : "portable");
  cudaStream_t stream{};
  check(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking));
  cudaEvent_t start{}, stop{};
  check(cudaEventCreate(&start)); check(cudaEventCreate(&stop));
  for (const int count : {256, 4096, 65536}) {
    const std::size_t storage = count + 2 * ex25::guard_elements;
    const std::size_t bytes = storage * sizeof(int);
    int *input = nullptr, *output = nullptr;
    check(cudaMalloc(&input, bytes)); check(cudaMalloc(&output, bytes));
    for (int pattern = 0; pattern < 3; ++pattern) {
      std::vector<int> host_input(storage, ex25::sentinel), host_output(storage, ex25::sentinel);
      for (int i = 0; i < count; ++i) host_input[i + ex25::guard_elements] = ex25::input_value(i, pattern);
      check(cudaMemcpyAsync(input, host_input.data(), bytes, cudaMemcpyHostToDevice, stream));
      // Always verify baseline independently before an admitted specialization.
      for (int path = 0; path < (specialized ? 2 : 1); ++path) {
        std::fill(host_output.begin(), host_output.end(), ex25::sentinel);
        check(cudaMemcpyAsync(output, host_output.data(), bytes, cudaMemcpyHostToDevice, stream));
        const auto launch = path ? launch_specialized : launch_portable;
        check(launch(input + ex25::guard_elements, output + ex25::guard_elements, count, stream));
        check(cudaMemcpyAsync(host_output.data(), output, bytes, cudaMemcpyDeviceToHost, stream));
        check(cudaStreamSynchronize(stream));
        if (!ex25::correct(host_output, count, pattern)) throw std::runtime_error("output or guard mismatch");
        std::printf("path=%s count=%d pattern=%d correctness=PASS\n", path ? "specialized" : "portable", count, pattern);
        if (pattern != 0) continue;
        for (int i = 0; i < 5; ++i) check(launch(input + 4, output + 4, count, stream));
        check(cudaStreamSynchronize(stream));
        for (int sample = 0; sample < 10; ++sample) {
          check(cudaEventRecord(start, stream));
          for (int i = 0; i < 100; ++i) check(launch(input + 4, output + 4, count, stream));
          check(cudaEventRecord(stop, stream)); check(cudaEventSynchronize(stop));
          float ms = 0;
          check(cudaEventElapsedTime(&ms, start, stop));
          std::printf("path=%s count=%d sample=%d batch_ms=%.9g launches=100\n", path ? "specialized" : "portable", count, sample, ms);
        }
        check(cudaMemcpyAsync(host_output.data(), output, bytes, cudaMemcpyDeviceToHost, stream));
        check(cudaStreamSynchronize(stream));
        if (!ex25::correct(host_output, count, pattern)) throw std::runtime_error("post-timing mismatch");
      }
    }
    check(cudaFree(output)); check(cudaFree(input));
  }
  check(cudaEventDestroy(stop)); check(cudaEventDestroy(start)); check(cudaStreamDestroy(stream));
  std::puts("PASS: all requested paths checked; this log needs its Environment Manifest");
  return EXIT_SUCCESS;
} catch (const std::exception& error) {
  std::fprintf(stderr, "FAIL: %s\n", error.what());
  return EXIT_FAILURE;
}
