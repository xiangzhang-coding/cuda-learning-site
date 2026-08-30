// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <string_view>
#include <vector>

#include "inclusive_exclusive_scan_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  static_assert(ex12::kElementCount == 4099U);
  static_assert(ex12::kMaximumPossibleTotal == 28693U);

  std::vector<std::uint32_t> input(ex12::kElementCount);
  if (!require(
          ex12::initialize_bounded_input(input.data(), input.size()),
          "bounded deterministic input initializes")) {
    return 1;
  }
  for (std::uint32_t value : input) {
    if (!require(
            value >= 1U && value <= ex12::kMaximumInputValue,
            "every input remains inside the declared bound")) {
      return 1;
    }
  }

  std::vector<std::uint32_t> inclusive(input.size(), 0U);
  std::vector<std::uint32_t> exclusive(input.size(), 0U);
  if (!require(
          ex12::inclusive_scan_reference(
              input.data(),
              input.size(),
              inclusive.data(),
              inclusive.size(),
              input.size()),
          "independent inclusive CPU reference succeeds") ||
      !require(
          ex12::exclusive_scan_reference(
              input.data(),
              input.size(),
              exclusive.data(),
              exclusive.size(),
              input.size()),
          "independent exclusive CPU reference succeeds")) {
    return 1;
  }

  std::vector<std::uint32_t> expected_inclusive(input.size());
  std::vector<std::uint32_t> expected_exclusive(input.size());
  std::uint32_t manual_total = 0U;
  for (std::size_t index = 0U; index < input.size(); ++index) {
    expected_exclusive[index] = manual_total;
    manual_total += input[index];
    expected_inclusive[index] = manual_total;
  }
  if (!require(
          ex12::verify_exact(
              expected_inclusive.data(), inclusive.data(), inclusive.size()).matches,
          "inclusive outputs match exactly") ||
      !require(
          ex12::verify_exact(
              expected_exclusive.data(), exclusive.data(), exclusive.size()).matches,
          "exclusive outputs match exactly")) {
    return 1;
  }

  bool recurrence_holds =
      inclusive.front() == input.front() && exclusive.front() == 0U;
  for (std::size_t index = 1U; index < input.size(); ++index) {
    recurrence_holds = recurrence_holds &&
        inclusive[index] == inclusive[index - 1U] + input[index] &&
        exclusive[index] == exclusive[index - 1U] + input[index - 1U] &&
        inclusive[index] == exclusive[index] + input[index];
  }
  if (!require(recurrence_holds, "exact inclusive and exclusive recurrence invariants")) {
    return 1;
  }

  std::uint32_t last_total = 0U;
  for (std::uint32_t value : input) last_total += value;
  if (!require(
          last_total == ex12::kDeterministicTotal &&
              inclusive.back() == last_total &&
              exclusive.back() + input.back() == last_total,
          "last-total invariants equal the independently accumulated total")) {
    return 1;
  }

  constexpr std::array<std::uint32_t, 4> kSmallInput{3U, 1U, 4U, 1U};
  constexpr std::array<std::uint32_t, 4> kSmallInclusive{3U, 4U, 8U, 9U};
  constexpr std::array<std::uint32_t, 4> kSmallExclusive{0U, 3U, 4U, 8U};
  std::array<std::uint32_t, 4> small_inclusive{};
  std::array<std::uint32_t, 4> small_exclusive{};
  if (!require(
          ex12::inclusive_scan_reference(
              kSmallInput.data(),
              kSmallInput.size(),
              small_inclusive.data(),
              small_inclusive.size(),
              kSmallInput.size()) &&
              small_inclusive == kSmallInclusive,
          "small inclusive fixture is exact") ||
      !require(
          ex12::exclusive_scan_reference(
              kSmallInput.data(),
              kSmallInput.size(),
              small_exclusive.data(),
              small_exclusive.size(),
              kSmallInput.size()) &&
              small_exclusive == kSmallExclusive,
          "small exclusive fixture is exact")) {
    return 1;
  }

  constexpr std::array<std::uint32_t, 3> kUnboundedInput{1U, 8U, 2U};
  std::array<std::uint32_t, 3> untouched{41U, 42U, 43U};
  if (!require(
          !ex12::inclusive_scan_reference(
              kUnboundedInput.data(),
              kUnboundedInput.size(),
              untouched.data(),
              untouched.size(),
              kUnboundedInput.size()) &&
              untouched == std::array<std::uint32_t, 3>{41U, 42U, 43U},
          "out-of-bound input is rejected before output mutation")) {
    return 1;
  }

  std::array<std::uint32_t, 4> undersized{51U, 52U, 53U, 54U};
  if (!require(
          !ex12::exclusive_scan_reference(
              kSmallInput.data(),
              kSmallInput.size(),
              undersized.data(),
              3U,
              kSmallInput.size()) &&
              undersized == std::array<std::uint32_t, 4>{51U, 52U, 53U, 54U},
          "undersized exclusive output is rejected without mutation")) {
    return 1;
  }

  expected_inclusive[23U] ^= 1U;
  const ex12::VerificationResult mismatch = ex12::verify_exact(
      inclusive.data(), expected_inclusive.data(), inclusive.size());
  if (!require(
          !mismatch.matches && mismatch.mismatch_index == 23U &&
              mismatch.expected == inclusive[23U] &&
              mismatch.actual == expected_inclusive[23U],
          "exact verifier reports the first deterministic mismatch")) {
    return 1;
  }

  if (!require(
          ex12::initialize_bounded_input(nullptr, 0U) &&
              ex12::inclusive_scan_reference(nullptr, 0U, nullptr, 0U, 0U) &&
              ex12::exclusive_scan_reference(nullptr, 0U, nullptr, 0U, 0U),
          "empty scan keeps the identity contract")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
