// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <limits>
#include <string_view>
#include <vector>

#include "error_handling_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

struct ScenarioCase {
  std::string_view text;
  ex04::Scenario scenario;
  ex04::ObservationStage expected_stage;
};

}  // namespace

int main() {
  constexpr std::array<ScenarioCase, 4> scenarios{{
      {"launch-config", ex04::Scenario::launch_config,
       ex04::ObservationStage::immediate_after_submission},
      {"deferred-access", ex04::Scenario::deferred_access,
       ex04::ObservationStage::deferred_at_synchronization},
      {"indexing-defect", ex04::Scenario::indexing_defect,
       ex04::ObservationStage::host_verification},
      {"repaired-indexing", ex04::Scenario::repaired_indexing,
       ex04::ObservationStage::none},
  }};

  for (const ScenarioCase& test_case : scenarios) {
    ex04::Scenario parsed = ex04::Scenario::launch_config;
    if (!require(ex04::parse_scenario(test_case.text, parsed), "scenario parses")) {
      return 1;
    }
    if (!require(parsed == test_case.scenario, "scenario identity is preserved")) return 1;
    if (!require(ex04::scenario_name(parsed) == test_case.text, "scenario name round-trips")) {
      return 1;
    }
    if (!require(
            ex04::expected_failure_stage(parsed) == test_case.expected_stage,
            "scenario failure stage is classified")) {
      return 1;
    }
  }

  ex04::Scenario unchanged = ex04::Scenario::repaired_indexing;
  if (!require(!ex04::parse_scenario("", unchanged), "empty scenario is rejected")) return 1;
  if (!require(!ex04::parse_scenario("Launch-config", unchanged), "case is not ignored")) {
    return 1;
  }
  if (!require(!ex04::parse_scenario("unknown", unchanged), "unknown scenario is rejected")) {
    return 1;
  }
  if (!require(
          unchanged == ex04::Scenario::repaired_indexing,
          "failed parsing leaves the destination unchanged")) {
    return 1;
  }

  if (!require(
          ex04::stage_label(ex04::ObservationStage::immediate_after_submission) ==
              "immediate-after-submission",
          "immediate label is stable")) {
    return 1;
  }
  if (!require(
          ex04::stage_label(ex04::ObservationStage::deferred_at_synchronization) ==
              "deferred-at-synchronization",
          "deferred label is stable")) {
    return 1;
  }
  if (!require(
          ex04::classify_first_failure(true, true, true) ==
              ex04::ObservationStage::immediate_after_submission,
          "immediate failure has first-stage precedence")) {
    return 1;
  }
  if (!require(
          ex04::classify_first_failure(false, true, true) ==
              ex04::ObservationStage::deferred_at_synchronization,
          "synchronization failure precedes host verification")) {
    return 1;
  }
  if (!require(
          ex04::classify_first_failure(false, false, true) ==
              ex04::ObservationStage::host_verification,
          "logical mismatch is a host-verification failure")) {
    return 1;
  }
  if (!require(
          ex04::classify_first_failure(false, false, false) ==
              ex04::ObservationStage::none,
          "successful path has no failure stage")) {
    return 1;
  }

  constexpr ex04::Extent2D extent{7U, 5U};
  std::size_t elements = 0U;
  if (!require(ex04::try_element_count(extent, elements) && elements == 35U,
               "element count is correct")) {
    return 1;
  }

  constexpr std::size_t kUnchanged = 12345U;
  std::size_t unchanged_count = kUnchanged;
  const ex04::Extent2D overflowing{
      std::numeric_limits<std::size_t>::max() / 2U + 1U,
      2U,
  };
  if (!require(
          !ex04::try_element_count(overflowing, unchanged_count) &&
              unchanged_count == kUnchanged,
          "overflowing element count is rejected without mutation")) {
    return 1;
  }
  if (!require(
          !ex04::try_element_count({0U, 5U}, unchanged_count),
          "zero width is rejected")) {
    return 1;
  }

  std::size_t row_major = 0U;
  std::size_t defective = 0U;
  if (!require(
          ex04::try_row_major_index({3U, 2U}, extent, row_major) && row_major == 17U,
          "row-major coordinate maps correctly")) {
    return 1;
  }
  if (!require(
          ex04::try_defective_column_major_index({3U, 2U}, extent, defective) &&
              defective == 17U,
          "defective map remains in bounds")) {
    return 1;
  }
  if (!require(
          ex04::try_row_major_index({1U, 3U}, extent, row_major) && row_major == 22U,
          "second row-major coordinate maps correctly")) {
    return 1;
  }
  if (!require(
          ex04::try_defective_column_major_index({1U, 3U}, extent, defective) &&
              defective == 8U && defective != row_major,
          "defective map is a different in-bounds permutation")) {
    return 1;
  }

  std::size_t rejected_index = kUnchanged;
  if (!require(
          !ex04::try_row_major_index({7U, 0U}, extent, rejected_index) &&
              rejected_index == kUnchanged,
          "out-of-range coordinate is rejected without mutation")) {
    return 1;
  }
  if (!require(
          !ex04::try_row_major_index({0U, 0U}, overflowing, rejected_index) &&
              rejected_index == kUnchanged,
          "overflowing extent is rejected before index arithmetic")) {
    return 1;
  }

  std::vector<std::uint32_t> expected(elements);
  std::vector<std::uint32_t> defective_output(elements);
  std::vector<std::uint32_t> repaired_output(elements);
  if (!require(
          ex04::write_row_major_reference(expected.data(), expected.size(), extent),
          "host reference is generated")) {
    return 1;
  }

  for (std::size_t y = 0U; y < extent.height; ++y) {
    for (std::size_t x = 0U; x < extent.width; ++x) {
      const ex04::Coordinate2D coordinate{x, y};
      std::size_t expected_index = 0U;
      std::size_t defective_index = 0U;
      if (!ex04::try_row_major_index(coordinate, extent, expected_index)) return 1;
      if (!ex04::try_defective_column_major_index(
              coordinate, extent, defective_index)) {
        return 1;
      }
      const std::uint32_t value = ex04::reference_value(coordinate);
      repaired_output[expected_index] = value;
      defective_output[defective_index] = value;
    }
  }

  const ex04::VerificationResult defect_result = ex04::verify_exact(
      expected.data(), defective_output.data(), elements);
  if (!require(
          !defect_result.matches && defect_result.mismatch_index == 1U,
          "deterministic in-bounds defect is detected")) {
    return 1;
  }

  const ex04::VerificationResult repaired_result = ex04::verify_exact(
      expected.data(), repaired_output.data(), elements);
  if (!require(
          repaired_result.matches && repaired_result.mismatch_index == elements,
          "repaired row-major output passes")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
