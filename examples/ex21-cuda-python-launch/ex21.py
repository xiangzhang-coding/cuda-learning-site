# SPDX-License-Identifier: Apache-2.0
"""Standalone EX21 command line; host-test needs only the Python standard library."""

import argparse
import ctypes
import hashlib
import importlib.metadata
import io
import json
import math
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import sysconfig
import traceback
import warnings

PACKAGES = {"cuda-core": "1.2.0", "cuda-bindings": "13.4.1",
            "cuda-pathfinder": "1.8.1", "numpy": "2.5.3"}
ROOT = Path(__file__).resolve().parent
MAX_SIZE = 1_000_000


def check_profile(report, phase="native"):
    report["stage"] = "environment-profile"
    environment = report["environment"] = {
        "python": platform.python_version(), "implementation": platform.python_implementation(),
        "gilBuild": not bool(sysconfig.get_config_var("Py_GIL_DISABLED")),
        "system": platform.system(), "architecture": platform.machine(),
        "libc": list(platform.libc_ver()), "packages": {},
    }
    failures = []
    if (environment["implementation"] != "CPython" or environment["python"] != "3.14.7"
            or sys.version_info.releaselevel != "final" or not environment["gilBuild"]
            or sysconfig.get_config_var("Py_DEBUG")):
        failures.append("requires ordinary GIL CPython 3.14.7, release ABI cp314-cp314")
    if environment["system"] != "Linux" or environment["architecture"] != "x86_64":
        failures.append("requires Native Ubuntu 24.04 x86_64")
    else:
        release = platform.freedesktop_os_release()
        environment["osRelease"] = release
        if release.get("ID") != "ubuntu" or release.get("VERSION_ID") != "24.04":
            failures.append("requires Ubuntu 24.04")
        if environment["libc"] != ["glibc", "2.39"]:
            failures.append("requires glibc 2.39")
    if ctypes.sizeof(ctypes.c_void_p) != 8 or ctypes.sizeof(ctypes.c_float) != 4:
        failures.append("requires 64-bit pointers and 32-bit float storage")
    if phase != "interpreter":
        for name, wanted in PACKAGES.items():
            try:
                actual = importlib.metadata.version(name)
            except importlib.metadata.PackageNotFoundError:
                actual = None
            environment["packages"][name] = actual
            if actual != wanted:
                failures.append(f"requires {name}=={wanted}; found {actual!r}")
    if failures:
        raise RuntimeError("unsupported EX21 profile: " + "; ".join(failures))
    environment["checkedPhase"] = "interpreter" if phase == "interpreter" else "packages"


def architecture(value):
    if not re.fullmatch(r"[1-9][0-9]{1,2}", value) or int(value) < 75:
        raise ValueError("arch must be a plain numeric target >=75; no sm_ prefix or suffix")
    return value

def problem_size(value):
    if not re.fullmatch(r"[0-9]+", str(value)) or not 1 <= int(value) <= MAX_SIZE:
        raise ValueError(f"size must be an integer in [1, {MAX_SIZE}]; zero never launches")
    return int(value)


# [ex21-cpu-reference-start]
def initialize_inputs(a, b):
    if len(a) != len(b):
        raise ValueError("input lengths differ")
    for i in range(len(a)):
        a[i] = (i % 37) * 0.25
        b[i] = -(i % 19) * 0.5


def cpu_reference(a, b):
    if len(a) != len(b):
        raise ValueError("input lengths differ")
    result = []
    for i in range(len(a)):
        if not math.isfinite(a[i]) or not math.isfinite(b[i]):
            raise ValueError(f"nonfinite input at index {i}")
        result.append(a[i] + b[i])
    return result


def check_output(actual, expected):
    if len(actual) != len(expected):
        raise ValueError(f"output length {len(actual)} != reference length {len(expected)}")
    first = None
    mismatches = 0
    for i in range(len(expected)):
        if (not math.isfinite(actual[i]) or not math.isfinite(expected[i])
                or actual[i] != expected[i]):
            mismatches += 1
            if first is None:
                first = i
    if mismatches:
        raise ValueError(
            f"first failing index={first}; mismatches={mismatches}; "
            f"actual={actual[first]!r}; expected={expected[first]!r}"
        )
    return len(expected)
