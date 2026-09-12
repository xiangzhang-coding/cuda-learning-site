# SPDX-License-Identifier: Apache-2.0
"""Standalone EX21 command line; host-test needs only the Python standard library."""

import argparse
from contextlib import redirect_stderr
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
import tempfile
import traceback
import warnings

PACKAGES = {"cuda-core": "1.2.0", "cuda-bindings": "13.4.1",
            "cuda-pathfinder": "1.8.1", "numpy": "2.5.3"}
ROOT = Path(__file__).resolve().parent
MAX_SIZE = 1_000_000
CLEANUP_DIAGNOSTIC_LIMIT = 16_384


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


def dpkg_query(*arguments):
    return subprocess.run(
        ["/usr/bin/dpkg-query", "--admindir=/var/lib/dpkg", "--no-pager", *arguments],
        capture_output=True, text=True, timeout=15,
        env={**os.environ, "LC_ALL": "C", "LANGUAGE": "C", "DPKG_ROOT": "/"},
    )


def inspect_native_file(path, package, inventory):
    actual = Path(path).resolve(strict=True)
    if not actual.is_file():
        raise RuntimeError(f"native artifact is not a regular file: {actual}")
    ownership = dpkg_query("--search", str(actual))
    owner = inventory[package]["binaryPackage"]
    if ownership.returncode != 0 or ownership.stdout.splitlines() != [f"{owner}: {actual}"]:
        raise RuntimeError(f"package ownership mismatch: {actual} must be owned only by {owner}")
    with actual.open("rb") as binary:
        identity = os.fstat(binary.fileno())
        digest = hashlib.file_digest(binary, "sha256").hexdigest()
    return {"path": str(actual), "sha256": digest, "package": package,
            "packageVersion": inventory[package]["version"], "owner": owner,
            "fileIdentity": {"inode": identity.st_ino, "deviceMajor": os.major(identity.st_dev),
                             "deviceMinor": os.minor(identity.st_dev)}}


def check_native_packages(report):
    report["stage"] = "native-packages"
    profile = json.loads((ROOT / "native-profile.json").read_text())
    if profile["schemaVersion"] != 1 or profile["id"] != "nvidia-deb-ubuntu2404-cuda1331":
        raise RuntimeError("unsupported EX21 native installation profile")
    toolkit = Path(os.environ.get("CUDA_PATH", profile["toolkitRoot"])).resolve(strict=True)
    if toolkit != Path(profile["toolkitRoot"]).resolve(strict=True):
        raise RuntimeError("the NVIDIA Debian installation must be rooted at /usr/local/cuda-13.3")
    if os.environ.get("CUDA_HOME") and Path(os.environ["CUDA_HOME"]).resolve() != toolkit:
        raise RuntimeError("CUDA_HOME and CUDA_PATH must identify the same selected Toolkit")
    os.environ["CUDA_PATH"] = str(toolkit)
    inventory = {}
    report["environment"]["toolkit"] = {
        "root": str(toolkit), "targetVersion": profile["toolkit"], "version": None,
        "installationMode": profile["installationMode"], "packages": inventory,
        "versionSource": "installed cuda-compiler-13-3 and cuda-command-line-tools-13-3 package coordinates",
    }
    query = dpkg_query(
        r"--showformat=${Package}\t${binary:Package}\t${Status}\t${Version}\t${Architecture}\n",
        "--show", *profile["packages"],
    )
    for line in query.stdout.splitlines():
        name, binary_name, status, version, architecture_name = line.split("\t")
        if name in inventory:
            raise RuntimeError(f"ambiguous installed package: {name}")
        inventory[name] = {"binaryPackage": binary_name, "status": status,
                           "version": version, "architecture": architecture_name}
    for name, version in profile["packages"].items():
        actual = inventory.get(name)
        if (actual is None or actual["status"] != profile["installedStatus"]
                or actual["version"] != version or actual["architecture"] != profile["architecture"]):
            raise RuntimeError(f"unsupported NVIDIA Debian package profile: {name} requires "
                               f"{profile['installedStatus']}, {version}, {profile['architecture']}; found {actual}")
    if query.returncode != 0 or set(inventory) != set(profile["packages"]):
        raise RuntimeError(f"NVIDIA package inventory query failed: {query.stderr.strip()}")
    observed_version = inventory["cuda-compiler-13-3"]["version"].rsplit("-", 1)[0]
    if (observed_version != profile["toolkit"]
            or inventory["cuda-command-line-tools-13-3"]["version"].rsplit("-", 1)[0] != observed_version):
        raise RuntimeError("the installed Toolkit metapackage coordinates disagree")
    report["environment"]["toolkit"]["version"] = observed_version
    report["stage"] = "native-package-files"
    files = report["environment"]["nativeFiles"] = {}
    for role, spec in profile["files"].items():
        files[role] = inspect_native_file(toolkit / spec["path"], spec["package"], inventory)
        if (not Path(files[role]["path"]).is_relative_to(toolkit)
                or Path(files[role]["path"]).name != Path(spec["path"]).name):
            raise RuntimeError(f"native package file has an unsupported path: {role}")
    report["environment"]["checkedPhase"] = "native-packages"
    return profile


