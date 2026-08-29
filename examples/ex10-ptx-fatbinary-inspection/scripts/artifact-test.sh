#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -ne 1 ]]; then
  printf 'Usage: artifact-test.sh <build-dir>\n' >&2
  exit 2
fi

build_dir="$1"
final_artifact="$build_dir/ex10-ptx-fatbinary-inspection"

for artifact in \
  artifact_kernel.ii \
  artifact_kernel.ptx \
  artifact_kernel.cubin \
  artifact_kernel.fatbin \
  device_math.o \
  caller.o \
  device_link.o \
  ex10-ptx-fatbinary-inspection; do
  test -s "$build_dir/$artifact"
done

test -x "$final_artifact"
(cd "$build_dir" && sha256sum --check artifact-sha256.txt)
grep -Eq '\.target[[:space:]]+sm_75' "$build_dir/artifact_kernel.ptx"
grep -Eq 'sm_75' "$build_dir/cuobjdump-ptx-list.txt"
grep -Eq 'sm_75' "$build_dir/cuobjdump-elf-list.txt"
grep -Eq '(Fatbin ptx code:|\.target[[:space:]]+sm_75)' "$build_dir/cuobjdump-ptx.txt"
grep -Eq 'artifact_kernel' "$build_dir/cuobjdump-sass.txt"
grep -Eq '(EF_CUDA_SM75|\.text\.artifact_kernel)' "$build_dir/cuobjdump-elf.txt"
grep -Eq 'artifact_kernel' "$build_dir/cuobjdump-symbols.txt"
grep -Eq 'ex10_device_scale' "$build_dir/symbol-link-ledger.txt"
grep -Eq 'ex10_caller_kernel' "$build_dir/symbol-link-ledger.txt"

{
  printf '%s\n' 'artifact-test=pass'
  printf '%s\n' 'target-native=sm_75'
  printf '%s\n' 'target-virtual=compute_75'
  printf '%s\n' 'host-executable-executed=false'
  printf '%s\n' 'gpu-executable-executed=false'
  printf '%s\n' 'runtime-evidence=Runtime-Not-Applicable'
  printf '%s\n' 'performance-measured=false'
} > "$build_dir/artifact-test-report.txt"
