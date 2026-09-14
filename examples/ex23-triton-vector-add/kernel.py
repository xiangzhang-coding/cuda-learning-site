# SPDX-License-Identifier: Apache-2.0
"""Original EX23 block-value addition; no allocation or driver access at import."""
# [ex23-imports-start]
import triton
import triton.language as tl
# [ex23-imports-end]


# [ex23-kernel-start]
@triton.jit
def add_tiles(left, right, result, count, TILE: tl.constexpr):
    indices = tl.program_id(0) * TILE + tl.arange(0, TILE)
    valid = indices < count
    lhs = tl.load(left + indices, mask=valid, other=0.0)
    rhs = tl.load(right + indices, mask=valid, other=0.0)
    tl.store(result + indices, lhs + rhs, mask=valid)
# [ex23-kernel-end]
