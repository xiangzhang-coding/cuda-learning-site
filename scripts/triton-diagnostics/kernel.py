# SPDX-License-Identifier: Apache-2.0
"""Original bounded diagnostic fixture; the extra element is allocated storage."""
import triton
import triton.language as tl


@triton.jit
def increment_fixture(source, target, N: tl.constexpr, BLOCK: tl.constexpr,
                      BROKEN: tl.constexpr, PRINT: tl.constexpr, ASSERT: tl.constexpr):
    tl.static_assert(BLOCK > 0 and (BLOCK & (BLOCK - 1)) == 0, 'power-of-two block required')
    offsets = tl.program_id(0) * BLOCK + tl.arange(0, BLOCK)
    valid = offsets <= N if BROKEN else offsets < N
    if PRINT:
        tl.static_print('block', BLOCK)
        tl.device_print('offset', offsets)
    if ASSERT:
        tl.device_assert((~valid) | (offsets < N), 'logical extent exceeded')
    values = tl.load(source + offsets, mask=valid, other=0)
    tl.store(target + offsets, values + 1, mask=valid)
