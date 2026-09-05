// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cub/device/device_reduce.cuh>
#include <cub/version.cuh>

#include <chrono>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <iomanip>
#include <iostream>
#include <limits>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string_view>
#include <vector>

#include "multi_stage_reduction_reference.hpp"

#ifndef LAB11_EXPECTED_CUB_VERSION
#error "LAB11_EXPECTED_CUB_VERSION must name the selected CUB_VERSION"
#endif

static_assert(
    CUB_VERSION == LAB11_EXPECTED_CUB_VERSION,
    "selected CUB headers do not match LAB11_EXPECTED_CUB_VERSION");
static_assert(
    ex11::kElementCount <=
        static_cast<std::size_t>(std::numeric_limits<int>::max()),
    "legacy CUB APIs require the LAB11 extent to fit in int");
static_assert(
    ex11::stage_output_count(ex11::kElementCount) == 9U,
    "the reviewed custom candidate requires a 4099 -> 9 -> 1 tree");

namespace {

using MonotonicClock = std::chrono::steady_clock;
static_assert(MonotonicClock::is_steady, "LAB11 timing requires a steady clock");

enum class Candidate {
  kCustom,
  kCub,
};

enum class TimingMode {
  kNone,
  kSteadyState,
  kSetupInclusive,
};

struct Config {
  Candidate candidate;
  TimingMode timing;
  std::size_t element_count;
};

struct CandidateResult {
  float value;
  std::optional<std::int64_t> elapsed_nanoseconds;
  std::optional<std::size_t> temporary_storage_bytes;
};

void check_cuda(
    cudaError_t status,
    const char* expression,
    const char* file,
    int line) {
  if (status == cudaSuccess) return;
  std::ostringstream message;
  message << "CUDA error at " << file << ':' << line << " for " << expression
          << ": " << cudaGetErrorString(status);
  throw std::runtime_error(message.str());
}

#define CUDA_CHECK(call) check_cuda((call), #call, __FILE__, __LINE__)

class DeviceAllocation {
 public:
  DeviceAllocation() = default;
  DeviceAllocation(const DeviceAllocation&) = delete;
  DeviceAllocation& operator=(const DeviceAllocation&) = delete;

  void allocate(std::size_t bytes) {
    if (pointer_ != nullptr || bytes == 0U) {
      throw std::logic_error("device allocation requires a nonzero fresh extent");
    }
    CUDA_CHECK(cudaMalloc(&pointer_, bytes));
  }

  template <typename T>
  T* as() noexcept {
    return static_cast<T*>(pointer_);
  }

  void* get() noexcept {
    return pointer_;
  }

  void release() {
    if (pointer_ == nullptr) return;
    CUDA_CHECK(cudaFree(pointer_));
    pointer_ = nullptr;
  }

