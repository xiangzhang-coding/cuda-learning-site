# SPDX-License-Identifier: Apache-2.0
"""Original LAB15 kernel: one program per row, finite contiguous FP32 only."""
import triton
import triton.language as tl


@triton.jit
def normalize_rows(source, destination, WIDTH: tl.constexpr, TILE: tl.constexpr):
    tl.static_assert(WIDTH > 0 and WIDTH <= TILE and TILE <= 2048)
    row = tl.program_id(0)
    columns = tl.arange(0, TILE)
    valid = columns < WIDTH
    logits = tl.load(source + row * WIDTH + columns, mask=valid, other=-float('inf'))
    shifted = logits.to(tl.float32) - tl.max(logits, axis=0)
    weights = tl.exp(shifted)
    probabilities = weights / tl.sum(weights, axis=0)
    tl.store(destination + row * WIDTH + columns, probabilities, mask=valid)
