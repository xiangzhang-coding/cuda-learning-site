<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX19 Evidence Boundary

No CUDA compilation, GPU runtime, or performance record is retained here.
The compilation array and recorded observations remain empty; runtime remains
Pending Hardware Verification. Host tests, preprocessor-gate tests with test
headers, build dry runs, and failure-injection tests grant no Compile-Checked
status and no GPU runtime status.

Future compile evidence must retain source identity, build-contract hash, exact
profile and container/toolchain coordinates, stage statuses, artifacts, and
dynamic-linkage reports. The compile runner never executes the CUDA program.

Runtime evidence additionally requires a Reference Environment, a complete
Environment Manifest, resolved cuFFT library/package identity and file hashes,
loaded major/minor/patch and raw version, driver/runtime API levels, workspace
bytes, stdout/stderr, and all forward/inverse/normalization correctness checks.
The version APIs do not expose the loaded cuFFT build number or the driver and
Toolkit package identities. Expected results in the README are not observations.
