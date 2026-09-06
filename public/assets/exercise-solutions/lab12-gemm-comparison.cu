// SPDX-License-Identifier: Apache-2.0
// Original LAB12 instrumentation; canonical GEMM implementations are included below.
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

#include "tiled_gemm_reference.hpp"
#include "cublas_gemm_reference.hpp"

#ifndef LAB12_HOST_ONLY
#define main lab12_ex15_main
#include "examples/ex15-tiled-gemm/src/tiled_gemm.cu"
#undef main
#define main lab12_ex18_main
#include "examples/ex18-cublas-gemm/src/cublas_gemm.cu"
#undef main
#endif

struct Lab12Input {
  ex15::Fixture fixture;
  std::vector<float> a, b, initial_c;
  std::vector<double> expected;

  explicit Lab12Input(const ex15::Fixture& selected) : fixture(selected) {
    std::size_t ac = 0, bc = 0, cc = 0;
    if (!ex15::matrix_counts(fixture.shape, &ac, &bc, &cc)) {
      throw std::runtime_error("invalid fixture extent");
    }
    a.resize(ac);
    b.resize(bc);
    initial_c.resize(cc);
    expected.resize(cc);
    if (!ex15::make_fixture(fixture.id, a.data(), ac, b.data(), bc, initial_c.data(), cc) ||
        !ex15::gemm_reference(a.data(), ac, b.data(), bc, initial_c.data(), cc,
            fixture.shape, fixture.alpha, fixture.beta, expected.data(), cc)) {
      throw std::runtime_error("fixture/oracle failed");
    }
    const ex18::Fixture* other = nullptr;
    for (const auto& candidate : ex18::kFixtures) {
      if (candidate.id == fixture.id) other = &candidate;
    }
    if (other == nullptr || other->shape.m != fixture.shape.m ||
        other->shape.k != fixture.shape.k || other->shape.n != fixture.shape.n ||
        other->alpha != fixture.alpha || other->beta != fixture.beta ||
        ex18::kAbsoluteTolerance != ex15::kAbsoluteTolerance ||
        ex18::kRelativeTolerance != ex15::kRelativeTolerance) {
      throw std::runtime_error("EX15/EX18 fixture contracts differ");
    }
    std::vector<float> other_a(ac), other_b(bc), other_c(cc);
    std::vector<double> other_expected(cc);
    if (!ex18::make_fixture(other->id, other_a.data(), ac, other_b.data(), bc, other_c.data(), cc) ||
        std::memcmp(a.data(), other_a.data(), ac * sizeof(float)) != 0 ||
        std::memcmp(b.data(), other_b.data(), bc * sizeof(float)) != 0 ||
        std::memcmp(initial_c.data(), other_c.data(), cc * sizeof(float)) != 0 ||
        !ex18::gemm_reference(other_a.data(), ac, other_b.data(), bc, other_c.data(), cc,
            other->shape, other->alpha, other->beta, other_expected.data(), cc) ||
        expected != other_expected) {
      throw std::runtime_error("EX15/EX18 input bytes or CPU references differ");
    }
  }

  bool check(const std::vector<float>& output) const {
    const auto result = ex15::verify_tolerance(expected.data(), expected.size(),
        output.data(), output.size(), fixture.shape.m, fixture.shape.n,
        ex15::kAbsoluteTolerance, ex15::kRelativeTolerance);
    if (!result.valid || !result.matches) {
      std::cerr << "correctness=FAIL fixture=" << fixture.id
                << " valid=" << result.valid << " row=" << result.row
                << " column=" << result.column << " reference=" << result.reference
                << " candidate=" << result.candidate
                << " absolute_error=" << result.absolute_error
                << " allowed_error=" << result.allowed_error << '\n';
      return false;
    }
    return true;
  }
};

#ifndef LAB12_HOST_ONLY
struct Lab12Events {
  cudaEvent_t start = nullptr, stop = nullptr;
  bool close() noexcept {
    bool ok = true;
    if (stop) ok = report(cudaEventDestroy(stop), "destroy stop event") && ok;
    if (start) ok = report(cudaEventDestroy(start), "destroy start event") && ok;
    start = stop = nullptr;
    return ok;
  }
  ~Lab12Events() noexcept { close(); }
};