 private:
  void* pointer_ = nullptr;
};

bool parse_cli(int argc, char** argv, Config* config) noexcept {
  if (config == nullptr || argv == nullptr || argc != 9 ||
      std::string_view(argv[1]) != "--candidate" ||
      std::string_view(argv[3]) != "--timing" ||
      std::string_view(argv[5]) != "--elements" ||
      std::string_view(argv[6]) != "4099" ||
      std::string_view(argv[7]) != "--verify" ||
      std::string_view(argv[8]) != "tolerance") {
    return false;
  }

  Candidate candidate;
  if (std::string_view(argv[2]) == "custom") {
    candidate = Candidate::kCustom;
  } else if (std::string_view(argv[2]) == "cub") {
    candidate = Candidate::kCub;
  } else {
    return false;
  }

  TimingMode timing;
  if (std::string_view(argv[4]) == "none") {
    timing = TimingMode::kNone;
  } else if (std::string_view(argv[4]) == "steady-state") {
    timing = TimingMode::kSteadyState;
  } else if (std::string_view(argv[4]) == "setup-inclusive") {
    timing = TimingMode::kSetupInclusive;
  } else {
    return false;
  }

  *config = {candidate, timing, ex11::kElementCount};
  return true;
}

std::string_view candidate_name(Candidate candidate) noexcept {
  return candidate == Candidate::kCustom ? "custom" : "cub";
}

std::string_view timing_name(TimingMode timing) noexcept {
  switch (timing) {
    case TimingMode::kNone:
      return "none";
    case TimingMode::kSteadyState:
      return "steady-state";
    case TimingMode::kSetupInclusive:
      return "setup-inclusive";
  }
  return "invalid";
}

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

const float* execute_custom_reduction(
    const float* device_input,
    float* device_partial_a,
    float* device_partial_b,
    std::size_t element_count,
    cudaStream_t stream) {
  const float* stage_input = device_input;
  float* stage_output = device_partial_a;
  std::size_t stage_size = element_count;

  while (stage_size > 1U) {
    const std::size_t next_stage_size = ex11::stage_output_count(stage_size);
    reduce_stage<<<
        static_cast<unsigned int>(next_stage_size),
        static_cast<unsigned int>(ex11::kBlockSize),
        ex11::kBlockSize * sizeof(float),
        stream>>>(stage_input, stage_output, stage_size);
    CUDA_CHECK(cudaGetLastError());

    stage_size = next_stage_size;
    stage_input = stage_output;
    stage_output = stage_output == device_partial_a
        ? device_partial_b
        : device_partial_a;
  }

  return stage_input;
}

void query_cub_storage(
    const float* device_input,
    float* device_output,
    int item_count,
    cudaStream_t stream,
    std::size_t* temporary_storage_bytes) {
  if (temporary_storage_bytes == nullptr) {
    throw std::logic_error("CUB storage query requires a byte-count output");
  }
  *temporary_storage_bytes = 0U;
  CUDA_CHECK(cub::DeviceReduce::Sum(
      nullptr,
      *temporary_storage_bytes,
      device_input,
      device_output,
      item_count,
      stream));
}

void execute_cub_reduction(
    void* temporary_storage,
    std::size_t temporary_storage_bytes,
    const float* device_input,
    float* device_output,
    int item_count,
    cudaStream_t stream) {
  CUDA_CHECK(cub::DeviceReduce::Sum(
      temporary_storage,
      temporary_storage_bytes,
      device_input,
      device_output,
      item_count,
      stream));
  CUDA_CHECK(cudaGetLastError());
}

std::optional<std::int64_t> finish_timing(
    TimingMode timing,
    const std::optional<MonotonicClock::time_point>& start) {
  if (timing == TimingMode::kNone) return std::nullopt;
  if (!start.has_value()) throw std::logic_error("timed run has no start point");
  const MonotonicClock::time_point end = MonotonicClock::now();
  return std::chrono::duration_cast<std::chrono::nanoseconds>(end - *start)
      .count();
}

CandidateResult run_custom_candidate(
    const Config& config,
    const float* device_input,
    cudaStream_t stream) {
  DeviceAllocation partial_a;
  DeviceAllocation partial_b;
  std::optional<MonotonicClock::time_point> start;

  // setup-inclusive starts immediately before capacity calculation and both
  // nine-float allocations. steady-state starts after those allocations.
  if (config.timing == TimingMode::kSetupInclusive) start = MonotonicClock::now();
  const std::size_t partial_capacity =
      ex11::stage_output_count(config.element_count);
  if (partial_capacity != 9U) {
    throw std::logic_error("custom candidate requires exactly nine partials");
  }
  const std::size_t partial_bytes = partial_capacity * sizeof(float);
  partial_a.allocate(partial_bytes);
  partial_b.allocate(partial_bytes);
  if (config.timing == TimingMode::kSteadyState) start = MonotonicClock::now();

  const float* device_result = execute_custom_reduction(
      device_input,
      partial_a.as<float>(),
      partial_b.as<float>(),
      config.element_count,
      stream);
  CUDA_CHECK(cudaStreamSynchronize(stream));
  // The end clock read immediately follows checked candidate completion.
  const std::optional<std::int64_t> elapsed = finish_timing(config.timing, start);

  float result = std::numeric_limits<float>::quiet_NaN();
  CUDA_CHECK(cudaMemcpyAsync(
      &result,
      device_result,
      sizeof(result),
      cudaMemcpyDeviceToHost,
      stream));
  CUDA_CHECK(cudaStreamSynchronize(stream));

  partial_b.release();
  partial_a.release();
  return {result, elapsed, std::nullopt};
}

CandidateResult run_cub_candidate(
    const Config& config,
    const float* device_input,
    cudaStream_t stream) {
  DeviceAllocation output;
  DeviceAllocation temporary_storage;
  std::size_t temporary_storage_bytes;
  std::optional<MonotonicClock::time_point> start;

  // setup-inclusive starts before output setup and the legacy null-storage
  // query. steady-state starts after output and queried scratch are allocated.
  if (config.timing == TimingMode::kSetupInclusive) start = MonotonicClock::now();
  output.allocate(sizeof(float));
  query_cub_storage(
      device_input,
      output.as<float>(),
      static_cast<int>(config.element_count),
      stream,
      &temporary_storage_bytes);
  if (temporary_storage_bytes == 0U) {
    throw std::runtime_error("CUB returned a zero temporary-storage extent");
  }
  temporary_storage.allocate(temporary_storage_bytes);
  if (config.timing == TimingMode::kSteadyState) start = MonotonicClock::now();

  execute_cub_reduction(
      temporary_storage.get(),
      temporary_storage_bytes,
      device_input,
      output.as<float>(),
      static_cast<int>(config.element_count),
      stream);
  CUDA_CHECK(cudaStreamSynchronize(stream));
  // The end clock read immediately follows checked candidate completion.
  const std::optional<std::int64_t> elapsed = finish_timing(config.timing, start);

  float result = std::numeric_limits<float>::quiet_NaN();
  CUDA_CHECK(cudaMemcpyAsync(
      &result,
      output.as<float>(),
      sizeof(result),
      cudaMemcpyDeviceToHost,
      stream));
  CUDA_CHECK(cudaStreamSynchronize(stream));

  temporary_storage.release();
  output.release();
  return {result, elapsed, temporary_storage_bytes};
}

std::uint32_t float_bits(float value) noexcept {
  static_assert(sizeof(value) == sizeof(std::uint32_t));
  std::uint32_t bits = 0U;
  std::memcpy(&bits, &value, sizeof(bits));
  return bits;
}

CandidateResult run_selected_candidate(
    const Config& config,
    const float* device_input,
    cudaStream_t stream) {
  if (config.candidate == Candidate::kCustom) {
    return run_custom_candidate(config, device_input, stream);
  }
  return run_cub_candidate(config, device_input, stream);
}

void print_usage(const char* executable) {
  std::cerr
      << "Usage: " << executable
      << " --candidate custom|cub --timing none|steady-state|setup-inclusive"
         " --elements 4099 --verify tolerance\n";
}

}  // namespace

