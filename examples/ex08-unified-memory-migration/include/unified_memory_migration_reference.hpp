// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX08_UNIFIED_MEMORY_MIGRATION_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX08_UNIFIED_MEMORY_MIGRATION_REFERENCE_HPP_

#include <array>
#include <cstddef>
#include <cstdint>
#include <limits>

namespace ex08 {

// [ex08-access-sequence-start]
inline constexpr std::size_t kPageBytes = 4096U;
inline constexpr std::size_t kPageCount = 16U;
inline constexpr std::size_t kElementsPerPage =
    kPageBytes / sizeof(std::uint32_t);
inline constexpr std::size_t kElementCount = kPageCount * kElementsPerPage;
inline constexpr std::size_t kPhaseCount = 3U;
inline constexpr std::size_t kAccessCount = kPageCount * kPhaseCount;
inline constexpr std::size_t kExpectedTransitionCount = 32U;

enum class AccessOrigin : std::uint8_t {
  host = 0U,
  device = 1U,
};

struct PageAccess {
  std::size_t page;
  AccessOrigin origin;
};

struct Transition {
  std::size_t access_index;
  std::size_t page;
  AccessOrigin from;
  AccessOrigin to;
};

struct TransitionSummary {
  std::size_t transition_count;
  std::size_t moved_pages;
  std::size_t moved_bytes;
};

inline constexpr bool is_valid_origin(AccessOrigin origin) noexcept {
  return origin == AccessOrigin::host || origin == AccessOrigin::device;
}

inline bool write_declared_access_sequence(
    PageAccess* accesses,
    std::size_t access_capacity) noexcept {
  if (accesses == nullptr || access_capacity < kAccessCount) return false;
  constexpr std::array<AccessOrigin, kPhaseCount> kOrigins{
      AccessOrigin::host,
      AccessOrigin::device,
      AccessOrigin::host,
  };

  std::size_t access_index = 0U;
  for (const AccessOrigin origin : kOrigins) {
    for (std::size_t page = 0U; page < kPageCount; ++page) {
      accesses[access_index++] = {page, origin};
    }
  }
  return true;
}

inline bool derive_transition_ledger(
    std::size_t page_count,
    std::size_t page_bytes,
    const PageAccess* accesses,
    std::size_t access_count,
    Transition* transitions,
    std::size_t transition_capacity,
    TransitionSummary& summary) noexcept {
  if (page_bytes == 0U || (access_count > 0U && accesses == nullptr)) {
    return false;
  }

  std::size_t transition_count = 0U;
  for (std::size_t index = 0U; index < access_count; ++index) {
    if (accesses[index].page >= page_count ||
        !is_valid_origin(accesses[index].origin)) {
      return false;
    }

    bool has_previous = false;
    AccessOrigin previous = AccessOrigin::host;
    for (std::size_t prior = index; prior > 0U; --prior) {
      if (accesses[prior - 1U].page == accesses[index].page) {
        has_previous = true;
        previous = accesses[prior - 1U].origin;
        break;
      }
    }
    if (has_previous && previous != accesses[index].origin) {
      if (transition_count == std::numeric_limits<std::size_t>::max()) {
        return false;
      }
      ++transition_count;
    }
  }

  constexpr std::size_t kMaximum = std::numeric_limits<std::size_t>::max();
  if (transition_count > kMaximum / page_bytes ||
      transition_count > transition_capacity ||
      (transition_count > 0U && transitions == nullptr)) {
    return false;
  }

  std::size_t written = 0U;
  for (std::size_t index = 0U; index < access_count; ++index) {
    bool has_previous = false;
    AccessOrigin previous = AccessOrigin::host;
    for (std::size_t prior = index; prior > 0U; --prior) {
      if (accesses[prior - 1U].page == accesses[index].page) {
        has_previous = true;
        previous = accesses[prior - 1U].origin;
        break;
      }
    }
    if (has_previous && previous != accesses[index].origin) {
      transitions[written++] = {
          index, accesses[index].page, previous, accesses[index].origin};
    }
  }

  summary = {
      transition_count,
      transition_count,
      transition_count * page_bytes,
  };
  return true;
}

inline constexpr std::uint32_t deterministic_input_value(
    std::size_t index) noexcept {
  return 29U + 11U * static_cast<std::uint32_t>(index);
}

inline constexpr std::uint32_t transform_value(std::uint32_t value) noexcept {
  return value ^ 0x5a5a5a5aU;
}

inline bool initialize_input(
    std::uint32_t* input,
    std::size_t input_count) noexcept {
  if (input_count > 0U && input == nullptr) return false;
  for (std::size_t index = 0U; index < input_count; ++index) {
    input[index] = deterministic_input_value(index);
  }
  return true;
}

inline bool transform_reference(
    const std::uint32_t* input,
    std::size_t input_count,
    std::uint32_t* output,
    std::size_t output_count,
    std::size_t element_count) noexcept {
  if (input_count < element_count || output_count < element_count ||
      (element_count > 0U && (input == nullptr || output == nullptr))) {
    return false;
  }
  for (std::size_t index = 0U; index < element_count; ++index) {
    output[index] = transform_value(input[index]);
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
// [ex08-access-sequence-end]

}  // namespace ex08

#endif  // CUDA_LEARNING_SITE_EX08_UNIFIED_MEMORY_MIGRATION_REFERENCE_HPP_
