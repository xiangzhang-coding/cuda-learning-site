// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX02_VECTOR_ADD_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX02_VECTOR_ADD_REFERENCE_HPP_

#include <algorithm>
#include <cmath>
#include <cstddef>

namespace ex02 {

inline constexpr float kAbsoluteTolerance = 1.0e-5F;
inline constexpr float kRelativeTolerance = 1.0e-5F;

// [ex02-cpu-reference-start]
inline void vector_add_cpu(
    const float* left,
    const float* right,
    float* output,
    std::size_t element_count) {
  for (std::size_t index = 0; index < element_count; ++index) {
    output[index] = left[index] + right[index];
  }
}

inline bool nearly_equal(
    float expected,
    float actual,
    float absolute_tolerance = kAbsoluteTolerance,
    float relative_tolerance = kRelativeTolerance) {
  const float difference = std::fabs(expected - actual);
  const float scale = std::max(std::fabs(expected), std::fabs(actual));
  return difference <= absolute_tolerance || difference <= relative_tolerance * scale;
}
// [ex02-cpu-reference-end]

struct ComparisonResult {
  bool passed;
  std::size_t mismatch_index;
  float maximum_absolute_error;
};

inline ComparisonResult compare_vectors(
    const float* expected,
    const float* actual,
    std::size_t element_count,
    float absolute_tolerance = kAbsoluteTolerance,
    float relative_tolerance = kRelativeTolerance) {
  ComparisonResult result{true, element_count, 0.0F};
  for (std::size_t index = 0; index < element_count; ++index) {
    result.maximum_absolute_error =
        std::max(result.maximum_absolute_error, std::fabs(expected[index] - actual[index]));
    if (result.passed &&
        !nearly_equal(expected[index], actual[index], absolute_tolerance, relative_tolerance)) {
      result.passed = false;
      result.mismatch_index = index;
    }
  }
  return result;
}

}  // namespace ex02

#endif  // CUDA_LEARNING_SITE_EX02_VECTOR_ADD_REFERENCE_HPP_