int run_gpu_comparison() {
  // Check all canonical inputs before submitting any GPU work.
  std::vector<Lab12Input> inputs;
  for (const auto& fixture : ex15::kFixtures) inputs.emplace_back(fixture);
  std::array<std::array<std::array<float, 10>, 2>, ex15::kFixtures.size()> samples{};

  int count = 0;
  check(cudaGetDeviceCount(&count), "device count");
  if (count != 1) throw std::runtime_error("select exactly one visible GPU");
  check(cudaSetDevice(0), "select GPU");
  cudaDeviceProp device{};
  check(cudaGetDeviceProperties(&device, 0), "device properties");
  if (device.major * 10 + device.minor < 75) throw std::runtime_error("requires CC >= 7.5");
  int driver = 0, runtime = 0;
  check(cudaDriverGetVersion(&driver), "driver API version");
  check(cudaRuntimeGetVersion(&runtime), "runtime version");
  std::cout << std::setprecision(9) << "gpu=" << device.name
            << " cc=" << device.major << '.' << device.minor << " gpu_count=" << count
            << " driver_api=" << driver << " runtime=" << runtime
            << " matrices=CUDA_R_32F compute=CUBLAS_COMPUTE_32F_PEDANTIC"
            << " math=CUBLAS_DEFAULT_MATH algorithm=CUBLAS_GEMM_DEFAULT"
            << " pointer_mode=host stream=nonblocking workspace=library-managed\n";

  for (std::size_t index = 0; index < inputs.size(); ++index) {
    const auto& input = inputs[index];
    const auto& fixture = input.fixture;
    const auto shape = fixture.shape;
    const std::size_t bytes = input.initial_c.size() * sizeof(float);
    std::vector<float> output(input.initial_c.size());
    Resources resources;
    Lab12Events events;
    std::size_t free_before = 0, total = 0, free_after = 0;
    check(cudaMemGetInfo(&free_before, &total), "memory before setup");
    resources.initialize(input.a.size(), input.b.size(), input.initial_c.size());
    check(cudaEventCreate(&events.start), "create start event");
    check(cudaEventCreate(&events.stop), "create stop event");
    check(cudaMemGetInfo(&free_after, &total), "memory after setup");
    int major = 0, minor = 0, patch = 0, version = 0;
    check(cublasGetProperty(MAJOR_VERSION, &major), "loaded cuBLAS major");
    check(cublasGetProperty(MINOR_VERSION, &minor), "loaded cuBLAS minor");
    check(cublasGetProperty(PATCH_LEVEL, &patch), "loaded cuBLAS patch");
    check(cublasGetVersion(resources.handle, &version), "loaded cuBLAS version");
    std::cout << "fixture=" << fixture.id << " input_contract=PASS"
              << " alpha=" << fixture.alpha << " beta=" << fixture.beta
              << " matrix_bytes=" << (input.a.size() + input.b.size() + output.size()) * sizeof(float)
              << " free_before=" << free_before << " free_after=" << free_after << " total=" << total
              << " cublas_headers=" << CUBLAS_VER_MAJOR << '.' << CUBLAS_VER_MINOR
              << '.' << CUBLAS_VER_PATCH << '.' << CUBLAS_VER_BUILD
              << " cublas_loaded=" << major << '.' << minor << '.' << patch
              << " cublas_raw=" << version << " loaded_build=not-exposed-by-API\n";
    if (major != CUBLAS_VER_MAJOR || minor != CUBLAS_VER_MINOR || patch != CUBLAS_VER_PATCH) {
      throw std::runtime_error("loaded cuBLAS differs from the header profile");
    }
    check(cudaMemcpyAsync(resources.a, input.a.data(), input.a.size() * sizeof(float),
        cudaMemcpyHostToDevice, resources.stream), "copy A");
    check(cudaMemcpyAsync(resources.b, input.b.data(), input.b.size() * sizeof(float),
        cudaMemcpyHostToDevice, resources.stream), "copy B");
    const dim3 block(kTileExtent, kTileExtent);
    const dim3 grid(static_cast<unsigned>((shape.n + kTileExtent - 1) / kTileExtent),
        static_cast<unsigned>((shape.m + kTileExtent - 1) / kTileExtent));

    for (int pair = -3; pair < 10; ++pair) {
      const bool measured = pair >= 0;
      for (int order = 0; order < 2; ++order) {
        const int candidate = measured && pair % 2 == 1 ? 1 - order : order;
        const char* name = candidate == 0 ? "EX15" : "EX18";
        const char* phase = measured ? "sample" : "warmup";
        const int number = measured ? pair + 1 : pair + 4;
        std::cout << "begin fixture=" << fixture.id << " candidate=" << name
                  << " phase=" << phase << " pair=" << number << " order=" << order + 1 << std::endl;
        // Reset and drain outside the event interval, including beta != 0 warm-ups.
        check(cudaMemcpyAsync(resources.c, input.initial_c.data(), bytes,
            cudaMemcpyHostToDevice, resources.stream), "reset initial C");
        check(cudaStreamSynchronize(resources.stream), "complete C reset");
        if (measured) check(cudaEventRecord(events.start, resources.stream), "record start");
        if (candidate == 0) {
          tiled_gemm<<<grid, block, 0, resources.stream>>>(resources.a, resources.b, resources.c,
              shape.m, shape.k, shape.n, fixture.alpha, fixture.beta);
        } else {
          // Generated from EX18's marked range, not a maintained copy of its call.
#include "lab12-ex18-gemm-call.inc"
        }
        check(cudaGetLastError(), "GEMM submission");
        float elapsed = 0;
        if (measured) {
          check(cudaEventRecord(events.stop, resources.stream), "record stop");
          check(cudaEventSynchronize(events.stop), "complete stop event");
          check(cudaEventElapsedTime(&elapsed, events.start, events.stop), "elapsed milliseconds");
          if (!std::isfinite(elapsed) || elapsed < 0) throw std::runtime_error("invalid event time");
        }
        check(cudaMemcpyAsync(output.data(), resources.c, bytes,
            cudaMemcpyDeviceToHost, resources.stream), "copy output");
        check(cudaStreamSynchronize(resources.stream), "complete output");
        const bool matches = input.check(output);
        std::cout << phase << " fixture=" << fixture.id << " candidate=" << name
                  << " pair=" << number << " order=" << order + 1
                  << " checked=" << output.size() << " correctness=" << (matches ? "PASS" : "FAIL");
        if (measured) std::cout << " elapsed_ms=" << elapsed;
        else std::cout << " excluded=true";
        std::cout << std::endl;
        if (!matches) throw std::runtime_error("reject complete run: GEMM verification failed");
        if (measured) samples[index][candidate][pair] = elapsed;
      }
    }
    const bool events_closed = events.close();
    const bool resources_closed = resources.close();
    if (!events_closed || !resources_closed) throw std::runtime_error("cleanup failed");
  }
  // Publish summaries only after all fixtures, samples, and cleanup checks pass.
  for (std::size_t index = 0; index < inputs.size(); ++index) {
    for (int candidate = 0; candidate < 2; ++candidate) {
      auto sorted = samples[index][candidate];
      std::sort(sorted.begin(), sorted.end());
      std::cout << "summary fixture=" << inputs[index].fixture.id
                << " candidate=" << (candidate == 0 ? "EX15" : "EX18")
                << " count=10 unit=ms min=" << sorted.front()
                << " median=" << (static_cast<double>(sorted[4]) + sorted[5]) / 2.0
                << " max=" << sorted.back() << '\n';
    }
  }
  std::cout << "run=PASS\n";
  return EXIT_SUCCESS;
}
#endif