def observe_nvrtc_builtins(report, profile):
    report["stage"] = "inspect-nvrtc-builtins"
    mappings = set()
    for line in Path("/proc/self/maps").read_text().splitlines():
        fields = line.split(maxsplit=5)
        if len(fields) != 6 or "libnvrtc-builtins.so" not in fields[5]:
            continue
        if fields[5].endswith(" (deleted)"):
            raise RuntimeError("loaded NVRTC-builtins mapping was deleted")
        major, minor = (int(value, 16) for value in fields[3].split(":"))
        mappings.add((fields[5], int(fields[4]), major, minor))
    if len(mappings) != 1:
        raise RuntimeError("expected exactly one loaded NVRTC-builtins file after compilation")
    path, inode, major, minor = next(iter(mappings))
    expected = report["environment"]["nativeFiles"]["nvrtcBuiltins"]
    if str(Path(path).resolve(strict=True)) != expected["path"]:
        raise RuntimeError(f"loaded NVRTC-builtins path/patch mismatch: {path}")
    observed = inspect_native_file(path, profile["files"]["nvrtcBuiltins"]["package"],
                                   report["environment"]["toolkit"]["packages"])
    if observed["sha256"] != expected["sha256"]:
        raise RuntimeError("loaded NVRTC-builtins backing file changed from its package inspection")
    mapping_identity = {"inode": inode, "deviceMajor": major, "deviceMinor": minor}
    if observed["fileIdentity"] != mapping_identity:
        raise RuntimeError("hashed NVRTC-builtins file does not match the loaded mapping identity")
    observed["mappingIdentity"] = mapping_identity
    observed["observedVia"] = "/proc/self/maps after NVRTC compilation"
    report["environment"]["nativeLibraries"]["nvrtcBuiltins"] = observed


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