# [ex21-cpu-reference-end]


def host_test():
    if ctypes.sizeof(ctypes.c_float) != 4 or ctypes.sizeof(ctypes.c_uint32) != 4:
        raise RuntimeError("EX21 requires 32-bit float and uint32 storage")
    sizes = [1, 255, 256, 257, 1003]
    for n in sizes:
        a, b = (ctypes.c_float * n)(), (ctypes.c_float * n)()
        initialize_inputs(a, b)
        expected = cpu_reference(a, b)
        check_output((ctypes.c_float * n)(*expected), expected)
    # Independently worked results include both input periods and the final tail.
    literals = {
        0: 0.0, 1: -0.25, 18: -4.5, 19: 4.75, 36: 0.5, 37: -9.0,
        38: 0.25, 255: 4.25, 256: 4.0, 257: 3.75, 702: 0.0, 1002: -6.25,
    }
    check_output([expected[i] for i in literals], list(literals.values()))

    def rejects(action, diagnostic):
        try:
            action()
        except ValueError as error:
            if diagnostic not in str(error):
                raise AssertionError(f"wrong rejection: {error}") from error
        else:
            raise AssertionError(f"accepted invalid case: {diagnostic}")

    for index in (0, 501, 1002):
        for value in (math.nan, math.inf, -math.inf, expected[index] + 0.25):
            invalid = expected.copy()
            invalid[index] = value
            rejects(lambda: check_output(invalid, expected),
                    f"first failing index={index}; mismatches=1")
    rejects(lambda: check_output(expected[:-1], expected), "output length")
    rejects(lambda: check_output(expected + [0.0], expected), "output length")
    invalid = expected.copy()
    invalid[0], invalid[1002] = math.nan, math.inf
    rejects(lambda: check_output(invalid, expected), "first failing index=0; mismatches=2")
    rejects(lambda: cpu_reference([1.0], []), "input lengths")
    for value in (math.nan, math.inf, -math.inf):
        rejects(lambda: cpu_reference([value], [1.0]), "nonfinite input")
    for value in (0, -1, MAX_SIZE + 1, "1.5"):
        rejects(lambda: problem_size(value), "size must be")
    return {"command": "host-test", "result": "pass", "gpuExecuted": False,
            "literalChecks": len(literals), "sizes": sizes,
            "rejectedOutputCases": 15, "rejectedInputCases": 4, "rejectedSizeCases": 4}


