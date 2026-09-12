<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX21: CUDA Python Explicit Launch

An original standalone Runnable Example: Python owns orchestration and resource
lifetime; a header-free CUDA C++ kernel computes vector addition. The execution
path is explicit: `Program` compiles source to PTX, `Linker` turns that PTX into
cubin, `get_kernel()` loads/resolves the entry point, and `launch()` submits work
to an owned stream. It is not a Python kernel compiler or a NumPy array operation.

No Toolkit, driver, third-party source, upstream sample, or wheel is redistributed.
EX21 source and its software instructions are Apache-2.0. Installed dependencies
retain their own licenses. See the source and license links below.

## Selected Profile

This is one documented-compatible target, not a Runtime-Verified Reference
Environment. Native Linux is the only Supported Environment.

| Coordinate | Requirement |
| --- | --- |
| OS / CPU / libc | Ubuntu 24.04 LTS, x86_64, glibc 2.39 |
| Interpreter | Ordinary GIL CPython 3.14.7, release ABI `cp314-cp314` |
| Python distributions | `cuda-core==1.2.0`, `cuda-bindings==13.4.1`, `cuda-pathfinder==1.8.1`, `numpy==2.5.3` |
| System Toolkit | NVIDIA Debian-package installation of CUDA Toolkit 13.3.1, under `/usr/local/cuda-13.3` |
| Compiler / linker libraries | NVRTC 13.3.33 and nvJitLink 13.3.33, from that same Toolkit |
| Driver userspace | Installed `cuda-compat-13-3=610.43.02-1ubuntu1`; `run` also requires the matching 610.43.02 kernel module |
| GPU for `run` | One visible CUDA GPU, CC >=7.5 and a plain numeric target supported by the loaded NVRTC |

The owner's archived OS qualification target is Ubuntu 24.04.4, kernel
6.17.0-19 and GCC 14.3.0. These are target coordinates, not observations of a
machine. Record actual OS package revisions. No macOS, ARM, WSL or container-only
runtime support is claimed. Passing machine-readable version gates cannot prove
that a machine is a maintainer-controlled Native Linux Reference Environment.

Bindings 13.4.1 supports the selected Toolkit 13.x API subset; its package number
does not require a 13.4 Toolkit. Core 1.2 supports CUDA 12.x/13.x, but this example
does not define a CUDA 12 profile. Do not add `[cu13]`/`[all]` extras or install the
`cuda-python` metapackage: their dependency resolution can replace the selected
native toolchain. No private, legacy or experimental import is used.

NumPy is a required transitive runtime dependency of core, even though EX21 does
not import NumPy or use its arrays. The four-wheel lock is the complete base
Python runtime closure for this interpreter, not a lock of the whole machine.
CPython, the bundled pip bootstrap, OS packages, driver and Toolkit installers
need their own provenance. NVCC 13.3.73 and CUDA Runtime 13.3.29 are independent
Toolkit components; this path neither invokes NVCC nor directly uses the Runtime.
The compiler metapackage is nevertheless mandatory for this installation profile.
Its absence is not excused by finding working NVRTC libraries.

`native-profile.json` is the authoritative, build-hashed installation contract.
All six NVIDIA packages must be `amd64`, with exact status `install ok installed`
and these full Debian versions:

| Package | Version |
| --- | --- |
| `cuda-compiler-13-3` | `13.3.1-1` |
| `cuda-command-line-tools-13-3` | `13.3.1-1` |
| `cuda-nvrtc-13-3` | `13.3.33-1` |
| `libnvjitlink-13-3` | `13.3.33-1` |
| `cuda-cuobjdump-13-3` | `13.3.73-1` |
| `cuda-compat-13-3` | `610.43.02-1ubuntu1` |

Missing, unpacked, half-configured, differently versioned, held or wrong-architecture
entries fail this deliberately exact profile. The installed package database is
queried using `dpkg-query --showformat` for package name, binary package name,
status, version and architecture. `dpkg-query --search` must identify exactly the
declared owner of every resolved native binary path, including cuobjdump and the
driver userspace library. A copied but unowned library does not qualify. There is
no runfile, arbitrary-prefix or native pip-package fallback and no requirement for
a `version.json` file. A newer driver coordinate needs a reviewed profile change;
this profile does not promise cross-version forward compatibility on arbitrary GPUs.

