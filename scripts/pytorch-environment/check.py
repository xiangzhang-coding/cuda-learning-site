# SPDX-License-Identifier: Apache-2.0
"""Validate the application lock or the selected Linux CPU environment."""

from contextlib import contextmanager
import ctypes
import hashlib
from importlib import metadata
import inspect
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit


def require(condition):
    if not condition:
        raise ValueError("contract mismatch")


def read_contract(directory):
    profile = json.loads((directory / "profile.json").read_text(encoding="utf-8"))
    lock = (directory / "requirements.lock").read_bytes()
    require(hashlib.sha256(lock).hexdigest() == profile["lockSha256"])
    lines = lock.decode("utf-8").splitlines()
    records = {}
    options = []
    for line in lines:
        if not line or line.startswith("#"):
            continue
        if line.startswith("--"):
            options.append(line)
            continue
        match = re.fullmatch(
            r"([a-z0-9-]+)(?:\[([a-z0-9,]+)\])? @ (https://\S+) --hash=sha256:([a-f0-9]{64})",
            line,
        )
        require(match is not None)
        name, extras, url, digest = match.groups()
        require(name not in records and name in profile["distributions"])
        require((extras.split(",") if extras else []) == (
            profile["toolkitExtras"] if name == "cuda-toolkit" else []))
        parsed = urlsplit(url)
        require(parsed.netloc == ("download.pytorch.org" if name == "torch" else "files.pythonhosted.org"))
        require(not parsed.query and not parsed.fragment)
        filename = unquote(parsed.path.rsplit("/", 1)[-1])
        version = profile["distributions"][name]
        require(filename.startswith(f"{name.replace('-', '_')}-{version}-") and filename.endswith(".whl"))
        if name == "torch":
            require(filename == f"torch-{profile['torch']['version']}-{profile['torch']['wheelTag']}.whl")
        records[name] = {"url": url, "sha256": digest}
    require(options == ["--require-hashes", "--only-binary=:all:", "--no-index"])
    require(len(records) == 29 and records.keys() == profile["distributions"].keys())
    require(len(profile["toolkitExtras"]) == 11)
    return profile, records


@contextmanager
def quiet_native_output():
    # Native loaders and Python warnings can include local paths. Retain neither.
    sys.stdout.flush()
    sys.stderr.flush()
    saved = [os.dup(1), os.dup(2)]
    try:
        with tempfile.TemporaryFile() as sink:
            os.dup2(sink.fileno(), 1)
            os.dup2(sink.fileno(), 2)
            try:
                yield
            finally:
                sys.stdout.flush()
                sys.stderr.flush()
    finally:
        for original, descriptor in zip(saved, (1, 2)):
            os.dup2(original, descriptor)
            os.close(original)