def cuda_command(args, report):
    report["stage"] = "canonical-imports"
    # [ex21-canonical-imports-start]
    from cuda.core import (
        Device, LaunchConfig, LegacyPinnedMemoryResource, Linker, LinkerOptions,
        Program, ProgramOptions, StreamOptions, launch,
    )
    from cuda.bindings import driver, nvjitlink, nvrtc
    from cuda.pathfinder import load_nvidia_dynamic_lib
    # [ex21-canonical-imports-end]

    report["stage"] = "native-libraries"
    toolkit = Path(os.environ.get("CUDA_PATH", "/usr/local/cuda-13.3")).resolve(strict=True)
    if os.environ.get("CUDA_HOME") and Path(os.environ["CUDA_HOME"]).resolve() != toolkit:
        raise RuntimeError("CUDA_HOME and CUDA_PATH must identify the same selected Toolkit")
    os.environ["CUDA_PATH"] = str(toolkit)
    version_file = toolkit / "version.json"
    toolkit_version = json.loads(version_file.read_text())["cuda"]["version"]
    report["environment"]["toolkit"] = {"root": str(toolkit), "version": toolkit_version}
    if toolkit_version != "13.3.1":
        raise RuntimeError(f"requires Toolkit 13.3.1; version.json declares {toolkit_version}")
    libraries = report["environment"]["nativeLibraries"] = {}
    for name in ("nvrtc", "nvJitLink", "cuda"):
        loaded = load_nvidia_dynamic_lib(name)
        if not loaded.abs_path:
            raise RuntimeError(f"cannot establish the loaded {name} library path")
        library = Path(loaded.abs_path).resolve(strict=True)
        with library.open("rb") as binary:
            digest = hashlib.file_digest(binary, "sha256").hexdigest()
        libraries[name] = {"path": str(library), "sha256": digest, "foundVia": loaded.found_via}
        if name != "cuda":
            if not library.is_relative_to(toolkit) or library.name != f"lib{name}.so.13.3.33":
                raise RuntimeError(f"requires native {name} 13.3.33 inside CUDA_PATH; loaded {library}")
            libraries[name]["binaryCoordinate"] = "13.3.33"
            libraries[name]["patchVersionExposedByApi"] = False
        else:
            match = re.fullmatch(r"libcuda\.so\.(\d+\.\d+\.\d+)", library.name)
            if not match or tuple(map(int, match[1].split("."))) < (610, 43, 2):
                raise RuntimeError("requires real driver userspace library >=610.43.02; no stubs")
            libraries[name]["binaryCoordinate"] = match[1]
    status, major, minor = nvrtc.nvrtcVersion()
    if status != nvrtc.nvrtcResult.NVRTC_SUCCESS:
        raise RuntimeError(f"nvrtcVersion failed: {status}")
    libraries["nvrtc"]["apiVersion"] = [major, minor]
    # nvJitLink returns a version pair and raises exceptions, NOT a status-first tuple.
    libraries["nvJitLink"]["apiVersion"] = list(nvjitlink.version())
    if [major, minor] != [13, 3] or libraries["nvJitLink"]["apiVersion"] != [13, 3]:
        raise RuntimeError("loaded NVRTC and nvJitLink API versions must both be 13.3")
    status, driver_api = driver.cuDriverGetVersion()
    if status != driver.CUresult.CUDA_SUCCESS:
        raise RuntimeError(f"cuDriverGetVersion failed: {status}; real userspace driver required")
    libraries["cuda"]["apiVersion"] = driver_api
    if driver_api < 13030:
        raise RuntimeError(f"requires driver API level >=13030; found {driver_api}")
    status, count = nvrtc.nvrtcGetNumSupportedArchs()
    if status != nvrtc.nvrtcResult.NVRTC_SUCCESS or count <= 0:
        raise RuntimeError(f"nvrtcGetNumSupportedArchs failed: {status}")
    status, supported = nvrtc.nvrtcGetSupportedArchs()
    if status != nvrtc.nvrtcResult.NVRTC_SUCCESS or len(supported) != count:
        raise RuntimeError(f"nvrtcGetSupportedArchs failed: {status}")
    report["environment"]["nvrtcSupportedArchs"] = list(supported)
    report["backend"] = str(Linker.which_backend())
    if report["backend"] != "nvJitLink":
        raise RuntimeError("requires nvJitLink; refusing the Driver linker fallback")
    report["environment"]["checkedPhase"] = "native"
    if args.command == "check-environment":
        return

    report["stage"] = "artifact-directory"
    output = Path(args.output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    artifacts = ("report.json", "ex21.ptx", "ex21.cubin", "nvrtc.log", "link-info.log",
                 "link-error.log", "sass.txt")
    if any((output / name).exists() or (output / name).is_symlink() for name in artifacts):
        raise RuntimeError("use a fresh output directory; existing results are never reused or overwritten")
    # Reserve this attempt before compilation so even a failed run cannot leave a stale success.
    with (output / "report.json").open("x") as destination:
        json.dump(report, destination)
    report["outputDirectory"] = str(output)

    dev = stream = program = linker = linked = kernel = None
    a = b = c = None
    host_buffers, device_buffers = [], []
    compile_log = io.StringIO()
    completed = False
    cleanup_errors = report["cleanupErrors"] = []
    cleanup_warnings = report["cleanupWarnings"] = []

    def cleanup(label, action):
        try:
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                try:
                    action()
                finally:
                    for warning in caught:
                        message = f"{label}: {warning.category.__name__}: {warning.message}"
                        cleanup_warnings.append(message)
                        print(f"cleanup warning: {message}", file=sys.stderr)
        except Exception as error:
            message = f"{label}: {type(error).__name__}: {error}"
            cleanup_errors.append(message)
            print(f"cleanup error: {message}", file=sys.stderr)

    try:
        if args.command == "run":
            report["stage"] = "driver-package"
            driver_text = Path("/proc/driver/nvidia/version").read_text()
            match = re.search(r"Kernel Module(?: for \S+)?\s+(\d+\.\d+\.\d+)", driver_text)
            if not match or match[1] != libraries["cuda"]["binaryCoordinate"]:
                raise RuntimeError("kernel driver and loaded userspace driver package must match")
            report["environment"]["kernelDriver"] = match[1]
            report["stage"] = "device-context"
            report["driverInitializationAttempted"] = True
            dev = Device(0)
            report["driverInitialized"] = True
            dev.set_current()
            arch = architecture(dev.arch)
            report["device"] = {"id": dev.device_id, "name": dev.name,
                                "computeCapability": list(dev.compute_capability)}
        else:
            arch = args.arch
        report["stage"] = "architecture"
        if int(arch) not in supported:
            raise ValueError(f"unsupported arch {arch}; loaded NVRTC supports {supported}")
        report["arch"] = arch

        # [ex21-runtime-compile-start]
        report["stage"] = "compile-ptx"
        source = (ROOT / "kernel.cu").read_text(encoding="utf-8")
        program = Program(source, code_type="c++", options=ProgramOptions(
            std="c++17", arch=f"compute_{arch}", relocatable_device_code=True,
            name="ex21_vector_add.cu",
        ))
        ptx = program.compile("ptx", logs=compile_log)
        ptx_bytes = bytes(ptx.code)
        with (output / "ex21.ptx").open("xb") as destination:
            destination.write(ptx_bytes)
        report["stage"] = "link-cubin"
        linker = Linker(ptx, options=LinkerOptions(arch=f"sm_{arch}"))
        linked = linker.link("cubin")
        cubin_bytes = bytes(linked.code)
        with (output / "ex21.cubin").open("xb") as destination:
            destination.write(cubin_bytes)
        # [ex21-runtime-compile-end]

        report["stage"] = "inspect-artifacts"
        ptx_text = ptx_bytes.rstrip(b"\0").decode("utf-8")
        if (not re.search(r"\.entry\s+ex21_vector_add\b", ptx_text)
                or not re.search(rf"\.target\s+sm_{arch}\b", ptx_text)
                or len(cubin_bytes) < 64 or cubin_bytes[:4] != b"\x7fELF"):
            raise RuntimeError("expected a PTX entry/target and a nonempty ELF cubin")
        inspection = subprocess.run(
            [str(toolkit / "bin/cuobjdump"), "--dump-sass", str(output / "ex21.cubin")],
            capture_output=True, text=True, timeout=60,
        )
        with (output / "sass.txt").open("x") as destination:
            destination.write(inspection.stdout + inspection.stderr)
        if (inspection.returncode != 0 or "ex21_vector_add" not in inspection.stdout
                or not re.search(rf"\bsm_{arch}\b", inspection.stdout)):
            raise RuntimeError("cuobjdump did not confirm the expected kernel/SM; inspect sass.txt")
        report["artifacts"] = [
            {"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
            for name, data in (("ex21.ptx", ptx_bytes), ("ex21.cubin", cubin_bytes))
        ]
        if args.command == "build":
            return

        # [ex21-python-lifecycle-start]
        n = args.size
        report["stage"] = "allocate"
        stream = dev.create_stream(options=StreamOptions(nonblocking=True))
        pinned = LegacyPinnedMemoryResource()
        nbytes = n * ctypes.sizeof(ctypes.c_float)
        for _ in range(3):
            host_buffers.append(pinned.allocate(nbytes, stream=stream))
            device_buffers.append(dev.allocate(nbytes, stream=stream))
        h_a, h_b, h_c = host_buffers
        d_a, d_b, d_c = device_buffers
        # These views borrow pinned storage. Never construct a CPU view of a device Buffer.
        a = (ctypes.c_float * n).from_address(int(h_a.handle))
        b = (ctypes.c_float * n).from_address(int(h_b.handle))
        c = (ctypes.c_float * n).from_address(int(h_c.handle))
        initialize_inputs(a, b)
        expected = cpu_reference(a, b)
        for i in range(n):
            c[i] = math.nan
        report["stage"] = "copy-inputs"
        d_a.copy_from(h_a, stream=stream)
        d_b.copy_from(h_b, stream=stream)
        # A missed store must fail even if recycled device memory happens to contain a valid sum.
        d_c.copy_from(h_c, stream=stream)
        report["stage"] = "load-kernel"
        kernel = linked.get_kernel("ex21_vector_add")
        report["stage"] = "launch"
        config = LaunchConfig(grid=(n + 255) // 256, block=256)
        report["launchAttempted"] = True
        report["gpuExecuted"] = None  # Completion is unknown if submission or synchronization fails.
        launch(stream, config, kernel, d_a, d_b, d_c, ctypes.c_uint32(n))
        report["stage"] = "copy-output"
        d_c.copy_to(h_c, stream=stream)
        report["stage"] = "stream-sync"
        stream.sync()
        completed = True
        report["gpuExecuted"] = True
        report["stage"] = "correctness"
        report["checkedElements"] = check_output(c, expected)
        report.update(size=n, block=256, grid=(n + 255) // 256,
                      inactiveTail=((n + 255) // 256) * 256 - n)
    finally:
        failing = sys.exc_info()[0] is not None
        if not failing:
            report["stage"] = "cleanup"
        if stream is not None:
            if not completed:
                cleanup("complete pending work", stream.sync)
            a = b = c = None
            for buffer in reversed(device_buffers):
                cleanup("device Buffer.close", lambda: buffer.close(stream=stream))
            for buffer in reversed(host_buffers):
                cleanup("pinned Buffer.close", lambda: buffer.close(stream=stream))
            cleanup("drain queued frees", stream.sync)
            cleanup("owned Stream.close", stream.close)
        # Kernel and ObjectCode have shared library ownership, not public close() methods.
        kernel = linked = None
        # Core retains the primary context; do not reset/destroy it or invent Device.close().
        # [ex21-python-lifecycle-end]
        cleanup("retain NVRTC log", lambda: (output / "nvrtc.log").write_text(compile_log.getvalue()))
        if linker is not None:
            cleanup("retain linker info log", lambda: (output / "link-info.log").write_text(linker.get_info_log()))
            cleanup("retain linker error log", lambda: (output / "link-error.log").write_text(linker.get_error_log()))
            cleanup("Linker.close", linker.close)
        if program is not None:
            cleanup("Program.close", program.close)
        if not failing and (cleanup_errors or cleanup_warnings):
            raise RuntimeError("cleanup was not clean; inspect cleanupErrors/cleanupWarnings and stderr")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("host-test", help="stdlib-only CPU logic checks; no CUDA evidence")
    check = commands.add_parser("check-environment", help="check the single selected profile")
    check.add_argument("--phase", choices=("interpreter", "packages", "native"), default="native",
                       help="setup preflights stop before packages or native CUDA libraries")
    build = commands.add_parser("build", help="GPU-free NVRTC PTX -> nvJitLink cubin")
    build.add_argument("--arch", required=True)
    build.add_argument("--output-dir", default=str(ROOT / "build/compile"))
    run = commands.add_parser("run", help="compile, launch and check all outputs on device 0")
    run.add_argument("--size", default="1003")
    run.add_argument("--output-dir", default=str(ROOT / "build/run"))
    args = parser.parse_args()
    try:
        if args.command == "build":
            args.arch = architecture(args.arch)
        if args.command == "run":
            args.size = problem_size(args.size)
    except ValueError as error:
        parser.error(str(error))
    if args.command == "host-test":
        print(json.dumps(host_test()))
        return 0
    report = {"command": args.command, "result": "fail", "gpuExecuted": False,
              "driverInitialized": False, "stage": "environment-profile"}
    try:
        phase = args.phase if args.command == "check-environment" else "native"
        check_profile(report, phase)
        if args.command == "run":
            report["stage"] = "cpu-reference"
            report["cpuChecks"] = host_test()
        if phase == "native":
            cuda_command(args, report)
        report["stage"] = "complete"
        report["result"] = "pass"
    except Exception as error:
        report["error"] = {"type": type(error).__name__, "message": str(error)}
        traceback.print_exc(file=sys.stderr)
    if "outputDirectory" in report:
        try:
            (Path(report["outputDirectory"]) / "report.json").write_text(json.dumps(report, indent=2))
        except OSError as error:
            report["result"] = "fail"
            report["reportWriteError"] = str(error)
            print(f"report write failed: {error}", file=sys.stderr)
    print(json.dumps(report, allow_nan=False))
    return 0 if report["result"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
