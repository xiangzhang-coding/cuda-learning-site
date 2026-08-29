// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <limits>
#include <string_view>
#include <vector>

#include "streams_events_overlap_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  std::size_t chunk_count = 0U;
  if (!require(
          ex07::try_chunk_count(
              ex07::kElementCount, ex07::kChunkElements, chunk_count) &&
              chunk_count == 5U,
          "declared extent has five chunks")) {
    return 1;
  }

  std::size_t zero_chunk_count = 99U;
  if (!require(
          ex07::try_chunk_count(0U, ex07::kChunkElements, zero_chunk_count) &&
              zero_chunk_count == 0U,
          "zero elements form an empty partition")) {
    return 1;
  }

  std::array<ex07::Chunk, 5> chunks{};
  std::size_t chunks_written = 0U;
  if (!require(
          ex07::build_chunk_partition(
              ex07::kElementCount,
              ex07::kChunkElements,
              chunks.data(),
              chunks.size(),
              chunks_written) &&
              chunks_written == chunks.size(),
          "complete chunk partition is constructed")) {
    return 1;
  }

  for (std::size_t index = 0U; index < 4U; ++index) {
    if (!require(
            chunks[index].offset == index * ex07::kChunkElements &&
                chunks[index].count == ex07::kChunkElements,
            "full chunks are contiguous and bounded")) {
      return 1;
    }
  }
  if (!require(
          chunks[4].offset == 4096U && chunks[4].count == 3U &&
              chunks[4].offset + chunks[4].count == ex07::kElementCount,
          "partial final chunk reaches the exact extent")) {
    return 1;
  }

  constexpr std::size_t kUnchanged = 12345U;
  std::size_t unchanged_count = kUnchanged;
  if (!require(
          !ex07::try_chunk_count(8U, 0U, unchanged_count) &&
              unchanged_count == kUnchanged,
          "zero chunk size is rejected without mutation")) {
    return 1;
  }

  ex07::Chunk unchanged_chunk{77U, 88U};
  if (!require(
          !ex07::try_chunk_at(
              std::numeric_limits<std::size_t>::max(),
              2U,
              std::numeric_limits<std::size_t>::max(),
              unchanged_chunk) &&
              unchanged_chunk.offset == 77U && unchanged_chunk.count == 88U,
          "overflowing chunk offset is rejected without mutation")) {
    return 1;
  }

  std::size_t unchanged_bytes = kUnchanged;
  if (!require(
          !ex07::try_byte_count(
              std::numeric_limits<std::size_t>::max() /
                      sizeof(std::uint32_t) +
                  1U,
              unchanged_bytes) &&
              unchanged_bytes == kUnchanged,
          "overflowing byte extent is rejected without mutation")) {
    return 1;
  }

  std::array<ex07::Chunk, 4> undersized{};
  for (ex07::Chunk& chunk : undersized) chunk = {91U, 92U};
  std::size_t undersized_written = kUnchanged;
  if (!require(
          !ex07::build_chunk_partition(
              ex07::kElementCount,
              ex07::kChunkElements,
              undersized.data(),
              undersized.size(),
              undersized_written) &&
              undersized_written == kUnchanged,
          "undersized partition destination is rejected")) {
    return 1;
  }
  for (const ex07::Chunk& chunk : undersized) {
    if (!require(
            chunk.offset == 91U && chunk.count == 92U,
            "rejected partition does not mutate destination chunks")) {
      return 1;
    }
  }

  std::vector<std::uint32_t> input(ex07::kElementCount);
  std::vector<std::uint32_t> expected(ex07::kElementCount);
  std::vector<std::uint32_t> actual(ex07::kElementCount, 0U);
  if (!require(
          ex07::initialize_input(input.data(), input.size()) &&
              ex07::transform_reference(
                  input.data(),
                  input.size(),
                  actual.data(),
                  actual.size(),
                  ex07::kElementCount),
          "full deterministic host transform succeeds")) {
    return 1;
  }
  for (std::size_t index = 0U; index < expected.size(); ++index) {
    expected[index] = (19U + 5U * static_cast<std::uint32_t>(index)) * 3U + 7U;
  }
  if (!require(
          ex07::verify_exact(
              expected.data(), actual.data(), expected.size()).matches,
          "full transform matches independently constructed values")) {
    return 1;
  }

  std::array<std::uint32_t, 4> untouched{41U, 42U, 43U, 44U};
  if (!require(
          !ex07::transform_reference(
              input.data(), 4U, untouched.data(), 3U, 4U) &&
              untouched == std::array<std::uint32_t, 4>{41U, 42U, 43U, 44U},
          "undersized transform destination is not mutated")) {
    return 1;
  }

  actual[17] ^= 1U;
  const ex07::VerificationResult mismatch =
      ex07::verify_exact(expected.data(), actual.data(), actual.size());
  if (!require(
          !mismatch.matches && mismatch.mismatch_index == 17U &&
              mismatch.expected == expected[17] &&
              mismatch.actual == actual[17],
          "exact verifier reports the first deterministic mismatch")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
