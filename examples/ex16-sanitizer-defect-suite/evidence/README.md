<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX16 Evidence Records

This directory intentionally contains no JSON records because no qualifying EX16 compilation record exists. No compilation Evidence Status is assigned.

The compile workflow may retain temporary sanitized build logs and inspection artifacts, but it executes neither the eight CUDA binaries nor any checking tool. A future compilation record must preserve the source commit, canonical build-contract hash, selected pinned image, actual toolchain coordinates, all eight artifacts at every declared stage, the metadata-only host result, and the no-GPU-execution boundary.

Runtime remains Pending Hardware Verification. A candidate runtime record must use a declared Reference Environment, run each case in a separate process, run memcheck first, preserve exact commands and exit statuses, and retain raw tool output outside this empty public directory until review. No sanitizer diagnostic, correctness result, timing, or performance observation is recorded here.
