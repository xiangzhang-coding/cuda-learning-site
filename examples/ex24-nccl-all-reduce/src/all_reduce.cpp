// SPDX-License-Identifier: Apache-2.0
#include "oracle.hpp"
#include <cuda_runtime.h>
#include <nccl.h>
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <thread>

static_assert(NCCL_VERSION_CODE == 23102, "EX24 requires NCCL 2.31.2 headers");
static_assert(CUDART_VERSION == 13030, "EX24 requires CUDA 13.3 headers");
static_assert(sizeof(std::int32_t) == 4);

namespace {
std::vector<ncclComm_t> comms;
[[noreturn]] void fail(const char* operation, const char* detail) {
  std::cerr << "FAIL operation=" << operation << " detail=" << detail << '\n';
  // Fatal policy: do not free possibly in-use host/device buffers or report success.
  // The external process watchdog also bounds blocking initialization/group/abort calls.
  for (auto& comm : comms) if (comm) {
    const auto status = ncclCommAbort(comm);
    comm = nullptr;
    if (status != ncclSuccess) std::cerr << "abort: " << ncclGetErrorString(status) << '\n';
  }
  std::cerr.flush();
  std::_Exit(EXIT_FAILURE);
}
void cuda(cudaError_t status, const char* operation) {
  if (status != cudaSuccess) fail(operation, cudaGetErrorString(status));
}
void nccl(ncclResult_t status, const char* operation) {
  if (status != ncclSuccess) fail(operation, ncclGetErrorString(status));
}
// [ex24-completion-start]
void complete(const std::vector<cudaStream_t>& streams) {
  const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(60);
  for (;;) {
    bool ready = true;
    for (std::size_t rank = 0; rank < streams.size(); ++rank) {
      cuda(cudaSetDevice(static_cast<int>(rank)), "select for completion");
      ncclResult_t async = ncclSuccess;
      nccl(ncclCommGetAsyncError(comms[rank], &async), "query async error");
      nccl(async, "communicator async state");
      const auto status = cudaStreamQuery(streams[rank]);
      if (status == cudaErrorNotReady) ready = false;
      else cuda(status, "stream completion");
    }
    if (ready) return;
    if (std::chrono::steady_clock::now() >= deadline) fail("completion", "60 second deadline");
    std::this_thread::sleep_for(std::chrono::milliseconds(1));
  }
}
// [ex24-completion-end]
}

