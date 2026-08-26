// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX03_MULTIDIMENSIONAL_INDEXING_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX03_MULTIDIMENSIONAL_INDEXING_REFERENCE_HPP_

#include <cstddef>
#include <cstdint>

namespace ex03 {

// [ex03-host-reference-start]
struct Extent3D {
  std::size_t x;
  std::size_t y;
  std::size_t z;
};

struct Coordinate3D {
  std::size_t x;
  std::size_t y;
  std::size_t z;
};

inline constexpr std::size_t element_count(const Extent3D& extent) noexcept {
  return extent.x * extent.y * extent.z;
}

inline constexpr bool try_row_major_index(
    const Coordinate3D& coordinate,
    const Extent3D& extent,
    std::size_t& index) noexcept {
  if (coordinate.x >= extent.x) return false;
  if (coordinate.y >= extent.y) return false;
  if (coordinate.z >= extent.z) return false;

  index = (coordinate.z * extent.y + coordinate.y) * extent.x + coordinate.x;
  return true;
}

inline constexpr std::uint32_t reference_value(
    std::uint32_t input,
    const Coordinate3D& coordinate) noexcept {
  return input + static_cast<std::uint32_t>(
                     coordinate.x + 3U * coordinate.y + 7U * coordinate.z);
}

inline void multidimensional_reference(
    const std::uint32_t* input,
    std::uint32_t* output,
    const Extent3D& extent) {
  for (std::size_t z = 0; z < extent.z; ++z) {
    for (std::size_t y = 0; y < extent.y; ++y) {
      for (std::size_t x = 0; x < extent.x; ++x) {
        const Coordinate3D coordinate{x, y, z};
        const std::size_t index = (z * extent.y + y) * extent.x + x;
        output[index] = reference_value(input[index], coordinate);
      }
    }
  }
}
// [ex03-host-reference-end]

}  // namespace ex03

#endif  // CUDA_LEARNING_SITE_EX03_MULTIDIMENSIONAL_INDEXING_REFERENCE_HPP_
