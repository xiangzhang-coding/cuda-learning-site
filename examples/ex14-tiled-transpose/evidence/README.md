<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX14 Evidence Records

This directory intentionally contains no JSON records because no qualifying EX14 compilation record exists. The compilation evidence array is empty.

Only a sanitized passing record from the repository CUDA compile workflow may be added. It must identify the pinned source commit, canonical build-contract hash, workflow run, runner, pulled image, actual operating system and compilers, C++17 dialect, target, commands, artifact hashes, host-reference result, and the fact that the CUDA executable was not executed.

Runtime remains Pending Hardware Verification. A qualifying runtime record must use a declared Reference Environment, run all three fixtures, retain output dimensions and every exact element comparison, and include a complete Environment Manifest.

A passing host test is not CUDA compilation or runtime evidence. This directory records no speedup, transaction count, bank-conflict observation, timing, or profiler claim.
