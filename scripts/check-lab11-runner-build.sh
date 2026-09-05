#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  printf 'Usage: check-lab11-runner-build.sh <profile-id> [result-dir]\n' >&2
  exit 2
fi

profile_id="$1"
bundled_include_root="/usr/local/cuda/include"

case "$profile_id" in
  cuda-11-8-bundled-cub-1-15-1)
    component_mode="bundled"
    expected_cub_version="101501"
    ;;
  cuda-12-9-bundled-cub-2-8-2)
    component_mode="bundled"
    expected_cub_version="200802"
    ;;
  cuda-13-3-bundled-cub-3-3-4)
    component_mode="bundled"
    expected_cub_version="300304"
    bundled_include_root="/usr/local/cuda/include/cccl"
    ;;
  cuda-12-9-selected-cccl-3-4-2|cuda-13-3-selected-cccl-3-4-2)
    component_mode="selected"
    expected_cub_version="300402"
    ;;
  *)
    printf 'Unknown LAB11 runner profile: %s\n' "$profile_id" >&2
    exit 2
    ;;
esac

component_include_args=()
component_headers=()
if [[ "$component_mode" == "selected" ]]; then
  if [[ -z "${CCCL_ROOT:-}" ]]; then
    printf 'CCCL_ROOT is required by selected CCCL profiles\n' >&2
    exit 2
  fi
  for include_root in \
      "$CCCL_ROOT/cub" \
      "$CCCL_ROOT/thrust" \
      "$CCCL_ROOT/libcudacxx/include"; do
    if [[ ! -d "$include_root" ]]; then
      printf 'Missing selected CCCL include root: %s\n' "$include_root" >&2
      exit 2
    fi
    component_include_args+=(--include-path "$include_root")
  done
  component_headers=(
    "$CCCL_ROOT/cub/cub/version.cuh"
    "$CCCL_ROOT/cub/cub/device/device_reduce.cuh"
  )
else
  component_include_args=(--include-path "$bundled_include_root")
  component_headers=(
    "$bundled_include_root/cub/version.cuh"
    "$bundled_include_root/cub/device/device_reduce.cuh"
  )
fi

for component_header in "${component_headers[@]}"; do
  if [[ ! -f "$component_header" ]]; then
    printf 'Missing CUB profile header: %s\n' "$component_header" >&2
    exit 2
  fi
done

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "$script_dir/.." && pwd)"
runner_source="$project_root/public/assets/exercise-solutions/lab11-reduction-comparison.cu"
reference_dir="$project_root/examples/ex11-multi-stage-reduction/include"
if [[ $# -eq 2 ]]; then
  result_dir="$2"
else
  result_dir="$(mktemp -d "${TMPDIR:-/tmp}/lab11-${profile_id}.XXXXXX")"
fi

mkdir -p -- "$result_dir"
temporary_dir="$(mktemp -d "${TMPDIR:-/tmp}/lab11-runner-build.XXXXXX")"
trap 'rm -rf -- "$temporary_dir"' EXIT
preprocessed="$temporary_dir/lab11-reduction-comparison.ii"
object="$temporary_dir/lab11-reduction-comparison.o"
binary="$temporary_dir/lab11-reduction-comparison"

run_recorded() {
  local stdout_path="$1"
  local stderr_path="$2"
  local status_path="$3"
  shift 3

  local status=0
  {
    printf 'argv:'
    printf ' %q' "$@"
    printf '\n'
  } >>"$result_dir/lab11-runner-commands.log"
  if "$@" >"$stdout_path" 2>"$stderr_path"; then
    status=0
  else
    status=$?
  fi
  printf '%s\n' "$status" >"$status_path"
  return "$status"
}

common_args=(
  --std=c++17
  --generate-code=arch=compute_75,code=sm_75
  --generate-code=arch=compute_75,code=compute_75
  "-DLAB11_EXPECTED_CUB_VERSION=$expected_cub_version"
  "${component_include_args[@]}"
  --include-path "$reference_dir"
)

: >"$result_dir/lab11-runner-commands.log"

{
  printf 'profile-id=%s\n' "$profile_id"
  printf 'component-mode=%s\n' "$component_mode"
  printf 'expected-cub-version=%s\n' "$expected_cub_version"
  printf 'dialect=c++17\n'
  printf 'binary-executed=false\n'
} >"$result_dir/lab11-runner-profile.txt"

(
  cd -- "$project_root"
  sha256sum \
    public/assets/exercise-solutions/lab11-reduction-comparison.cu \
    examples/ex11-multi-stage-reduction/include/multi_stage_reduction_reference.hpp \
    scripts/check-lab11-runner-build.sh
  sha256sum "${component_headers[@]}"
) >"$result_dir/lab11-runner-inputs.sha256"

run_recorded \
  "$result_dir/lab11-runner-preprocess.stdout.log" \
  "$result_dir/lab11-runner-preprocess.stderr.log" \
  "$result_dir/lab11-runner-preprocess.status" \
  nvcc "${common_args[@]}" \
    --preprocess "$runner_source" \
    --output-file "$preprocessed"

run_recorded \
  "$result_dir/lab11-runner-compile.stdout.log" \
  "$result_dir/lab11-runner-compile.stderr.log" \
  "$result_dir/lab11-runner-compile.status" \
  nvcc "${common_args[@]}" \
    --compile "$runner_source" \
    --output-file "$object"

run_recorded \
  "$result_dir/lab11-runner-link.stdout.log" \
  "$result_dir/lab11-runner-link.stderr.log" \
  "$result_dir/lab11-runner-link.status" \
  nvcc --std=c++17 "$object" --output-file "$binary"

run_recorded \
  "$result_dir/lab11-runner-cubin.inspection.txt" \
  "$result_dir/lab11-runner-cubin.stderr.log" \
  "$result_dir/lab11-runner-cubin.status" \
  cuobjdump --list-elf "$binary"

run_recorded \
  "$result_dir/lab11-runner-ptx.inspection.txt" \
  "$result_dir/lab11-runner-ptx.stderr.log" \
  "$result_dir/lab11-runner-ptx.status" \
  cuobjdump --dump-ptx "$binary"

inspection_status=0
if ! grep -Eq 'sm_75' "$result_dir/lab11-runner-cubin.inspection.txt"; then
  inspection_status=1
fi
if ! grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' \
    "$result_dir/lab11-runner-ptx.inspection.txt"; then
  inspection_status=1
fi
printf '%s\n' "$inspection_status" \
  >"$result_dir/lab11-runner-target-inspection.status"
if [[ "$inspection_status" -ne 0 ]]; then
  exit "$inspection_status"
fi

(
  cd -- "$result_dir"
  sha256sum \
    lab11-runner-profile.txt \
    lab11-runner-commands.log \
    lab11-runner-preprocess.stdout.log \
    lab11-runner-preprocess.stderr.log \
    lab11-runner-compile.stdout.log \
    lab11-runner-compile.stderr.log \
    lab11-runner-link.stdout.log \
    lab11-runner-link.stderr.log \
    lab11-runner-cubin.stderr.log \
    lab11-runner-ptx.stderr.log
) >"$result_dir/lab11-runner-logs.sha256"

(
  cd -- "$result_dir"
  sha256sum \
    lab11-runner-cubin.inspection.txt \
    lab11-runner-ptx.inspection.txt
) >"$result_dir/lab11-runner-inspection.sha256"

printf 'LAB11 runner compile-check results: %s\n' "$result_dir"
