// SPDX-License-Identifier: Apache-2.0
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <vector>

#include "multidimensional_indexing_reference.hpp"

namespace {

bool has_index(
    const ex03::Extent3D& extent,
    const ex03::Coordinate3D& coordinate,
    std::size_t expected) {
  std::size_t actual = 0;
  return ex03::try_row_major_index(coordinate, extent, actual) && actual == expected;
}

bool rejects_coordinate(
    const ex03::Extent3D& extent,
    const ex03::Coordinate3D& coordinate) {
  constexpr std::size_t kUnchanged = 12345U;
  std::size_t index = kUnchanged;
  return !ex03::try_row_major_index(coordinate, extent, index) && index == kUnchanged;
}

}  // namespace

int main() {
  if (!has_index({7U, 1U, 1U}, {5U, 0U, 0U}, 5U)) return 1;
  if (!has_index({5U, 4U, 1U}, {3U, 2U, 0U}, 13U)) return 1;
  if (!has_index({4U, 3U, 2U}, {2U, 1U, 1U}, 18U)) return 1;

  constexpr ex03::Extent3D non_divisible{10U, 9U, 5U};
  const std::size_t elements = ex03::element_count(non_divisible);
  if (elements != 450U ||
      !has_index(non_divisible, {9U, 8U, 4U}, elements - 1U)) {
    return 1;
  }

  std::vector<std::uint32_t> input(elements);
  std::vector<std::uint32_t> actual(elements);
  for (std::size_t index = 0; index < elements; ++index) {
    input[index] = static_cast<std::uint32_t>((index * 17U + 3U) % 1009U);
  }
  ex03::multidimensional_reference(input.data(), actual.data(), non_divisible);

  for (std::size_t z = 0; z < non_divisible.z; ++z) {
    for (std::size_t y = 0; y < non_divisible.y; ++y) {
      for (std::size_t x = 0; x < non_divisible.x; ++x) {
        const std::size_t index = (z * non_divisible.y + y) * non_divisible.x + x;
        const std::uint32_t expected = input[index] +
            static_cast<std::uint32_t>(x + 3U * y + 7U * z);
        if (actual[index] != expected) return 1;
      }
    }
  }

  constexpr ex03::Extent3D bounds{4U, 3U, 2U};
  if (!rejects_coordinate(bounds, {4U, 1U, 1U})) return 1;
  if (!rejects_coordinate(bounds, {1U, 3U, 1U})) return 1;
  if (!rejects_coordinate(bounds, {1U, 1U, 2U})) return 1;

  std::cout << "host-reference: pass\n";
  return 0;
}
