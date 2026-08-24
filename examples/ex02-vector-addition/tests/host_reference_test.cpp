// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <iostream>

#include "vector_add_reference.hpp"

int main() {
  constexpr std::array<float, 5> left{-4.0F, -1.5F, 0.0F, 2.25F, 1000.0F};
  constexpr std::array<float, 5> right{1.0F, 2.5F, 0.0F, -0.25F, 0.5F};
  constexpr std::array<float, 5> expected{-3.0F, 1.0F, 0.0F, 2.0F, 1000.5F};
  std::array<float, 5> actual{};

  ex02::vector_add_cpu(left.data(), right.data(), actual.data(), actual.size());
  const ex02::ComparisonResult exact =
      ex02::compare_vectors(expected.data(), actual.data(), actual.size());
  if (!exact.passed || exact.maximum_absolute_error != 0.0F) return 1;

  actual[3] += ex02::kAbsoluteTolerance * 0.5F;
  if (!ex02::compare_vectors(expected.data(), actual.data(), actual.size()).passed) return 1;

  actual[3] += ex02::kAbsoluteTolerance * 10.0F;
  const ex02::ComparisonResult mismatch =
      ex02::compare_vectors(expected.data(), actual.data(), actual.size());
  if (mismatch.passed || mismatch.mismatch_index != 3U) return 1;

  if (!ex02::nearly_equal(1000.0F, 1000.005F)) return 1;
  if (ex02::nearly_equal(1.0F, 1.01F)) return 1;

  std::cout << "host-reference: pass\n";
  return 0;
}
