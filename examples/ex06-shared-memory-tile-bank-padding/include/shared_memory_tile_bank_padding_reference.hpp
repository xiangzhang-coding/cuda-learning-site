// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX06_SHARED_MEMORY_TILE_BANK_PADDING_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX06_SHARED_MEMORY_TILE_BANK_PADDING_REFERENCE_HPP_

#include <array>
#include <cstddef>

namespace ex06 {

inline constexpr std::size_t kTileRows = 32U;
inline constexpr std::size_t kTileColumns = 32U;
inline constexpr std::size_t kTileElements = kTileRows * kTileColumns;
inline constexpr std::size_t kWarpSize = 32U;
inline constexpr std::size_t kBankCount = 32U;
inline constexpr std::size_t kReadColumn = 5U;

struct TileCoordinate {
  std::size_t row;
  std::size_t column;
};

inline constexpr bool try_tile_index(
    const TileCoordinate& coordinate,
    std::size_t& index) noexcept {
  if (coordinate.row >= kTileRows || coordinate.column >= kTileColumns) {
    return false;
  }
  index = coordinate.row * kTileColumns + coordinate.column;
  return true;
}

inline constexpr bool try_shared_word_index(
    const TileCoordinate& coordinate,
    std::size_t padding,
    std::size_t& word_index) noexcept {
  if (padding > 1U || coordinate.row >= kTileRows ||
      coordinate.column >= kTileColumns) {
    return false;
  }
  word_index = coordinate.row * (kTileColumns + padding) + coordinate.column;
  return true;
}

inline constexpr bool try_bank_index(
    const TileCoordinate& coordinate,
    std::size_t padding,
    std::size_t& bank_index) noexcept {
  std::size_t word_index = 0U;
  if (!try_shared_word_index(coordinate, padding, word_index)) return false;
  bank_index = word_index % kBankCount;
  return true;
}

inline constexpr float deterministic_tile_value(
    const TileCoordinate& coordinate) noexcept {
  return static_cast<float>(coordinate.row * kTileColumns + coordinate.column) +
      0.25F;
}

inline bool write_tile_input(
    float* input,
    std::size_t input_count) noexcept {
  if (input == nullptr || input_count < kTileElements) return false;
  for (std::size_t row = 0U; row < kTileRows; ++row) {
    for (std::size_t column = 0U; column < kTileColumns; ++column) {
      const TileCoordinate coordinate{row, column};
      std::size_t input_index = 0U;
      if (!try_tile_index(coordinate, input_index)) return false;
      input[input_index] = deterministic_tile_value(coordinate);
    }
  }
  return true;
}

template <std::size_t Padding>
inline bool tiled_reference(
    const float* input,
    std::size_t input_count,
    std::size_t column,
    float* output,
    std::size_t output_count) noexcept {
  static_assert(Padding <= 1U, "EX06 defines only unpadded and one-column-padded layouts");
  if (input == nullptr || output == nullptr || input_count < kTileElements ||
      output_count < kWarpSize || column >= kTileColumns) {
    return false;
  }

  std::array<float, kTileRows * (kTileColumns + Padding)> tile{};
  for (std::size_t row = 0U; row < kTileRows; ++row) {
    for (std::size_t source_column = 0U;
         source_column < kTileColumns;
         ++source_column) {
      const TileCoordinate coordinate{row, source_column};
      std::size_t input_index = 0U;
      std::size_t shared_index = 0U;
      if (!try_tile_index(coordinate, input_index) ||
          !try_shared_word_index(coordinate, Padding, shared_index)) {
        return false;
      }
      tile[shared_index] = input[input_index];
    }
  }

  for (std::size_t lane = 0U; lane < kWarpSize; ++lane) {
    std::size_t shared_index = 0U;
    if (!try_shared_word_index({lane, column}, Padding, shared_index)) return false;
    output[lane] = tile[shared_index];
  }
  return true;
}

struct VerificationResult {
  bool matches;
  std::size_t mismatch_index;
  float expected;
  float actual;
};

inline VerificationResult verify_exact(
    const float* expected,
    const float* actual,
    std::size_t count) noexcept {
  if (count > 0U && (expected == nullptr || actual == nullptr)) {
    return {false, 0U, 0.0F, 0.0F};
  }
  for (std::size_t index = 0U; index < count; ++index) {
    if (expected[index] != actual[index]) {
      return {false, index, expected[index], actual[index]};
    }
  }
  return {true, count, 0.0F, 0.0F};
}

}  // namespace ex06

#endif  // CUDA_LEARNING_SITE_EX06_SHARED_MEMORY_TILE_BANK_PADDING_REFERENCE_HPP_