## Commands

Run from this example's directory. Provision the selected interpreter and the
six NVIDIA packages from the owner's Ubuntu 24.04 repository first, using their
exact versions above. `CUDA_PATH` defaults to `/usr/local/cuda-13.3`; any supplied
alias and `CUDA_HOME` must resolve to that same Debian installation root. Select
the registered compat userspace library before starting Python:

```sh
export LD_LIBRARY_PATH=/usr/local/cuda-13.3/compat:/usr/local/cuda-13.3/lib64
bash scripts/setup.sh
.venv/bin/python ex21.py host-test
.venv/bin/python ex21.py check-environment --phase native-packages
.venv/bin/python ex21.py check-environment
.venv/bin/python ex21.py build --arch 75
.venv/bin/python ex21.py run --size 1003
```

`setup.sh` checks the exact interpreter and host before creating `.venv`, uses
pip's `--require-hashes --only-binary=:all:` with `requirements.lock`, and checks
the installed versions/dependency closure. It does not use `--no-deps` or install
native CUDA packages. It refuses to overwrite an existing `.venv`; a fresh
working copy is required for another hash-checked installation. It retains pip's
installation report in `build/setup-install.json`. A failed install is not a
usable selected profile.

`check-environment --phase interpreter` is setup's host preflight;
`--phase packages` adds Python distribution pins. `--phase native-packages`
additionally checks real installed Debian records and resolved file ownership/
hashes without importing CUDA. These installed-file observations appear in
`environment.nativeFiles`, not as loaded libraries. The default `--phase native`
then imports the canonical public APIs, validates actual compiler/linker/driver
library paths against those owned files, and reports NVRTC's supported targets.
It does not enumerate GPUs or initialize a device/context. NVRTC-builtins is
explicitly unobserved in `environment.nativeLibraries.nvrtcBuiltins` until a
successful compilation; `check-environment` alone does not validate its loading.
`run` additionally checks the matching kernel driver before selecting visible
device 0 and making its primary context current.

For independent CPU logic checks on a development machine without any CUDA
packages, use a local CPython 3.10+ interpreter:

```sh
python3 -I -S ex21.py host-test
```

This exception is only for CPU logic, not an accepted CUDA profile. `host-test`
uses stdlib ctypes storage and literal results; it does not fake GPU buffers or
launches. It covers sizes 1, 255, 256, 257 and 1003, invalid sizes, wrong lengths,
nonfinite inputs and outputs, first/middle/final-element mismatches and a
multi-mismatch count. Its `cleanupChecks` additionally exercises real Python
stderr (including a non-fd sink), native fd 2 writes, warnings, exceptions,
reference-release diagnostics, truncation, restoration and preservation of an
earlier error. These diagnostic-plumbing checks deliberately replay labeled
expected diagnostics to stderr; their successful classification, not an empty
stderr log, is the host-test acceptance criterion. They import no CUDA and do
not run as part of `run`'s CPU correctness checks. A host-test pass grants no
CUDA Evidence Status.

## Compilation Without A GPU

`build --arch 75` passes explicit `compute_75` and `sm_75` targets rather than
asking a device for its architecture. NVRTC produces relocatable C++17 PTX;
immediately afterward, the CLI inspects its own Linux `/proc/self/maps` for the
actually mapped NVRTC-builtins file. It requires exactly one non-deleted mapped
file at the declared `libnvrtc-builtins.so.13.3.33` path, owned by the installed
`cuda-nvrtc-13-3=13.3.33-1` package, with the same hash as the inspected package
file. The loaded path, SHA-256, owner, package version and mapping identity are
recorded explicitly; missing, wrong-patch, unowned or multiple builtins fail.
This identity is never inferred from `nvrtcVersion()`. Then nvJitLink explicitly
produces cubin. The CLI refuses core's Driver linker
fallback. It checks the PTX entry/target and ELF cubin, then invokes the selected
Toolkit's `cuobjdump --dump-sass` to inspect the kernel and SM. It never calls
`Device()`, `set_current()`, `get_kernel()` or `launch()` on this path.

