<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX20 Evidence Boundary

No CUDA compilation, GPU runtime, determinism, workspace measurement, or
performance record is retained here. Compilation and recorded observations
remain empty; runtime remains Pending Hardware Verification. Host tests,
preprocessor-gate tests with test headers, dry runs, and failure injection grant
no Compile-Checked status and no GPU runtime status.

Future compile evidence must retain source identity, build-contract hash,
exact component profile and container/toolchain coordinates, stage statuses,
artifacts, and dynamic-linkage reports. The compile runner never executes the
CUDA program. A successful CI job alone does not update project evidence.

Runtime evidence additionally requires a Reference Environment, complete
Environment Manifest, resolved cuSPARSE library/package identity and file
hashes, loaded major/minor/patch and raw version, driver/runtime API levels,
actual workspace bytes per fixture, stdout/stderr, and both finite full-output
correctness checks against the CPU reference and literal expectations.
Version APIs do not expose the loaded cuSPARSE build number, Toolkit package
patch, or driver package identity. Expected results are not observations;
correctness checks are not a benchmark or a determinism experiment.
