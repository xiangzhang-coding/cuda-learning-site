// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX17_CUB_DEVICE_REDUCTION_SCAN_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX17_CUB_DEVICE_REDUCTION_SCAN_REFERENCE_HPP_

#include <cmath>
#include <cstddef>
#include <cstdint>
#include <limits>

namespace ex17 {

// [ex17-cpu-reference-start]
inline constexpr std::size_t kElementCount = 4099U;
inline constexpr double kAbsoluteTolerance = 1.0e-4;
inline constexpr double kRelativeTolerance = 2.0e-5;
inline constexpr std::uint32_t kMaximumScanInputValue = 7U;
inline constexpr std::uint32_t kDeterministicScanTotal = 16390U;
inline constexpr std::uint32_t kMaximumPossibleScanTotal =
    static_cast<std::uint32_t>(kElementCount) * kMaximumScanInputValue;

static_assert(
    kElementCount <=
        std::numeric_limits<std::uint32_t>::max() / kMaximumScanInputValue,
    "the bounded scan must fit exactly in uint32_t");

inline float deterministic_reduction_input_value(std::size_t index) noexcept {
  const int centered =
      static_cast<int>((index * 37U + 11U) % 101U) - 50;
  const float coarse = static_cast<float>(centered) * 0.125F;
  const float fine =
      static_cast<float>((index * 13U + 3U) % 17U) * 0.001F;
  return coarse + fine;
}

inline bool initialize_reduction_input(
    float* values,
    std::size_t count) noexcept {
  if (count > 0U && values == nullptr) return false;
  for (std::size_t index = 0U; index < count; ++index) {
    values[index] = deterministic_reduction_input_value(index);
  }
  return true;
}

inline double cpu_reference_sum(
    const float* values,
    std::size_t count) noexcept {
  if (count > 0U && values == nullptr) {
    return std::numeric_limits<double>::quiet_NaN();
  }
  double total = 0.0;
  for (std::size_t index = 0U; index < count; ++index) {
    total += static_cast<double>(values[index]);
  }
  return total;
}

struct SumComparison {
  bool matches;
  double reference;
  double actual;
  double absolute_error;
  double allowed_error;
};

inline SumComparison compare_reduction_sum(
    double reference,
    float actual,
    double absolute_tolerance = kAbsoluteTolerance,
    double relative_tolerance = kRelativeTolerance) noexcept {
  const double actual_as_double = static_cast<double>(actual);
  const double absolute_error = std::abs(reference - actual_as_double);
  const double allowed_error =
      absolute_tolerance + relative_tolerance * std::abs(reference);
  const bool valid = std::isfinite(reference) && std::isfinite(actual_as_double) &&
      absolute_tolerance >= 0.0 && relative_tolerance >= 0.0;
  return {
      valid && absolute_error <= allowed_error,
      reference,
      actual_as_double,
      absolute_error,
      allowed_error,
  };
}

inline constexpr std::uint32_t deterministic_scan_input_value(
    std::size_t index) noexcept {
  return 1U + static_cast<std::uint32_t>(index % kMaximumScanInputValue);
}

inline bool initialize_bounded_scan_input(
    std::uint32_t* values,
    std::size_t count) noexcept {
  if (count > kElementCount || (count > 0U && values == nullptr)) return false;
  for (std::size_t index = 0U; index < count; ++index) {
    values[index] = deterministic_scan_input_value(index);
  }
  return true;
}

inline bool bounded_scan_arguments(
    const std::uint32_t* input,
    std::size_t input_count,
    const std::uint32_t* output,
    std::size_t output_count,
    std::size_t element_count) noexcept {
  if (element_count > kElementCount || input_count < element_count ||
      output_count < element_count ||
      (element_count > 0U && (input == nullptr || output == nullptr))) {
    return false;
  }
  for (std::size_t index = 0U; index < element_count; ++index) {
    if (input[index] > kMaximumScanInputValue) return false;
  }
  return true;
}

inline bool inclusive_scan_reference(
    const std::uint32_t* input,
    std::size_t input_count,
    std::uint32_t* inclusive,
    std::size_t inclusive_count,
    std::size_t element_count) noexcept {
  if (!bounded_scan_arguments(
          input, input_count, inclusive, inclusive_count, element_count)) {
    return false;
  }

  std::uint32_t running_total = 0U;
  for (std::size_t index = 0U; index < element_count; ++index) {
    running_total += input[index];
    inclusive[index] = running_total;
  }
  return true;
}

inline bool exclusive_scan_reference(
    const std::uint32_t* input,
    std::size_t input_count,
    std::uint32_t* exclusive,
    std::size_t exclusive_count,
    std::size_t element_count) noexcept {
  if (!bounded_scan_arguments(
          input, input_count, exclusive, exclusive_count, element_count)) {
    return false;
  }

  std::uint32_t running_total = 0U;
  for (std::size_t index = 0U; index < element_count; ++index) {
    const std::uint32_t value = input[index];
    exclusive[index] = running_total;
    running_total += value;
  }
  return true;
}

struct ExactComparison {
  bool matches;
  std::size_t mismatch_index;
  std::uint32_t expected;
  std::uint32_t actual;
};

inline ExactComparison compare_exact(
    const std::uint32_t* expected,
    const std::uint32_t* actual,
    std::size_t count) noexcept {
  if (count > 0U && (expected == nullptr || actual == nullptr)) {
    return {false, 0U, 0U, 0U};
  }
  for (std::size_t index = 0U; index < count; ++index) {
    if (expected[index] != actual[index]) {
      return {false, index, expected[index], actual[index]};
    }
  }
  return {true, count, 0U, 0U};
}
// [ex17-cpu-reference-end]

}  // namespace ex17

#endif  // CUDA_LEARNING_SITE_EX17_CUB_DEVICE_REDUCTION_SCAN_REFERENCE_HPP_