GPU-free is **not driver-library-free** for the pinned core 1.2.0:
`Program.compile("ptx")` internally queries `cuDriverGetVersion()` to assess PTX
loadability. That query does not call `cuInit` or create a context. A real driver
userspace library must be discoverable; a missing driver library or Toolkit stub
is a failure, not a reason to patch core, inject a fake driver or skip the stage.

NVRTC's default native cache is a separate initialization path: since CUDA 12.9
it calls `cuInit()` on the first compilation. EX21 sets `CUDA_CACHE_DISABLE=1`
before CUDA imports and uses `ProgramOptions(no_cache=True)` and
`LinkerOptions(no_cache=True)` so that path is disabled. `cachePolicy` records
this configuration. Omitting device construction alone would not be enough to
claim a no-initialization compilation path with default NVRTC caching.

Compilation defaults to `build/compile`; GPU execution defaults to `build/run`.
Both retain `report.json`, PTX, cubin, compiler/linker logs and `sass.txt`.
`--output-dir` selects a different destination, including paths containing spaces.
Existing result files cause failure instead of cache reuse or overwriting a prior
verdict. Use a fresh directory for each additional attempt:

```sh
.venv/bin/python ex21.py run --size 1 --output-dir build/run-1
.venv/bin/python ex21.py run --size 255 --output-dir build/run-255
.venv/bin/python ex21.py run --size 256 --output-dir build/run-256
.venv/bin/python ex21.py run --size 257 --output-dir build/run-257
```

`build` and `run` use the same kernel and compilation/linking path. A direct
`Program(..., arch="sm_75").compile("cubin")` would be a different path; it
would not demonstrate this explicit Linker stage. This example does not ship a
second low-level implementation.

## Correctness And Lifetime

Inputs are `a[i] = (i % 37) * 0.25` and `b[i] = -(i % 19) * 0.5`. The CPU
reference adds the values read back from stored `ctypes.c_float` inputs. Twelve
independently worked literals include both periodic wrap points and index 1002,
whose expected sum is -6.25. The chosen small values and sums are binary-exact
in FP32, so exact equality is appropriate here, not a general floating-point rule.

Three pinned host Buffers and three device Buffers have identical byte extents.
Only pinned host handles become ctypes views. The views borrow storage and do
not keep its Buffer alive. Two H2D input copies and a NaN output-sentinel upload,
kernel launch, and explicit D2H destination all use the same owned nonblocking
stream. `ctypes.c_uint32(n)` matches the kernel's `unsigned int`; an untyped
Python integer would not promise the same scalar ABI.

The default 1003 elements require four 256-thread blocks and leave 21 inactive
tail threads. Sizes must be integers in `[1, 1000000]`; zero never submits a
zero-grid launch. At the maximum size, caller device arrays use 12 MB and pinned
host arrays another 12 MB. CPU references and library/context resources are
additional. There is no allocation-success guarantee or performance claim.

`stream.sync()` must succeed before any output is read. Every result and
reference must be finite and exactly equal. Validation reports the first failing
index and total mismatch count, not just a sample. The NaN sentinel makes a
missed kernel store fail rather than accidentally match recycled memory.

On success, the host stops using its views, closes buffers with that same stream,
drains queued frees with another checked sync, and closes the owned stream.
Pinned allocation is synchronous and pinned deallocation synchronizes; neither
implies allocation/copy overlap. Device allocation may use a pool or a fallback.

On failure, cleanup first attempts completion while resources still live, then
attempts all releases without replacing the first exception. Compiler/linker logs
are read before their supported `close()` calls. `ObjectCode` and `Kernel` have
no public `close()`; core's shared ownership manages the loaded CUDA library.
The standalone process does not reset/destroy a primary context, close a Device,
or pass a CUlibrary handle to a legacy module-unload function.

