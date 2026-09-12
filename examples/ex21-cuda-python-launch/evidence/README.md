<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX21 Evidence Boundary

No selected-profile installation, CUDA compilation, GPU execution, sanitizer or
performance record is retained here. `project.json` declares no compilation
evidence and no recorded observations. Runtime remains **Pending Hardware
Verification**. CPU tests, Python parsing, wheel metadata checks, expected output
and browser checks cannot promote either CUDA evidence axis.

The one Python environment is separate from C++ Toolkit Lanes.
`compatibility.lanes` is intentionally empty: the Python host is not a new C++
dialect. The kernel itself uses C++17 through NVRTC. The explicitly declared
Python compilation check executes the public `build --arch 75` CLI and inspects
artifacts, without driver initialization or GPU execution. EX21 as a whole still
requires GPU correctness and is not Runtime-Not-Applicable.

## Compilation Acceptance

Retain the source commit and build-contract hash, exact interpreter provenance,
GIL ABI, OS and installed package revisions, four wheel hashes, pip installation
report, native-profile hash and runner/helper input hashes. Retain the machine-
readable `dpkg-query` records for all six declared NVIDIA Debian packages, with
exact installed status, full versions and architecture. Both Toolkit metapackages
are required, even though EX21 never invokes NVCC. Retain actual resolved file
ownership, compiler/linker paths and hashes, their major/minor API pairs, the
registered compat driver userspace identity, cuobjdump version,
commands, stage verdicts, PTX/cubin hashes and SASS inspection. Include stdout
and stderr, not only `report.json`. Use the blank `environment-manifest.json` as
an inventory, not as an observation.

Core 1.2.0's PTX path calls `cuDriverGetVersion()`, so a real userspace driver
library is needed even on a GPU-free build host. No stub or private monkeypatch
may replace it. NVRTC's default cache calls `cuInit()`: retain the explicit
`no_cache=True` compiler/linker options and `CUDA_CACHE_DISABLE=1` configuration
that disables this initialization path. The profile requires registered NVIDIA Debian files, not a
runfile fallback or a `version.json` file. Native version APIs do not expose
patch 33. After NVRTC compilation, the program records the actually mapped
NVRTC-builtins path, hash, package owner/version and mapping identity from
`/proc/self/maps`. Before compilation it remains unobserved as a loaded library;
an installed-file hash is a distinct observation. Missing, deleted, unowned or
wrong-patch builtins fail. Package database records are not independent binary
authentication: retain the NVIDIA repository/DEB identities as well. No
compilation success is claimed until the complete check is retained and reviewed.

The repo CLI tests enable real compilation only when `EX21_PROFILE_PYTHON`
identifies the selected Linux interpreter with its installed hashed wheels and
native libraries. They exercise the real package-inspection CLI, successful
artifacts and a learner-edited invalid kernel. Without that environment these
three native tests are explicitly skipped, never replaced by mocked CUDA.
The CI runner additionally removes/unpacks the real compiler metapackage and
redirects the real NVRTC file to an unowned copy inside its disposable container.
Each must fail the public `native-packages` preflight; all package/file state is
restored before CUDA imports. These tests do not remove packages on a learner's
host. A successful package installation or inspection alone is not compilation
evidence, and the driver comparison DEB's extracted libraries are never loaded.

The public `host-test` command also reports `cleanupChecks`. It exercises real
Python stderr, native `os.write(2, ...)`, warnings, exceptions and a CPU object's
reference-release diagnostic through the same cleanup helper used by build/run.
It checks bounded retention, restoration of both sinks, and that a later clean
action cannot clear a failure or replace an earlier exception. Expected diagnostic
markers in this host-test's stderr are intentional. This is CPU diagnostic
plumbing, not a CUDA mock or evidence of native CUDA teardown behavior.

## Runtime Acceptance

Use a declared Native Linux Reference Environment with a supported GPU. Record
GPU name, compute capability, memory, visible device count/order, actual kernel
driver and userspace versions, all environment and artifact identities, then run
1003 and the boundary sizes 1, 255, 256 and 257 in separate fresh output
directories. Every output must pass finite exact comparison after stream sync.
The default geometry should be four blocks and 21 inactive tail threads; these
remain expected observations until executed and reviewed.

Check errors at compilation, linking, lazy load/symbol lookup, copies, launch and
synchronization. Review partial-allocation and fatal-asynchronous cleanup on real
hardware, preserving the first diagnostic and the retained cleanup stderr. Core
callbacks may print to Python stderr and native destructors may write directly
to fd 2 without raising. The explicit-cleanup helper captures both: exceptions
populate `cleanupErrors`, and any nonempty captured stderr populates
`cleanupWarnings` and fails the verdict even if subsequent sync succeeds.
Capture includes explicit Kernel/ObjectCode reference release. Retained/replayed
payloads are bounded to 16 KiB of captured bytes and 16,384 decoded characters
per action, with a label and truncation marker; the temporary-file spool itself
is not disk-quota bounded. A truncated record is not a complete diagnostic log.

This process-global capture is for a single-threaded standalone process. It
does not claim to catch deferred releases, later buffered output or interpreter
shutdown after the verdict. Those limitations and real native cleanup still
require review in the selected environment. A failed sync does not prove safe
teardown or a healthy context. Add appropriate Compute Sanitizer checks before
making memory-safety claims. These CUDA runtime/error-path checks have not been
completed here.

There is no timer or benchmark in EX21. Leave measurement fields unobserved (or
explicitly explain that none were measured) instead of inventing durations,
speedups, overlap, deterministic teardown or a GPU model. A successful command
does not automatically write publication evidence or upgrade the project status.
