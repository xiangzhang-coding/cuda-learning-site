# SPDX-License-Identifier: Apache-2.0
import torch
from torch.nn.functional import pad

# [ex22-fake-start]
@torch.library.register_fake("cuda_learning::adjacent_energy")
def adjacent_energy_fake(x):
    torch._check(x.layout == torch.strided, lambda: "expected strided layout")
    torch._check(x.dim() == 1, lambda: "expected rank one")
    torch._check(x.is_contiguous(), lambda: "expected contiguous input")
    torch._check(x.dtype in (torch.float32, torch.float64),
                 lambda: "expected float32 or float64")
    torch._check(x.device.type in ("cpu", "cuda", "meta"), lambda: "unsupported device")
    torch._check(x.numel() >= 1, lambda: "expected 1 through 1000000 elements")
    torch._check(x.numel() <= 1000000, lambda: "expected 1 through 1000000 elements")
    return x.new_empty((x.shape[0] - 1,))
# [ex22-fake-end]

# [ex22-autograd-start]
def setup_context(ctx, inputs, output):
    (x,) = inputs
    ctx.save_for_backward(x)


def backward(ctx, grad_output):
    (x,) = ctx.saved_tensors
    q = 2 * (x[1:] - x[:-1]) * grad_output
    return pad(q, (1, 0)) - pad(q, (0, 1))


torch.library.register_autograd(
    "cuda_learning::adjacent_energy", backward, setup_context=setup_context
)
# [ex22-autograd-end]