int main(int argc, char** argv) {
  Config config{};
  if (!parse_cli(argc, argv, &config)) {
    print_usage(argc > 0 && argv != nullptr ? argv[0] : "lab11-reduction-comparison");
    return 2;
  }

  try {
    std::vector<float> input(config.element_count);
    if (!ex11::initialize_input(input.data(), input.size())) {
      throw std::runtime_error("EX11 input initialization failed");
    }
    const double reference = ex11::cpu_reference_sum(input.data(), input.size());
    const std::size_t input_bytes = input.size() * sizeof(float);

    CUDA_CHECK(cudaSetDevice(0));
    cudaStream_t stream = nullptr;
    CUDA_CHECK(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking));

    DeviceAllocation device_input;
    device_input.allocate(input_bytes);
    CUDA_CHECK(cudaMemcpyAsync(
        device_input.as<float>(),
        input.data(),
        input_bytes,
        cudaMemcpyHostToDevice,
        stream));
    CUDA_CHECK(cudaStreamSynchronize(stream));

    bool process_local_warmup_passed = false;
    if (config.timing != TimingMode::kNone) {
      Config warmup_config = config;
      warmup_config.timing = TimingMode::kNone;
      const CandidateResult warmup_result =
          run_selected_candidate(
              warmup_config,
              device_input.as<float>(),
              stream);
      const ex11::SumComparison warmup_comparison =
          ex11::compare_reduction_sum(reference, warmup_result.value);
      if (!warmup_comparison.matches) {
        device_input.release();
        CUDA_CHECK(cudaStreamDestroy(stream));
        std::ostringstream message;
        message << std::setprecision(std::numeric_limits<double>::max_digits10)
                << "process-local warm-up failed: actual="
                << warmup_comparison.actual
                << " absolute_error=" << warmup_comparison.absolute_error
                << " allowed_error=" << warmup_comparison.allowed_error;
        throw std::runtime_error(message.str());
      }
      process_local_warmup_passed = true;
    }

    const CandidateResult result =
        run_selected_candidate(config, device_input.as<float>(), stream);
    const ex11::SumComparison comparison =
        ex11::compare_reduction_sum(reference, result.value);

    device_input.release();
    CUDA_CHECK(cudaStreamDestroy(stream));

    std::cout << "candidate=" << candidate_name(config.candidate) << '\n'
              << "timing=" << timing_name(config.timing) << '\n'
              << "elements=" << config.element_count << '\n'
              << "cub_version=" << CUB_VERSION << '\n';
    if (result.temporary_storage_bytes.has_value()) {
      std::cout << "temporary_storage_bytes="
                << *result.temporary_storage_bytes << '\n';
    }
    if (process_local_warmup_passed) {
      std::cout << "process_local_warmup=excluded-pass\n";
    }
    std::cout << "result_float_bits_hex=0x"
              << std::hex << std::setw(8) << std::setfill('0')
              << float_bits(result.value) << std::dec << '\n'
              << std::setprecision(std::numeric_limits<double>::max_digits10)
              << "cpu_reference=" << comparison.reference << '\n'
              << "result_float=" << comparison.actual << '\n'
              << "absolute_error=" << comparison.absolute_error << '\n'
              << "allowed_error=" << comparison.allowed_error << '\n'
              << "pass=" << (comparison.matches ? "PASS" : "FAIL") << '\n';
    if (result.elapsed_nanoseconds.has_value()) {
      std::cout << "clock=std::chrono::steady_clock\n"
                << "elapsed_nanoseconds=" << *result.elapsed_nanoseconds << '\n';
    }
    return comparison.matches ? EXIT_SUCCESS : EXIT_FAILURE;
  } catch (const std::exception& error) {
    std::cerr << error.what() << '\n';
    return EXIT_FAILURE;
  }
}