Each explicit cleanup action captures both Python `sys.stderr` and native file
descriptor 2, with both restored in `finally`. Raised exceptions are retained in
`cleanupErrors`; `cleanupWarnings` retains all captured stderr, including Python
warnings and direct callback/destructor diagnostics, regardless of their apparent
severity. Any nonempty diagnostic, including whitespace, conservatively fails the
command even if later synchronization succeeds. A prior operation's exception
and stage remain primary; cleanup problems are additional diagnostics.

Capture uses an unbuffered temporary-file spool. At most 16 KiB of its bytes are
read as diagnostic payload, plus one byte to detect truncation; retained text is
also capped at 16,384 characters, plus the action label and truncation marker.
Exception messages are bounded too. Retained diagnostics are replayed to restored
stderr. This bounds report/replay payloads, not the temporary file's disk usage.
Capture or replay failure is itself a cleanup failure; inability to set up capture
does not prevent attempting the release.

Explicit Kernel/ObjectCode reference release uses the same capture helper,
without invented public `close()` methods. Capture covers diagnostics actually
emitted during those explicit actions, not delayed garbage collection, references
retained elsewhere, buffered native output emitted later, or interpreter-shutdown
destructors after the verdict. It changes process-global stderr and warning state
and is only for this single-threaded standalone process, not a reusable process
library or concurrent application. Retain stderr as well as JSON. Stream
destruction is not a substitute for checked completion, and a fatal asynchronous
error does not establish a healthy context merely because later cleanup returns.

## Reports And Evidence

Commands print JSON to stdout; tracebacks and diagnostics remain on stderr.
Argument errors exit 2; profile, CUDA, correctness, artifact and cleanup failures
exit nonzero. Reports retain stage, original exception type/message and actual
artifact hashes. An attempted launch with failed completion reports
`gpuExecuted: null`, not successful execution; `launchAttempted` is separate.
An empty `nvrtc.log` on compilation failure is not absence of diagnostics: core
attaches the compilation log to its exception, while `logs=` captures successful
compilation logs.

NVRTC and nvJitLink API version pairs must both be 13.3. Neither exposes patch 33.
`environment.toolkit.packages` records the installed Debian status, full version,
architecture and binary package names; the two required metapackages establish
the Toolkit 13.3.1 installation coordinate. `environment.nativeLibraries` records
actual loaded paths, hashes and ownership. The after-compilation builtins entry
also records `observedVia` and `mappingIdentity`, without exporting the process's
other mappings or virtual addresses. Local package records and file hashes do
not independently authenticate an upstream binary; retain the signed-repository
or hash-pinned installer provenance from `native-profile.json` too. The driver
API level is not a driver package version, and `run` requires the kernel module
to match the exact 610.43.02 userspace package coordinate.

The repository CI runner hashes the native profile, the canonical build inputs
and its own runner/helper inputs. In its disposable container it checks real
compiler-package removal, unpacked status and an unowned copy of the real NVRTC
library, restores them, then runs the normal import/build/invalid-source/stale-
output CLI checks. It verifies the installed driver bytes against the hash-pinned
compat DEB, but loads the registered library, not the extracted comparison copy.
Only scanned text reports are retained. No such gate automatically promotes
compilation or runtime Evidence Status.

`environment-manifest.json` is deliberately blank. Fill an external copy from
actual observations; do not substitute the target profile or this template for
machine evidence. Generated reports can contain local paths: review/redact
private data before any public evidence retention. The project has no retained
compilation records or runtime observations and remains **Pending Hardware
Verification**. Expected shapes/results above are not an observed log transcript.
See `evidence/README.md` for the remaining acceptance work.

## Sources And Licenses

Owner APIs, signatures and support policy reviewed on 2026-09-12:

- [Core 1.2.0 installation](https://nvidia.github.io/cuda-python/cuda-core/1.2.0/install.html) and [support](https://nvidia.github.io/cuda-python/cuda-core/1.2.0/support.html).
- [Bindings 13.4.1 installation](https://nvidia.github.io/cuda-python/cuda-bindings/13.4.1/install.html) and [support](https://nvidia.github.io/cuda-python/cuda-bindings/13.4.1/support.html).
- [Core Program source at the selected release](https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/cuda/core/_program.pyx), [Linker source](https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/cuda/core/_linker.pyx), and [driver-version query](https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/cuda/core/_utils/version.pyx).
- [Core 1.2.0 Device API](https://nvidia.github.io/cuda-python/cuda-core/1.2.0/generated/cuda.core.Device.html), [Buffer](https://nvidia.github.io/cuda-python/cuda-core/1.2.0/generated/cuda.core.Buffer.html), [LegacyPinnedMemoryResource](https://nvidia.github.io/cuda-python/cuda-core/1.2.0/generated/cuda.core.LegacyPinnedMemoryResource.html), [Stream](https://nvidia.github.io/cuda-python/cuda-core/1.2.0/generated/cuda.core.Stream.html) and [launch](https://nvidia.github.io/cuda-python/cuda-core/1.2.0/generated/cuda.core.launch.html).
- [Stable NVRTC bindings source](https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvrtc.pyx) and [stable nvJitLink bindings source](https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvjitlink.pyx). NVRTC uses checked status-first tuples; nvJitLink's version function returns a pair and failures raise exceptions.
- [Toolkit 13.3.1 component/driver release notes](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-toolkit-release-notes/index.html), [Linux installation guide](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-installation-guide-linux/index.html), and [nvJitLink compatibility](https://docs.nvidia.com/cuda/archive/13.3.1/nvjitlink/index.html#compatibility).
- [NVIDIA Ubuntu 24.04 package index](https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/Packages), [Ubuntu dpkg-query machine formats and ownership queries](https://manpages.ubuntu.com/manpages/noble/en/man1/dpkg-query.1.html), [Linux process mappings](https://man7.org/linux/man-pages/man5/proc_pid_maps.5.html) and [NVRTC builtins versioning](https://docs.nvidia.com/cuda/archive/13.3.1/nvrtc/index.html#nvrtc-builtins-library). Exact archive coordinates and hashes are in `native-profile.json`.
- [NVRTC 13.3 caching and driver initialization](https://docs.nvidia.com/cuda/archive/13.3.1/nvrtc/index.html#caching-cuda-12-9).
- [CPython 3.14.7 release](https://www.python.org/downloads/release/python-3147/) and [ctypes ownership documentation](https://docs.python.org/release/3.14.7/library/ctypes.html#ctypes._CData.from_address).
- CPython 3.14.7 [stderr redirection and its global-state limits](https://docs.python.org/release/3.14.7/library/contextlib.html#contextlib.redirect_stderr), [descriptor duplication](https://docs.python.org/release/3.14.7/library/os.html#os.dup2) and [temporary files](https://docs.python.org/release/3.14.7/library/tempfile.html#tempfile.TemporaryFile).
- Exact wheel metadata: [core](https://pypi.org/pypi/cuda-core/1.2.0/json), [bindings](https://pypi.org/pypi/cuda-bindings/13.4.1/json), [pathfinder](https://pypi.org/pypi/cuda-pathfinder/1.8.1/json), [NumPy](https://pypi.org/pypi/numpy/2.5.3/json). `requirements.lock` identifies the four Linux/GIL artifacts by SHA-256.

CUDA Python components retain their Apache-2.0 licenses and bundled notices:
[core license](https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/LICENSE),
[core NOTICE](https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/NOTICE),
[bindings license](https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/LICENSE),
[pathfinder license](https://github.com/NVIDIA/cuda-python/blob/e606d084ccfc502a29990f34fbb6ba7a91655c24/cuda_pathfinder/LICENSE).
Core NOTICE includes vendored DLPack and PyTorch interface material. NumPy's
wheel includes BSD-3-Clause, 0BSD, MIT, Zlib and CC0-1.0 components with bundled
notices; retain its complete `.dist-info/licenses` if redistributing that wheel.
CPython uses the PSF license stack. Native CUDA libraries are separately governed
by NVIDIA terms; CUDA Python's license does not relicense the Toolkit.
