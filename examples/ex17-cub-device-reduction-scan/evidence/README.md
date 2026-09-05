<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX17 Evidence Records

This directory intentionally contains no JSON records. The three Toolkit-bundled checks and two independently selected CCCL checks each have empty compilation evidence, so no Compile-Checked status is assigned.

A future compilation record must identify one declared profile, the exact Toolkit image and digest, the dependency mode, the resolved include roots, the observed `CUB_VERSION`, the canonical build-contract hash, generated artifact hashes, and the passing pure-host reference result. The compile check must not execute the CUDA binary.

Runtime remains Pending Hardware Verification. A future qualifying runtime record must use a declared Reference Environment, retain the 4,099-element reduction and scan inputs, satisfy the reduction comparator, match both scan references exactly, and include a complete Environment Manifest. No runtime or timing observation is recorded here.
