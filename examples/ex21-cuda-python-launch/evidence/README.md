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
report, system Toolkit coordinate, compiler/linker resolved paths and hashes,
their major/minor API pairs, actual driver userspace identity, cuobjdump version,
commands, stage verdicts, PTX/cubin hashes and SASS inspection. Include stdout
and stderr, not only `report.json`. Use the blank `environment-manifest.json` as
an inventory, not as an observation.

Core 1.2.0's PTX path calls `cuDriverGetVersion()`, so a real userspace driver
library is needed even on a GPU-free build host. No stub or private monkeypatch
may replace it. Native compiler/linker patch provenance needs installation
evidence: the version APIs do not expose patch 33. Also identify the actually
loaded NVRTC builtins library; a selected filename is not an authenticated
binary. No compilation success is claimed until this complete check is retained
and reviewed under the project's evidence policy.

The repo CLI tests enable real compilation only when `EX21_PROFILE_PYTHON`
identifies the selected Linux interpreter with its installed hashed wheels and
native libraries. They exercise successful artifacts and a learner-edited
invalid kernel through the same public CLI. Without that environment the two
real compiler tests are explicitly skipped, never replaced by mocked CUDA.

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
hardware, preserving the first diagnostic and all cleanup stderr. Core RAII can
warn without raising, and a failed sync does not prove safe teardown or a healthy
context. Add appropriate Compute Sanitizer checks before making memory-safety
claims. These runtime/error-path checks have not been completed here.

There is no timer or benchmark in EX21. Leave measurement fields unobserved (or
explicitly explain that none were measured) instead of inventing durations,
speedups, overlap, deterministic teardown or a GPU model. A successful command
does not automatically write publication evidence or upgrade the project status.
