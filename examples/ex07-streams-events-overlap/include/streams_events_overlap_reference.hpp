// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX07_STREAMS_EVENTS_OVERLAP_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX07_STREAMS_EVENTS_OVERLAP_REFERENCE_HPP_

#include <cstddef>
#include <cstdint>
#include <limits>

namespace ex07 {

// [ex07-chunk-contract-start]
inline constexpr std::size_t kElementCount = 4099U;
inline constexpr std::size_t kChunkElements = 1024U;
inline constexpr std::size_t kChunkStreamCount = 2U;

struct Chunk {
  std::size_t offset;
  std::size_t count;
};

inline constexpr bool try_byte_count(
    std::size_t element_count,
    std::size_t& byte_count) noexcept {
  constexpr std::size_t kMaximum = std::numeric_limits<std::size_t>::max();
  if (element_count > kMaximum / sizeof(std::uint32_t)) return false;
  byte_count = element_count * sizeof(std::uint32_t);
  return true;
}

inline constexpr bool try_chunk_count(
    std::size_t element_count,
    std::size_t chunk_elements,
    std::size_t& chunk_count) noexcept {
  if (chunk_elements == 0U) return false;
  chunk_count = element_count / chunk_elements;
  if (element_count % chunk_elements != 0U) ++chunk_count;
  return true;
}

inline constexpr bool try_chunk_at(
    std::size_t element_count,
    std::size_t chunk_elements,
    std::size_t chunk_index,
    Chunk& chunk) noexcept {
  if (chunk_elements == 0U) return false;
  constexpr std::size_t kMaximum = std::numeric_limits<std::size_t>::max();
  if (chunk_index > kMaximum / chunk_elements) return false;

  std::size_t chunk_count = 0U;
  if (!try_chunk_count(element_count, chunk_elements, chunk_count) ||
      chunk_index >= chunk_count) {
    return false;
  }

  const std::size_t offset = chunk_index * chunk_elements;
  const std::size_t remaining = element_count - offset;
  const std::size_t count =
      remaining < chunk_elements ? remaining : chunk_elements;
  chunk = {offset, count};
  return true;
}

inline bool build_chunk_partition(
    std::size_t element_count,
    std::size_t chunk_elements,
    Chunk* chunks,
    std::size_t chunk_capacity,
    std::size_t& chunks_written) noexcept {
  std::size_t required_chunks = 0U;
  if (!try_chunk_count(element_count, chunk_elements, required_chunks) ||
      required_chunks > chunk_capacity ||
      (required_chunks > 0U && chunks == nullptr)) {
    return false;
  }

  for (std::size_t index = 0U; index < required_chunks; ++index) {
    Chunk next{};
    if (!try_chunk_at(element_count, chunk_elements, index, next)) return false;
    chunks[index] = next;
  }
  chunks_written = required_chunks;
  return true;
}

inline constexpr std::uint32_t deterministic_input_value(
    std::size_t index) noexcept {
  return 19U + 5U * static_cast<std::uint32_t>(index);
}

inline constexpr std::uint32_t transform_value(std::uint32_t value) noexcept {
  return value * 3U + 7U;
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
// [ex07-chunk-contract-end]

}  // namespace ex07

#endif  // CUDA_LEARNING_SITE_EX07_STREAMS_EVENTS_OVERLAP_REFERENCE_HPP_
