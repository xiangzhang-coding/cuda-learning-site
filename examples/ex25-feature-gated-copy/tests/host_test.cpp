// SPDX-License-Identifier: Apache-2.0
#include "contract.hpp"
#include <cassert>
#include <iostream>
int main() {
  using namespace ex25;
  assert(eligible("100f", 100) && eligible("100f", 103));
  assert(!eligible("100f", 107) && !eligible("100f", 110) && !eligible("100f", 120));
  assert(!eligible("103f", 100) && eligible("103f", 103));
  assert(eligible("110f", 110) && !eligible("110f", 120));
  assert(eligible("120f", 121) && !eligible("121f", 120));
  assert(eligible("121f", 121) && eligible("90", 90) && !eligible("90", 100));
  assert(!eligible("unknown", 100) && !eligible("portable", 100));
  assert(!select_specialized("portable", "100f", 100));
  assert(!select_specialized("auto", "100f", 120));
  assert(select_specialized("auto", "100f", 103));
  bool threw = false;
  try { select_specialized("specialized", "100f", 120); } catch (const std::runtime_error&) { threw = true; }
  assert(threw);
  threw = false;
  try { select_specialized("typo", "100f", 100); } catch (const std::invalid_argument&) { threw = true; }
  assert(threw);
  assert(input_value(0, 0) == -125 && input_value(250, 0) == 125 && input_value(251, 0) == -125);
  for (int pattern = 0; pattern < 3; ++pattern) {
    std::vector<int> output(264, sentinel);
    for (int i = 0; i < 256; ++i) output[i + 4] = pattern == 0 ? i % 251 - 125 : pattern == 1 ? 0 : i % 2 ? -100000 : 100000;
    assert(correct(output, 256, pattern));
    for (std::size_t i = 0; i < output.size(); ++i) {
      ++output[i]; assert(!correct(output, 256, pattern)); --output[i];
    }
    output.pop_back(); assert(!correct(output, 256, pattern));
  }
  std::cout << "Host dispatch/oracle tests passed; no GPU execution\n";
}
