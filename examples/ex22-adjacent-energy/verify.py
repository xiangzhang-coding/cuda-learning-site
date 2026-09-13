# SPDX-License-Identifier: Apache-2.0
"""Run from an installed wheel with python -I; never silently skip CUDA mode."""
import argparse
import importlib.metadata
import json
import platform
import sys

import torch
from cuda_learning_ops import adjacent_energy

# [ex22-reference-start]
def reference(x):
    return (x[1:] - x[:-1]).square()


def literal_reference():
    x = torch.tensor([1.0, -2.0, 2.0, 2.5], dtype=torch.float64)
    expected = torch.tensor([9.0, 16.0, 0.25], dtype=torch.float64)
    torch.testing.assert_close(reference(x), expected, rtol=0, atol=0)
    return x, expected
# [ex22-reference-end]


def reject(call):
    try:
        call()
    except (RuntimeError, NotImplementedError):
        return
    raise AssertionError("invalid input unexpectedly accepted")


# [ex22-checks-start]
def check_device(device):
    literal, expected = literal_reference()
    torch.testing.assert_close(adjacent_energy(literal.to(device)).cpu(), expected,
                               rtol=0, atol=0)
    for dtype in (torch.float32, torch.float64):
        for n in (1, 2, 256, 257, 258, 1003):
            x = ((torch.arange(n, dtype=dtype, device=device) % 17) / 8).requires_grad_()
            before = x.detach().clone()
            y = adjacent_energy(x)
            assert y.shape == (n - 1,) and y.is_contiguous() and y.dtype == dtype
            assert torch.isfinite(y).all()
            torch.testing.assert_close(y, reference(x), rtol=0, atol=0)
            torch.testing.assert_close(x, before, rtol=0, atol=0)
            # A nonuniform upstream vector exposes boundary/sign errors hidden by sum().
            g = torch.arange(n - 1, dtype=dtype, device=device) / 16 + 1
            actual = torch.autograd.grad(y, x, g)[0]
            wanted = torch.autograd.grad(reference(x), x, g)[0]
            torch.testing.assert_close(actual, wanted)
            torch.library.opcheck(adjacent_energy, (x,))
    for n in (1, 4):
        x = torch.linspace(-0.7, 0.9, n, dtype=torch.float64, device=device).requires_grad_()
        assert torch.autograd.gradcheck(adjacent_energy, (x,), eps=1e-6, atol=1e-5, rtol=1e-3)
        assert torch.autograd.gradgradcheck(adjacent_energy, (x,), eps=1e-6, atol=1e-5, rtol=1e-3)
    # A contiguous offset view is supported; strided views are deliberately rejected.
    x = torch.arange(10, dtype=torch.float64, device=device)[2:8]
    torch.testing.assert_close(adjacent_energy(x), reference(x))
    reject(lambda: adjacent_energy(x[::2]))
    reject(lambda: adjacent_energy(torch.empty(0, device=device)))
    reject(lambda: adjacent_energy(torch.empty(1000001, device=device)))
    reject(lambda: adjacent_energy(torch.empty(2, 2, device=device)))
    reject(lambda: adjacent_energy(torch.ones(3, dtype=torch.int64, device=device)))
    reject(lambda: adjacent_energy(torch.ones(3, dtype=torch.float16, device=device)))
    compiled = torch.compile(adjacent_energy, fullgraph=True, dynamic=True)
    for n in (4, 7):
        x = torch.linspace(-1, 1, n, device=device).requires_grad_()
        out = compiled(x)
        torch.testing.assert_close(out, reference(x))
        torch.testing.assert_close(torch.autograd.grad(out.sum(), x)[0],
                                   torch.autograd.grad(reference(x).sum(), x)[0])
# [ex22-checks-end]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", choices=("cpu", "cuda"), required=True)
    args = parser.parse_args()
    if platform.system() != "Linux" or platform.machine() != "x86_64" or sys.version_info[:3] != (3, 12, 14):
        raise RuntimeError("verification requires the selected Linux CPython profile")
    if torch.__version__ != "2.11.0+cu128" or torch.version.cuda != "12.8":
        raise RuntimeError("wrong PyTorch build")
    # Meta is storage-free; opcheck above additionally exercises FakeTensor metadata.
    for n in (1, 4):
        out = adjacent_energy(torch.empty(n, device="meta", dtype=torch.float64))
        assert out.device.type == "meta" and out.shape == (n - 1,) and out.dtype == torch.float64
    reject(lambda: adjacent_energy(torch.empty(0, device="meta")))
    reject(lambda: adjacent_energy(torch.ones(3, device="meta", dtype=torch.int64)))
    gpu = None
    if args.device == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA requested but unavailable; this is not a passing skip")
        properties = torch.cuda.get_device_properties(0)
        if (properties.major, properties.minor) < (8, 0) or properties.total_memory < 8000000000:
            raise RuntimeError("LAB13 requires CC >= 8.0 and at least 8 GB")
        gpu = {"name": properties.name, "computeCapability": f"{properties.major}.{properties.minor}",
               "memoryBytes": properties.total_memory}
        # Allocate and consume on a non-default current stream, then explicitly join it.
        stream = torch.cuda.Stream()
        with torch.cuda.stream(stream):
            check_device("cuda:0")
        stream.synchronize()
        torch.cuda.synchronize(0)
    else:
        check_device("cpu")
    print(json.dumps({"result": "pass", "scope": f"ex22-{args.device}",
                      "python": platform.python_version(), "torch": torch.__version__,
                      "package": importlib.metadata.version("cuda-learning-ops"),
                      "gpuExecuted": args.device == "cuda", "gpu": gpu,
                      "grantsRuntimeVerified": False}))


if __name__ == "__main__":
    main()
