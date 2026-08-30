// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "tiled_transpose_reference.hpp"

namespace {

// [ex14-tiled-transpose-start]
constexpr unsigned int TILE_DIM = 32U;
constexpr unsigned int BLOCK_ROWS = 8U;

__global__ void tiled_transpose(
    const float* input,
    float* output,
    std::size_t rows,
    std::size_t columns) {
  __shared__ float tile[32][33];

  const std::size_t input_column =
      static_cast<std::size_t>(blockIdx.x) * TILE_DIM + threadIdx.x;
  const std::size_t input_row_base =
      static_cast<std::size_t>(blockIdx.y) * TILE_DIM + threadIdx.y;

  for (unsigned int offset = 0U; offset < TILE_DIM; offset += BLOCK_ROWS) {
    const std::size_t input_row = input_row_base + offset;
    if (input_row < rows && input_column < columns) {
      tile[threadIdx.y + offset][threadIdx.x] =
          input[input_row * columns + input_column];
    }
  }

  __syncthreads();

  const std::size_t output_column =
      static_cast<std::size_t>(blockIdx.y) * TILE_DIM + threadIdx.x;
  const std::size_t output_row_base =
      static_cast<std::size_t>(blockIdx.x) * TILE_DIM + threadIdx.y;

  for (unsigned int offset = 0U; offset < TILE_DIM; offset += BLOCK_ROWS) {
    const std::size_t output_row = output_row_base + offset;
    if (output_row < columns && output_column < rows) {
      output[output_row * rows + output_column] =
          tile[threadIdx.x][threadIdx.y + offset];
    }
  }
}
// [ex14-tiled-transpose-end]

bool cuda_ok(cudaError_t status) noexcept {
  return status == cudaSuccess;
}

bool run_fixture(const ex14::Fixture& fixture) {
  std::size_t element_count = 0U;
  ex14::MatrixShape output_shape{};
  if (!ex14::checked_element_count(fixture.input_shape, &element_count) ||
      !ex14::transposed_shape(fixture.input_shape, &output_shape)) {
    return false;
  }

  std::vector<float> input(element_count);
  std::vector<float> expected(element_count);
  std::vector<float> actual(element_count, 0.0F);
  if (!ex14::make_fixture(fixture.id, input.data(), input.size()) ||
      !ex14::transpose_reference(
          input.data(),
          input.size(),
          fixture.input_shape,
          expected.data(),
          expected.size(),
          output_shape) ||
      output_shape != ex14::MatrixShape{
                          fixture.input_shape.columns,
                          fixture.input_shape.rows}) {
    return false;
  }

  float* device_input = nullptr;
  float* device_output = nullptr;
  const std::size_t bytes = element_count * sizeof(float);
  bool ok = cuda_ok(cudaMalloc(
      reinterpret_cast<void**>(&device_input), bytes));
  if (ok) {
    ok = cuda_ok(cudaMalloc(
        reinterpret_cast<void**>(&device_output), bytes));
  }
  if (ok) {
    ok = cuda_ok(cudaMemcpy(
        device_input, input.data(), bytes, cudaMemcpyHostToDevice));
  }

  if (ok) {
    const dim3 block(TILE_DIM, BLOCK_ROWS);
    const dim3 grid(
        static_cast<unsigned int>(
            (fixture.input_shape.columns + TILE_DIM - 1U) / TILE_DIM),
        static_cast<unsigned int>(
            (fixture.input_shape.rows + TILE_DIM - 1U) / TILE_DIM));
    tiled_transpose<<<grid, block>>>(
        device_input,
        device_output,
        fixture.input_shape.rows,
        fixture.input_shape.columns);
    ok = cuda_ok(cudaGetLastError());
  }
  if (ok) ok = cuda_ok(cudaDeviceSynchronize());
  if (ok) {
    ok = cuda_ok(cudaMemcpy(
        actual.data(), device_output, bytes, cudaMemcpyDeviceToHost));
  }

  const ex14::VerificationResult verification = ex14::verify_exact(
      expected.data(),
      expected.size(),
      actual.data(),
      actual.size(),
      output_shape);

  if (device_output != nullptr) {
    ok = cuda_ok(cudaFree(device_output)) && ok;
  }
  if (device_input != nullptr) {
    ok = cuda_ok(cudaFree(device_input)) && ok;
  }
  return ok && verification.valid && verification.matches;
}

}  // namespace

int main() {
  bool all_match = true;
  for (const ex14::Fixture& fixture : ex14::kFixtures) {
    const bool fixture_matches = run_fixture(fixture);
    all_match = fixture_matches && all_match;
  }

  std::cout << "correctness=" << (all_match ? "PASS" : "FAIL") << '\n';
  return all_match ? EXIT_SUCCESS : EXIT_FAILURE;
}
