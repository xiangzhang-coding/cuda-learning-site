// SPDX-License-Identifier: Apache-2.0
#pragma once
#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <string>
#include <vector>

namespace ex24 {
inline int ranks(const std::string& value) {
  if (value.size() != 1 || value[0] < '2' || value[0] > '8')
    throw std::invalid_argument("rank count must be an integer from 2 to 8");
  return value[0] - '0';
}
// [ex24-oracle-start]
inline std::int32_t input(int rank, std::size_t index) {
  return 3 * (rank + 1) + static_cast<int>(index % 17) - 8;
}
inline std::int32_t expected(int count, std::size_t index) {
  if (count < 2 || count > 8) throw std::invalid_argument("rank count outside contract");
  return 3 * count * (count + 1) / 2 + count * (static_cast<int>(index % 17) - 8);
}
inline std::size_t mismatches(const std::vector<std::int32_t>& result, int count) {
  if (result.empty()) throw std::invalid_argument("empty output is not a passing run");
  std::size_t errors = 0;
  for (std::size_t i = 0; i < result.size(); ++i) errors += result[i] != expected(count, i);
  return errors;
}
// [ex24-oracle-end]
}
