// SPDX-License-Identifier: Apache-2.0
#include <algorithm>
#include <array>
#include <iostream>
#include <limits>
#include <vector>

#include "cublas_gemm_reference.hpp"

bool require(bool condition, const char* message) {
  if (!condition) std::cerr << "host-reference failure: " << message << '\n';
  return condition;
}

int main() {
  const std::array<float, 6> a{{1, 2, 3, 4, 5, 6}};
  const std::array<float, 6> b{{1, 2, 3, 4, 5, 6}};
  const std::array<float, 4> c{{0, 0, 0, 0}};
  std::array<double, 4> output{};
  if (!ex18::gemm_reference(
          a.data(), a.size(), b.data(), b.size(), c.data(), c.size(),
          {2, 3, 2}, 1.0F, 0.0F, output.data(), output.size()) ||
      output != std::array<double, 4>{{22, 28, 49, 64}}) {
    std::cerr << "host-reference failure: literal row-major hand result\n";
    return 1;
  }
  const std::array<double, 4> expected{{0, 1000, 3, 4}};
  std::array<float, 4> actual{{0.00005F, 1000.01F, 3, 4}};
  auto check = [&]() {
    return ex18::verify_tolerance(
        expected.data(), expected.size(), actual.data(), actual.size(), 2, 2,
        ex18::kAbsoluteTolerance, ex18::kRelativeTolerance);
  };
  if (!require(check().matches, "absolute and relative acceptance")) return 1;
  actual.back() = 4.5F;
  const auto mismatch = check();
  if (!require(mismatch.valid && !mismatch.matches && mismatch.row == 1 &&
                   mismatch.column == 1 && mismatch.mismatch_index == 3,
               "full output check reports final-element corruption")) return 1;
  for (float nonfinite : {std::numeric_limits<float>::infinity(),
                          std::numeric_limits<float>::quiet_NaN()}) {
    actual.back() = nonfinite;
    if (!require(!check().valid, "nonfinite output rejected")) return 1;
  }
  actual.back() = 4;
  if (!require(!ex18::verify_tolerance(expected.data(), 4, actual.data(), 3,
                                      2, 2, 1e-4, 2e-5).valid,
               "truncated output rejected") ||
      !require(!ex18::verify_tolerance(expected.data(), 4, actual.data(), 4,
                                      2, 2, -1, 2e-5).valid,
               "negative tolerance rejected")) return 1;
  const double one = 1.0;
  const float boundary = 1.125F;
  if (!require(ex18::verify_tolerance(&one, 1, &boundary, 1, 1, 1, 0.125, 0).matches &&
                   !ex18::verify_tolerance(&one, 1, &boundary, 1, 1, 1, 0.124, 0).matches,
               "inclusive tolerance boundary")) return 1;
  const std::array<std::array<std::size_t, 3>, 3> shapes{{
      {{2, 3, 2}}, {{33, 31, 35}}, {{32, 32, 32}}}};
  if (!require(ex18::kFixtures.size() == shapes.size(), "three EX15 fixtures")) return 1;
  for (std::size_t f = 0; f < shapes.size(); ++f) {
    const auto& fixture = ex18::kFixtures[f];
    if (!require(fixture.shape.m == shapes[f][0] && fixture.shape.k == shapes[f][1] &&
                     fixture.shape.n == shapes[f][2] &&
                     fixture.alpha == (f == 1 ? 0.75F : 1.0F) &&
                     fixture.beta == (f == 1 ? 0.25F : 0.0F),
                 "EX15 shapes and alpha/beta")) return 1;
    std::size_t na = 0, nb = 0, nc = 0;
    if (!require(ex18::matrix_counts(fixture.shape, &na, &nb, &nc), "matrix counts")) return 1;
    std::vector<float> fa(na), fb(nb), fc(nc);
    if (!require(ex18::make_fixture(fixture.id, fa.data(), na, fb.data(), nb, fc.data(), nc),
                 "deterministic fixture generated")) return 1;
    if (f == 0) {
      if (!require(std::equal(fa.begin(), fa.end(), a.begin()) &&
                       std::equal(fb.begin(), fb.end(), b.begin()) &&
                       std::equal(fc.begin(), fc.end(), c.begin()), "hand fixture inputs")) return 1;
    } else {
      const std::array<float, 7> a_period{{-0.375F, -0.25F, -0.125F, 0, 0.125F, 0.25F, 0.375F}};
      const std::array<float, 5> b_period{{-2.0F / 7.0F, -1.0F / 7.0F, 0, 1.0F / 7.0F, 2.0F / 7.0F}};
      const std::array<float, 3> c_period{{-0.2F, 0, 0.2F}};
      for (std::size_t i = 0; i < na; ++i)
        if (!require(fa[i] == a_period[i % a_period.size()], "A fixture period")) return 1;
      for (std::size_t i = 0; i < nb; ++i)
        if (!require(fb[i] == b_period[i % b_period.size()], "B fixture period")) return 1;
      for (std::size_t i = 0; i < nc; ++i)
        if (!require(fc[i] == c_period[i % c_period.size()], "C fixture period")) return 1;
    }
  }
  const std::array<float, 4> initial{{4, 8, 12, 16}};
  if (!require(ex18::gemm_reference(a.data(), 6, b.data(), 6, initial.data(), 4,
                                    {2, 3, 2}, 0.75F, 0.25F, output.data(), 4) &&
                   output == std::array<double, 4>{{17.5, 23, 39.75, 52}},
               "independent literal alpha/beta result")) return 1;
  const std::array<float, 3> cancellation{{16777216, 1, -16777216}};
  const std::array<float, 3> ones{{1, 1, 1}};
  if (!require(ex18::gemm_reference(cancellation.data(), 3, ones.data(), 3, c.data(), 1,
                                    {1, 3, 1}, 1, 0, output.data(), 1) && output[0] == 1,
               "oracle accumulates stored float inputs in double")) return 1;
  std::size_t count = 0;
  if (!require(!ex18::checked_product(std::numeric_limits<std::size_t>::max(), 2, &count) &&
                   !ex18::checked_product(0, 2, &count), "invalid extents rejected") ||
      !require(!ex18::gemm_reference(a.data(), 5, b.data(), 6, c.data(), 4,
                                     {2, 3, 2}, 1, 0, output.data(), 4),
               "invalid input count rejected")) return 1;
  std::cout << "host-reference: pass\n";
}