def cleanup_step(label, action, report):
    """Observe one explicit cleanup action in this single-threaded standalone process."""
    errors = report.setdefault("cleanupErrors", [])
    diagnostics = report.setdefault("cleanupWarnings", [])
    failures = []
    data = b""
    attempted = False
    try:
        # Unbuffered backing storage keeps Python writes and native fd 2 writes on one file offset.
        with tempfile.TemporaryFile(mode="w+b", buffering=0) as captured:
            with io.TextIOWrapper(captured, encoding="utf-8", errors="backslashreplace",
                                  write_through=True) as redirected:
                sys.stderr.flush()
                saved_fd = os.dup(2)
                try:
                    os.dup2(captured.fileno(), 2)
                    with redirect_stderr(redirected), warnings.catch_warnings():
                        warnings.simplefilter("always")
                        attempted = True
                        try:
                            action()
                        except Exception as error:
                            failures.append(f"{type(error).__name__}: {error}"[:CLEANUP_DIAGNOSTIC_LIMIT])
                finally:
                    try:
                        redirected.flush()
                    finally:
                        try:
                            os.dup2(saved_fd, 2)
                        finally:
                            os.close(saved_fd)
                captured.seek(0)
                data = captured.read(CLEANUP_DIAGNOSTIC_LIMIT + 1)
    except Exception as error:
        failures.append(f"diagnostic capture: {type(error).__name__}: {error}"[:CLEANUP_DIAGNOSTIC_LIMIT])
    if not attempted:
        # Capture failure is already fatal, but must not prevent attempting the release itself.
        try:
            action()
        except Exception as error:
            failures.append(f"{type(error).__name__}: {error}"[:CLEANUP_DIAGNOSTIC_LIMIT])
    messages = []
    for failure in failures:
        message = f"{label}: {failure}"
        errors.append(message)
        messages.append(message)
    if data:
        text = data[:CLEANUP_DIAGNOSTIC_LIMIT].decode("utf-8", errors="backslashreplace")
        truncated = len(data) > CLEANUP_DIAGNOSTIC_LIMIT or len(text) > CLEANUP_DIAGNOSTIC_LIMIT
        message = f"{label}: stderr: {text[:CLEANUP_DIAGNOSTIC_LIMIT]}"
        if truncated:
            message += "\n[cleanup diagnostics truncated]"
        diagnostics.append(message)
        messages.append(message)
    for message in messages:
        try:
            print(f"cleanup diagnostic: {message}", file=sys.stderr, flush=True)
        except Exception as error:
            errors.append(f"{label}: diagnostic replay: {type(error).__name__}: {error}"[:CLEANUP_DIAGNOSTIC_LIMIT])


def cleanup_self_test():
    checks = {}
    original_stderr = sys.stderr
    original_fd = os.fstat(2)

    def check(name, action, markers=()):
        expected_stderr = sys.stderr
        report = {}
        cleanup_step(f"self-test {name}", action, report)
        problems = report["cleanupErrors"] + report["cleanupWarnings"]
        if bool(problems) != bool(markers) or any(marker not in "\n".join(problems) for marker in markers):
            raise AssertionError(f"cleanup self-test did not classify {name} correctly")
        cleanup_step("self-test later clean action", lambda: None, report)
        if report["cleanupErrors"] + report["cleanupWarnings"] != problems:
            raise AssertionError("a later clean action changed the recorded failure")
        current_fd = os.fstat(2)
        if sys.stderr is not expected_stderr or (current_fd.st_dev, current_fd.st_ino, current_fd.st_mode) != (
                original_fd.st_dev, original_fd.st_ino, original_fd.st_mode):
            raise AssertionError("cleanup did not restore both stderr sinks")
        checks[name] = True
        return report

    def raises_error():
        raise ValueError("expected cleanup exception")

    def combined():
        print("expected Python stderr", file=sys.stderr)
        os.write(2, b"expected fd2 stderr\n")
        warnings.warn("expected cleanup warning", RuntimeWarning)
        raises_error()

    check("quiet", lambda: None)
    # A Python sink that is not fd 2 proves the two capture paths independently.
    with redirect_stderr(io.StringIO()) as alternate_stderr:
        check("pythonStderr", lambda: print("expected Python stderr", file=sys.stderr), ("expected Python stderr",))
    print(alternate_stderr.getvalue(), file=original_stderr, end="")
    check("nativeStderr", lambda: os.write(2, b"expected fd2 stderr\n"), ("expected fd2 stderr",))
    check("nativeStderr", lambda: os.write(2, b" \n"), (" \n",))
    check("warning", lambda: warnings.warn("expected cleanup warning", RuntimeWarning), ("expected cleanup warning",))
    check("exception", raises_error, ("expected cleanup exception",))
    check("combined", combined, ("expected Python stderr", "expected fd2 stderr",
                                 "expected cleanup warning", "expected cleanup exception"))
    primary = RuntimeError("expected primary exception")
    try:
        try:
            raise primary
        finally:
            check("primaryExceptionPreserved", combined, ("expected cleanup exception", "expected fd2 stderr"))
    except RuntimeError as error:
        if error is not primary:
            raise AssertionError("cleanup masked the primary exception") from error
    report = check("boundedDiagnostics", lambda: os.write(2, b"x" * (CLEANUP_DIAGNOSTIC_LIMIT + 64)),
                   ("cleanup diagnostics truncated",))
    if any(len(message) > CLEANUP_DIAGNOSTIC_LIMIT + 128 for message in report["cleanupWarnings"]):
        raise AssertionError("retained cleanup diagnostics exceeded the bound")

    class DiagnosticOnRelease:
        def __del__(self):
            os.write(2, b"expected release stderr\n")

    owner = [DiagnosticOnRelease()]
    check("referenceRelease", owner.clear, ("expected release stderr",))
    print("self-test Python stderr restored", file=sys.stderr)
    os.write(2, b"self-test fd2 restored\n")
    checks["stderrRestored"] = True
    return checks


