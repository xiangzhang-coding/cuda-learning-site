// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <iostream>
#include <string>
#include <string_view>

#include "sanitizer_suite_contract.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

struct ExpectedMetadata {
  std::string_view id;
  ex16::Tool tool;
  ex16::Variant variant;
  std::string_view category;
};

}  // namespace

int main() {
  constexpr std::array<ExpectedMetadata, 8> expected{{
      {"memcheck-defect", ex16::Tool::memcheck, ex16::Variant::defect,
       "global-memory-out-of-bounds"},
      {"memcheck-corrected", ex16::Tool::memcheck, ex16::Variant::corrected,
       "global-memory-out-of-bounds"},
      {"racecheck-defect", ex16::Tool::racecheck, ex16::Variant::defect,
       "shared-memory-raw-hazard"},
      {"racecheck-corrected", ex16::Tool::racecheck, ex16::Variant::corrected,
       "shared-memory-raw-hazard"},
      {"initcheck-defect", ex16::Tool::initcheck, ex16::Variant::defect,
       "uninitialized-global-memory-read"},
      {"initcheck-corrected", ex16::Tool::initcheck, ex16::Variant::corrected,
       "uninitialized-global-memory-read"},
      {"synccheck-defect", ex16::Tool::synccheck, ex16::Variant::defect,
       "divergent-block-barrier"},
      {"synccheck-corrected", ex16::Tool::synccheck, ex16::Variant::corrected,
       "divergent-block-barrier"},
  }};

  if (!require(ex16::kScenarios.size() == expected.size(), "scenario count is exact")) {
    return 1;
  }

  for (std::size_t index = 0U; index < expected.size(); ++index) {
    const ExpectedMetadata& contract = expected[index];
    const ex16::ScenarioMetadata& actual = ex16::kScenarios[index];
    if (!require(actual.id == contract.id, "scenario order and identity are stable") ||
        !require(actual.tool == contract.tool, "scenario tool is stable") ||
        !require(actual.variant == contract.variant, "scenario variant is stable") ||
        !require(actual.category == contract.category, "scenario category is stable")) {
      return 1;
    }

    const std::string expected_command =
        "compute-sanitizer --tool " + std::string(ex16::tool_name(actual.tool)) +
        " ./build/" + std::string(actual.id);
    if (!require(actual.command == expected_command, "scenario command selects its own binary")) {
      return 1;
    }
    const std::string_view variant = ex16::variant_name(actual.variant);
    const bool carries_variant = actual.id.size() >= variant.size() &&
        actual.id.substr(actual.id.size() - variant.size()) == variant;
    if (!require(carries_variant, "scenario id carries its variant")) {
      return 1;
    }

    for (std::size_t previous = 0U; previous < index; ++previous) {
      if (!require(ex16::kScenarios[previous].id != actual.id, "scenario ids are unique") ||
          !require(
              ex16::kScenarios[previous].command != actual.command,
              "scenario commands are unique")) {
        return 1;
      }
    }
  }

  for (std::size_t pair = 0U; pair < expected.size(); pair += 2U) {
    if (!require(
            ex16::kScenarios[pair].tool == ex16::kScenarios[pair + 1U].tool,
            "paired variants select the same tool") ||
        !require(
            ex16::kScenarios[pair].category == ex16::kScenarios[pair + 1U].category,
            "paired variants retain one category")) {
      return 1;
    }
  }

  std::cout << "host-reference: pass\n"
            << "scope=metadata-only; cannot establish GPU correctness or sanitizer behavior\n";
  return 0;
}
