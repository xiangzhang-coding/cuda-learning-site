<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX01 Evidence Records

This directory intentionally contains no compilation or runtime record. The canonical manifest therefore declares an empty compilation-evidence array and Pending Hardware Verification for runtime.

A host-only contract-test result, a successful local build, a container tag, or an unreviewed report grants no CUDA Evidence Status. Future records must identify the exact source revision, build contract, Toolkit Lane, actual toolchain and environment, commands, artifacts, execution boundary, and review basis. The compile-check script builds the CUDA executable but never runs it.

EX01 JSON is an observation input, not a complete Environment Manifest and not a compatibility, tier, Reference Environment, or evidence decision.
