// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <limits>
#include <string_view>
#include <vector>

#include "coalesced_strided_access_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  constexpr std::array<std::string_view, 3> expected_ids{
      "contiguous", "misaligned", "strided"};
  constexpr std::array<std::size_t, 3> expected_counts{256U, 257U, 511U};
  constexpr std::array<std::size_t, 4> logical_indices{0U, 1U, 31U, 255U};

  std::size_t maximum_input_count = 0U;
  for (std::size_t scenario_index = 0U;
       scenario_index < ex05::kScenarios.size();
       ++scenario_index) {
    const ex05::AccessScenario& scenario = ex05::kScenarios[scenario_index];
    if (!require(scenario.id == expected_ids[scenario_index], "scenario order is stable")) {
      return 1;
    }

    std::size_t required_count = 0U;
    if (!require(
            ex05::try_required_input_count(
                ex05::kLogicalCount, scenario, required_count),
            "required input count is representable")) {
      return 1;
    }
    if (!require(
            required_count == expected_counts[scenario_index],
            "required input count matches offset and stride")) {
      return 1;
    }
    if (required_count > maximum_input_count) maximum_input_count = required_count;

    for (const std::size_t logical_index : logical_indices) {
      std::size_t source_index = 0U;
      if (!require(
              ex05::try_source_index(
                  logical_index,
                  ex05::kLogicalCount,
                  scenario,
                  required_count,
                  source_index),
              "declared logical index maps into the allocation")) {
        return 1;
      }
      if (!require(
              source_index == scenario.offset + logical_index * scenario.stride,
              "source-index arithmetic is exact")) {
        return 1;
      }
    }
  }

  if (!require(maximum_input_count == 511U, "maximum input allocation is bounded")) {
    return 1;
  }

  constexpr std::size_t kUnchanged = 12345U;
  std::size_t unchanged = kUnchanged;
  if (!require(
          !ex05::try_source_index(
              ex05::kLogicalCount,
              ex05::kLogicalCount,
              ex05::kScenarios[0],
              expected_counts[0],
              unchanged) &&
              unchanged == kUnchanged,
          "out-of-range logical index is rejected without mutation")) {
    return 1;
  }
  if (!require(
          !ex05::try_source_index(
              ex05::kLogicalCount - 1U,
              ex05::kLogicalCount,
              ex05::kScenarios[2],
              expected_counts[2] - 1U,
              unchanged) &&
              unchanged == kUnchanged,
          "undersized source allocation is rejected")) {
    return 1;
  }

  const ex05::AccessScenario zero_stride{"invalid", 0U, 0U};
  if (!require(
          !ex05::try_required_input_count(ex05::kLogicalCount, zero_stride, unchanged) &&
              unchanged == kUnchanged,
          "zero stride is rejected without mutation")) {
    return 1;
  }
  const ex05::AccessScenario overflowing{
      "overflowing", 2U, std::numeric_limits<std::size_t>::max() - 1U};
  if (!require(
          !ex05::try_required_input_count(2U, overflowing, unchanged) &&
              unchanged == kUnchanged,
          "overflowing source extent is rejected")) {
    return 1;
  }

  std::vector<std::uint32_t> input(maximum_input_count);
  for (std::size_t index = 0U; index < input.size(); ++index) {
    input[index] = static_cast<std::uint32_t>(11U + 17U * index);
  }

  std::vector<std::uint32_t> actual(ex05::kLogicalCount);
  std::vector<std::uint32_t> expected(ex05::kLogicalCount);
  for (const ex05::AccessScenario& scenario : ex05::kScenarios) {
    if (!require(
            ex05::gather_reference(
                input.data(),
                input.size(),
                actual.data(),
                actual.size(),
                ex05::kLogicalCount,
                scenario),
            "scenario host reference succeeds")) {
      return 1;
    }

    for (std::size_t logical_index = 0U;
         logical_index < ex05::kLogicalCount;
         ++logical_index) {
      expected[logical_index] =
          input[scenario.offset + logical_index * scenario.stride];
    }
    if (!require(
            ex05::verify_exact(
                expected.data(), actual.data(), ex05::kLogicalCount).matches,
            "scenario output follows the declared gather rule")) {
      return 1;
    }
  }

  actual[7] ^= 1U;
  const ex05::VerificationResult mismatch =
      ex05::verify_exact(expected.data(), actual.data(), ex05::kLogicalCount);
  if (!require(
          !mismatch.matches && mismatch.mismatch_index == 7U,
          "exact verification reports a deterministic mismatch")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
