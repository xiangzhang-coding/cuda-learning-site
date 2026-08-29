// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <string_view>

#include "graph_capture_reference.hpp"

namespace {

bool require(bool condition, std::string_view message) {
  if (condition) return true;
  std::cerr << "host-reference failure: " << message << '\n';
  return false;
}

}  // namespace

int main() {
  using ex09::GraphEdge;
  using ex09::GraphNode;

  if (!require(
          ex09::kElementCount == 8U && ex09::kReplayIterations == 3U,
          "element and replay counts are fixed")) {
    return 1;
  }
  if (!require(
          ex09::validate_fixed_graph_contract(),
          "the fixed two-node DAG satisfies its topological contract")) {
    return 1;
  }

  constexpr std::array<GraphEdge, 2> cycle{{
      {GraphNode::kAccumulateInput, GraphNode::kAffineTransform},
      {GraphNode::kAffineTransform, GraphNode::kAccumulateInput},
  }};
  constexpr std::array<GraphEdge, 1> unknown{{
      {GraphNode::kAccumulateInput, static_cast<GraphNode>(99U)},
  }};
  constexpr std::array<GraphEdge, 1> self{{
      {GraphNode::kAccumulateInput, GraphNode::kAccumulateInput},
  }};
  constexpr std::array<GraphEdge, 2> duplicate{{
      {GraphNode::kAccumulateInput, GraphNode::kAffineTransform},
      {GraphNode::kAccumulateInput, GraphNode::kAffineTransform},
  }};
  constexpr std::array<GraphNode, 2> reversed_order{{
      GraphNode::kAffineTransform,
      GraphNode::kAccumulateInput,
  }};

  const auto validates = [](const GraphEdge* edges, std::size_t edge_count,
                            const GraphNode* order, std::size_t order_count) {
    return ex09::validate_topological_contract(
        ex09::kGraphNodes.data(),
        ex09::kGraphNodes.size(),
        edges,
        edge_count,
        order,
        order_count);
  };

  if (!require(
          !validates(cycle.data(), cycle.size(),
                     ex09::kTopologicalOrder.data(), ex09::kTopologicalOrder.size()),
          "cycles are rejected")) {
    return 1;
  }
  if (!require(
          !validates(unknown.data(), unknown.size(),
                     ex09::kTopologicalOrder.data(), ex09::kTopologicalOrder.size()),
          "unknown edge endpoints are rejected")) {
    return 1;
  }
  if (!require(
          !validates(self.data(), self.size(),
                     ex09::kTopologicalOrder.data(), ex09::kTopologicalOrder.size()),
          "self-edges are rejected")) {
    return 1;
  }
  if (!require(
          !validates(duplicate.data(), duplicate.size(),
                     ex09::kTopologicalOrder.data(), ex09::kTopologicalOrder.size()),
          "duplicate edges are rejected")) {
    return 1;
  }
  if (!require(
          !validates(ex09::kGraphEdges.data(), ex09::kGraphEdges.size(),
                     reversed_order.data(), reversed_order.size()),
          "an edge-reversing order is rejected")) {
    return 1;
  }
  if (!require(
          !validates(ex09::kGraphEdges.data(), ex09::kGraphEdges.size(),
                     ex09::kTopologicalOrder.data(), 1U),
          "invalid topological-order size is rejected")) {
    return 1;
  }

  constexpr std::uint32_t kSentinel = 0xA5A5A5A5U;
  std::array<std::uint32_t, ex09::kElementCount> input{};
  input.fill(kSentinel);
  const auto untouched_input = input;
  if (!require(
          !ex09::write_deterministic_input(input.data(), input.size() - 1U) &&
              input == untouched_input,
          "invalid input size is rejected without mutation")) {
    return 1;
  }
  if (!require(
          ex09::write_deterministic_input(input.data(), input.size()),
          "deterministic input is generated")) {
    return 1;
  }
  constexpr std::array<std::uint32_t, ex09::kElementCount> literal_input{{
      1U, 2U, 3U, 4U, 5U, 6U, 7U, 8U,
  }};
  if (!require(input == literal_input, "input values match the literal contract")) {
    return 1;
  }

  std::array<std::uint32_t, ex09::kElementCount> output{};
  output.fill(kSentinel);
  const auto untouched_output = output;
  if (!require(
          !ex09::replay_reference(
              input.data(), input.size() - 1U,
              output.data(), output.size(), ex09::kReplayIterations) &&
              !ex09::replay_reference(
                  input.data(), input.size(),
                  output.data(), output.size() - 1U, ex09::kReplayIterations) &&
              !ex09::replay_reference(
                  input.data(), input.size(),
                  output.data(), output.size(), 0U) &&
              !ex09::replay_reference(
                  input.data(), input.size(),
                  output.data(), output.size(),
                  ex09::kMaximumReplayIterations + 1U) &&
              output == untouched_output,
          "invalid sizes and iterations are rejected without mutation")) {
    return 1;
  }

  if (!require(
          ex09::replay_reference(
              input.data(), input.size(),
              output.data(), output.size(), ex09::kReplayIterations),
          "the host recurrence accepts the fixed contract")) {
    return 1;
  }
  constexpr std::array<std::uint32_t, ex09::kElementCount> literal_expected{{
      21U, 35U, 49U, 63U, 77U, 91U, 105U, 119U,
  }};
  if (!require(
          output == literal_expected,
          "three replay iterations produce the literal expected result")) {
    return 1;
  }

  auto mismatched = output;
  mismatched[4] ^= 1U;
  const ex09::VerificationResult mismatch = ex09::verify_exact(
      literal_expected.data(), mismatched.data(), mismatched.size());
  if (!require(
          !mismatch.matches && mismatch.mismatch_index == 4U &&
              mismatch.expected == 77U && mismatch.actual == 76U,
          "exact verification reports a deterministic mismatch")) {
    return 1;
  }
  if (!require(
          ex09::verify_exact(
              literal_expected.data(), output.data(), output.size()).matches,
          "complete host output matches exactly")) {
    return 1;
  }

  std::cout << "host-reference: pass\n";
  return 0;
}
