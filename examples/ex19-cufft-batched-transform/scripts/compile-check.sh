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
  printf 'EX19 declares only c++17: %s\n' "$dialect" >&2
  exit 2
fi
case "$profile_id" in
  cuda-11-8-bundled-cufft-10-9-0-58) expected_cufft_version=10.9.0.58 ;;
  cuda-12-9-bundled-cufft-11-4-1-4) expected_cufft_version=11.4.1.4 ;;
  cuda-13-3-bundled-cufft-12-3-0-29) expected_cufft_version=12.3.0.29 ;;
  *) printf 'Unknown EX19 compile-check profile: %s\n' "$profile_id" >&2; exit 2 ;;
esac
if [[ $# == 3 && -z "$3" ]]; then
  printf 'The result directory must not be empty\n' >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
example_root="$(cd -- "$script_dir/.." && pwd)"
result_dir="${3:-$(mktemp -d "${TMPDIR:-/tmp}/ex19-${profile_id}.XXXXXX")}"
mkdir -p -- "$result_dir"
# Discard only this runner's previous logs so a failure cannot retain later-stage success.
for file in clean.log preprocess.log compile.log link.log inspect.log host-test.log dynamic-section.txt dynamic-linkage.txt; do
  rm -f -- "$result_dir/$file"
done
make_args=("DIALECT=$dialect" "BUILD_DIR=build" "EXPECTED_CUFFT_VERSION=$expected_cufft_version")
printf 'profile=%s\nexpected_cufft=%s\nruntime=not-executed\n' \
  "$profile_id" "$expected_cufft_version" > "$result_dir/profile.txt"
for stage in clean preprocess compile link inspect host-test; do
  if make -C "$example_root" "$stage" "${make_args[@]}" > "$result_dir/$stage.log" 2>&1; then
    printf '%s: pass\n' "$stage"
  else
    status=$?
    printf '%s failed (status %s); see %s/%s.log\n' "$stage" "$status" "$result_dir" "$stage" >&2
    exit "$status"
  fi
done
cp -- "$example_root/build/dynamic-section.txt" "$example_root/build/dynamic-linkage.txt" "$result_dir/"
printf 'compile-check results: %s\n' "$result_dir"
