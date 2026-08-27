// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX04_ERROR_HANDLING_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX04_ERROR_HANDLING_REFERENCE_HPP_

#include <cstddef>
#include <cstdint>
#include <limits>
#include <string_view>

namespace ex04 {

// [ex04-host-verification-start]
enum class Scenario {
  launch_config,
  deferred_access,
  indexing_defect,
  repaired_indexing,
};

enum class ObservationStage {
  none,
  immediate_after_submission,
  deferred_at_synchronization,
  host_verification,
};

inline constexpr std::string_view scenario_name(Scenario scenario) noexcept {
  switch (scenario) {
    case Scenario::launch_config:
      return "launch-config";
    case Scenario::deferred_access:
      return "deferred-access";
    case Scenario::indexing_defect:
      return "indexing-defect";
    case Scenario::repaired_indexing:
      return "repaired-indexing";
  }
  return "unknown";
}

inline constexpr bool parse_scenario(
    std::string_view text,
    Scenario& scenario) noexcept {
  if (text == "launch-config") {
    scenario = Scenario::launch_config;
    return true;
  }
  if (text == "deferred-access") {
    scenario = Scenario::deferred_access;
    return true;
  }
  if (text == "indexing-defect") {
    scenario = Scenario::indexing_defect;
    return true;
  }
  if (text == "repaired-indexing") {
    scenario = Scenario::repaired_indexing;
    return true;
  }
  return false;
}

inline constexpr std::string_view stage_label(ObservationStage stage) noexcept {
  switch (stage) {
    case ObservationStage::none:
      return "none";
    case ObservationStage::immediate_after_submission:
      return "immediate-after-submission";
    case ObservationStage::deferred_at_synchronization:
      return "deferred-at-synchronization";
    case ObservationStage::host_verification:
      return "host-verification";
  }
  return "unknown";
}

inline constexpr ObservationStage expected_failure_stage(Scenario scenario) noexcept {
  switch (scenario) {
    case Scenario::launch_config:
      return ObservationStage::immediate_after_submission;
    case Scenario::deferred_access:
      return ObservationStage::deferred_at_synchronization;
    case Scenario::indexing_defect:
      return ObservationStage::host_verification;
    case Scenario::repaired_indexing:
      return ObservationStage::none;
  }
  return ObservationStage::none;
}

inline constexpr ObservationStage classify_first_failure(
    bool immediate_failed,
    bool synchronization_failed,
    bool host_verification_failed) noexcept {
  if (immediate_failed) return ObservationStage::immediate_after_submission;
  if (synchronization_failed) return ObservationStage::deferred_at_synchronization;
  if (host_verification_failed) return ObservationStage::host_verification;
  return ObservationStage::none;
}

struct Extent2D {
  std::size_t width;
  std::size_t height;
};

struct Coordinate2D {
  std::size_t x;
  std::size_t y;
};

inline constexpr bool try_element_count(
    const Extent2D& extent,
    std::size_t& count) noexcept {
  if (extent.width == 0U || extent.height == 0U) return false;
  if (extent.width > std::numeric_limits<std::size_t>::max() / extent.height) {
    return false;
  }
  count = extent.width * extent.height;
  return true;
}

inline constexpr bool try_row_major_index(
    const Coordinate2D& coordinate,
    const Extent2D& extent,
    std::size_t& index) noexcept {
  std::size_t count = 0U;
  if (!try_element_count(extent, count)) return false;
  if (coordinate.x >= extent.width || coordinate.y >= extent.height) return false;

  index = coordinate.y * extent.width + coordinate.x;
  return index < count;
}

inline constexpr bool try_defective_column_major_index(
    const Coordinate2D& coordinate,
    const Extent2D& extent,
    std::size_t& index) noexcept {
  std::size_t count = 0U;
  if (!try_element_count(extent, count)) return false;
  if (coordinate.x >= extent.width || coordinate.y >= extent.height) return false;

  index = coordinate.x * extent.height + coordinate.y;
  return index < count;
}

inline constexpr std::uint32_t reference_value(
    const Coordinate2D& coordinate) noexcept {
  return 7U + 17U * static_cast<std::uint32_t>(coordinate.x) +
      31U * static_cast<std::uint32_t>(coordinate.y);
}

inline bool write_row_major_reference(
    std::uint32_t* output,
    std::size_t output_count,
    const Extent2D& extent) noexcept {
  std::size_t count = 0U;
  if (!try_element_count(extent, count) || output == nullptr || output_count < count) {
    return false;
  }

  for (std::size_t y = 0U; y < extent.height; ++y) {
    for (std::size_t x = 0U; x < extent.width; ++x) {
      const Coordinate2D coordinate{x, y};
      std::size_t index = 0U;
      if (!try_row_major_index(coordinate, extent, index)) return false;
      output[index] = reference_value(coordinate);
    }
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
// [ex04-host-verification-end]

}  // namespace ex04

#endif  // CUDA_LEARNING_SITE_EX04_ERROR_HANDLING_REFERENCE_HPP_
