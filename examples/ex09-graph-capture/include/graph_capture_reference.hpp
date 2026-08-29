// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX09_GRAPH_CAPTURE_REFERENCE_HPP_
#define CUDA_LEARNING_SITE_EX09_GRAPH_CAPTURE_REFERENCE_HPP_

#include <array>
#include <cstddef>
#include <cstdint>

namespace ex09 {

// [ex09-graph-contract-start]
inline constexpr std::size_t kElementCount = 8U;
inline constexpr std::size_t kReplayIterations = 3U;
inline constexpr std::size_t kMaximumReplayIterations = 16U;

enum class GraphNode : std::uint8_t {
  kAccumulateInput = 0U,
  kAffineTransform = 1U,
};

struct GraphEdge {
  GraphNode from;
  GraphNode to;
};

inline constexpr std::array<GraphNode, 2> kGraphNodes{{
    GraphNode::kAccumulateInput,
    GraphNode::kAffineTransform,
}};
inline constexpr std::array<GraphEdge, 1> kGraphEdges{{
    {GraphNode::kAccumulateInput, GraphNode::kAffineTransform},
}};
inline constexpr std::array<GraphNode, 2> kTopologicalOrder{{
    GraphNode::kAccumulateInput,
    GraphNode::kAffineTransform,
}};

inline constexpr bool is_known_node(GraphNode node) noexcept {
  return node == GraphNode::kAccumulateInput ||
      node == GraphNode::kAffineTransform;
}

inline bool contains_node(
    const GraphNode* nodes,
    std::size_t node_count,
    GraphNode candidate) noexcept {
  for (std::size_t index = 0U; index < node_count; ++index) {
    if (nodes[index] == candidate) return true;
  }
  return false;
}

inline bool validate_topological_contract(
    const GraphNode* nodes,
    std::size_t node_count,
    const GraphEdge* edges,
    std::size_t edge_count,
    const GraphNode* order,
    std::size_t order_count) noexcept {
  if (nodes == nullptr || order == nullptr || node_count == 0U ||
      node_count > kGraphNodes.size() || order_count != node_count ||
      (edge_count > 0U && edges == nullptr) ||
      edge_count > node_count * node_count) {
    return false;
  }

  for (std::size_t index = 0U; index < node_count; ++index) {
    if (!is_known_node(nodes[index])) return false;
    for (std::size_t previous = 0U; previous < index; ++previous) {
      if (nodes[previous] == nodes[index]) return false;
    }
  }

  for (std::size_t index = 0U; index < order_count; ++index) {
    if (!is_known_node(order[index]) ||
        !contains_node(nodes, node_count, order[index])) {
      return false;
    }
    for (std::size_t previous = 0U; previous < index; ++previous) {
      if (order[previous] == order[index]) return false;
    }
  }

  for (std::size_t edge_index = 0U; edge_index < edge_count; ++edge_index) {
    const GraphEdge& edge = edges[edge_index];
    if (!is_known_node(edge.from) || !is_known_node(edge.to) ||
        !contains_node(nodes, node_count, edge.from) ||
        !contains_node(nodes, node_count, edge.to) || edge.from == edge.to) {
      return false;
    }
    for (std::size_t previous = 0U; previous < edge_index; ++previous) {
      if (edges[previous].from == edge.from && edges[previous].to == edge.to) {
        return false;
      }
    }

    std::size_t from_position = order_count;
    std::size_t to_position = order_count;
    for (std::size_t position = 0U; position < order_count; ++position) {
      if (order[position] == edge.from) from_position = position;
      if (order[position] == edge.to) to_position = position;
    }
    if (from_position >= to_position) return false;
  }

  return true;
}

inline bool validate_fixed_graph_contract() noexcept {
  return validate_topological_contract(
      kGraphNodes.data(),
      kGraphNodes.size(),
      kGraphEdges.data(),
      kGraphEdges.size(),
      kTopologicalOrder.data(),
      kTopologicalOrder.size());
}

inline constexpr std::uint32_t deterministic_input_value(
    std::size_t index) noexcept {
  return static_cast<std::uint32_t>(index + 1U);
}

inline bool write_deterministic_input(
    std::uint32_t* input,
    std::size_t input_count) noexcept {
  if (input == nullptr || input_count != kElementCount) return false;
  for (std::size_t index = 0U; index < input_count; ++index) {
    input[index] = deterministic_input_value(index);
  }
  return true;
}

inline bool replay_reference(
    const std::uint32_t* input,
    std::size_t input_count,
    std::uint32_t* output,
    std::size_t output_count,
    std::size_t replay_iterations) noexcept {
  if (input == nullptr || output == nullptr || input_count != kElementCount ||
      output_count != kElementCount || replay_iterations == 0U ||
      replay_iterations > kMaximumReplayIterations) {
    return false;
  }

  std::array<std::uint32_t, kElementCount> state{};
  for (std::size_t iteration = 0U; iteration < replay_iterations; ++iteration) {
    for (std::size_t index = 0U; index < state.size(); ++index) {
      state[index] += input[index];
    }
    for (std::size_t index = 0U; index < state.size(); ++index) {
      state[index] = 2U * state[index] + 1U;
    }
  }

  for (std::size_t index = 0U; index < state.size(); ++index) {
    output[index] = state[index];
  }
  return true;
}

struct VerificationResult {
  bool matches;
  std::size_t mismatch_index;
  std::uint32_t expected;
  std::uint32_t actual;
};

inline VerificationResult verify_exact(
    const std::uint32_t* expected,
    const std::uint32_t* actual,
    std::size_t count) noexcept {
  if (count > 0U && (expected == nullptr || actual == nullptr)) {
    return {false, 0U, 0U, 0U};
  }
  for (std::size_t index = 0U; index < count; ++index) {
    if (expected[index] != actual[index]) {
      return {false, index, expected[index], actual[index]};
    }
  }
  return {true, count, 0U, 0U};
}
// [ex09-graph-contract-end]

}  // namespace ex09

#endif  // CUDA_LEARNING_SITE_EX09_GRAPH_CAPTURE_REFERENCE_HPP_
