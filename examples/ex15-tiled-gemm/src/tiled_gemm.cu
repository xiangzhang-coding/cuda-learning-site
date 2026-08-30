// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>

#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <vector>

#include "tiled_gemm_reference.hpp"

namespace {

// [ex15-tiled-gemm-start]
constexpr unsigned int kTileExtent = 16U;

__global__ void tiled_gemm(
    const float* a,
    const float* b,
    float* c,
    std::size_t m,
    std::size_t k,
    std::size_t n,
    float alpha,
    float beta) {
  __shared__ float tile_a[16][16];
  __shared__ float tile_b[16][16];

  const unsigned int local_row = threadIdx.y;
  const unsigned int local_column = threadIdx.x;
  const std::size_t row = static_cast<std::size_t>(blockIdx.y) * kTileExtent + local_row;
  const std::size_t column = static_cast<std::size_t>(blockIdx.x) * kTileExtent + local_column;
  float sum = 0.0F;

  for (std::size_t tile_start = 0U; tile_start < k; tile_start += kTileExtent) {
    const std::size_t a_column = tile_start + local_column;
    const std::size_t b_row = tile_start + local_row;
    tile_a[local_row][local_column] =
        (row < m && a_column < k) ? a[row * k + a_column] : 0.0F;
    tile_b[local_row][local_column] =
        (b_row < k && column < n) ? b[b_row * n + column] : 0.0F;

    __syncthreads();
    for (unsigned int p = 0U; p < kTileExtent; ++p) {
      sum += tile_a[local_row][p] * tile_b[p][local_column];
    }
    __syncthreads();
  }

  if (row < m && column < n) {
    const std::size_t output_index = row * n + column;
    c[output_index] = alpha * sum + beta * c[output_index];
  }
}
// [ex15-tiled-gemm-end]

bool cuda_ok(cudaError_t status) noexcept {
  return status == cudaSuccess;
}

bool run_fixture(const ex15::Fixture& fixture) {
  std::size_t a_count = 0U;
  std::size_t b_count = 0U;
  std::size_t c_count = 0U;
  if (!ex15::matrix_counts(fixture.shape, &a_count, &b_count, &c_count)) return false;

  std::vector<float> a(a_count);
  std::vector<float> b(b_count);
  std::vector<float> c(c_count);
  std::vector<double> expected(c_count);
  if (!ex15::make_fixture(
          fixture.id, a.data(), a.size(), b.data(), b.size(), c.data(), c.size()) ||
      !ex15::gemm_reference(
          a.data(), a.size(), b.data(), b.size(), c.data(), c.size(), fixture.shape,
          fixture.alpha, fixture.beta, expected.data(), expected.size())) {
    return false;
  }

  float* device_a = nullptr;
  float* device_b = nullptr;
  float* device_c = nullptr;
  bool ok = cuda_ok(cudaMalloc(reinterpret_cast<void**>(&device_a), a.size() * sizeof(float)));
  if (ok) ok = cuda_ok(cudaMalloc(reinterpret_cast<void**>(&device_b), b.size() * sizeof(float)));
  if (ok) ok = cuda_ok(cudaMalloc(reinterpret_cast<void**>(&device_c), c.size() * sizeof(float)));
  if (ok) ok = cuda_ok(cudaMemcpy(device_a, a.data(), a.size() * sizeof(float), cudaMemcpyHostToDevice));
  if (ok) ok = cuda_ok(cudaMemcpy(device_b, b.data(), b.size() * sizeof(float), cudaMemcpyHostToDevice));
  if (ok) ok = cuda_ok(cudaMemcpy(device_c, c.data(), c.size() * sizeof(float), cudaMemcpyHostToDevice));

  if (ok) {
    const dim3 block(kTileExtent, kTileExtent);
    const dim3 grid(
        static_cast<unsigned int>((fixture.shape.n + kTileExtent - 1U) / kTileExtent),
        static_cast<unsigned int>((fixture.shape.m + kTileExtent - 1U) / kTileExtent));
    tiled_gemm<<<grid, block>>>(
        device_a, device_b, device_c, fixture.shape.m, fixture.shape.k, fixture.shape.n,
        fixture.alpha, fixture.beta);
    ok = cuda_ok(cudaGetLastError());
  }
  if (ok) ok = cuda_ok(cudaDeviceSynchronize());
  if (ok) {
    ok = cuda_ok(cudaMemcpy(
        c.data(), device_c, c.size() * sizeof(float), cudaMemcpyDeviceToHost));
  }

  const ex15::VerificationResult verification = ex15::verify_tolerance(
      expected.data(), expected.size(), c.data(), c.size(), fixture.shape.m, fixture.shape.n,
      ex15::kAbsoluteTolerance, ex15::kRelativeTolerance);
  if (device_c != nullptr) ok = cuda_ok(cudaFree(device_c)) && ok;
  if (device_b != nullptr) ok = cuda_ok(cudaFree(device_b)) && ok;
  if (device_a != nullptr) ok = cuda_ok(cudaFree(device_a)) && ok;
  return ok && verification.valid && verification.matches;
}

}  // namespace

int main() {
  bool all_match = true;
  for (const ex15::Fixture& fixture : ex15::kFixtures) {
    const bool matches = run_fixture(fixture);
    std::cout << "fixture=" << fixture.id
              << " shape=" << fixture.shape.m << 'x' << fixture.shape.k << 'x'
              << fixture.shape.n << " correctness=" << (matches ? "PASS" : "FAIL") << '\n';
    all_match = matches && all_match;
  }
  std::cout << "result=" << (all_match ? "PASS" : "FAIL") << '\n';
  return all_match ? EXIT_SUCCESS : EXIT_FAILURE;
}
