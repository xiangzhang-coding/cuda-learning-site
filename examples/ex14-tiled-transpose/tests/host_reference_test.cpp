// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <iostream>
#include <limits>
#include <string_view>
#include <vector>

#include "tiled_transpose_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  constexpr std::array<ex14::MatrixShape, 3> kExpectedShapes{{
      {5U, 7U},
      {33U, 35U},
      {64U, 32U},
  }};
  for (std::size_t index = 0U; index < ex14::kFixtures.size(); ++index) {
    if (!require(
            ex14::kFixtures[index].input_shape == kExpectedShapes[index],
            "fixture dimensions are exactly 5x7, 33x35, and 64x32")) {
      return 1;
    }
  }

  for (const ex14::Fixture& fixture : ex14::kFixtures) {
    std::size_t element_count = 0U;
    ex14::MatrixShape output_shape{};
    if (!require(
            ex14::checked_element_count(
                fixture.input_shape, &element_count),
            "each fixture has a valid element count") ||
        !require(
            ex14::transposed_shape(fixture.input_shape, &output_shape),
            "each fixture has a valid transposed shape") ||
        !require(
            output_shape == ex14::MatrixShape{
                                fixture.input_shape.columns,
                                fixture.input_shape.rows},
            "output dimensions are input columns by input rows")) {
      return 1;
    }

    std::vector<float> input(element_count, -1.0F);
    std::vector<float> output(element_count, -2.0F);
    if (!require(
            ex14::make_fixture(fixture.id, input.data(), input.size()),
            "every declared fixture is generated") ||
        !require(
            ex14::transpose_reference(
                input.data(),
                input.size(),
                fixture.input_shape,
                output.data(),
                output.size(),
                output_shape),
            "the CPU reference accepts every fixture")) {
      return 1;
    }

    for (std::size_t input_index = 0U;
         input_index < input.size();
         ++input_index) {
      if (!require(
              input[input_index] == static_cast<float>(input_index + 1U),
              "fixture values follow the deterministic exact sequence")) {
        return 1;
      }
    }
    for (std::size_t row = 0U; row < fixture.input_shape.rows; ++row) {
      for (std::size_t column = 0U;
           column < fixture.input_shape.columns;
           ++column) {
        if (!require(
                output[column * fixture.input_shape.rows + row] ==
                    input[row * fixture.input_shape.columns + column],
                "every row-major transpose mapping matches exactly")) {
          return 1;
        }
      }
    }

    const ex14::VerificationResult exact = ex14::verify_exact(
        output.data(),
        output.size(),
        output.data(),
        output.size(),
        output_shape);
    if (!require(
            exact.valid && exact.matches &&
                exact.mismatch_index == ex14::kNoMismatch,
            "exact verification accepts every complete output")) {
      return 1;
    }
  }

  constexpr float kSentinel = -4096.0F;
  constexpr ex14::MatrixShape input_shape{5U, 7U};
  constexpr ex14::MatrixShape output_shape{7U, 5U};
  std::vector<float> input(35U, kSentinel);
  const auto untouched_input = input;
  if (!require(
          !ex14::make_fixture("unknown", input.data(), input.size()) &&
              input == untouched_input,
          "an unknown fixture is rejected without mutation") ||
      !require(
          !ex14::make_fixture("5x7", input.data(), input.size() - 1U) &&
              input == untouched_input,
          "an invalid fixture size is rejected without mutation") ||
      !require(
          !ex14::make_fixture("5x7", nullptr, input.size()),
          "a null fixture output is rejected")) {
    return 1;
  }

  if (!require(
          ex14::make_fixture("5x7", input.data(), input.size()),
          "the 5x7 fixture is available for rejection checks")) {
    return 1;
  }
  std::vector<float> rejected_output(35U, kSentinel);
  const auto untouched_output = rejected_output;
  const ex14::MatrixShape wrong_output_shape{5U, 7U};
  const ex14::MatrixShape zero_shape{0U, 7U};
  const ex14::MatrixShape overflow_shape{
      std::numeric_limits<std::size_t>::max(), 2U};
  if (!require(
          !ex14::transpose_reference(
              input.data(),
              input.size() - 1U,
              input_shape,
              rejected_output.data(),
              rejected_output.size(),
              output_shape) &&
              rejected_output == untouched_output,
          "an invalid input size is rejected without output mutation") ||
      !require(
          !ex14::transpose_reference(
              input.data(),
              input.size(),
              input_shape,
              rejected_output.data(),
              rejected_output.size() - 1U,
              output_shape) &&
              rejected_output == untouched_output,
          "an invalid output size is rejected without output mutation") ||
      !require(
          !ex14::transpose_reference(
              input.data(),
              input.size(),
              input_shape,
              rejected_output.data(),
              rejected_output.size(),
              wrong_output_shape) &&
              rejected_output == untouched_output,
          "invalid output dimensions are rejected without output mutation") ||
      !require(
          !ex14::transpose_reference(
              nullptr,
              input.size(),
              input_shape,
              rejected_output.data(),
              rejected_output.size(),
              output_shape) &&
              rejected_output == untouched_output,
          "a null input is rejected without output mutation") ||
      !require(
          !ex14::transpose_reference(
              input.data(),
              input.size(),
              input_shape,
              nullptr,
              rejected_output.size(),
              output_shape),
          "a null output is rejected") ||
      !require(
          !ex14::transpose_reference(
              input.data(),
              input.size(),
              zero_shape,
              rejected_output.data(),
              rejected_output.size(),
              output_shape) &&
              rejected_output == untouched_output,
          "zero dimensions are rejected without output mutation") ||
      !require(
          !ex14::transpose_reference(
              input.data(),
              input.size(),
              overflow_shape,
              rejected_output.data(),
              rejected_output.size(),
              output_shape) &&
              rejected_output == untouched_output,
          "overflowing dimensions are rejected without output mutation")) {
    return 1;
  }

  auto in_place = input;
  const auto untouched_in_place = in_place;
  if (!require(
          !ex14::transpose_reference(
              in_place.data(),
              in_place.size(),
              input_shape,
              in_place.data(),
              in_place.size(),
              output_shape) &&
              in_place == untouched_in_place,
          "an in-place request is rejected without mutation")) {
    return 1;
  }

  std::vector<float> expected(35U);
  if (!require(
          ex14::transpose_reference(
              input.data(),
              input.size(),
              input_shape,
              expected.data(),
              expected.size(),
              output_shape),
          "a valid output is available for mismatch reporting")) {
    return 1;
  }
  auto actual = expected;
  constexpr std::size_t kMismatchRow = 2U;
  constexpr std::size_t kMismatchColumn = 3U;
  constexpr std::size_t kMismatchIndex =
      kMismatchRow * output_shape.columns + kMismatchColumn;
  actual[kMismatchIndex] += 1.0F;
  const ex14::VerificationResult mismatch = ex14::verify_exact(
      expected.data(),
      expected.size(),
      actual.data(),
      actual.size(),
      output_shape);
  if (!require(
          mismatch.valid && !mismatch.matches &&
              mismatch.mismatch_index == kMismatchIndex &&
              mismatch.output_row == kMismatchRow &&
              mismatch.output_column == kMismatchColumn &&
              mismatch.expected == expected[kMismatchIndex] &&
              mismatch.actual == actual[kMismatchIndex],
          "exact comparison reports the first mismatch and output coordinates") ||
      !require(
          !ex14::verify_exact(
               nullptr,
               expected.size(),
               actual.data(),
               actual.size(),
               output_shape)
               .valid,
          "a null comparison input is reported as invalid") ||
      !require(
          !ex14::verify_exact(
               expected.data(),
               expected.size() - 1U,
               actual.data(),
               actual.size(),
               output_shape)
               .valid,
          "a comparison size mismatch is reported as invalid")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