int main(int argc, char** argv) {
  try {
    if (argc != 2) throw std::invalid_argument("usage: ex24-nccl-all-reduce RANKS (2..8)");
    const int count = ex24::ranks(argv[1]);
    int visible = 0, loaded = 0, runtime = 0, driver = 0;
    nccl(ncclGetVersion(&loaded), "NCCL version");
    if (loaded != NCCL_VERSION_CODE) fail("version", "loaded NCCL does not match headers");
    cuda(cudaRuntimeGetVersion(&runtime), "CUDA runtime version");
    cuda(cudaDriverGetVersion(&driver), "CUDA driver API version");
    if (runtime != CUDART_VERSION) fail("version", "loaded CUDA runtime does not match headers");
    cuda(cudaGetDeviceCount(&visible), "visible devices");
    if (visible < count) fail("hardware gate", "insufficient visible GPUs");
    std::cout << "processes=1 submitting_threads=1 ranks=" << count
              << " nccl_header=" << NCCL_VERSION_CODE << " nccl_loaded=" << loaded
              << " cudart_header=" << CUDART_VERSION << " cudart_loaded=" << runtime
              << " driver_api=" << driver << std::endl;
    std::vector<int> devices(count);
    std::vector<cudaStream_t> streams(count, nullptr);
    std::vector<std::int32_t*> send(count, nullptr), receive(count, nullptr);
    constexpr std::size_t maximum = 1048576;
    for (int rank = 0; rank < count; ++rank) {
      devices[rank] = rank;
      cuda(cudaSetDevice(rank), "select for allocation");
      cudaDeviceProp properties{};
      cuda(cudaGetDeviceProperties(&properties, rank), "device properties");
      std::size_t free = 0, total = 0;
      cuda(cudaMemGetInfo(&free, &total), "memory gate");
      if (properties.major * 10 + properties.minor < 75 || total < 8000000000ULL || free < 268435456ULL)
        fail("hardware gate", "requires CC>=7.5, total>=8GB and free>=256MiB per GPU");
      std::cout << "rank=" << rank << " visible_device=" << rank << " cc=" << properties.major
                << '.' << properties.minor << " total_bytes=" << total << " free_bytes=" << free
                << " stream=one-nonblocking-per-rank" << std::endl;
      cuda(cudaStreamCreateWithFlags(&streams[rank], cudaStreamNonBlocking), "create stream");
      cuda(cudaMalloc(reinterpret_cast<void**>(&send[rank]), maximum * 4), "allocate send");
      cuda(cudaMalloc(reinterpret_cast<void**>(&receive[rank]), maximum * 4), "allocate receive");
    }
    comms.resize(count, nullptr);
    nccl(ncclCommInitAll(comms.data(), count, devices.data()), "initialize all ranks");
    for (int rank = 0; rank < count; ++rank) {
      int actualRank = -1, actualCount = -1, device = -1;
      nccl(ncclCommUserRank(comms[rank], &actualRank), "query rank");
      nccl(ncclCommCount(comms[rank], &actualCount), "query size");
      nccl(ncclCommCuDevice(comms[rank], &device), "query communicator device");
      if (actualRank != rank || actualCount != count || device != devices[rank]) fail("mapping", "rank/device mismatch");
    }
    for (const std::size_t n : {std::size_t{1}, std::size_t{257}, maximum}) {
      std::vector<std::vector<std::int32_t>> inputs(count, std::vector<std::int32_t>(n));
      std::vector<std::vector<std::int32_t>> outputs(count, std::vector<std::int32_t>(n));
      for (int rank = 0; rank < count; ++rank) {
        for (std::size_t i = 0; i < n; ++i) inputs[rank][i] = ex24::input(rank, i);
        cuda(cudaSetDevice(rank), "select for upload");
        cuda(cudaMemcpyAsync(send[rank], inputs[rank].data(), n * 4, cudaMemcpyHostToDevice, streams[rank]), "upload");
      }
      // [ex24-collective-start]
      nccl(ncclGroupStart(), "group start");
      ncclResult_t submission = ncclSuccess;
      for (int rank = 0; rank < count; ++rank) {
        const auto status = ncclAllReduce(send[rank], receive[rank], n, ncclInt32,
                                         ncclSum, comms[rank], streams[rank]);
        if (status != ncclSuccess && submission == ncclSuccess) submission = status;
      }
      const auto group = ncclGroupEnd(); // Always close the group before handling submission errors.
      nccl(submission, "all-reduce submission");
      nccl(group, "group end"); // Blocking communicators: success means enqueued, not completed.
      complete(streams); // Poll before pageable D2H calls, which may block the submitting thread.
      for (int rank = 0; rank < count; ++rank) {
        cuda(cudaSetDevice(rank), "select for download");
        cuda(cudaMemcpyAsync(outputs[rank].data(), receive[rank], n * 4,
                             cudaMemcpyDeviceToHost, streams[rank]), "download");
      }
      complete(streams); // Keeps all host and device buffers alive until every rank completes.
      for (int rank = 0; rank < count; ++rank) {
        const auto errors = ex24::mismatches(outputs[rank], count);
        std::cout << "rank=" << rank << " count=" << n << " datatype=ncclInt32 op=ncclSum mismatches=" << errors << std::endl;
        if (errors != 0) fail("correctness", "all elements of every rank must match");
      }
      // [ex24-collective-end]
    }
    nccl(ncclGroupStart(), "finalization group start");
    ncclResult_t finalization = ncclSuccess;
    for (auto comm : comms) {
      const auto status = ncclCommFinalize(comm);
      if (status != ncclSuccess) finalization = status;
    }
    const auto end = ncclGroupEnd();
    nccl(finalization, "finalize"); nccl(end, "finalization group end");
    for (int rank = 0; rank < count; ++rank) {
      cuda(cudaSetDevice(rank), "select for cleanup");
      const auto status = ncclCommDestroy(comms[rank]);
      nccl(status, "destroy communicator");
      comms[rank] = nullptr;
      cuda(cudaFree(send[rank]), "free send"); cuda(cudaFree(receive[rank]), "free receive");
      cuda(cudaStreamDestroy(streams[rank]), "destroy stream");
    }
    std::cout << "PASS all ranks and workloads; cleanup complete; no timing collected\n";
    return EXIT_SUCCESS;
  } catch (const std::exception& error) {
    fail("host contract", error.what());
  }
}
