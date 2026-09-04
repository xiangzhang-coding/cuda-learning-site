#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  printf 'Usage: compile-check.sh <c++17> <profile-id> [result-dir]\n' >&2
  exit 2
fi

dialect="$1"
profile_id="$2"
bundled_include_root="/usr/local/cuda/include"

if [[ "$dialect" != "c++17" ]]; then
  printf 'EX17 declares only the c++17 dialect: %s\n' "$dialect" >&2
  exit 2
fi

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
    printf 'Unknown EX17 compile-check profile: %s\n' "$profile_id" >&2
    exit 2
    ;;
esac

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
  done
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
example_root="$(cd -- "$script_dir/.." && pwd)"
if [[ $# -eq 3 ]]; then
  result_dir="$3"
else
  result_dir="$(mktemp -d "${TMPDIR:-/tmp}/ex17-${profile_id}.XXXXXX")"
fi

mkdir -p "$result_dir"
make_args=(
  "DIALECT=$dialect"
  "BUILD_DIR=build"
  "COMPONENT_MODE=$component_mode"
  "EXPECTED_CUB_VERSION=$expected_cub_version"
  "CCCL_ROOT=${CCCL_ROOT:-}"
  "BUNDLED_INCLUDE_ROOT=$bundled_include_root"
)

make -C "$example_root" clean BUILD_DIR=build > "$result_dir/clean.log" 2>&1
make -C "$example_root" preprocess "${make_args[@]}" > "$result_dir/preprocess.log" 2>&1
make -C "$example_root" compile "${make_args[@]}" > "$result_dir/compile.log" 2>&1
make -C "$example_root" link "${make_args[@]}" > "$result_dir/link.log" 2>&1
make -C "$example_root" inspect "${make_args[@]}" > "$result_dir/inspect.log" 2>&1
make -C "$example_root" host-test "${make_args[@]}" > "$result_dir/host-test.log" 2>&1
cp "$example_root/build/cubin-list.txt" "$example_root/build/ptx-dump.txt" "$result_dir/"

printf 'compile-check results: %s\n' "$result_dir"
