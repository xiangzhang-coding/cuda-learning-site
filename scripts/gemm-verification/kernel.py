# SPDX-License-Identifier: Apache-2.0
"""Original LAB16 contiguous FP16 GEMM; one program owns one output tile."""
import triton
import triton.language as tl


@triton.jit
def blocked_product(left, right, output, M: tl.constexpr, N: tl.constexpr, K: tl.constexpr,
                    BM: tl.constexpr, BN: tl.constexpr, BK: tl.constexpr):
    rows = tl.program_id(0) * BM + tl.arange(0, BM)
    columns = tl.program_id(1) * BN + tl.arange(0, BN)
    reduction = tl.arange(0, BK)
    accumulator = tl.zeros((BM, BN), tl.float32)
    for start in range(tl.cdiv(K, BK)):
        inner = start * BK + reduction
        a = tl.load(left + rows[:, None] * K + inner[None, :],
                    mask=(rows[:, None] < M) & (inner[None, :] < K), other=0.0)
        b = tl.load(right + inner[:, None] * N + columns[None, :],
                    mask=(inner[:, None] < K) & (columns[None, :] < N), other=0.0)
        accumulator = tl.dot(a, b, accumulator)
    tl.store(output + rows[:, None] * N + columns[None, :], accumulator.to(tl.float16),
             mask=(rows[:, None] < M) & (columns[None, :] < N))
