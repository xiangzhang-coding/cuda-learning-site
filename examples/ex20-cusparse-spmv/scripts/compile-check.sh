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
  printf 'EX20 declares only c++17: %s\n' "$dialect" >&2
  exit 2
fi
case "$profile_id" in
  cuda-11-8-bundled-cusparse-11-7-5-86) expected_cusparse_version=11.7.5.86 ;;
  cuda-12-9-bundled-cusparse-12-5-10-65) expected_cusparse_version=12.5.10.65 ;;
  cuda-13-3-bundled-cusparse-12-8-2-51) expected_cusparse_version=12.8.2.51 ;;
  *) printf 'Unknown EX20 compile-check profile: %s\n' "$profile_id" >&2; exit 2 ;;
esac
if [[ $# == 3 && -z "$3" ]]; then
  printf 'The result directory must not be empty\n' >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
example_root="$(cd -- "$script_dir/.." && pwd -P)"
result_dir="${3:-$(mktemp -d "${TMPDIR:-/tmp}/ex20-${profile_id}.XXXXXX")}"
mkdir -p -- "$result_dir"
result_dir="$(cd -- "$result_dir" && pwd -P)"
build_root="$example_root/build"
if [[ -d "$build_root" ]]; then build_root="$(cd -- "$build_root" && pwd -P)"; fi
case "$result_dir" in
  "$build_root"|"$build_root"/*)
    printf 'The result directory must be outside the cleaned build directory\n' >&2
    exit 2 ;;
esac
# Discard only this runner's previous logs so a failure cannot retain later-stage success.
for file in clean.log preprocess.log compile.log link.log inspect.log host-test.log dynamic-section.txt dynamic-linkage.txt; do
  rm -f -- "$result_dir/$file"
done
make_args=("DIALECT=$dialect" "BUILD_DIR=build" "EXPECTED_CUSPARSE_VERSION=$expected_cusparse_version")
printf 'profile=%s\nexpected_cusparse=%s\nruntime=not-executed\n' \
  "$profile_id" "$expected_cusparse_version" > "$result_dir/profile.txt"
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
