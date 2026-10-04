// SPDX-License-Identifier: Apache-2.0
#pragma once
#include <cstddef>
#include <stdexcept>
#include <string_view>
#include <vector>

namespace ex25 {
constexpr int tile_elements = 256;
constexpr int guard_elements = 4;
constexpr int sentinel = 0x13579;
// [ex25-dispatch-start]
// Explicit reviewed sets, not a numeric >= test or a product-name match.
inline bool eligible(std::string_view target, int cc) {
  if (target == "90") return cc == 90;
  if (target == "100f") return cc == 100 || cc == 103;
  if (target == "103f") return cc == 103;
  if (target == "110f") return cc == 110;
  if (target == "120f") return cc == 120 || cc == 121;
  if (target == "121f") return cc == 121;
  return false; // 10.7 is documented, but outside this 13.3.1 build profile.
}
inline bool select_specialized(std::string_view mode, std::string_view target, int cc) {
  if (mode != "auto" && mode != "portable" && mode != "specialized")
    throw std::invalid_argument("mode must be auto, portable or specialized");
  const bool admitted = eligible(target, cc);
  if (mode == "specialized" && !admitted)
    throw std::runtime_error("requested specialization is not admitted; no launch");
  return mode != "portable" && admitted;
}
// [ex25-dispatch-end]
// [ex25-oracle-start]
inline int input_value(std::size_t i, int pattern) {
  if (pattern == 0) return static_cast<int>(i % 251) - 125;
  if (pattern == 1) return 0;
  return i % 2 ? -100000 : 100000;
}
inline bool correct(const std::vector<int>& output, std::size_t count, int pattern) {
  if (output.size() != count + 2 * guard_elements) return false;
  for (std::size_t i = 0; i < output.size(); ++i) {
    const int expected = i < guard_elements || i >= count + guard_elements
      ? sentinel : input_value(i - guard_elements, pattern);
    if (output[i] != expected) return false;
  }
  return true;
}
// [ex25-oracle-end]
}
