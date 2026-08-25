#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -ne 3 ]]; then
  printf 'Usage: compile-check.sh <dialect> <shared|static> <result-dir>\n' >&2
  exit 2
fi

readonly dialect="$1"
readonly cudart="$2"
readonly result_dir="$3"
readonly build_dir="${BUILD_DIR:-build}"

if [[ "$dialect" != "c++17" ]]; then
  printf 'EX01 declares only DIALECT=c++17\n' >&2
  exit 2
fi
if [[ "$cudart" != "shared" && "$cudart" != "static" ]]; then
  printf 'CUDART must be shared or static\n' >&2
  exit 2
fi

mkdir -p "$result_dir"
make clean BUILD_DIR="$build_dir" > "$result_dir/clean.log" 2>&1
make preprocess DIALECT="$dialect" CUDART="$cudart" BUILD_DIR="$build_dir" \
  > "$result_dir/preprocess.log" 2>&1
make compile DIALECT="$dialect" CUDART="$cudart" BUILD_DIR="$build_dir" \
  > "$result_dir/compile.log" 2>&1
make link DIALECT="$dialect" CUDART="$cudart" BUILD_DIR="$build_dir" \
  > "$result_dir/link.log" 2>&1
make host-test DIALECT="$dialect" BUILD_DIR="$build_dir" \
  > "$result_dir/host-test.log" 2>&1
