# SPDX-License-Identifier: Apache-2.0
"""External P11/P12 verification harness; never executed by the Learning Site."""

import argparse
from contextlib import nullcontext
import hashlib
from importlib import metadata
import json
import os
from pathlib import Path
import platform
import statistics
import subprocess
import sys

TORCH_COMMIT = "70d99e998b4955e0049d13a98d77ae1b14db1f45"
WARMUP_CALLS = 20
TIMING_SAMPLES = 7
CALLS_PER_SAMPLE = 100
PROFILE_SCHEDULE = {"wait": 1, "warmup": 1, "active": 2, "repeat": 1}
BACKEND_EVENTS = {
    "MATH": "aten::_scaled_dot_product_attention_math",
    "FLASH_ATTENTION": "aten::_scaled_dot_product_flash_attention",
    "EFFICIENT_ATTENTION": "aten::_scaled_dot_product_efficient_attention",
    "CUDNN_ATTENTION": "aten::_scaled_dot_product_cudnn_attention",
}


def trace_summary(trace):
    """Keep observed names separate from requested policies and eligibility."""
    events = trace.get("traceEvents", [])
    names = {event.get("name") for event in events if event.get("ph") == "X"}
    backends = [name for name, event in BACKEND_EVENTS.items() if event in names]
    kernels = sorted({event["name"] for event in events
                      if event.get("ph") == "X" and event.get("cat") == "kernel"
                      and isinstance(event.get("name"), str)})
    return {"observedBackendEvents": backends, "deviceKernelNames": kernels,
            "hasDeviceTrace": bool(kernels)}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def require_dispatch(summary, policy):
    require(summary["hasDeviceTrace"], "No device kernel trace")
    observed = summary["observedBackendEvents"]
    require(len(observed) == 1, "Dispatch trace is ambiguous or unrecognized")
    require(policy == "AUTO" or observed == [policy], "Observed backend differs from forced policy")


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def command_output(command):
    result = subprocess.run(command, check=True, text=True, capture_output=True)
    return result.stdout.strip()


def environment(torch, device, source_commit):
    require(platform.system() == "Linux" and platform.machine() == "x86_64",
            "Native Linux x86-64 is required")
    require(platform.python_version() == "3.12.14", "CPython 3.12.14 is required")
    require(torch.__version__ == "2.11.0+cu128" and torch.version.git_version == TORCH_COMMIT,
            "Selected PyTorch build is required")
    require(torch.version.cuda == "12.8", "Selected CUDA build family is required")
    profile = json.loads((Path(__file__).resolve().parents[1] /
                          "pytorch-environment/profile.json").read_text())
    installed = {name: metadata.version(name) for name in profile["distributions"]}
    require(installed == profile["distributions"], "Application distribution matrix mismatch")
    require(os.environ.get("PYTORCH_ALLOC_CONF") == "backend:native",
            "Set PYTORCH_ALLOC_CONF=backend:native")
    require(not os.environ.get("LD_PRELOAD") and not os.environ.get("PYTORCH_CUDA_ALLOC_CONF"),
            "Unset preload and legacy allocator overrides")
    record = {"sourceCommit": source_commit, "torch": torch.__version__,
              "torchCommit": torch.version.git_version, "buildCuda": torch.version.cuda,
              "python": platform.python_version(), "os": platform.platform(),
              "libc": platform.libc_ver(), "distributions": installed, "device": device,
              "profiler": "torch.profiler in PyTorch 2.11.0", "gpu": None,
              "allocator": os.environ.get("PYTORCH_ALLOC_CONF"),
              "cudnnDeprioritized": os.environ.get("TORCH_CUDNN_SDPA_DEPRIORITIZED"),
              "deterministicAlgorithms": torch.are_deterministic_algorithms_enabled(),
              "cudnnDeterministic": torch.backends.cudnn.deterministic}
    if device == "cuda":
        require(torch.cuda.is_available() and torch.cuda.device_count() == 1,
                "Expose exactly one CUDA GPU")
        props = torch.cuda.get_device_properties(0)
        require(props.major >= 8 and props.total_memory >= 8000000000,
                "CC >= 8.0 and at least 8 GB are required")
        require(torch.profiler.ProfilerActivity.CUDA in torch.profiler.supported_activities(),
                "CUDA activity tracing unavailable; inspect CUPTI and permissions")
        record["gpu"] = {"name": props.name, "cc": [props.major, props.minor],
                         "totalMemory": props.total_memory,
                         "freeMemory": torch.cuda.mem_get_info()[0],
                         "driver": command_output(["nvidia-smi", "--query-gpu=driver_version",
                                                   "--format=csv,noheader"]),
                         "loadedCudnnVersion": torch.backends.cudnn.version()}
    return record


