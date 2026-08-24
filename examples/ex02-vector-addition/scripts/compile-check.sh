#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -ne 3 ]]; then
  printf 'Usage: compile-check.sh <dialect> <ex02|cxx23-probe> <result-dir>\n' >&2
  exit 2
fi

dialect="$1"
kind="$2"
result_dir="$3"

mkdir -p "$result_dir"
make clean BUILD_DIR=build > "$result_dir/clean.log" 2>&1

if [[ "$kind" == "ex02" ]]; then
  make preprocess DIALECT="$dialect" BUILD_DIR=build > "$result_dir/preprocess.log" 2>&1
  make compile DIALECT="$dialect" BUILD_DIR=build > "$result_dir/compile.log" 2>&1
  make link DIALECT="$dialect" BUILD_DIR=build > "$result_dir/link.log" 2>&1
  make inspect DIALECT="$dialect" BUILD_DIR=build > "$result_dir/inspect.log" 2>&1
  make host-test DIALECT="$dialect" BUILD_DIR=build > "$result_dir/host-test.log" 2>&1
  cp build/cubin-list.txt build/ptx-dump.txt "$result_dir/"
elif [[ "$kind" == "cxx23-probe" ]]; then
  nvcc --help > "$result_dir/nvcc-help.txt" 2>&1
  mkdir -p build
  nvcc --std=c++23 \
    --generate-code=arch=compute_75,code=sm_75 \
    --generate-code=arch=compute_75,code=compute_75 \
    --compile probes/cxx23.cu -o build/cxx23_probe.o \
    > "$result_dir/compile.log" 2>&1
else
  printf 'Unknown compile-check kind: %s\n' "$kind" >&2
  exit 2
fi