int main(int argc, char** argv) {
  try {
#ifndef LAB12_HOST_ONLY
    if (argc == 1) return run_gpu_comparison();
#endif
    if (argc == 2 && std::string_view(argv[1]) == "--check-fixtures") {
      for (const auto& fixture : ex15::kFixtures) {
        const Lab12Input input(fixture);
        std::cout << "fixture=" << fixture.id << " alpha=" << fixture.alpha
                  << " beta=" << fixture.beta << " input_contract=PASS\n";
      }
      return EXIT_SUCCESS;
    }
    if (argc != 3 || std::string_view(argv[1]) != "--check-output") {
      throw std::runtime_error("usage: --check-fixtures | --check-output FIXTURE < matrix.txt");
    }
    const auto* fixture = ex15::find_fixture(argv[2]);
    if (fixture == nullptr) throw std::runtime_error("unknown fixture");
    const Lab12Input input(*fixture);
    std::vector<float> output(input.expected.size());
    for (float& value : output) {
      std::string token;
      if (!(std::cin >> token)) throw std::runtime_error("incomplete matrix");
      char* end = nullptr;
      value = std::strtof(token.c_str(), &end);
      if (end == token.c_str() || *end != '\0') throw std::runtime_error("invalid value");
    }
    std::string extra;
    if (std::cin >> extra) throw std::runtime_error("extra matrix value");
    if (!input.check(output)) return EXIT_FAILURE;
    std::cout << "fixture=" << fixture->id << " correctness=PASS\n";
    return EXIT_SUCCESS;
  } catch (const std::exception& error) {
    std::cerr << error.what() << '\n';
    return EXIT_FAILURE;
  }
}