def cuda_command(args, report, profile):
    # NVRTC's default cache invokes cuInit(); this standalone compilation path must not.
    os.environ["CUDA_CACHE_DISABLE"] = "1"
    report["cachePolicy"] = "disabled"
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
    inventory = report["environment"]["toolkit"]["packages"]
    libraries = report["environment"]["nativeLibraries"] = {"nvrtcBuiltins": None}
    for name in ("nvrtc", "nvJitLink", "cuda"):
        loaded = load_nvidia_dynamic_lib(name)
        if not loaded.abs_path:
            raise RuntimeError(f"cannot establish the loaded {name} library path")
        observed = inspect_native_file(loaded.abs_path, profile["files"][name]["package"], inventory)
        expected = report["environment"]["nativeFiles"][name]
        if observed["path"] != expected["path"] or observed["sha256"] != expected["sha256"]:
            raise RuntimeError(f"loaded {name} does not match the inspected Debian package file")
        libraries[name] = {**observed, "foundVia": loaded.found_via,
                           "binaryCoordinate": observed["packageVersion"].rsplit("-", 1)[0]}
        if name != "cuda":
            libraries[name]["patchVersionExposedByApi"] = False
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
        cleanup_step(label, action, report)

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
            name="ex21_vector_add.cu", no_cache=True,
        ))
        ptx = program.compile("ptx", logs=compile_log)
        observe_nvrtc_builtins(report, profile)
        ptx_bytes = bytes(ptx.code)
        with (output / "ex21.ptx").open("xb") as destination:
            destination.write(ptx_bytes)
        report["stage"] = "link-cubin"
        linker = Linker(ptx, options=LinkerOptions(arch=f"sm_{arch}", no_cache=True))
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
            [report["environment"]["nativeFiles"]["cuobjdump"]["path"], "--dump-sass", str(output / "ex21.cubin")],
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
        def release_code():
            nonlocal kernel, linked
            kernel = linked = None

        cleanup("release Kernel/ObjectCode references", release_code)
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
    check.add_argument("--phase", choices=("interpreter", "packages", "native-packages", "native"), default="native",
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
        report = host_test()
        report["cleanupChecks"] = cleanup_self_test()
        print(json.dumps(report))
        return 0
    report = {"command": args.command, "result": "fail", "gpuExecuted": False,
              "driverInitialized": False, "stage": "environment-profile"}
    try:
        phase = args.phase if args.command == "check-environment" else "native"
        check_profile(report, phase)
        if phase in ("native-packages", "native"):
            native_profile = check_native_packages(report)
        if args.command == "run":
            report["stage"] = "cpu-reference"
            report["cpuChecks"] = host_test()
        if phase == "native":
            cuda_command(args, report, native_profile)
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
