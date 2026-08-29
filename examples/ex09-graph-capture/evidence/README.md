<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX09 Evidence Records

This directory intentionally contains no JSON records because no qualifying EX09 compilation record exists. No compilation Evidence Status is assigned.

Only sanitized passing records produced by a repository CUDA compile workflow may be added. A record must identify the source commit, canonical build-contract hash, workflow run, runner, pulled image, actual operating system and compilers, C++17 dialect, target, commands, generated-artifact hashes, host-reference result, and the fact that the CUDA executable was not executed.

Runtime remains Pending Hardware Verification. A qualifying runtime record must use a declared Reference Environment, preserve the fixed graph contract, three-launch count, complete exact correctness verdict, explicit completion boundary, and a complete Environment Manifest. The host test cannot establish capture, CUDA graph execution, replay, or performance. This directory records no timing, launch overhead, latency, throughput, speedup, or other performance quantity.
