#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  printf 'Usage: compile-check.sh <c++17> <profile-id> [result-dir]\n' >&2
  exit 2
fi
dialect="$1"
profile_id="$2"
if [[ "$dialect" != c++17 ]]; then
  printf 'EX18 declares only c++17: %s\n' "$dialect" >&2
  exit 2
fi
case "$profile_id" in
  cuda-11-8-bundled-cublas-11-11-3-6) expected_cublas_version=11.11.3.6 ;;
  cuda-12-9-bundled-cublas-12-9-2-10) expected_cublas_version=12.9.2.10 ;;
  cuda-13-3-bundled-cublas-13-6-0-2) expected_cublas_version=13.6.0.2 ;;
  *) printf 'Unknown EX18 compile-check profile: %s\n' "$profile_id" >&2; exit 2 ;;
esac

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
example_root="$(cd -- "$script_dir/.." && pwd)"
result_dir="${3:-$(mktemp -d "${TMPDIR:-/tmp}/ex18-${profile_id}.XXXXXX")}"
mkdir -p "$result_dir"
make_args=("DIALECT=$dialect" "BUILD_DIR=build" "EXPECTED_CUBLAS_VERSION=$expected_cublas_version")
printf 'profile=%s\nexpected_cublas=%s\n' "$profile_id" "$expected_cublas_version" > "$result_dir/profile.txt"
for stage in clean preprocess compile link inspect host-test; do
  make -C "$example_root" "$stage" "${make_args[@]}" > "$result_dir/$stage.log" 2>&1
done
cp "$example_root/build/dynamic-section.txt" "$example_root/build/dynamic-linkage.txt" "$result_dir/"
printf 'compile-check results: %s\n' "$result_dir"
