# SPDX-License-Identifier: Apache-2.0
"""Original bounded query-outer forward attention; no upstream tutorial code copied."""
import triton
import triton.language as tl
from contract import BM, BN, WARPS, STAGES


@triton.jit
def attention_forward(Q, K, V, O, N: tl.constexpr, D: tl.constexpr,
                      CAUSAL: tl.constexpr, BM: tl.constexpr, BN: tl.constexpr):
    rows = tl.program_id(0)*BM + tl.arange(0, BM)
    cols = tl.arange(0, BN)
    dims = tl.arange(0, D)
    base = tl.program_id(1)*N*D
    query = tl.load(Q + base + rows[:, None]*D + dims[None, :], rows[:, None] < N, 0)
    maximum = tl.full((BM,), -float('inf'), tl.float32)
    total = tl.zeros((BM,), tl.float32)
    accumulator = tl.zeros((BM, D), tl.float32)
    for start in range(tl.cdiv(N, BN)):
        keys = start*BN + cols
        key = tl.load(K + base + dims[:, None] + keys[None, :]*D, keys[None, :] < N, 0)
        value = tl.load(V + base + keys[:, None]*D + dims[None, :], keys[:, None] < N, 0)
        score = tl.dot(query, key) * (D ** -0.5)
        valid = keys[None, :] < N
        if CAUSAL:
            valid = valid & (keys[None, :] <= rows[:, None])
        score = tl.where(valid, score, -float('inf'))
        merged = tl.maximum(maximum, tl.max(score, 1))
        correction = tl.exp(maximum-merged)
        weights = tl.exp(score-merged[:, None])
        total = correction*total + tl.sum(weights, 1)
        accumulator = accumulator*correction[:, None]
        accumulator = tl.dot(weights.to(tl.float16), value, accumulator)
        maximum = merged
    tl.store(O + base + rows[:, None]*D + dims[None, :],
             (accumulator/total[:, None]).to(tl.float16), rows[:, None] < N)


def launch(q, k, v, output, causal):
    """Unchecked launch for already validated inputs and caller-owned output."""
    b, h, n, d = q.shape
    attention_forward[(triton.cdiv(n, BM), b*h)](q, k, v, output, n, d, causal, BM, BN,
                                                num_warps=WARPS, num_stages=STAGES)
    return output


def attention(q, k, v, causal=False):
    """Eager inference adapter. Validation synchronizes; exclude it from kernel timing."""
    import torch
    from contract import validate_shape
    validate_shape(tuple(q.shape))
    if type(causal) is not bool:
        raise ValueError('causal must be boolean')
    for x in (q, k, v):
        if (x.shape != q.shape or x.device != q.device or x.dtype != torch.float16
                or not x.is_cuda or not x.is_contiguous() or x.requires_grad):
            raise ValueError('equal contiguous CUDA FP16 tensors on one device, no gradients required')
        if not torch.isfinite(x).all().item() or x.abs().max().item() > 4:
            raise ValueError('finite inputs with magnitude <= 4 required')
    if torch.version.hip is not None or torch.cuda.get_device_capability(q.device) < (8, 0):
        raise ValueError('NVIDIA CC >= 8.0 required')
    output = torch.empty_like(q)
    with torch.cuda.device(q.device):
        launch(q, k, v, output, causal)
    return output
