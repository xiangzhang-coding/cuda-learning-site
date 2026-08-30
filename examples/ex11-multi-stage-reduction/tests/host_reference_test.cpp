// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <iostream>
#include <string_view>
#include <utility>
#include <vector>

#include "multi_stage_reduction_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

std::vector<float> staged_host_model(const std::vector<float>& input) {
  std::vector<float> current = input;
  while (current.size() > 1U) {
    const std::size_t next_count = ex11::stage_output_count(current.size());
    std::vector<float> next(next_count, 0.0F);

    for (std::size_t block = 0U; block < next_count; ++block) {
      std::array<float, ex11::kBlockSize> shared{};
      const std::size_t block_begin = block * ex11::kElementsPerBlock;
      for (std::size_t thread = 0U; thread < ex11::kBlockSize; ++thread) {
        const std::size_t first = block_begin + thread;
        const std::size_t second = first + ex11::kBlockSize;
        if (first < current.size()) shared[thread] = current[first];
        if (second < current.size()) shared[thread] += current[second];
      }
      for (std::size_t stride = ex11::kBlockSize / 2U;
           stride > 0U;
           stride /= 2U) {
        for (std::size_t thread = 0U; thread < stride; ++thread) {
          shared[thread] += shared[thread + stride];
        }
      }
      next[block] = shared[0];
    }
    current = std::move(next);
  }
  return current;
}

}  // namespace

int main() {
  if (!require(
          ex11::kElementCount == 4099U && ex11::kBlockSize == 256U &&
              ex11::kElementsPerBlock == 512U,
          "declared element and block extents are fixed")) {
    return 1;
  }

  const std::vector<std::size_t> expected_stage_sizes{4099U, 9U, 1U};
  std::vector<std::size_t> actual_stage_sizes{ex11::kElementCount};
  while (actual_stage_sizes.back() > 1U) {
    const std::size_t stage_count = actual_stage_sizes.back();
    if (!require(
            ex11::stage_makes_progress(stage_count),
            "every nonterminal stage size makes progress")) {
      return 1;
    }
    actual_stage_sizes.push_back(ex11::stage_output_count(stage_count));
  }
  if (!require(
          actual_stage_sizes == expected_stage_sizes,
          "stage size sequence is 4099 -> 9 -> 1")) {
    return 1;
  }

  std::size_t first_stage_coverage = 0U;
  const std::size_t first_stage_count =
      ex11::stage_output_count(ex11::kElementCount);
  for (std::size_t block = 0U; block < first_stage_count; ++block) {
    const std::size_t count =
        ex11::block_input_count(ex11::kElementCount, block);
    if (!require(count > 0U && count <= ex11::kElementsPerBlock,
                 "each first-stage block has a bounded nonempty extent")) {
      return 1;
    }
    first_stage_coverage += count;
  }
  if (!require(
          first_stage_coverage == ex11::kElementCount,
          "first-stage block extents cover every element exactly once")) {
    return 1;
  }

  const std::size_t partial_block_index = first_stage_count - 1U;
  const std::size_t partial_block_count =
      ex11::block_input_count(ex11::kElementCount, partial_block_index);
  if (!require(
          partial_block_index == 8U && partial_block_count == 3U &&
              partial_block_index * ex11::kElementsPerBlock == 4096U,
          "partial_block invariant leaves exactly indices 4096 through 4098")) {
    return 1;
  }
  if (!require(
          ex11::block_input_count(ex11::kElementCount, first_stage_count) == 0U,
          "out-of-range block has an empty extent")) {
    return 1;
  }

  std::vector<float> input(ex11::kElementCount);
  std::vector<float> repeated(ex11::kElementCount);
  if (!require(
          ex11::initialize_input(input.data(), input.size()) &&
              ex11::initialize_input(repeated.data(), repeated.size()) &&
              input == repeated,
          "4,099 float inputs are deterministic")) {
    return 1;
  }
  for (std::size_t index = 0U; index < input.size(); ++index) {
    const int centered =
        static_cast<int>((index * 37U + 11U) % 101U) - 50;
    const float independently_constructed =
        static_cast<float>(centered) * 0.125F +
        static_cast<float>((index * 13U + 3U) % 17U) * 0.001F;
    if (!require(
            input[index] == independently_constructed,
            "deterministic input follows the declared formula")) {
      return 1;
    }
  }

  const double reference = ex11::cpu_reference_sum(input.data(), input.size());
  long double independent_total = 0.0L;
  for (float value : input) independent_total += static_cast<long double>(value);
  if (!require(
          reference == static_cast<double>(independent_total),
          "double CPU reference matches a wider independent accumulation")) {
    return 1;
  }

  const std::vector<float> modeled = staged_host_model(input);
  if (!require(modeled.size() == 1U, "staged host model ends with one value")) {
    return 1;
  }
  const ex11::SumComparison modeled_comparison =
      ex11::compare_reduction_sum(reference, modeled[0]);
  if (!require(
          modeled_comparison.matches,
          "combined absolute and relative tolerance accepts staged float order")) {
    return 1;
  }

  if (!require(
          ex11::compare_reduction_sum(
              0.0, static_cast<float>(ex11::kAbsoluteTolerance / 2.0)).matches,
          "absolute tolerance protects a near-zero reference")) {
    return 1;
  }
  if (!require(
          ex11::compare_reduction_sum(1000.0, 1000.01F).matches,
          "relative tolerance scales for a larger reference")) {
    return 1;
  }
  if (!require(
          !ex11::compare_reduction_sum(1.0, 1.1F).matches,
          "comparator rejects an error outside both tolerance terms")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