def check_host(profile, records, directory, report, install):
    report["stage"] = "host-platform"
    require(platform.system() == profile["platform"]["system"])
    require(platform.machine() == profile["platform"]["machine"])
    libc, libc_version = platform.libc_ver()
    require(libc == profile["platform"]["libc"])
    require(tuple(map(int, libc_version.split("."))) >=
            tuple(map(int, profile["platform"]["minimumLibc"].split("."))))
    os_release = platform.freedesktop_os_release()
    coordinates = {
        "system": platform.system(), "machine": platform.machine(), "kernel": platform.release(),
        "distribution": os_release.get("ID", "unknown"), "osVersion": os_release.get("VERSION_ID", "unknown"),
        "libc": libc, "libcVersion": libc_version, "pythonVersion": platform.python_version(),
        "pythonCompiler": platform.python_compiler(), "interpreterProvider": "caller-provisioned",
    }
    for key in ("ImageOS", "ImageVersion", "RUNNER_OS", "RUNNER_ARCH", "GITHUB_SHA", "GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT"):
        coordinates[key] = os.environ.get(key, "not-recorded")
    if os.environ.get("GITHUB_ACTIONS") == "true":
        coordinates["interpreterProvider"] = "actions-python-versions"
    # Coordinates describe bootstrap inputs; never print executable or loader paths.
    report["runnerCoordinates"] = {
        key: value if re.fullmatch(r"[A-Za-z0-9._+() -]{1,160}", value) else "omitted"
        for key, value in coordinates.items()
    }
    report["stage"] = "host-python"
    require(platform.python_implementation() == profile["python"]["implementation"])
    require(platform.python_version() == profile["python"]["version"])
    report["stage"] = "host-isolation"
    require(sys.flags.isolated and not sys.flags.no_site and sys.prefix != sys.base_prefix)
    report["runnerCoordinates"]["interpreterSha256"] = hashlib.sha256(Path(sys.executable).read_bytes()).hexdigest()
    report["stage"] = "host-configuration"
    require(os.environ.get("PYTORCH_ALLOC_CONF") == "backend:native")
    require(os.environ.get("CUDA_VISIBLE_DEVICES") == "")
    require(not os.environ.get("PYTORCH_CUDA_ALLOC_CONF") and not os.environ.get("LD_PRELOAD"))
    # setup-python may need its own interpreter libraries, not another CUDA tree.
    loader_paths = os.environ.get("LD_LIBRARY_PATH", "")
    require(not loader_paths or all(
        entry == str(Path(sys.base_prefix) / "lib") for entry in loader_paths.split(":")))

    pip = [sys.executable, "-I", "-m", "pip", "--isolated", "--disable-pip-version-check"]
    if install:
        report["stage"] = "wheel-install"
        outcome = subprocess.run(pip + ["install", "--require-hashes", "--only-binary=:all:",
            "--no-index", "--no-cache-dir", "--force-reinstall", "--progress-bar", "off",
            "-r", str(directory / "requirements.lock")],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=2400,
            env={**os.environ, "PIP_CONFIG_FILE": os.devnull})
        require(outcome.returncode == 0)

    report["stage"] = "installed-distributions"
    installed = {}
    for distribution in metadata.distributions():
        name = re.sub(r"[-_.]+", "-", distribution.metadata["Name"]).lower()
        require(name not in installed)
        installed[name] = distribution
    require(set(installed) == set(records) | set(profile["bootstrapDistributions"]))
    require(re.fullmatch(r"[0-9]+(?:\.[0-9]+){1,2}", installed["pip"].version) is not None)
    report["runnerCoordinates"]["pipVersion"] = installed["pip"].version
    for name, pin in records.items():
        distribution = installed[name]
        require(distribution.version == profile["distributions"][name])
        origin = json.loads(distribution.read_text("direct_url.json") or "{}")
        require(unquote(origin.get("url", "")) == unquote(pin["url"]))
        require(origin.get("archive_info", {}).get("hashes", {}).get("sha256") == pin["sha256"])
    report["stage"] = "pip-check"
    outcome = subprocess.run(pip + ["check"], stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL, timeout=120)
    require(outcome.returncode == 0)

    report["stage"] = "artifact-licenses"
    for member in profile["licenseMembers"]:
        distribution = installed[member["distribution"]]
        require(member["path"] in {str(file) for file in distribution.files or []})
        require(hashlib.sha256(distribution.locate_file(member["path"]).read_bytes()).hexdigest()
                == member["sha256"])

    report["stage"] = "library-artifacts"
    libraries = [
        ("nvidia-cuda-runtime-cu12", "nvidia/cuda_runtime/lib/libcudart.so.12"),
        ("nvidia-cuda-cupti-cu12", "nvidia/cuda_cupti/lib/libcupti.so.12"),
        ("nvidia-cudnn-cu12", "nvidia/cudnn/lib/libcudnn.so.9"),
    ]
    for name, relative in libraries:
        distribution = installed[name]
        require(relative in {str(file) for file in distribution.files or []})
        library = distribution.locate_file(relative)
        with library.open("rb") as stream:
            require(stream.read(4) == b"\x7fELF")
    # Resolve a runtime symbol but do not call it. CUPTI/cuDNN get artifact checks
    # only; driver-dependent initialization and library API calls are out of scope.
    runtime = ctypes.CDLL(str(installed[libraries[0][0]].locate_file(libraries[0][1])),
                          mode=os.RTLD_LOCAL | os.RTLD_LAZY)
    require(getattr(runtime, "cudaRuntimeGetVersion", None) is not None)

    report["stage"] = "torch-build"
    import torch

    require(str(torch.__version__) == profile["torch"]["version"])
    require(torch.version.git_version == profile["torch"]["sourceCommit"])
    require(torch.version.cuda == profile["torch"]["cudaBuild"])
    require(torch.version.debug is profile["torch"]["debug"])
    require(not torch.cuda.is_initialized())
    require(Path(torch.__file__).resolve() == installed["torch"].locate_file("torch/__init__.py").resolve())

    report["stage"] = "api-signatures"
    signatures = [
        (torch.amp.autocast, {"device_type": inspect.Parameter.empty, "dtype": None,
                              "enabled": True, "cache_enabled": None}),
        (torch.amp.GradScaler, {"device": "cuda", "init_scale": 65536.0, "growth_factor": 2.0,
                                "backoff_factor": 0.5, "growth_interval": 2000, "enabled": True}),
        (torch.cuda.Event, {"enable_timing": False, "blocking": False,
                            "interprocess": False, "external": False}),
        (torch.profiler.schedule, {"wait": inspect.Parameter.empty, "warmup": inspect.Parameter.empty,
                                   "active": inspect.Parameter.empty, "repeat": 0,
                                   "skip_first": 0, "skip_first_wait": 0}),
    ]
    for api, expected in signatures:
        parameters = inspect.signature(api).parameters
        require(list(parameters) == list(expected))
        for name, default in expected.items():
            require(parameters[name].default == default)
    profiler_defaults = inspect.signature(torch.profiler.profile).parameters
    for name in ("record_shapes", "profile_memory", "with_stack", "with_flops", "with_modules", "acc_events"):
        require(profiler_defaults[name].default is False)

    report["stage"] = "cpu-quantization"
    # All inputs and expected outputs are exact binary fractions. FP16 spacing
    # near 1 is 1/1024: the first value is a tie that rounds to the even 1.
    original = torch.tensor([1.00048828125, 1.000732421875, -1.000732421875],
                            dtype=torch.float64, device="cpu")
    narrowed = original.to(torch.float16).to(torch.float64)
    require(narrowed.tolist() == [1.0, 1.0009765625, -1.0009765625])
    original_sum = original.sum().item()
    quantized_sum = narrowed.sum().item()
    require(original_sum == 1.00048828125 and quantized_sum == 1.0)
    require(torch.isfinite(narrowed).all().item())
    require((narrowed - original).abs().max().item() == 0.00048828125)
    report["cpuQuantization"] = {"originalSum": original_sum, "quantizedSum": quantized_sum,
                                 "maximumAbsoluteInputError": 0.00048828125}

    report["stage"] = "profiler-schedule"
    schedule = torch.profiler.schedule(wait=1, warmup=1, active=3, repeat=2)
    actions = [schedule(step).name for step in range(11)]
    require(actions == ["NONE", "WARMUP", "RECORD", "RECORD", "RECORD_AND_SAVE",
                        "NONE", "WARMUP", "RECORD", "RECORD", "RECORD_AND_SAVE", "NONE"])
    report["scheduleActions"] = actions
    report["stage"] = "no-cuda-initialization"
    require(not torch.cuda.is_initialized())
    report.update(pipCheck="pass", libraryInspection="runtime-dlopen-symbol-only; cupti-cudnn-ELF-only",
                  licenseMembersChecked=len(profile["licenseMembers"]),
                  allocatorConfiguration="backend:native", allocatorRuntimeChecked=False)
    report["stage"] = "complete"


def main():
    scope = "lock-contract" if sys.argv[1:] == ["--check-lock"] else "linux-cpu-environment"
    report = {"result": "fail", "scope": scope, "stage": "lock-contract",
              "gpuExecuted": False, "traceCollected": False}
    try:
        require(sys.argv[1:] in ([], ["--check-lock"], ["--install"]))
        directory = Path(__file__).resolve().parent
        profile, records = read_contract(directory)
        if sys.argv[1:] != ["--check-lock"]:
            with quiet_native_output():
                check_host(profile, records, directory, report, sys.argv[1:] == ["--install"])
        report.update(result="pass", distributions=len(records), toolkitExtras=profile["toolkitExtras"],
                      python=profile["python"]["version"], torch=profile["torch"]["version"],
                      torchCommit=profile["torch"]["sourceCommit"])
    except Exception:
        pass
    print(json.dumps(report, sort_keys=True))
    return 0 if report["result"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
