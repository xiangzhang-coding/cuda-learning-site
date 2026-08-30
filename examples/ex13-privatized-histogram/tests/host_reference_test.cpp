// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <string_view>

#include "privatized_histogram_reference.hpp"

namespace {

struct FixtureExpectation {
  std::string_view id;
  ex13::Histogram exact_counts;
};

constexpr std::array<FixtureExpectation, 3> kExpectations{{
    {"uniform", {{
        17U, 17U, 17U, 16U, 16U, 16U, 16U, 16U,
        16U, 16U, 16U, 16U, 16U, 16U, 16U, 16U,
    }}},
    {"skewed", {{
        17U, 0U, 0U, 0U, 0U, 0U, 0U, 226U,
        16U, 0U, 0U, 0U, 0U, 0U, 0U, 0U,
    }}},
    {"boundary", {{
        130U, 0U, 0U, 0U, 0U, 0U, 0U, 0U,
        0U, 0U, 0U, 0U, 0U, 0U, 0U, 129U,
    }}},
}};

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  if (!require(ex13::kBinCount == 16U, "the histogram has exactly 16 bins") ||
      !require(
          ex13::kFixtureIds ==
              std::array<std::string_view, 3>{{"uniform", "skewed", "boundary"}},
          "fixture IDs are exactly uniform, skewed, and boundary")) {
    return 1;
  }

  std::array<ex13::Value, ex13::kElementCount> values{};
  for (const FixtureExpectation& expectation : kExpectations) {
    if (!require(
            ex13::make_fixture(expectation.id, values.data(), values.size()),
            "each declared fixture is generated")) {
      return 1;
    }

    ex13::Histogram reference{};
    if (!require(
            ex13::histogram_reference(values.data(), values.size(), &reference),
            "the CPU reference accepts each fixture") ||
        !require(
            ex13::verify_exact(expectation.exact_counts, reference).matches,
            "exact counts match the literal fixture oracle") ||
        !require(
            ex13::sum_of_bins(reference) == ex13::kElementCount,
            "the sum-of-bins invariant equals the input count")) {
      return 1;
    }
  }

  constexpr ex13::Value kSentinel = 0xA5A5A5A5U;
  values.fill(kSentinel);
  const auto untouched_values = values;
  if (!require(
          !ex13::make_fixture("unknown", values.data(), values.size()) &&
              values == untouched_values,
          "an unknown fixture is rejected without mutation")) {
    return 1;
  }

  if (!require(
          ex13::make_fixture("uniform", values.data(), values.size()),
          "the uniform fixture is available for rejection checks")) {
    return 1;
  }
  values.back() = static_cast<ex13::Value>(ex13::kBinCount);
  ex13::Histogram rejected{};
  rejected.fill(kSentinel);
  const auto untouched_histogram = rejected;
  if (!require(
          !ex13::histogram_reference(values.data(), values.size(), &rejected) &&
              rejected == untouched_histogram,
          "an out-of-range bin is rejected without output mutation")) {
    return 1;
  }

  auto mismatched = kExpectations[0].exact_counts;
  ++mismatched[5];
  const ex13::VerificationResult mismatch =
      ex13::verify_exact(kExpectations[0].exact_counts, mismatched);
  if (!require(
          !mismatch.matches && mismatch.mismatch_bin == 5U &&
              mismatch.expected == 16U && mismatch.actual == 17U,
          "exact comparison reports the first mismatched bin")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
