// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX12_INCLUSIVE_EXCLUSIVE_SCAN_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX12_INCLUSIVE_EXCLUSIVE_SCAN_REFERENCE_HPP_

#include <cstddef>
#include <cstdint>
#include <limits>

namespace ex12 {

// [ex12-cpu-reference-start]
inline constexpr std::size_t kElementCount = 4099U;
inline constexpr std::uint32_t kMaximumInputValue = 7U;
inline constexpr std::uint32_t kDeterministicTotal = 16390U;
inline constexpr std::uint32_t kMaximumPossibleTotal =
    static_cast<std::uint32_t>(kElementCount) * kMaximumInputValue;

static_assert(
    kElementCount <=
        std::numeric_limits<std::uint32_t>::max() / kMaximumInputValue,
    "the bounded scan must fit exactly in uint32_t");

inline constexpr std::uint32_t deterministic_input_value(
    std::size_t index) noexcept {
  return 1U + static_cast<std::uint32_t>(index % kMaximumInputValue);
}

inline bool initialize_bounded_input(
    std::uint32_t* input,
    std::size_t input_count) noexcept {
  if (input_count > kElementCount || (input_count > 0U && input == nullptr)) {
    return false;
  }
  for (std::size_t index = 0U; index < input_count; ++index) {
    input[index] = deterministic_input_value(index);
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
    if (input[index] > kMaximumInputValue) return false;
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

struct VerificationResult {
  bool matches;
  std::size_t mismatch_index;
  std::uint32_t expected;
  std::uint32_t actual;
};

inline VerificationResult verify_exact(
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
// [ex12-cpu-reference-end]

}  // namespace ex12

#endif  // CUDA_LEARNING_SITE_EX12_INCLUSIVE_EXCLUSIVE_SCAN_REFERENCE_HPP_
