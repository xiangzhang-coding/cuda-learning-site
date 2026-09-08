// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>
#include <cufft.h>

#include <algorithm>
#include <cstdio>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <vector>

#include "cufft_batched_reference.hpp"

#if !defined(EX19_EXPECTED_CUFFT_MAJOR) || !defined(EX19_EXPECTED_CUFFT_MINOR) || \
    !defined(EX19_EXPECTED_CUFFT_PATCH) || !defined(EX19_EXPECTED_CUFFT_BUILD)
#error "EX19 requires an explicit four-part cuFFT component version"
#endif
#if !defined(CUFFT_VER_MAJOR) || !defined(CUFFT_VER_MINOR) || \
    !defined(CUFFT_VER_PATCH) || !defined(CUFFT_VER_BUILD)
#error "EX19 requires all four cuFFT header version macros"
#endif
#if CUFFT_VER_MAJOR != EX19_EXPECTED_CUFFT_MAJOR || CUFFT_VER_MINOR != EX19_EXPECTED_CUFFT_MINOR || \
    CUFFT_VER_PATCH != EX19_EXPECTED_CUFFT_PATCH || CUFFT_VER_BUILD != EX19_EXPECTED_CUFFT_BUILD
#error "EX19 cuFFT headers do not match the selected component profile"
#endif

namespace {

bool report(cudaError_t status, const char* operation) noexcept {
  if (status == cudaSuccess) return true;
  std::fprintf(stderr, "%s: %s (%d)\n", operation, cudaGetErrorString(status), static_cast<int>(status));
  return false;
}

bool report(cufftResult status, const char* operation) noexcept {
  if (status == CUFFT_SUCCESS) return true;
  std::fprintf(stderr, "%s: cuFFT status %d\n", operation, static_cast<int>(status));
  return false;
}

void check(cudaError_t status, const char* operation) {
  if (!report(status, operation)) throw std::runtime_error(operation);
}

void check(cufftResult status, const char* operation) {
  if (!report(status, operation)) throw std::runtime_error(operation);
}

struct Resources {
  cudaStream_t stream = nullptr;
  cufftHandle plan{};
  bool plan_created = false;
  void* workspace = nullptr;
  cufftComplex* input = nullptr;
  cufftComplex* output = nullptr;

  Resources() = default;
  Resources(const Resources&) = delete;
  Resources& operator=(const Resources&) = delete;

  // [ex19-plan-layout-start]
  void initialize() {
    check(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking), "create EX19 stream");
    check(cufftCreate(&plan), "create cuFFT plan");
    plan_created = true;
    check(cufftSetAutoAllocation(plan, 0), "disable automatic workspace allocation");
    int n[]{ex19::kLength};
    int inembed[]{ex19::kLength};
    int onembed[]{ex19::kLength};
    std::size_t planned_bytes = 0;
    // All offsets are in cufftComplex elements, not bytes. Non-null embeddings
    // activate the advanced layout: input[b*11+x*2], output[b*16+x*3].
    check(cufftMakePlanMany(plan, 1, n,
                           inembed, ex19::kInputStride, ex19::kInputDistance,
                           onembed, ex19::kOutputStride, ex19::kOutputDistance,
                           CUFFT_C2C, ex19::kBatch, &planned_bytes), "make batched C2C plan");
    check(cufftSetStream(plan, stream), "associate EX19 stream");
    std::size_t workspace_bytes = 0;
    check(cufftGetSize(plan, &workspace_bytes), "query final workspace bytes");
    constexpr std::size_t buffer_bytes =
        (ex19::kInputCount + ex19::kOutputCount) * sizeof(cufftComplex);
    if (workspace_bytes > 8000000000ULL - buffer_bytes)
      throw std::runtime_error("workspace exceeds EX19 problem-memory budget");
    if (workspace_bytes != 0)
      check(cudaMalloc(&workspace, workspace_bytes), "allocate caller workspace");
    check(cufftSetWorkArea(plan, workspace), "attach caller workspace (null if zero bytes)");
    check(cudaMalloc(reinterpret_cast<void**>(&input), ex19::kInputCount * sizeof(cufftComplex)),
          "allocate padded input");
    check(cudaMalloc(reinterpret_cast<void**>(&output), ex19::kOutputCount * sizeof(cufftComplex)),
          "allocate separate padded output");
    std::cout << "rank=1 length=4 batch=2 istride=2 idist=11 ostride=3 odist=16"
              << " inembed=4 onembed=4 type=CUFFT_C2C precision=FP32 placement=out-of-place"
              << " planned_workspace_bytes=" << planned_bytes
              << " attached_workspace_bytes=" << workspace_bytes << '\n';
  }
  // [ex19-plan-layout-end]

