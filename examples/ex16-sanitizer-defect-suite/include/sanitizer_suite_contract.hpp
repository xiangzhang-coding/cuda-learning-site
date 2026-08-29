// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX16_SANITIZER_SUITE_CONTRACT_HPP_
#define CUDA_LEARNING_SITE_EX16_SANITIZER_SUITE_CONTRACT_HPP_

#include <array>
#include <string_view>

namespace ex16 {

enum class Tool {
  memcheck,
  racecheck,
  initcheck,
  synccheck,
};

enum class Variant {
  defect,
  corrected,
};

struct ScenarioMetadata {
  std::string_view id;
  Tool tool;
  Variant variant;
  std::string_view command;
  std::string_view category;
};

inline constexpr std::array<ScenarioMetadata, 8> kScenarios{{
    {"memcheck-defect", Tool::memcheck, Variant::defect,
     "compute-sanitizer --tool memcheck ./build/memcheck-defect",
     "global-memory-out-of-bounds"},
    {"memcheck-corrected", Tool::memcheck, Variant::corrected,
     "compute-sanitizer --tool memcheck ./build/memcheck-corrected",
     "global-memory-out-of-bounds"},
    {"racecheck-defect", Tool::racecheck, Variant::defect,
     "compute-sanitizer --tool racecheck ./build/racecheck-defect",
     "shared-memory-raw-hazard"},
    {"racecheck-corrected", Tool::racecheck, Variant::corrected,
     "compute-sanitizer --tool racecheck ./build/racecheck-corrected",
     "shared-memory-raw-hazard"},
    {"initcheck-defect", Tool::initcheck, Variant::defect,
     "compute-sanitizer --tool initcheck ./build/initcheck-defect",
     "uninitialized-global-memory-read"},
    {"initcheck-corrected", Tool::initcheck, Variant::corrected,
     "compute-sanitizer --tool initcheck ./build/initcheck-corrected",
     "uninitialized-global-memory-read"},
    {"synccheck-defect", Tool::synccheck, Variant::defect,
     "compute-sanitizer --tool synccheck ./build/synccheck-defect",
     "divergent-block-barrier"},
    {"synccheck-corrected", Tool::synccheck, Variant::corrected,
     "compute-sanitizer --tool synccheck ./build/synccheck-corrected",
     "divergent-block-barrier"},
}};

inline constexpr std::string_view tool_name(Tool tool) noexcept {
  switch (tool) {
    case Tool::memcheck:
      return "memcheck";
    case Tool::racecheck:
      return "racecheck";
    case Tool::initcheck:
      return "initcheck";
    case Tool::synccheck:
      return "synccheck";
  }
  return "unknown";
}

inline constexpr std::string_view variant_name(Variant variant) noexcept {
  switch (variant) {
    case Variant::defect:
      return "defect";
    case Variant::corrected:
      return "corrected";
  }
  return "unknown";
}

}  // namespace ex16

#endif  // CUDA_LEARNING_SITE_EX16_SANITIZER_SUITE_CONTRACT_HPP_
