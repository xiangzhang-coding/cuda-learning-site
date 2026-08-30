// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX11_MULTI_STAGE_REDUCTION_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX11_MULTI_STAGE_REDUCTION_REFERENCE_HPP_

#include <cmath>
#include <cstddef>
#include <limits>

namespace ex11 {

// [ex11-cpu-reference-start]
inline constexpr std::size_t kElementCount = 4099U;
inline constexpr std::size_t kBlockSize = 256U;
inline constexpr std::size_t kElementsPerBlock = 2U * kBlockSize;
inline constexpr double kAbsoluteTolerance = 1.0e-4;
inline constexpr double kRelativeTolerance = 2.0e-5;

inline constexpr std::size_t stage_output_count(
    std::size_t input_count) noexcept {
  return input_count / kElementsPerBlock +
      (input_count % kElementsPerBlock == 0U ? 0U : 1U);
}

inline constexpr std::size_t block_input_count(
    std::size_t input_count,
    std::size_t block_index) noexcept {
  if (block_index >= stage_output_count(input_count)) return 0U;
  const std::size_t block_begin = block_index * kElementsPerBlock;
  const std::size_t remaining = input_count - block_begin;
  return remaining < kElementsPerBlock ? remaining : kElementsPerBlock;
}

inline constexpr bool stage_makes_progress(std::size_t input_count) noexcept {
  return input_count <= 1U ||
      (stage_output_count(input_count) > 0U &&
       stage_output_count(input_count) < input_count);
}

inline float deterministic_input_value(std::size_t index) noexcept {
  const int centered =
      static_cast<int>((index * 37U + 11U) % 101U) - 50;
  const float coarse = static_cast<float>(centered) * 0.125F;
  const float fine =
      static_cast<float>((index * 13U + 3U) % 17U) * 0.001F;
  return coarse + fine;
}

inline bool initialize_input(float* values, std::size_t count) noexcept {
  if (count > 0U && values == nullptr) return false;
  for (std::size_t index = 0U; index < count; ++index) {
    values[index] = deterministic_input_value(index);
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
  // The absolute term protects near-zero sums; the relative term scales with
  // the reference magnitude when a different reduction order changes rounding.
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
// [ex11-cpu-reference-end]

}  // namespace ex11

#endif  // CUDA_LEARNING_SITE_EX11_MULTI_STAGE_REDUCTION_REFERENCE_HPP_