  // [ex19-stream-lifecycle-start]
  void execute(std::vector<cufftComplex>& host_input,
               std::vector<cufftComplex>& host_output, int direction) {
    check(cudaMemcpyAsync(input, host_input.data(), host_input.size() * sizeof(cufftComplex),
                          cudaMemcpyHostToDevice, stream), "input H2D");
    check(cudaMemcpyAsync(output, host_output.data(), host_output.size() * sizeof(cufftComplex),
                          cudaMemcpyHostToDevice, stream), "initialize output H2D");
    check(cufftExecC2C(plan, input, output, direction), "execute C2C");
    check(cudaMemcpyAsync(host_output.data(), output, host_output.size() * sizeof(cufftComplex),
                          cudaMemcpyDeviceToHost, stream), "output D2H");
    // Validation, repacking, and sequential reuse all happen after completion.
    check(cudaStreamSynchronize(stream), "C2C completion before validation/reuse");
  }

  bool close() noexcept {
    bool ok = true;
    // Also drain partial submissions. Report every error; never short-circuit
    // release attempts. Host transfer buffers outlive this resource owner.
    if (stream != nullptr) ok = report(cudaStreamSynchronize(stream), "cleanup stream sync") && ok;
    if (plan_created) {
      ok = report(cufftDestroy(plan), "destroy cuFFT plan") && ok;
      plan_created = false;
    }
    if (workspace != nullptr) {
      ok = report(cudaFree(workspace), "free caller workspace") && ok;
      workspace = nullptr;
    }
    for (cufftComplex** pointer : {&output, &input}) {
      if (*pointer != nullptr) {
        ok = report(cudaFree(*pointer), "free device buffer") && ok;
        *pointer = nullptr;
      }
    }
    if (stream != nullptr) {
      ok = report(cudaStreamDestroy(stream), "destroy EX19 stream") && ok;
      stream = nullptr;
    }
    return ok;
  }

  ~Resources() noexcept { close(); }
  // [ex19-stream-lifecycle-end]
};

}  // namespace

