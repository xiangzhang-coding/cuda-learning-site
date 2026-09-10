// SPDX-License-Identifier: Apache-2.0
#ifndef EX20_CUSPARSE_SPMV_REFERENCE_HPP
#define EX20_CUSPARSE_SPMV_REFERENCE_HPP

#include <array>
#include <cmath>
#include <cstdint>
#include <stdexcept>
#include <vector>

namespace ex20 {

inline constexpr int kRows = 4;
inline constexpr int kColumns = 5;
inline constexpr int kNnz = 7;
inline constexpr double kAbsoluteTolerance = 0.0001;
inline constexpr double kRelativeTolerance = 0.00002;

struct Fixture {
  const char* id;
  std::vector<std::int32_t> row_offsets, column_indices;
  std::vector<float> values, x, y;
  float alpha, beta;
  std::vector<double> expected;
};

inline std::array<Fixture, 2> fixtures() {
  const std::vector<std::int32_t> offsets{0, 2, 2, 4, 7}, columns{0, 3, 1, 4, 0, 2, 4};
  return {{
    {"A", offsets, columns, {2, -1, 3, 4, -2, 5, 1}, {1, 2, -1, 3, 2}, {4, -2, 1, 3},
     1, 0, {-1, 0, 14, -5}},
    {"B", offsets, columns, {-1, 2, 0.5F, -3, 4, -2, 1}, {2, -1, 3, 0.5F, -2}, {1, -4, 2, 0},
     2, -0.5F, {-2.5, 2, 10, 0}},
  }};
}

// [ex20-cpu-reference-start]
inline std::vector<double> spmv(const Fixture& fixture) {
  if (fixture.row_offsets.size() != kRows + 1 || fixture.column_indices.size() != kNnz ||
      fixture.values.size() != kNnz || fixture.x.size() != kColumns || fixture.y.size() != kRows)
    throw std::invalid_argument("EX20 requires a 4x5 CSR matrix with seven stored entries");
  if (fixture.row_offsets.front() != 0 || fixture.row_offsets.back() != kNnz)
    throw std::invalid_argument("CSR offsets must start at zero and end at nnz");
  for (int row = 0; row < kRows; ++row) {
    const int begin = fixture.row_offsets[row], end = fixture.row_offsets[row + 1];
    if (begin < 0 || end < begin || end > kNnz)
      throw std::invalid_argument("CSR offsets must be nondecreasing and within nnz");
    int previous = -1;
    for (int index = begin; index < end; ++index) {
      const int column = fixture.column_indices[index];
      if (column <= previous || column >= kColumns)
        throw std::invalid_argument("CSR columns must be in range, sorted, and unique per row");
      previous = column;
    }
  }
  for (const auto* values : {&fixture.values, &fixture.x, &fixture.y}) {
    for (float value : *values) {
      if (!std::isfinite(value)) throw std::invalid_argument("SpMV inputs must be finite");
    }
  }
  if (!std::isfinite(fixture.alpha) || !std::isfinite(fixture.beta))
    throw std::invalid_argument("SpMV scalars must be finite");

  std::vector<double> output(kRows);
  for (int row = 0; row < kRows; ++row) {
    double sum = 0;
    for (int index = fixture.row_offsets[row]; index < fixture.row_offsets[row + 1]; ++index)
      sum += static_cast<double>(fixture.values[index]) * fixture.x[fixture.column_indices[index]];
    output[row] = static_cast<double>(fixture.alpha) * sum +
                  static_cast<double>(fixture.beta) * fixture.y[row];
  }
  return output;
}

inline bool matches(const std::vector<double>& expected, const std::vector<double>& actual,
                    double absolute = kAbsoluteTolerance, double relative = kRelativeTolerance) {
  if (expected.size() != kRows || actual.size() != expected.size() ||
      !std::isfinite(absolute) || !std::isfinite(relative) || absolute < 0 || relative < 0)
    return false;
  bool all_match = true;
  for (std::size_t i = 0; i < expected.size(); ++i) {
    if (!std::isfinite(expected[i]) || !std::isfinite(actual[i])) return false;
    const double error = std::abs(actual[i] - expected[i]);
    const double allowed = absolute + relative * std::abs(expected[i]);
    if (!std::isfinite(error) || !std::isfinite(allowed) || error > allowed) all_match = false;
  }
  return all_match;
}
// [ex20-cpu-reference-end]

}  // namespace ex20
#endif
