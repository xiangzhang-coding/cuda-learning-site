<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX13 Evidence Records

This directory intentionally contains no JSON records because no qualifying EX13 compilation record exists. The compilation evidence array is empty.

Only a sanitized passing record from the repository CUDA compile workflow may be added. It must identify the pinned source commit, canonical build-contract hash, workflow run, runner, pulled image, actual operating system and compilers, C++17 dialect, target, commands, artifact hashes, host-reference result, and the fact that the CUDA executable was not executed.

Runtime remains Pending Hardware Verification. A qualifying record must use a declared Reference Environment, run all three fixtures through both kernels, retain every exact comparison and sum-of-bins result, and include a complete Environment Manifest. No contention behavior, timing, throughput, speedup, or other performance quantity is recorded here.
