// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <limits>
#include <string_view>
#include <vector>

#include "cub_device_reduction_scan_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  static_assert(ex17::kElementCount == 4099U);
  static_assert(ex17::kMaximumScanInputValue == 7U);
  static_assert(ex17::kMaximumPossibleScanTotal == 28693U);
  static_assert(ex17::kDeterministicScanTotal == 16390U);

  std::vector<float> reduction_input(ex17::kElementCount);
  std::vector<float> repeated_reduction_input(ex17::kElementCount);
  if (!require(
          ex17::initialize_reduction_input(
              reduction_input.data(), reduction_input.size()) &&
              ex17::initialize_reduction_input(
                  repeated_reduction_input.data(),
                  repeated_reduction_input.size()) &&
              reduction_input == repeated_reduction_input,
          "the fixed 4,099-float reduction workload is deterministic")) {
    return 1;
  }

  for (std::size_t index = 0U; index < reduction_input.size(); ++index) {
    const int centered =
        static_cast<int>((index * 37U + 11U) % 101U) - 50;
    const float independent_value =
        static_cast<float>(centered) * 0.125F +
        static_cast<float>((index * 13U + 3U) % 17U) * 0.001F;
    if (!require(
            reduction_input[index] == independent_value,
            "every reduction input matches the EX11 formula")) {
      return 1;
    }
  }
  if (!require(
          reduction_input.front() == -4.872F &&
              reduction_input[4096U] == 1.632F &&
              reduction_input.back() == -1.734F,
          "fixed reduction boundary values remain unchanged")) {
    return 1;
  }

  const double reference =
      ex17::cpu_reference_sum(reduction_input.data(), reduction_input.size());
  long double independent_total = 0.0L;
  for (float value : reduction_input) {
    independent_total += static_cast<long double>(value);
  }
  if (!require(
          reference == 33.04498379607685 &&
              reference == static_cast<double>(independent_total),
          "double CPU oracle matches the fixed workload and wider accumulation")) {
    return 1;
  }
  if (!require(
          ex17::compare_reduction_sum(reference, static_cast<float>(reference)).matches,
          "default absolute-plus-relative comparator accepts the rounded oracle")) {
    return 1;
  }

  const ex17::SumComparison absolute_boundary =
      ex17::compare_reduction_sum(0.0, 0.5F, 0.5, 0.0);
  if (!require(
          absolute_boundary.matches &&
              absolute_boundary.absolute_error == absolute_boundary.allowed_error,
          "comparator accepts an exact absolute-tolerance boundary")) {
    return 1;
  }
  if (!require(
          !ex17::compare_reduction_sum(
               0.0, std::nextafter(0.5F, 1.0F), 0.5, 0.0).matches,
          "comparator rejects the first float outside the absolute boundary")) {
    return 1;
  }

  constexpr double kRelativeBoundary = 1.0 / 2048.0;
  const ex17::SumComparison relative_boundary =
      ex17::compare_reduction_sum(1024.0, 1024.5F, 0.0, kRelativeBoundary);
  if (!require(
          relative_boundary.matches &&
              relative_boundary.absolute_error == relative_boundary.allowed_error,
          "comparator accepts an exact relative-tolerance boundary")) {
    return 1;
  }
  if (!require(
          !ex17::compare_reduction_sum(
               1024.0,
               std::nextafter(1024.5F, std::numeric_limits<float>::infinity()),
               0.0,
               kRelativeBoundary).matches,
          "comparator rejects the first float outside the relative boundary")) {
    return 1;
  }
  if (!require(
          !ex17::compare_reduction_sum(
               std::numeric_limits<double>::quiet_NaN(), 0.0F).matches,
          "comparator rejects a non-finite oracle")) {
    return 1;
  }

  std::vector<std::uint32_t> scan_input(ex17::kElementCount);
  if (!require(
          ex17::initialize_bounded_scan_input(
              scan_input.data(), scan_input.size()),
          "bounded uint32 scan input initializes")) {
    return 1;
  }
  for (std::size_t index = 0U; index < scan_input.size(); ++index) {
    if (!require(
            scan_input[index] ==
                1U + static_cast<std::uint32_t>(index % 7U),
            "every scan input remains in the independent 1-through-7 fixture")) {
      return 1;
    }
  }

  std::vector<std::uint32_t> inclusive(scan_input.size());
  std::vector<std::uint32_t> exclusive(scan_input.size());
  if (!require(
          ex17::inclusive_scan_reference(
              scan_input.data(),
              scan_input.size(),
              inclusive.data(),
              inclusive.size(),
              scan_input.size()),
          "independent inclusive CPU reference succeeds") ||
      !require(
          ex17::exclusive_scan_reference(
              scan_input.data(),
              scan_input.size(),
              exclusive.data(),
              exclusive.size(),
              scan_input.size()),
          "independent exclusive CPU reference succeeds")) {
    return 1;
  }

  std::vector<std::uint32_t> manual_inclusive(scan_input.size());
  std::vector<std::uint32_t> manual_exclusive(scan_input.size());
  std::uint32_t manual_total = 0U;
  for (std::size_t index = 0U; index < scan_input.size(); ++index) {
    manual_exclusive[index] = manual_total;
    manual_total += scan_input[index];
    manual_inclusive[index] = manual_total;
  }
  if (!require(
          ex17::compare_exact(
              manual_inclusive.data(), inclusive.data(), inclusive.size()).matches,
          "inclusive reference is exact") ||
      !require(
          ex17::compare_exact(
              manual_exclusive.data(), exclusive.data(), exclusive.size()).matches,
          "exclusive reference is exact")) {
    return 1;
  }

  bool recurrence_holds =
      inclusive.front() == scan_input.front() && exclusive.front() == 0U;
  for (std::size_t index = 1U; index < scan_input.size(); ++index) {
    recurrence_holds = recurrence_holds &&
        inclusive[index] == inclusive[index - 1U] + scan_input[index] &&
        exclusive[index] == exclusive[index - 1U] + scan_input[index - 1U] &&
        inclusive[index] == exclusive[index] + scan_input[index];
  }
  if (!require(
          recurrence_holds,
          "exact inclusive and exclusive scan recurrence invariants hold")) {
    return 1;
  }
  if (!require(
          manual_total == ex17::kDeterministicScanTotal &&
              inclusive.back() == manual_total &&
              exclusive.back() + scan_input.back() == manual_total,
          "exact scan last-total invariants match the fixed workload")) {
    return 1;
  }

  constexpr std::array<std::uint32_t, 4> kSmallInput{3U, 1U, 4U, 1U};
  constexpr std::array<std::uint32_t, 4> kSmallInclusive{3U, 4U, 8U, 9U};
  constexpr std::array<std::uint32_t, 4> kSmallExclusive{0U, 3U, 4U, 8U};
  std::array<std::uint32_t, 4> small_inclusive{};
  std::array<std::uint32_t, 4> small_exclusive{};
  if (!require(
          ex17::inclusive_scan_reference(
              kSmallInput.data(),
              kSmallInput.size(),
              small_inclusive.data(),
              small_inclusive.size(),
              kSmallInput.size()) &&
              small_inclusive == kSmallInclusive,
          "small inclusive fixture is exact") ||
      !require(
          ex17::exclusive_scan_reference(
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
          !ex17::inclusive_scan_reference(
              kUnboundedInput.data(),
              kUnboundedInput.size(),
              untouched.data(),
              untouched.size(),
              kUnboundedInput.size()) &&
              untouched == std::array<std::uint32_t, 3>{41U, 42U, 43U},
          "out-of-bound scan input is rejected before mutation")) {
    return 1;
  }

  manual_inclusive[31U] ^= 1U;
  const ex17::ExactComparison mismatch = ex17::compare_exact(
      inclusive.data(), manual_inclusive.data(), inclusive.size());
  if (!require(
          !mismatch.matches && mismatch.mismatch_index == 31U &&
              mismatch.expected == inclusive[31U] &&
              mismatch.actual == manual_inclusive[31U],
          "exact scan comparator reports its first mismatch")) {
    return 1;
  }

  if (!require(
          ex17::initialize_reduction_input(nullptr, 0U) &&
              ex17::initialize_bounded_scan_input(nullptr, 0U) &&
              ex17::inclusive_scan_reference(nullptr, 0U, nullptr, 0U, 0U) &&
              ex17::exclusive_scan_reference(nullptr, 0U, nullptr, 0U, 0U),
          "empty reduction and scan references retain their identities")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
