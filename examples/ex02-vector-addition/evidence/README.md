<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX02 Compile Evidence Records

Only sanitized passing records produced by `.github/workflows/cuda-compile.yml` may be committed here. Each JSON record must identify the source commit, canonical build-contract hash, workflow run, runner, pulled image, actual operating system and compilers, dialect, target, commands, generated-artifact hashes, and the fact that the CUDA executable was not executed. The site validates all of those fields before displaying a passing status.

A failed, cancelled, skipped, blocked, or manually reconstructed EX02 record grants no Compile-Checked status. The C++23 dialect probe records either a passing or unsupported boundary with its diagnostic; neither outcome is EX02 compilation evidence.
