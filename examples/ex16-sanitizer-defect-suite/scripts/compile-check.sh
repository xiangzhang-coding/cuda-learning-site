#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -ne 3 ]]; then
  printf 'Usage: compile-check.sh <dialect> <ex16> <result-dir>\n' >&2
  exit 2
fi

dialect="$1"
kind="$2"
result_dir="$3"

if [[ "$dialect" != "c++17" ]]; then
  printf 'EX16 declares only the c++17 dialect: %s\n' "$dialect" >&2
  exit 2
fi

if [[ "$kind" != "ex16" ]]; then
  printf 'Unknown compile-check kind: %s\n' "$kind" >&2
  exit 2
fi

mkdir -p "$result_dir"
make clean BUILD_DIR=build > "$result_dir/clean.log" 2>&1
make preprocess DIALECT="$dialect" BUILD_DIR=build > "$result_dir/preprocess.log" 2>&1
make compile DIALECT="$dialect" BUILD_DIR=build > "$result_dir/compile.log" 2>&1
make link DIALECT="$dialect" BUILD_DIR=build > "$result_dir/link.log" 2>&1
make inspect DIALECT="$dialect" BUILD_DIR=build > "$result_dir/inspect.log" 2>&1
make host-test DIALECT="$dialect" BUILD_DIR=build > "$result_dir/host-test.log" 2>&1
for report in build/*-cubin-list.txt build/*-ptx-dump.txt; do
  cp "$report" "$result_dir/"
done
