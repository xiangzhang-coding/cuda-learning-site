// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX05_COALESCED_STRIDED_ACCESS_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX05_COALESCED_STRIDED_ACCESS_REFERENCE_HPP_

#include <array>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <string_view>

namespace ex05 {

inline constexpr std::size_t kLogicalCount = 256U;

struct AccessScenario {
  std::string_view id;
  std::size_t stride;
  std::size_t offset;
};

inline constexpr std::array<AccessScenario, 3> kScenarios{{
    {"contiguous", 1U, 0U},
    {"misaligned", 1U, 1U},
    {"strided", 2U, 0U},
}};

inline constexpr bool try_required_input_count(
    std::size_t logical_count,
    const AccessScenario& scenario,
    std::size_t& required_count) noexcept {
  if (scenario.stride == 0U) return false;
  if (logical_count == 0U) {
    required_count = 0U;
    return true;
  }

  constexpr std::size_t kMaximum = std::numeric_limits<std::size_t>::max();
  if (scenario.offset == kMaximum) return false;
  const std::size_t last_logical_index = logical_count - 1U;
  if (last_logical_index > (kMaximum - scenario.offset) / scenario.stride) {
    return false;
  }
  const std::size_t last_source_index =
      scenario.offset + last_logical_index * scenario.stride;
  if (last_source_index == kMaximum) return false;

  required_count = last_source_index + 1U;
  return true;
}

inline constexpr bool try_source_index(
    std::size_t logical_index,
    std::size_t logical_count,
    const AccessScenario& scenario,
    std::size_t input_count,
    std::size_t& source_index) noexcept {
  if (logical_index >= logical_count) return false;

  std::size_t required_count = 0U;
  if (!try_required_input_count(logical_count, scenario, required_count) ||
      input_count < required_count) {
    return false;
  }

  source_index = scenario.offset + logical_index * scenario.stride;
  return true;
}

inline bool gather_reference(
    const std::uint32_t* input,
    std::size_t input_count,
    std::uint32_t* output,
    std::size_t output_count,
    std::size_t logical_count,
    const AccessScenario& scenario) noexcept {
  if (logical_count > output_count) return false;
  if (logical_count > 0U && (input == nullptr || output == nullptr)) return false;

  std::size_t required_count = 0U;
  if (!try_required_input_count(logical_count, scenario, required_count) ||
      input_count < required_count) {
    return false;
  }

  for (std::size_t logical_index = 0U; logical_index < logical_count; ++logical_index) {
    const std::size_t source_index =
        scenario.offset + logical_index * scenario.stride;
    output[logical_index] = input[source_index];
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

}  // namespace ex05

#endif  // CUDA_LEARNING_SITE_EX05_COALESCED_STRIDED_ACCESS_REFERENCE_HPP_
