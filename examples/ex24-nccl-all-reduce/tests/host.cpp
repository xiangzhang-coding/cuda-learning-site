// SPDX-License-Identifier: Apache-2.0
#include "oracle.hpp"
#include <cassert>
#include <iostream>

int main() {
  // Independent hand-worked fixtures: rank inputs at i=0 are -5,-2,1,4.
  assert(ex24::expected(2, 0) == -7);
  assert(ex24::expected(4, 0) == -2);
  assert(ex24::expected(4, 16) == 62);
  assert(ex24::expected(8, 16) == 172);
  for (int ranks = 2; ranks <= 8; ++ranks) {
    for (std::size_t i = 0; i < 257; ++i) {
      std::int64_t sum = 0;
      for (int rank = 0; rank < ranks; ++rank) sum += ex24::input(rank, i);
      assert(sum == ex24::expected(ranks, i));
    }
  }
  std::vector<std::int32_t> result{-7, -5, -3};
  assert(ex24::mismatches(result, 2) == 0);
  for (std::size_t i = 0; i < result.size(); ++i) {
    ++result[i]; assert(ex24::mismatches(result, 2) == 1); --result[i];
  }
  for (const auto& invalid : {"", "1", "9", "02", "2x", "-2"}) {
    bool rejected = false;
    try { ex24::ranks(invalid); } catch (const std::invalid_argument&) { rejected = true; }
    assert(rejected);
  }
  bool rejected = false;
  try { ex24::mismatches({}, 2); } catch (const std::invalid_argument&) { rejected = true; }
  assert(rejected);
  std::cout << "EX24 host oracle checks passed; no CUDA execution\n";
}