int main() {
  try {
    // No transfer points into a loop-local allocation that could die on failure.
    std::vector<cufftComplex> host_input(ex19::kInputCount), host_output(ex19::kOutputCount);
    Resources resources;
    int exit_status = 0;
    try {
      int major = 0, minor = 0, patch = 0, raw_version = 0;
      check(cufftGetProperty(MAJOR_VERSION, &major), "loaded cuFFT major");
      check(cufftGetProperty(MINOR_VERSION, &minor), "loaded cuFFT minor");
      check(cufftGetProperty(PATCH_LEVEL, &patch), "loaded cuFFT patch");
      check(cufftGetVersion(&raw_version), "loaded cuFFT raw version");
      std::cout << "cuFFT headers=" << CUFFT_VER_MAJOR << '.' << CUFFT_VER_MINOR << '.'
                << CUFFT_VER_PATCH << '.' << CUFFT_VER_BUILD
                << " loaded=" << major << '.' << minor << '.' << patch
                << " loaded_raw=" << raw_version
                << " comparison_granularity=major.minor.patch loaded_build=not-exposed-by-API\n";
      if (major != CUFFT_VER_MAJOR || minor != CUFFT_VER_MINOR || patch != CUFFT_VER_PATCH)
        throw std::runtime_error("loaded cuFFT version differs from header profile");
      int count = 0;
      check(cudaGetDeviceCount(&count), "device count");
      if (count < 1) throw std::runtime_error("one CUDA device is required");
      check(cudaSetDevice(0), "select device 0");
      cudaDeviceProp device{};
      check(cudaGetDeviceProperties(&device, 0), "device properties");
      if (device.major * 10 + device.minor < 75)
        throw std::runtime_error("EX19 requires compute capability 7.5 or newer");
      int driver = 0, runtime = 0;
      check(cudaDriverGetVersion(&driver), "driver CUDA API level");
      check(cudaRuntimeGetVersion(&runtime), "runtime CUDA API level");
      std::cout << "device=" << device.name << " cc=" << device.major << '.' << device.minor
                << " visible_devices=" << count << " selected_device=0"
                << " driver_cuda_api_level=" << driver << " runtime_cuda_api_level=" << runtime
                << " cudart_header_api_level=" << CUDART_VERSION
                << " package_versions=record-separately-in-environment-manifest\n";
      resources.initialize();

      for (const auto& fixture : ex19::fixtures()) {
        const auto forward_reference = ex19::dft(fixture.input, -1);
        if (!ex19::matches(fixture.forward, forward_reference))
          throw std::runtime_error("CPU DFT disagrees with literal forward spectrum");
        const auto inverse_reference = ex19::dft(fixture.forward, 1);
        auto next_input = fixture.input;
        for (int direction : {CUFFT_FORWARD, CUFFT_INVERSE}) {
          std::fill(host_input.begin(), host_input.end(), cufftComplex{123.0F, -321.0F});
          const float nan = std::numeric_limits<float>::quiet_NaN();
          std::fill(host_output.begin(), host_output.end(), cufftComplex{nan, nan});
          for (int b = 0; b < ex19::kBatch; ++b) {
            for (int x = 0; x < ex19::kLength; ++x) {
              const auto value = next_input[b * ex19::kLength + x];
              host_input[ex19::input_index(b, x)] =
                  cufftComplex{static_cast<float>(value.real()), static_cast<float>(value.imag())};
            }
          }
          resources.execute(host_input, host_output, direction);
          ex19::Values actual(ex19::kBatch * ex19::kLength);
          for (int b = 0; b < ex19::kBatch; ++b) {
            for (int k = 0; k < ex19::kLength; ++k) {
              const auto value = host_output[ex19::output_index(b, k)];
              actual[b * ex19::kLength + k] = {value.x, value.y};
            }
          }
          const auto& expected = direction == CUFFT_FORWARD ? forward_reference : inverse_reference;
          if (!ex19::matches(expected, actual))
            throw std::runtime_error(std::string(fixture.id) + " finite full-output DFT tolerance failure");
          if (direction == CUFFT_FORWARD) {
            // The plan always reads stride 2/distance 11, even for inverse.
            // Repack the completed GPU spectrum on the host; do NOT swap device pointers.
            next_input = actual;
          } else {
            for (auto& value : actual) value /= ex19::kLength;
            if (!ex19::matches(fixture.input, actual))
              throw std::runtime_error("explicit host normalization 1/N failed");
          }
          std::cout << fixture.id << " direction=" << direction << " checked_complex_outputs=8"
                    << " plan_policy=sequential-reuse correctness: pass\n";
        }
      }
    } catch (const std::exception& error) {
      std::cerr << "EX19 failed: " << error.what() << '\n';
      exit_status = 1;
    }
    if (!resources.close()) exit_status = 1;
    return exit_status;
  } catch (const std::exception& error) {
    std::cerr << "EX19 host allocation failure: " << error.what() << '\n';
    return 1;
  }
}
