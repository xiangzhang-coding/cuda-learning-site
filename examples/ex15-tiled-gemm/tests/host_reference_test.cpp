// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cmath>
#include <cstddef>
#include <iostream>
#include <limits>
#include <string_view>
#include <vector>

#include "tiled_gemm_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  for (const ex15::Fixture& fixture : ex15::kFixtures) {
    std::size_t a_count = 0U;
    std::size_t b_count = 0U;
    std::size_t c_count = 0U;
    if (!require(
            ex15::matrix_counts(fixture.shape, &a_count, &b_count, &c_count),
            "every fixture has valid matrix counts")) return 1;
    std::vector<float> a(a_count);
    std::vector<float> b(b_count);
    std::vector<float> c(c_count);
    std::vector<double> expected(c_count);
    if (!require(
            ex15::make_fixture(
                fixture.id, a.data(), a.size(), b.data(), b.size(), c.data(), c.size()),
            "every declared fixture is generated") ||
        !require(
            ex15::gemm_reference(
                a.data(), a.size(), b.data(), b.size(), c.data(), c.size(), fixture.shape,
                fixture.alpha, fixture.beta, expected.data(), expected.size()),
            "the double CPU reference accepts every fixture")) return 1;

    std::vector<float> rounded(expected.begin(), expected.end());
    const ex15::VerificationResult result = ex15::verify_tolerance(
        expected.data(), expected.size(), rounded.data(), rounded.size(), fixture.shape.m,
        fixture.shape.n, ex15::kAbsoluteTolerance, ex15::kRelativeTolerance);
    if (!require(result.valid && result.matches, "every rounded reference satisfies tolerance")) return 1;
  }

  std::array<float, 6> hand_a{{1.0F, 2.0F, 3.0F, 4.0F, 5.0F, 6.0F}};
  std::array<float, 6> hand_b{{1.0F, 2.0F, 3.0F, 4.0F, 5.0F, 6.0F}};
  std::array<float, 4> hand_c{{0.0F, 0.0F, 0.0F, 0.0F}};
  std::array<double, 4> hand_output{};
  if (!require(
          ex15::gemm_reference(
              hand_a.data(), hand_a.size(), hand_b.data(), hand_b.size(), hand_c.data(),
              hand_c.size(), {2U, 3U, 2U}, 1.0F, 0.0F, hand_output.data(), hand_output.size()) &&
              hand_output == std::array<double, 4>{{22.0, 28.0, 49.0, 64.0}},
          "hand-computed GEMM result")) return 1;

  const std::array<double, 1> zero_expected{{0.0}};
  const std::array<float, 1> near_zero{{0.00005F}};
  if (!require(
          ex15::verify_tolerance(
              zero_expected.data(), 1U, near_zero.data(), 1U, 1U, 1U, 0.0001, 0.0).matches,
          "near-zero absolute tolerance")) return 1;

  const std::array<double, 1> large_expected{{1000.0}};
  const std::array<float, 1> relative_candidate{{1000.01F}};
  if (!require(
          ex15::verify_tolerance(
              large_expected.data(), 1U, relative_candidate.data(), 1U, 1U, 1U, 0.0001, 0.00002).matches,
          "magnitude-scaled relative tolerance")) return 1;

  const std::array<double, 4> mismatch_expected{{1.0, 2.0, 3.0, 4.0}};
  const std::array<float, 4> mismatch_actual{{1.0F, 2.0F, 3.0F, 4.5F}};
  const ex15::VerificationResult mismatch = ex15::verify_tolerance(
      mismatch_expected.data(), 4U, mismatch_actual.data(), 4U, 2U, 2U, 0.0001, 0.00002);
  if (!require(mismatch.valid && !mismatch.matches, "out-of-tolerance value") ||
      !require(
          mismatch.mismatch_index == 3U && mismatch.row == 1U && mismatch.column == 1U &&
              mismatch.absolute_error > mismatch.allowed_error,
          "first mismatch reports row and column")) return 1;

  const std::array<float, 1> nan_candidate{{std::numeric_limits<float>::quiet_NaN()}};
  const std::array<float, 1> infinity_candidate{{std::numeric_limits<float>::infinity()}};
  if (!require(
          !ex15::verify_tolerance(
               zero_expected.data(), 1U, nan_candidate.data(), 1U, 1U, 1U, 0.0, 0.0).valid,
          "NaN is rejected") ||
      !require(
          !ex15::verify_tolerance(
               zero_expected.data(), 1U, infinity_candidate.data(), 1U, 1U, 1U, 0.0, 0.0).valid,
          "infinity is rejected") ||
      !require(
          !ex15::verify_tolerance(
               zero_expected.data(), 1U, near_zero.data(), 1U, 1U, 1U, -1.0, 0.0).valid &&
              !ex15::verify_tolerance(
               zero_expected.data(), 1U, near_zero.data(), 1U, 1U, 1U, 0.0, -1.0).valid,
          "negative tolerances are rejected")) return 1;

  std::cout << "host-reference: pass\n";
  return 0;
}