def measure(torch, operation, output, name, device):
    """Warm-up, unprofiled repeated timing, then a separate diagnostic trace."""
    def sync():
        if device == "cuda":
            torch.cuda.synchronize()

    for _ in range(WARMUP_CALLS):
        operation()
    sync()
    times = []
    if device == "cuda":
        for _ in range(TIMING_SAMPLES):
            start, end = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
            sync()
            start.record()
            for _ in range(CALLS_PER_SAMPLE):
                operation()
            end.record()
            end.synchronize()
            times.append(start.elapsed_time(end) / CALLS_PER_SAMPLE)
    activities = [torch.profiler.ProfilerActivity.CPU]
    if device == "cuda":
        activities.append(torch.profiler.ProfilerActivity.CUDA)
    with torch.profiler.profile(activities=activities, record_shapes=True,
                                schedule=torch.profiler.schedule(**PROFILE_SCHEDULE)) as prof:
        steps = sum(PROFILE_SCHEDULE[key] for key in ("wait", "warmup", "active")) * PROFILE_SCHEDULE["repeat"]
        for _ in range(steps):
            with torch.profiler.record_function(name):
                operation()
            sync()
            prof.step()
    trace_path = output / f"{name}.json"
    prof.export_chrome_trace(str(trace_path))
    summary = trace_summary(json.loads(trace_path.read_text()))
    require(device != "cuda" or summary["hasDeviceTrace"],
            "No device kernel trace: CPU ranges alone do not establish CUDA execution")
    return {**summary, "trace": trace_path.name, "traceSha256": digest(trace_path),
            "unprofiledMillisecondsPerCall": times,
            "medianMilliseconds": statistics.median(times) if times else None,
            "warmupCalls": WARMUP_CALLS, "samples": TIMING_SAMPLES if times else 0,
            "callsPerSample": CALLS_PER_SAMPLE, "profileSchedule": PROFILE_SCHEDULE.copy()}


def operator_checks(torch, args, report):
    from cuda_learning_ops import adjacent_energy, _C
    require("site-packages" in Path(_C.__file__).parts, "Use the installed wheel, not a checkout")
    report["extensionSha256"] = digest(_C.__file__)
    report["operatorDistribution"] = metadata.version("cuda-learning-ops")
    # The canonical verifier remains authoritative for metadata, all boundary sizes,
    # non-default stream, gradients and compiled forward/backward.
    verifier = Path(__file__).resolve().parents[2] / "examples/ex22-adjacent-energy/verify.py"
    subprocess.run([sys.executable, "-I", str(verifier), "--device", args.device], check=True)
    report["canonicalVerification"] = "passed"
    for dtype in (torch.float32, torch.float64):
        for n in (258, 1003, 1000000):
            x = ((torch.arange(n, device=args.device) % 17) - 8).to(dtype) / 4
            reference = lambda: (x[1:] - x[:-1]).square()
            torch.testing.assert_close(adjacent_energy(x), reference(), atol=0, rtol=0)
            for label, operation in (("eager", reference), ("operator", lambda: adjacent_energy(x))):
                name = f"{label}-{str(dtype).split('.')[-1]}-{n}"
                report["cases"].append({"case": name, "n": n, "dtype": str(dtype),
                                        "correctness": "passed", "scope": "forward allocation-inclusive",
                                        **measure(torch, operation, args.output, name, args.device)})


