#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -ne 3 ]]; then
  printf 'Usage: compile-check.sh <dialect> <ex10|cxx23-probe> <result-dir>\n' >&2
  exit 2
fi

dialect="$1"
kind="$2"
result_dir="$3"
build_dir="build"
host_cxx="${HOST_CXX:-g++}"

mkdir -p "$result_dir"
make clean BUILD_DIR="$build_dir" > "$result_dir/clean.log" 2>&1

if [[ "$kind" == "ex10" ]]; then
  for stage in preprocess standalone-ptx cubin fatbin relocatable-compile device-link host-link inspect artifact-test; do
    make "$stage" DIALECT="$dialect" BUILD_DIR="$build_dir" \
      > "$result_dir/${stage}.log" 2>&1
  done
  cp "$build_dir"/artifact-sha256.txt \
    "$build_dir"/cuobjdump-ptx-list.txt \
    "$build_dir"/cuobjdump-elf-list.txt \
    "$build_dir"/cuobjdump-ptx.txt \
    "$build_dir"/cuobjdump-sass.txt \
    "$build_dir"/cuobjdump-elf.txt \
    "$build_dir"/cuobjdump-symbols.txt \
    "$build_dir"/symbol-link-ledger.txt \
    "$build_dir"/artifact-test-report.txt \
    "$result_dir/"
elif [[ "$kind" == "cxx23-probe" ]]; then
  if [[ "$dialect" != "c++23" || "$host_cxx" != "/usr/bin/g++-14" ]]; then
    printf 'The EX10 C++23 probe requires c++23 with /usr/bin/g++-14.\n' >&2
    exit 2
  fi
  mkdir -p "$build_dir"
  nvcc --compiler-bindir=/usr/bin/g++-14 \
    --std=c++23 \
    --generate-code=arch=compute_75,code=sm_75 \
    --generate-code=arch=compute_75,code=compute_75 \
    --compile probes/cxx23.cu -o "$build_dir/cxx23_probe.o" \
    > "$result_dir/compile.log" 2>&1
  cuobjdump --list-elf "$build_dir/cxx23_probe.o" > "$result_dir/cuobjdump-elf-list.txt" 2>&1
  sha256sum "$build_dir/cxx23_probe.o" > "$result_dir/artifact-sha256.txt"
else
  printf 'Unknown compile-check kind: %s\n' "$kind" >&2
  exit 2
fi
