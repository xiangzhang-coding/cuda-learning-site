<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX10 Compile Evidence Records

Run [33275734951](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/33275734951) produced the retained records for source commit `904c6da03800ed3012baacb861494377c0fa01f2`. All six records bind build contract SHA-256 `9b2df37e1ee6f7d6c51fea80d90f0bcff4a13d2dcd83fb2cf150a269f02a41f7`.

The five ordinary `Compile-Checked` records are `cuda-11-8-cxx17.json`, `cuda-12-9-cxx17.json`, `cuda-12-9-cxx20.json`, `cuda-13-3-cxx17.json`, and `cuda-13-3-cxx20.json`. Together they cover every declared Lane/dialect row. Each record covers every declared stage and artifact, identifies the canonical build-contract hash, runner, digest-pinned `linux/amd64` image, actual image, and toolchain coordinates, and states that neither the final host artifact nor a GPU executable was executed. Its compact `inspection` field durably retains the complete PTX/ELF inventories, artifact-test facts, caller-undefined/device-link-defined symbol transition, and stage exit statuses; the artifact ledger retains paths, sizes, and hashes for the larger generated outputs.

`cuda-13-3-gcc14-cxx23-probe.json` records a successful narrow `C++23-Dialect-Probe` under CUDA Toolkit 13.3.1, NVCC 13.3.73, and GCC 14.2.0. It identifies the exact pinned base image, derived image identity, Dockerfile, installed `g++-14` package version, compiler line, complete sanitized compiler output, zero exit statuses, ELF inventory, and C++23 object hash. It does not declare ordinary EX10 C++23 support or make a claim about another compiler or platform.

No record executes the final host artifact or a GPU executable, and no record contains runtime, correctness, or performance evidence. EX10 runtime remains Runtime-Not-Applicable and recorded observations remain empty.
