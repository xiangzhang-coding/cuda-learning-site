<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX10 Compile Evidence Records

No compile record is committed initially. Only sanitized passing records produced by the EX10 job in `.github/workflows/cuda-compile.yml` may be added here after the canonical URLs are repinned to the evidence commit.

An ordinary EX10 record must cover every declared stage and artifact, identify the canonical build-contract hash, runner, digest-pinned `linux/amd64` image, actual image and toolchain coordinates, and state that neither the host artifact nor a GPU artifact was executed. Runtime remains Runtime-Not-Applicable.

The CUDA 13.3.1 C++23 record is a probe only. It must identify the exact pinned base image, derived image identity, Dockerfile, installed `g++-14` package version, actual GCC 14 compiler line, and C++23 object hash. It grants no C++23 Compile-Checked status to the ordinary EX10 matrix.
