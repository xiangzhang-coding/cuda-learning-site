// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX13_PRIVATIZED_HISTOGRAM_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX13_PRIVATIZED_HISTOGRAM_REFERENCE_HPP_

#include <array>
#include <cstddef>
#include <cstdint>
#include <string_view>

namespace ex13 {

// [ex13-cpu-reference-start]
inline constexpr std::size_t kBinCount = 16U;
inline constexpr std::size_t kElementCount = 259U;
inline constexpr std::array<std::string_view, 3> kFixtureIds{{
    "uniform",
    "skewed",
    "boundary",
}};

using Value = std::uint32_t;
using Histogram = std::array<std::uint32_t, kBinCount>;

inline bool make_fixture(
    std::string_view fixture_id,
    Value* values,
    std::size_t value_count) noexcept {
  if (values == nullptr || value_count != kElementCount) return false;

  if (fixture_id == "uniform") {
    for (std::size_t index = 0U; index < value_count; ++index) {
      values[index] = static_cast<Value>(index % kBinCount);
    }
    return true;
  }

  if (fixture_id == "skewed") {
    for (std::size_t index = 0U; index < value_count; ++index) {
      if (index % 8U == 0U) {
        values[index] = ((index / 8U) % 2U == 0U) ? 0U : 8U;
      } else {
        values[index] = 7U;
      }
    }
    return true;
  }

  if (fixture_id == "boundary") {
    for (std::size_t index = 0U; index < value_count; ++index) {
      values[index] = (index % 2U == 0U) ? 0U : 15U;
    }
    return true;
  }

  return false;
}

inline bool histogram_reference(
    const Value* values,
    std::size_t value_count,
    Histogram* histogram) noexcept {
  if (values == nullptr || histogram == nullptr || value_count != kElementCount) {
    return false;
  }

  Histogram counts{};
  for (std::size_t index = 0U; index < value_count; ++index) {
    const Value bin = values[index];
    if (bin >= kBinCount) return false;
    ++counts[bin];
  }

  *histogram = counts;
  return true;
}

inline std::uint64_t sum_of_bins(const Histogram& histogram) noexcept {
  std::uint64_t total = 0U;
  for (const std::uint32_t count : histogram) total += count;
  return total;
}

struct VerificationResult {
  bool matches;
  std::size_t mismatch_bin;
  std::uint32_t expected;
  std::uint32_t actual;
};

inline VerificationResult verify_exact(
    const Histogram& expected,
    const Histogram& actual) noexcept {
  for (std::size_t bin = 0U; bin < kBinCount; ++bin) {
    if (expected[bin] != actual[bin]) {
      return {false, bin, expected[bin], actual[bin]};
    }
  }
  return {true, kBinCount, 0U, 0U};
}
// [ex13-cpu-reference-end]

}  // namespace ex13

#endif  // CUDA_LEARNING_SITE_EX13_PRIVATIZED_HISTOGRAM_REFERENCE_HPP_
