// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX15_TILED_GEMM_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX15_TILED_GEMM_REFERENCE_HPP_

#include <array>
#include <cmath>
#include <cstddef>
#include <limits>
#include <string_view>

namespace ex15 {

// [ex15-cpu-reference-start]
struct GemmShape {
  std::size_t m;
  std::size_t k;
  std::size_t n;
};

struct Fixture {
  std::string_view id;
  GemmShape shape;
  float alpha;
  float beta;
};

inline constexpr std::array<Fixture, 3> kFixtures{{
    {"2x3x2-hand", {2U, 3U, 2U}, 1.0F, 0.0F},
    {"33x31x35-partial", {33U, 31U, 35U}, 0.75F, 0.25F},
    {"32x32x32-aligned", {32U, 32U, 32U}, 1.0F, 0.0F},
}};

inline constexpr double kAbsoluteTolerance = 1.0e-4;
inline constexpr double kRelativeTolerance = 2.0e-5;
inline constexpr std::size_t kNoMismatch =
    std::numeric_limits<std::size_t>::max();

inline bool checked_product(
    std::size_t first,
    std::size_t second,
    std::size_t* product) noexcept {
  if (product == nullptr || first == 0U || second == 0U ||
      first > std::numeric_limits<std::size_t>::max() / second) {
    return false;
  }
  *product = first * second;
  return true;
}

inline bool matrix_counts(
    GemmShape shape,
    std::size_t* a_count,
    std::size_t* b_count,
    std::size_t* c_count) noexcept {
  return checked_product(shape.m, shape.k, a_count) &&
      checked_product(shape.k, shape.n, b_count) &&
      checked_product(shape.m, shape.n, c_count);
}

inline const Fixture* find_fixture(std::string_view fixture_id) noexcept {
  for (const Fixture& fixture : kFixtures) {
    if (fixture.id == fixture_id) return &fixture;
  }
  return nullptr;
}

inline bool make_fixture(
    std::string_view fixture_id,
    float* a,
    std::size_t a_count,
    float* b,
    std::size_t b_count,
    float* c,
    std::size_t c_count) noexcept {
  const Fixture* fixture = find_fixture(fixture_id);
  std::size_t expected_a = 0U;
  std::size_t expected_b = 0U;
  std::size_t expected_c = 0U;
  if (fixture == nullptr || a == nullptr || b == nullptr || c == nullptr ||
      !matrix_counts(fixture->shape, &expected_a, &expected_b, &expected_c) ||
      a_count != expected_a || b_count != expected_b || c_count != expected_c) {
    return false;
  }

  if (fixture->id == "2x3x2-hand") {
    for (std::size_t index = 0U; index < a_count; ++index) {
      a[index] = static_cast<float>(index + 1U);
    }
    for (std::size_t index = 0U; index < b_count; ++index) {
      b[index] = static_cast<float>(index + 1U);
    }
    for (std::size_t index = 0U; index < c_count; ++index) c[index] = 0.0F;
    return true;
  }

  for (std::size_t index = 0U; index < a_count; ++index) {
    a[index] = static_cast<float>(static_cast<int>(index % 7U) - 3) / 8.0F;
  }
  for (std::size_t index = 0U; index < b_count; ++index) {
    b[index] = static_cast<float>(static_cast<int>(index % 5U) - 2) / 7.0F;
  }
  for (std::size_t index = 0U; index < c_count; ++index) {
    c[index] = static_cast<float>(static_cast<int>(index % 3U) - 1) / 5.0F;
  }
  return true;
}

inline bool gemm_reference(
    const float* a,
    std::size_t a_count,
    const float* b,
    std::size_t b_count,
    const float* c,
    std::size_t c_count,
    GemmShape shape,
    float alpha,
    float beta,
    double* output,
    std::size_t output_count) noexcept {
  std::size_t expected_a = 0U;
  std::size_t expected_b = 0U;
  std::size_t expected_c = 0U;
  if (a == nullptr || b == nullptr || c == nullptr || output == nullptr ||
      !std::isfinite(alpha) || !std::isfinite(beta) ||
      !matrix_counts(shape, &expected_a, &expected_b, &expected_c) ||
      a_count != expected_a || b_count != expected_b ||
      c_count != expected_c || output_count != expected_c) {
    return false;
  }

  for (std::size_t row = 0U; row < shape.m; ++row) {
    for (std::size_t column = 0U; column < shape.n; ++column) {
      double sum = 0.0;
      for (std::size_t p = 0U; p < shape.k; ++p) {
        const float left = a[row * shape.k + p];
        const float right = b[p * shape.n + column];
        if (!std::isfinite(left) || !std::isfinite(right)) return false;
        sum += static_cast<double>(left) * static_cast<double>(right);
      }
      const float initial = c[row * shape.n + column];
      if (!std::isfinite(initial)) return false;
      output[row * shape.n + column] =
          static_cast<double>(alpha) * sum + static_cast<double>(beta) * initial;
    }
  }
  return true;
}

struct VerificationResult {
  bool valid;
  bool matches;
  std::size_t mismatch_index;
  std::size_t row;
  std::size_t column;
  double reference;
  double candidate;
  double absolute_error;
  double allowed_error;
};

inline VerificationResult verify_tolerance(
    const double* expected,
    std::size_t expected_count,
    const float* actual,
    std::size_t actual_count,
    std::size_t rows,
    std::size_t columns,
    double atol,
    double rtol) noexcept {
  std::size_t shape_count = 0U;
  const VerificationResult invalid{
      false, false, kNoMismatch, kNoMismatch, kNoMismatch, 0.0, 0.0, 0.0, 0.0};
  if (expected == nullptr || actual == nullptr || !std::isfinite(atol) ||
      !std::isfinite(rtol) || atol < 0.0 || rtol < 0.0 ||
      !checked_product(rows, columns, &shape_count) ||
      expected_count != shape_count || actual_count != shape_count) {
    return invalid;
  }

  for (std::size_t index = 0U; index < shape_count; ++index) {
    const double reference = expected[index];
    const double candidate = static_cast<double>(actual[index]);
    if (!std::isfinite(reference) || !std::isfinite(candidate)) return invalid;
    const double absolute_error = std::abs(candidate - reference);
    const double allowed_error = atol + rtol * std::abs(reference);
    if (absolute_error > allowed_error) {
      return {
          true,
          false,
          index,
          index / columns,
          index % columns,
          reference,
          candidate,
          absolute_error,
          allowed_error,
      };
    }
  }
  return {true, true, kNoMismatch, kNoMismatch, kNoMismatch, 0.0, 0.0, 0.0, 0.0};
}
// [ex15-cpu-reference-end]

}  // namespace ex15

#endif  // CUDA_LEARNING_SITE_EX15_TILED_GEMM_REFERENCE_HPP_
