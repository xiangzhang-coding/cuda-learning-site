<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX07 Evidence Records

This directory intentionally contains no JSON records because no qualifying EX07 compilation record exists. No compilation Evidence Status is assigned.

Only sanitized passing records produced by a repository CUDA compile workflow may be added. A record must identify the source commit, canonical build-contract hash, workflow run, runner, pulled image, actual operating system and compilers, C++17 dialect, target, commands, generated-artifact hashes, host-reference result, and the fact that the CUDA executable was not executed.

Runtime remains Pending Hardware Verification. A qualifying runtime record must use a declared Reference Environment, preserve both path identities and exact correctness verdicts, and include a complete Environment Manifest. Device capability fields, stream structure, page-locked allocation, and timing-disabled dependency events do not establish that operations overlapped. This directory records no duration, bandwidth, throughput, speedup, or timeline observation.
