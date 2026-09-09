// SPDX-License-Identifier: Apache-2.0
#include "cusparse_spmv_reference.hpp"

#include <iostream>
#include <limits>
#include <stdexcept>

void require(bool condition, const char* message) {
  if (!condition) throw std::runtime_error(message);
}

int main() {
  try {
    const auto fixtures = ex20::fixtures();
    const std::vector<double> a{-1, 0, 14, -5}, b{-2.5, 2, 10, 0};
    require(ex20::spmv(fixtures[0]) == a, "literal A, including empty row with beta=0");
    require(ex20::spmv(fixtures[1]) == b, "literal B, including empty row with beta=-0.5");
    require(fixtures[0].expected == a && fixtures[1].expected == b, "independent fixture literals");
    require(fixtures[0].row_offsets == std::vector<std::int32_t>({0, 2, 2, 4, 7}), "CSR offsets");
    require(fixtures[0].column_indices == std::vector<std::int32_t>({0, 3, 1, 4, 0, 2, 4}), "CSR columns");
    require(fixtures[0].row_offsets == fixtures[1].row_offsets &&
            fixtures[0].column_indices == fixtures[1].column_indices, "shared CSR structure");
    require(fixtures[0].values == std::vector<float>({2, -1, 3, 4, -2, 5, 1}) &&
            fixtures[0].x == std::vector<float>({1, 2, -1, 3, 2}) &&
            fixtures[0].y == std::vector<float>({4, -2, 1, 3}) &&
            fixtures[0].alpha == 1 && fixtures[0].beta == 0, "A inputs");
    require(fixtures[1].values == std::vector<float>({-1, 2, 0.5F, -3, 4, -2, 1}) &&
            fixtures[1].x == std::vector<float>({2, -1, 3, 0.5F, -2}) &&
            fixtures[1].y == std::vector<float>({1, -4, 2, 0}) &&
            fixtures[1].alpha == 2 && fixtures[1].beta == -0.5F, "B inputs");
    require(ex20::matches(a, ex20::spmv(fixtures[0])) &&
            ex20::matches(b, ex20::spmv(fixtures[1])), "full-output tolerance");
    auto precision = fixtures[0];
    precision.values[0] = 16777216.0F;
    precision.values[1] = 1;
    precision.x[0] = precision.x[3] = 1;
    require(ex20::spmv(precision)[0] == 16777217.0, "accumulation is double, not FP32");
    const auto rejects = [](const ex20::Fixture& fixture) {
      bool rejected = false;
      try { ex20::spmv(fixture); } catch (const std::invalid_argument&) { rejected = true; }
      require(rejected, "malformed or nonfinite CSR input must be rejected before indexing");
    };
    for (auto offsets : {std::vector<std::int32_t>{}, {0, 2, 2, 4}, {0, 2, 2, 4, 7, 7},
                         {1, 2, 2, 4, 7}, {0, 2, 2, 4, 6}, {0, 2, 2, 4, 8},
                         {0, -1, 2, 4, 7}, {0, 3, 2, 4, 7}, {0, 2, 2, 8, 7}}) {
      auto bad = fixtures[0];
      bad.row_offsets = offsets;
      rejects(bad);
    }
    for (auto columns : {std::vector<std::int32_t>{}, {0, 3, 1, 4, 0, 2}, {0, 3, 1, 4, 0, 2, 4, 4},
                         {-1, 3, 1, 4, 0, 2, 4}, {0, 5, 1, 4, 0, 2, 4},
                         {3, 0, 1, 4, 0, 2, 4}, {0, 0, 1, 4, 0, 2, 4}}) {
      auto bad = fixtures[0];
      bad.column_indices = columns;
      rejects(bad);
    }
    const float nan = std::numeric_limits<float>::quiet_NaN();
    const float infinity = std::numeric_limits<float>::infinity();
    for (auto member : {&ex20::Fixture::values, &ex20::Fixture::x, &ex20::Fixture::y}) {
      auto bad = fixtures[0];
      (bad.*member).pop_back();
      rejects(bad);
      bad = fixtures[0];
      (bad.*member).push_back(0);
      rejects(bad);
      for (std::size_t i = 0; i < (fixtures[0].*member).size(); ++i) {
        for (float value : {nan, infinity, -infinity}) {
          bad = fixtures[0];
          (bad.*member)[i] = value;
          rejects(bad);
        }
      }
    }
    for (auto member : {&ex20::Fixture::alpha, &ex20::Fixture::beta}) {
      for (float value : {nan, infinity, -infinity}) {
        auto bad = fixtures[0];
        bad.*member = value;
        rejects(bad);
      }
    }
    for (int row = 0; row < 4; ++row) {
      auto actual = b;
      actual[row] += 1;
      require(!ex20::matches(b, actual), "every row checked, including zero output");
      for (double bad : {static_cast<double>(nan), static_cast<double>(infinity), -static_cast<double>(infinity)}) {
        actual[row] = bad;
        require(!ex20::matches(b, actual) && !ex20::matches(actual, b), "nonfinite output or oracle rejected");
      }
    }
    require(ex20::matches({0, 0, 0, 0}, {0, 0, 0, 0.125}, 0.125, 0), "inclusive absolute tolerance");
    require(!ex20::matches({0, 0, 0, 0}, {0, 0, 0, 0.126}, 0.125, 0), "outside absolute tolerance");
    require(ex20::matches({0, 0, 0, 8}, {0, 0, 0, 9}, 0, 0.125), "inclusive relative tolerance");
    require(!ex20::matches({0, 0, 0, 8}, {0, 0, 0, 9.01}, 0, 0.125), "outside relative tolerance");
    for (double bad : {-1.0, static_cast<double>(nan), static_cast<double>(infinity)}) {
      require(!ex20::matches(a, a, bad, 0) && !ex20::matches(a, a, 0, bad), "invalid tolerance");
    }
    require(!ex20::matches({}, {}) && !ex20::matches(a, {0, 0, 0}) &&
            !ex20::matches(a, {0, 0, 0, 0, 0}), "invalid comparison extents");
    const double maximum = std::numeric_limits<double>::max();
    require(!ex20::matches({maximum, 0, 0, 0}, {-maximum, 0, 0, 0}), "overflowed difference");
    require(!ex20::matches({maximum, 0, 0, 0}, {maximum, 0, 0, 0}, maximum, maximum), "overflowed tolerance");
    std::cout << "host-reference: pass\n";
    return 0;
  } catch (const std::exception& error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
