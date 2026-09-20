// SPDX-License-Identifier: Apache-2.0
// Original G06 exercise solution. No GPU execution or performance evidence is bundled.
#include <cuda_runtime.h>
#include <cuda_profiler_api.h>
#include <nccl.h>
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

static_assert(NCCL_VERSION_CODE == 23102, "NCCL 2.31.2 required");
static_assert(CUDART_VERSION == 13030, "CUDA 13.3 required");
static_assert(sizeof(int) == 4);
namespace {
std::vector<ncclComm_t> comms;
[[noreturn]] void fail(const char* message) {
  std::cerr << "FAIL " << message << std::endl;
  for (auto comm : comms) if (comm) (void)ncclCommAbort(comm);
  std::_Exit(EXIT_FAILURE); // Never free buffers that may still be in flight.
}
void cu(cudaError_t result) { if (result != cudaSuccess) fail(cudaGetErrorString(result)); }
void nc(ncclResult_t result) { if (result != ncclSuccess) fail(ncclGetErrorString(result)); }
int number(const char* text, int low, int high) {
  const std::string value(text);
  if (value.empty() || value.find_first_not_of("0123456789") != std::string::npos) throw std::invalid_argument("decimal integer required");
  const auto n = std::stoll(value);
  if (n < low || n > high) throw std::invalid_argument("argument outside bounded workload");
  return static_cast<int>(n);
}
// Iteration-dependent input detects stale outputs; the global index detects bad tail offsets.
__global__ void produce(int* input, int offset, int count, int rank, int iteration) {
  const int j = static_cast<int>(blockIdx.x * blockDim.x + threadIdx.x);
  if (j < count) input[offset + j] = 3 * (rank + 1) + (offset + j) % 17 - 8 + iteration % 3;
}
__global__ void consume(int* output, int offset, int count) {
  const int j = static_cast<int>(blockIdx.x * blockDim.x + threadIdx.x);
  if (j < count) output[offset + j] = 2 * output[offset + j] + 1;
}
struct Rank {
  int *input = nullptr, *output = nullptr;
  cudaStream_t p{}, c{}, q{};
  std::vector<cudaEvent_t> ready, done;
};
void drain(const std::vector<Rank>& ranks) {
  const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(60);
  for (;;) {
    bool complete = true;
    for (std::size_t r = 0; r < ranks.size(); ++r) {
      cu(cudaSetDevice(static_cast<int>(r)));
      ncclResult_t async;
      nc(ncclCommGetAsyncError(comms[r], &async)); nc(async);
      const auto status = cudaStreamQuery(ranks[r].q);
      if (status == cudaErrorNotReady) complete = false;
      else cu(status);
    }
    if (complete) return;
    if (std::chrono::steady_clock::now() >= deadline) fail("completion deadline");
    std::this_thread::yield();
  }
}
}
int main(int argc, char** argv) {
  try {
    if (argc != 7) throw std::invalid_argument("usage: lab18 serial|pipeline R N C SAMPLES TRACE(0|1)");
    const std::string mode(argv[1]);
    if (mode != "serial" && mode != "pipeline") throw std::invalid_argument("invalid mode");
    const int R = number(argv[2], 2, 8), N = number(argv[3], 1, 1048576);
    const int C = number(argv[4], 1, N), samples = number(argv[5], 1, 100), trace = number(argv[6], 0, 1);
    const int chunks = (N + C - 1) / C;
    if (chunks > 1024 || (trace && samples != 1)) throw std::invalid_argument("at most 1024 chunks; trace requires one sample");
    int visible = 0, version = 0;
    cu(cudaGetDeviceCount(&visible));
    if (visible < R) fail("insufficient GPUs");
    nc(ncclGetVersion(&version)); if (version != NCCL_VERSION_CODE) fail("NCCL runtime mismatch");
    cu(cudaRuntimeGetVersion(&version)); if (version != CUDART_VERSION) fail("CUDA runtime mismatch");
    std::vector<Rank> ranks(R);
    std::vector<int> devices(R);
    for (int r = 0; r < R; ++r) {
      devices[r] = r; cu(cudaSetDevice(r));
      cudaDeviceProp prop{}; cu(cudaGetDeviceProperties(&prop, r));
      std::size_t free = 0, total = 0; cu(cudaMemGetInfo(&free, &total));
      if (prop.major * 10 + prop.minor < 75 || total < 8000000000ULL || free < 268435456ULL) fail("CC/memory gate");
      auto& x = ranks[r];
      cu(cudaStreamCreateWithFlags(&x.p, cudaStreamNonBlocking));
      cu(cudaStreamCreateWithFlags(&x.c, cudaStreamNonBlocking));
      cu(cudaStreamCreateWithFlags(&x.q, cudaStreamNonBlocking));
      cu(cudaMalloc(reinterpret_cast<void**>(&x.input), N * sizeof(int)));
      cu(cudaMalloc(reinterpret_cast<void**>(&x.output), N * sizeof(int)));
      x.ready.resize(chunks); x.done.resize(chunks);
      for (int k = 0; k < chunks; ++k) {
        cu(cudaEventCreateWithFlags(&x.ready[k], cudaEventDisableTiming));
        cu(cudaEventCreateWithFlags(&x.done[k], cudaEventDisableTiming));
      }
      std::cout << "rank=" << r << " visible=" << r << " cc=" << prop.major << '.' << prop.minor
                << " total=" << total << " free=" << free << '\n';
    }
    comms.resize(R, nullptr); nc(ncclCommInitAll(comms.data(), R, devices.data()));
    std::vector<int> host(N);
    std::cout << "mode=" << mode << " R=" << R << " N=" << N << " C=" << C
              << " chunks=" << chunks << " warmup=5 samples=" << samples << " trace=" << trace << std::endl;
    for (int iteration = 0; iteration < 5 + samples; ++iteration) {
      // Previous iteration's consumers and host validation are complete before events are re-recorded.
      if (trace && iteration == 5) { cu(cudaSetDevice(0)); cu(cudaProfilerStart()); }
      const auto start = std::chrono::steady_clock::now();
      for (int k = 0; k < chunks; ++k) {
        const int offset = k * C, count = std::min(C, N - offset);
        for (int r = 0; r < R; ++r) {
          cu(cudaSetDevice(r)); auto& x = ranks[r];
          produce<<<(count + 255) / 256, 256, 0, x.p>>>(x.input, offset, count, r, iteration);
          cu(cudaGetLastError()); cu(cudaEventRecord(x.ready[k], x.p));
          cu(cudaStreamWaitEvent(x.c, x.ready[k], 0));
        }
        nc(ncclGroupStart());
        ncclResult_t submission = ncclSuccess;
        for (int r = 0; r < R; ++r) {
          auto& x = ranks[r];
          const auto status = ncclAllReduce(x.input + offset, x.output + offset, count, ncclInt32, ncclSum, comms[r], x.c);
          if (status != ncclSuccess && submission == ncclSuccess) submission = status;
        }
        const auto end = ncclGroupEnd(); nc(submission); nc(end);
        for (int r = 0; r < R; ++r) {
          cu(cudaSetDevice(r)); auto& x = ranks[r];
          cu(cudaEventRecord(x.done[k], x.c)); cu(cudaStreamWaitEvent(x.q, x.done[k], 0));
          consume<<<(count + 255) / 256, 256, 0, x.q>>>(x.output, offset, count);
          cu(cudaGetLastError());
        }
        if (mode == "serial") drain(ranks);
      }
      drain(ranks); // All ranks' final consumers; also transitively completes producers and collectives.
      const auto stop = std::chrono::steady_clock::now();
      if (trace && iteration == 5) { cu(cudaSetDevice(0)); cu(cudaProfilerStop()); }
      for (int r = 0; r < R; ++r) {
        cu(cudaSetDevice(r)); cu(cudaMemcpy(host.data(), ranks[r].output, N * sizeof(int), cudaMemcpyDeviceToHost));
        int mismatches = 0;
        for (int i = 0; i < N; ++i) {
          const int expected = 2 * (3 * R * (R + 1) / 2 + R * (i % 17 - 8 + iteration % 3)) + 1;
          if (host[i] != expected) ++mismatches;
        }
        std::cout << "iteration=" << iteration << " rank=" << r << " mismatches=" << mismatches << '\n';
        if (mismatches) fail("correctness");
      }
      if (iteration >= 5) std::cout << "sample=" << iteration - 5 << " seconds="
        << std::chrono::duration<double>(stop - start).count() << " profiled=" << trace << std::endl;
    }
    nc(ncclGroupStart()); ncclResult_t finalization = ncclSuccess;
    for (auto comm : comms) { const auto status = ncclCommFinalize(comm); if (status != ncclSuccess) finalization = status; }
    const auto end = ncclGroupEnd(); nc(finalization); nc(end);
    for (int r = 0; r < R; ++r) {
      cu(cudaSetDevice(r)); auto& x = ranks[r];
      const auto status = ncclCommDestroy(comms[r]); comms[r] = nullptr; nc(status);
      for (int k = 0; k < chunks; ++k) { cu(cudaEventDestroy(x.ready[k])); cu(cudaEventDestroy(x.done[k])); }
      cu(cudaFree(x.input)); cu(cudaFree(x.output));
      cu(cudaStreamDestroy(x.p)); cu(cudaStreamDestroy(x.c)); cu(cudaStreamDestroy(x.q));
    }
    std::cout << "PASS all ranks, iterations and elements; cleanup complete\n";
    return EXIT_SUCCESS;
  } catch (const std::exception& error) { fail(error.what()); }
}
