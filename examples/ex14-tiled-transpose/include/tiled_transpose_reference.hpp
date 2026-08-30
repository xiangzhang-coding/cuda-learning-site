// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX14_TILED_TRANSPOSE_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX14_TILED_TRANSPOSE_REFERENCE_HPP_

#include <array>
#include <cstddef>
#include <limits>
#include <string_view>

namespace ex14 {

// [ex14-cpu-reference-start]
struct MatrixShape {
  std::size_t rows;
  std::size_t columns;
};

constexpr bool operator==(MatrixShape left, MatrixShape right) noexcept {
  return left.rows == right.rows && left.columns == right.columns;
}

constexpr bool operator!=(MatrixShape left, MatrixShape right) noexcept {
  return !(left == right);
}

struct Fixture {
  std::string_view id;
  MatrixShape input_shape;
};

inline constexpr std::array<Fixture, 3> kFixtures{{
    {"5x7", {5U, 7U}},
    {"33x35", {33U, 35U}},
    {"64x32", {64U, 32U}},
}};

inline constexpr std::size_t kNoMismatch =
    std::numeric_limits<std::size_t>::max();

inline bool checked_element_count(
    MatrixShape shape,
    std::size_t* element_count) noexcept {
  if (element_count == nullptr || shape.rows == 0U || shape.columns == 0U ||
      shape.rows > std::numeric_limits<std::size_t>::max() / shape.columns) {
    return false;
  }
  *element_count = shape.rows * shape.columns;
  return true;
}

inline bool transposed_shape(
    MatrixShape input_shape,
    MatrixShape* output_shape) noexcept {
  std::size_t element_count = 0U;
  if (output_shape == nullptr ||
      !checked_element_count(input_shape, &element_count)) {
    return false;
  }
  *output_shape = {input_shape.columns, input_shape.rows};
  return true;
}

inline const Fixture* find_fixture(std::string_view fixture_id) noexcept {
  for (const Fixture& fixture : kFixtures) {
    if (fixture.id == fixture_id) return &fixture;
  }
  return nullptr;
}

inline bool make_fixture(
    std::string_view fixture_id,
    float* input,
    std::size_t input_count) noexcept {
  const Fixture* fixture = find_fixture(fixture_id);
  std::size_t expected_count = 0U;
  if (fixture == nullptr || input == nullptr ||
      !checked_element_count(fixture->input_shape, &expected_count) ||
      input_count != expected_count) {
    return false;
  }

  for (std::size_t index = 0U; index < input_count; ++index) {
    input[index] = static_cast<float>(index + 1U);
  }
  return true;
}

inline bool transpose_reference(
    const float* input,
    std::size_t input_count,
    MatrixShape input_shape,
    float* output,
    std::size_t output_count,
    MatrixShape output_shape) noexcept {
  std::size_t expected_count = 0U;
  MatrixShape expected_output_shape{};
  if (input == nullptr || output == nullptr || input == output ||
      !checked_element_count(input_shape, &expected_count) ||
      !transposed_shape(input_shape, &expected_output_shape) ||
      input_count != expected_count || output_count != expected_count ||
      output_shape != expected_output_shape) {
    return false;
  }

  for (std::size_t row = 0U; row < input_shape.rows; ++row) {
    for (std::size_t column = 0U; column < input_shape.columns; ++column) {
      output[column * input_shape.rows + row] =
          input[row * input_shape.columns + column];
    }
  }
  return true;
}

struct VerificationResult {
  bool valid;
  bool matches;
  std::size_t mismatch_index;
  std::size_t output_row;
  std::size_t output_column;
  float expected;
  float actual;
};

inline VerificationResult verify_exact(
    const float* expected,
    std::size_t expected_count,
    const float* actual,
    std::size_t actual_count,
    MatrixShape output_shape) noexcept {
  std::size_t shape_count = 0U;
  if (expected == nullptr || actual == nullptr ||
      !checked_element_count(output_shape, &shape_count) ||
      expected_count != shape_count || actual_count != shape_count) {
    return {false, false, kNoMismatch, kNoMismatch, kNoMismatch, 0.0F, 0.0F};
  }

  for (std::size_t index = 0U; index < shape_count; ++index) {
    if (expected[index] != actual[index]) {
      return {
          true,
          false,
          index,
          index / output_shape.columns,
          index % output_shape.columns,
          expected[index],
          actual[index],
      };
    }
  }
  return {true, true, kNoMismatch, kNoMismatch, kNoMismatch, 0.0F, 0.0F};
}
// [ex14-cpu-reference-end]

}  // namespace ex14

#endif  // CUDA_LEARNING_SITE_EX14_TILED_TRANSPOSE_REFERENCE_HPP_
