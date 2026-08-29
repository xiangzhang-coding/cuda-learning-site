// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <limits>
#include <string_view>
#include <vector>

#include "unified_memory_migration_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

bool is_unchanged(const ex08::TransitionSummary& summary) {
  return summary.transition_count == 91U && summary.moved_pages == 92U &&
      summary.moved_bytes == 93U;
}

}  // namespace

int main() {
  ex08::TransitionSummary summary{91U, 92U, 93U};
  const std::array<ex08::PageAccess, 2> no_transition{{
      {0U, ex08::AccessOrigin::host},
      {1U, ex08::AccessOrigin::device},
  }};
  if (!require(
          ex08::derive_transition_ledger(
              2U,
              ex08::kPageBytes,
              no_transition.data(),
              no_transition.size(),
              nullptr,
              0U,
              summary) &&
              summary.transition_count == 0U && summary.moved_pages == 0U &&
              summary.moved_bytes == 0U,
          "first access to each page has no modeled transition")) {
    return 1;
  }

  const std::array<ex08::PageAccess, 3> repeated{{
      {0U, ex08::AccessOrigin::host},
      {0U, ex08::AccessOrigin::host},
      {0U, ex08::AccessOrigin::host},
  }};
  if (!require(
          ex08::derive_transition_ledger(
              1U,
              ex08::kPageBytes,
              repeated.data(),
              repeated.size(),
              nullptr,
              0U,
              summary) &&
              summary.transition_count == 0U,
          "repeated same-origin access adds no transition")) {
    return 1;
  }

  const std::array<ex08::PageAccess, 4> alternating{{
      {0U, ex08::AccessOrigin::host},
      {0U, ex08::AccessOrigin::device},
      {0U, ex08::AccessOrigin::host},
      {0U, ex08::AccessOrigin::device},
  }};
  std::array<ex08::Transition, 3> alternating_ledger{};
  if (!require(
          ex08::derive_transition_ledger(
              1U,
              ex08::kPageBytes,
              alternating.data(),
              alternating.size(),
              alternating_ledger.data(),
              alternating_ledger.size(),
              summary) &&
              summary.transition_count == 3U && summary.moved_pages == 3U &&
              summary.moved_bytes == 3U * ex08::kPageBytes,
          "alternating origins add one modeled transition per change")) {
    return 1;
  }
  for (std::size_t index = 0U; index < alternating_ledger.size(); ++index) {
    if (!require(
            alternating_ledger[index].access_index == index + 1U &&
                alternating_ledger[index].page == 0U &&
                alternating_ledger[index].from !=
                    alternating_ledger[index].to,
            "alternating transition ledger preserves access order")) {
      return 1;
    }
  }

  const std::array<ex08::PageAccess, 1> invalid_page{{
      {1U, ex08::AccessOrigin::host},
  }};
  summary = {91U, 92U, 93U};
  if (!require(
          !ex08::derive_transition_ledger(
              1U,
              ex08::kPageBytes,
              invalid_page.data(),
              invalid_page.size(),
              nullptr,
              0U,
              summary) &&
              is_unchanged(summary),
          "out-of-range page is rejected without summary mutation")) {
    return 1;
  }

  const std::array<ex08::PageAccess, 1> invalid_origin{{
      {0U, static_cast<ex08::AccessOrigin>(7U)},
  }};
  if (!require(
          !ex08::derive_transition_ledger(
              1U,
              ex08::kPageBytes,
              invalid_origin.data(),
              invalid_origin.size(),
              nullptr,
              0U,
              summary) &&
              is_unchanged(summary),
          "invalid access origin is rejected without summary mutation")) {
    return 1;
  }

  const std::array<ex08::PageAccess, 3> overflowing{{
      {0U, ex08::AccessOrigin::host},
      {0U, ex08::AccessOrigin::device},
      {0U, ex08::AccessOrigin::host},
  }};
  if (!require(
          !ex08::derive_transition_ledger(
              1U,
              std::numeric_limits<std::size_t>::max(),
              overflowing.data(),
              overflowing.size(),
              alternating_ledger.data(),
              alternating_ledger.size(),
              summary) &&
              is_unchanged(summary),
          "overflowing moved-byte proxy is rejected")) {
    return 1;
  }

  std::array<ex08::PageAccess, ex08::kAccessCount> declared_accesses{};
  if (!require(
          ex08::write_declared_access_sequence(
              declared_accesses.data(), declared_accesses.size()),
          "declared three-phase access sequence is generated")) {
    return 1;
  }

  std::array<ex08::Transition, ex08::kExpectedTransitionCount> ledger{};
  if (!require(
          ex08::derive_transition_ledger(
              ex08::kPageCount,
              ex08::kPageBytes,
              declared_accesses.data(),
              declared_accesses.size(),
              ledger.data(),
              ledger.size(),
              summary) &&
              summary.transition_count == 32U && summary.moved_pages == 32U &&
              summary.moved_bytes == 131072U,
          "declared access sequence has exact software proxy values")) {
    return 1;
  }
  for (std::size_t page = 0U; page < ex08::kPageCount; ++page) {
    if (!require(
            ledger[page].access_index == ex08::kPageCount + page &&
                ledger[page].page == page &&
                ledger[page].from == ex08::AccessOrigin::host &&
                ledger[page].to == ex08::AccessOrigin::device,
            "device phase follows each page's host initialization")) {
      return 1;
    }
    const ex08::Transition& host_return = ledger[ex08::kPageCount + page];
    if (!require(
            host_return.access_index == 2U * ex08::kPageCount + page &&
                host_return.page == page &&
                host_return.from == ex08::AccessOrigin::device &&
                host_return.to == ex08::AccessOrigin::host,
            "host verification phase follows each page's device phase")) {
      return 1;
    }
  }

  std::array<ex08::Transition, ex08::kExpectedTransitionCount - 1U>
      undersized_ledger{};
  for (ex08::Transition& transition : undersized_ledger) {
    transition = {71U, 72U, ex08::AccessOrigin::host, ex08::AccessOrigin::host};
  }
  summary = {91U, 92U, 93U};
  if (!require(
          !ex08::derive_transition_ledger(
              ex08::kPageCount,
              ex08::kPageBytes,
              declared_accesses.data(),
              declared_accesses.size(),
              undersized_ledger.data(),
              undersized_ledger.size(),
              summary) &&
              is_unchanged(summary),
          "undersized transition ledger is rejected")) {
    return 1;
  }
  for (const ex08::Transition& transition : undersized_ledger) {
    if (!require(
            transition.access_index == 71U && transition.page == 72U &&
                transition.from == ex08::AccessOrigin::host &&
                transition.to == ex08::AccessOrigin::host,
            "rejected ledger derivation does not mutate entries")) {
      return 1;
    }
  }

  std::vector<std::uint32_t> input(ex08::kElementCount);
  std::vector<std::uint32_t> actual(ex08::kElementCount, 0U);
  std::vector<std::uint32_t> expected(ex08::kElementCount, 0U);
  if (!require(
          ex08::initialize_input(input.data(), input.size()) &&
              ex08::transform_reference(
                  input.data(),
                  input.size(),
                  actual.data(),
                  actual.size(),
                  ex08::kElementCount),
          "complete deterministic host workload succeeds")) {
    return 1;
  }
  for (std::size_t index = 0U; index < expected.size(); ++index) {
    expected[index] =
        (29U + 11U * static_cast<std::uint32_t>(index)) ^ 0x5a5a5a5aU;
  }
  if (!require(
          ex08::verify_exact(
              expected.data(), actual.data(), expected.size()).matches,
          "complete host oracle matches independently constructed values")) {
    return 1;
  }

  std::array<std::uint32_t, 4> untouched{51U, 52U, 53U, 54U};
  if (!require(
          !ex08::transform_reference(
              input.data(), 4U, untouched.data(), 3U, 4U) &&
              untouched == std::array<std::uint32_t, 4>{51U, 52U, 53U, 54U},
          "undersized oracle destination is not mutated")) {
    return 1;
  }

  actual[23] ^= 1U;
  const ex08::VerificationResult mismatch =
      ex08::verify_exact(expected.data(), actual.data(), actual.size());
  if (!require(
          !mismatch.matches && mismatch.mismatch_index == 23U &&
              mismatch.expected == expected[23] &&
              mismatch.actual == actual[23],
          "exact verifier reports the first deterministic mismatch")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
