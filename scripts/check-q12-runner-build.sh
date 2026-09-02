#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -ne 1 ]]; then
  printf 'Usage: check-q12-runner-build.sh <result-dir>\n' >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "$script_dir/.." && pwd)"
result_dir="$1"
runner_source="$project_root/public/assets/exercise-solutions/q12-reduction-candidates.cu"
reference_dir="$project_root/examples/ex11-multi-stage-reduction/include"

mkdir -p -- "$result_dir"
temporary_dir="$(mktemp -d "${TMPDIR:-/tmp}/q12-runner-build.XXXXXX")"
trap 'rm -rf -- "$temporary_dir"' EXIT
binary="$temporary_dir/q12-reduction-candidates"

run_recorded() {
  local stdout_path="$1"
  local stderr_path="$2"
  local status_path="$3"
  shift 3

  local status=0
  if "$@" >"$stdout_path" 2>"$stderr_path"; then
    status=0
  else
    status=$?
  fi
  printf '%s\n' "$status" >"$status_path"
  return "$status"
}

(
  cd -- "$project_root"
  sha256sum \
    public/assets/exercise-solutions/q12-reduction-candidates.cu \
    examples/ex11-multi-stage-reduction/include/multi_stage_reduction_reference.hpp \
    scripts/check-q12-runner-build.sh
) >"$result_dir/q12-runner-inputs.sha256"

run_recorded \
  "$result_dir/q12-runner-compile.stdout.log" \
  "$result_dir/q12-runner-compile.stderr.log" \
  "$result_dir/q12-runner-compile.status" \
  nvcc \
    --std=c++17 \
    --generate-code=arch=compute_75,code=sm_75 \
    --generate-code=arch=compute_75,code=compute_75 \
    --include-path "$reference_dir" \
    "$runner_source" \
    --output-file "$binary"

run_recorded \
  "$result_dir/q12-runner-cubin.inspection.txt" \
  "$result_dir/q12-runner-cubin.stderr.log" \
  "$result_dir/q12-runner-cubin.status" \
  cuobjdump --list-elf "$binary"

run_recorded \
  "$result_dir/q12-runner-ptx.inspection.txt" \
  "$result_dir/q12-runner-ptx.stderr.log" \
  "$result_dir/q12-runner-ptx.status" \
  cuobjdump --dump-ptx "$binary"

inspection_status=0
if ! grep -Eq 'sm_75' "$result_dir/q12-runner-cubin.inspection.txt"; then
  inspection_status=1
fi
if ! grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' \
    "$result_dir/q12-runner-ptx.inspection.txt"; then
  inspection_status=1
fi
printf '%s\n' "$inspection_status" \
  >"$result_dir/q12-runner-target-inspection.status"
if [[ "$inspection_status" -ne 0 ]]; then
  exit "$inspection_status"
fi

(
  cd -- "$result_dir"
  sha256sum \
    q12-runner-compile.stdout.log \
    q12-runner-compile.stderr.log \
    q12-runner-cubin.stderr.log \
    q12-runner-ptx.stderr.log
) >"$result_dir/q12-runner-logs.sha256"

(
  cd -- "$result_dir"
  sha256sum \
    q12-runner-cubin.inspection.txt \
    q12-runner-ptx.inspection.txt
) >"$result_dir/q12-runner-inspection.sha256"
