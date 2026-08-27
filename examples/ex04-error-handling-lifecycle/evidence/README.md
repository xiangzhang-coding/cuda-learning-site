<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX04 Evidence Records

This directory intentionally contains no JSON records because no qualifying EX04 compilation record exists. No compilation Evidence Status is assigned.

Only sanitized passing records produced by the repository CUDA compile workflow may be added. A record must identify the source commit, canonical build-contract hash, workflow run, runner, pulled image, actual operating system and compilers, C++17 dialect, target, commands, generated-artifact hashes, host-reference result, and the fact that no EX04 scenario was executed.

Runtime remains Pending Hardware Verification. A qualifying runtime record must use a declared Reference Environment, run each scenario in a separate process, preserve the immediate and deferred observation boundaries, include the host-verification verdicts, and avoid treating a fatal CUDA context as reusable. No error code, output transcript, or performance result is recorded here.