def attention_checks(torch, args, report):
    from torch.nn.attention import SDPBackend, sdpa_kernel
    from torch.nn.functional import scaled_dot_product_attention as sdpa
    # Derive independent finite inputs on CPU, then compare the *rounded* inputs.
    dtypes = (torch.float32, torch.float64) if args.device == "cpu" else (
        torch.float16, torch.bfloat16, torch.float32, torch.float64)
    policies = ["MATH"] if args.device == "cpu" else ["AUTO", *BACKEND_EVENTS]
    for dtype in dtypes:
        if dtype == torch.bfloat16 and not torch.cuda.is_bf16_supported(including_emulation=False):
            report["cases"].append({"dtype": str(dtype), "status": "ineligible", "reason": "native BF16 unavailable"})
            continue
        base = torch.arange(1 * 2 * 128 * 64, dtype=torch.float64).reshape(1, 2, 128, 64)
        inputs = [(((base + shift) % 31 - 15) / 32).to(dtype).to(args.device)
                  for shift in (0, 7, 13)]
        q, k, v = [x.cpu().double() for x in inputs]
        oracle = ((q @ k.transpose(-2, -1)) * 0.125).softmax(-1) @ v
        atol, rtol = {torch.float16: (2e-3, 2e-3), torch.bfloat16: (2e-2, 2e-2),
                      torch.float32: (1e-5, 1e-4), torch.float64: (1e-12, 1e-10)}[dtype]
        for policy in policies:
            row = {"dtype": str(dtype), "requestedPolicy": policy, "shape": [1, 2, 128, 64],
                   "strides": list(inputs[0].stride()), "scale": 0.125,
                   "dropout": 0.0, "causal": False, "mask": None, "gqa": False,
                   "atol": atol, "rtol": rtol, "status": "started"}
            report["cases"].append(row)
            context = nullcontext() if policy == "AUTO" else sdpa_kernel(getattr(SDPBackend, policy))
            with context:
                if policy not in ("AUTO", "MATH"):
                    params = torch.backends.cuda.SDPAParams(*inputs, None, 0.0, False, False)
                    check = {"FLASH_ATTENTION": torch.backends.cuda.can_use_flash_attention,
                             "EFFICIENT_ATTENTION": torch.backends.cuda.can_use_efficient_attention,
                             "CUDNN_ATTENTION": torch.backends.cuda.can_use_cudnn_attention}[policy]
                    eligible = check(params, debug=True)
                    row["eligible"] = eligible
                    if not eligible:
                        row["status"] = "ineligible"
                        continue
                # Do not turn arbitrary execution errors or numerical failures into skips.
                operation = lambda: sdpa(*inputs, dropout_p=0.0, is_causal=False, scale=0.125)
                actual = operation().cpu().double()
                require(bool(torch.isfinite(actual).all()), "Nonfinite attention result")
                torch.testing.assert_close(actual, oracle, atol=atol, rtol=rtol)
                row["maxAbsoluteError"] = (actual - oracle).abs().max().item()
                row.update(measure(torch, operation, args.output,
                                   f"sdpa-{str(dtype).split('.')[-1]}-{policy}", args.device))
                if args.device == "cuda":
                    require_dispatch(row, policy)
                row["status"] = "passed"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("operator", "sdpa"), required=True)
    parser.add_argument("--device", choices=("cpu", "cuda"), required=True)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    require(len(args.source_commit) == 40 and all(c in "0123456789abcdef" for c in args.source_commit),
            "Supply the actual full source commit")
    args.output.mkdir(parents=False, exist_ok=False)
    report = {"schemaVersion": 1, "mode": args.mode, "status": "started", "cases": [],
              "runtimeEvidence": "Pending Hardware Verification"}
    try:
        import torch
        report["environment"] = environment(torch, args.device, args.source_commit)
        with torch.no_grad() if args.mode == "sdpa" else nullcontext():
            (operator_checks if args.mode == "operator" else attention_checks)(torch, args, report)
        # Actual loader mappings are local artifacts; review/redact paths before publication.
        mappings = Path("/proc/self/maps").read_text()
        libraries = sorted({line.split()[-1] for line in mappings.splitlines()
                            if "/" in line and any(s in line for s in ("libcuda", "libcudnn", "libtorch", "libcupti"))
                            and Path(line.split()[-1]).is_file()})
        report["loadedLibraries"] = [{"path": name, "sha256": digest(name)} for name in libraries]
        report["status"] = "passed"
    except Exception as error:
        report["status"] = "failed"
        report["errorType"] = type(error).__name__
        raise
    finally:
        (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
