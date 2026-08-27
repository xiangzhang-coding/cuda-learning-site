// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <iostream>
#include <string_view>

#include "shared_memory_tile_bank_padding_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  if (!require(
          ex06::kTileRows == 32U && ex06::kTileColumns == 32U &&
              ex06::kTileElements == 1024U && ex06::kWarpSize == 32U,
          "tile and warp extents are fixed")) {
    return 1;
  }

  std::size_t index = 0U;
  if (!require(
          ex06::try_tile_index({7U, 5U}, index) && index == 229U,
          "row-major tile index is correct")) {
    return 1;
  }
  if (!require(
          ex06::try_tile_index({31U, 31U}, index) && index == 1023U,
          "last tile coordinate is in bounds")) {
    return 1;
  }

  constexpr std::size_t kUnchanged = 12345U;
  std::size_t unchanged = kUnchanged;
  if (!require(
          !ex06::try_tile_index({32U, 0U}, unchanged) && unchanged == kUnchanged,
          "out-of-range row is rejected without mutation")) {
    return 1;
  }
  if (!require(
          !ex06::try_shared_word_index({0U, 0U}, 2U, unchanged) &&
              unchanged == kUnchanged,
          "unsupported padding is rejected")) {
    return 1;
  }

  std::array<bool, ex06::kBankCount> padded_banks{};
  std::size_t previous_unpadded_word = 0U;
  for (std::size_t lane = 0U; lane < ex06::kWarpSize; ++lane) {
    const ex06::TileCoordinate access{lane, ex06::kReadColumn};
    std::size_t unpadded_word = 0U;
    std::size_t padded_word = 0U;
    std::size_t unpadded_bank = 0U;
    std::size_t padded_bank = 0U;
    if (!require(
            ex06::try_shared_word_index(access, 0U, unpadded_word) &&
                ex06::try_shared_word_index(access, 1U, padded_word) &&
                ex06::try_bank_index(access, 0U, unpadded_bank) &&
                ex06::try_bank_index(access, 1U, padded_bank),
            "both shared layouts map every lane")) {
      return 1;
    }
    if (!require(
            unpadded_word == lane * 32U + ex06::kReadColumn &&
                unpadded_bank == ex06::kReadColumn,
            "unpadded lane access selects one bank")) {
      return 1;
    }
    if (lane > 0U && !require(
                         unpadded_word != previous_unpadded_word,
                         "unpadded same-bank accesses select distinct words")) {
      return 1;
    }
    previous_unpadded_word = unpadded_word;

    if (!require(
            padded_word == lane * 33U + ex06::kReadColumn &&
                padded_bank == (lane + ex06::kReadColumn) % ex06::kBankCount,
            "padded lane access rotates across banks")) {
      return 1;
    }
    if (!require(!padded_banks[padded_bank], "padded bank is unique within the warp")) {
      return 1;
    }
    padded_banks[padded_bank] = true;
  }
  for (const bool visited : padded_banks) {
    if (!require(visited, "padded layout reaches every bank exactly once")) return 1;
  }

  std::array<float, ex06::kTileElements> input{};
  std::array<float, ex06::kWarpSize> unpadded_output{};
  std::array<float, ex06::kWarpSize> padded_output{};
  if (!require(
          ex06::write_tile_input(input.data(), input.size()),
          "deterministic tile input is generated")) {
    return 1;
  }
  if (!require(
          ex06::tiled_reference<0U>(
              input.data(),
              input.size(),
              ex06::kReadColumn,
              unpadded_output.data(),
              unpadded_output.size()),
          "unpadded host layout is generated")) {
    return 1;
  }
  if (!require(
          ex06::tiled_reference<1U>(
              input.data(),
              input.size(),
              ex06::kReadColumn,
              padded_output.data(),
              padded_output.size()),
          "padded host layout is generated")) {
    return 1;
  }

  for (std::size_t lane = 0U; lane < ex06::kWarpSize; ++lane) {
    const float expected = ex06::deterministic_tile_value({lane, ex06::kReadColumn});
    if (!require(
            unpadded_output[lane] == expected && padded_output[lane] == expected,
            "padding leaves the logical output unchanged")) {
      return 1;
    }
  }
  if (!require(
          ex06::verify_exact(
              unpadded_output.data(), padded_output.data(), ex06::kWarpSize).matches,
          "both output layouts match exactly")) {
    return 1;
  }

  if (!require(
          !ex06::tiled_reference<0U>(
              input.data(),
              input.size(),
              ex06::kTileColumns,
              unpadded_output.data(),
              unpadded_output.size()),
          "out-of-range read column is rejected")) {
    return 1;
  }
  if (!require(
          !ex06::tiled_reference<1U>(
              input.data(),
              input.size() - 1U,
              ex06::kReadColumn,
              padded_output.data(),
              padded_output.size()),
          "undersized input tile is rejected")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
