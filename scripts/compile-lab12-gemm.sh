#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  printf 'Usage: compile-lab12-gemm.sh <expected-cublas-version> [result-dir]\n' >&2
  exit 2
fi
expected_cublas_version="$1"
if [[ ! "$expected_cublas_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  printf 'Expected cuBLAS version must have four decimal components\n' >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd -- "$script_dir/.." && pwd)"
result_dir="${2:-$(mktemp -d /tmp/lab12-gemm-results.XXXXXX)}"
mkdir -p -- "$result_dir"
result_dir="$(cd -- "$result_dir" && pwd)"
temporary_dir="$(mktemp -d /tmp/lab12-gemm-build.XXXXXX)"
trap 'rm -rf -- "$temporary_dir"' EXIT
cd -- "$project_root"

# Match canonical whole-line markers, rejecting missing, duplicate, or reversed ranges.
awk '
  {
    marker = $0
    sub(/^[[:space:]]+/, "", marker)
    sub(/[[:space:]]+$/, "", marker)
    if (marker == "// [ex18-gemm-call-start]") {
      starts++; start = NR; active = 1; next
    }
    if (marker == "// [ex18-gemm-call-end]") {
      ends++; end = NR; active = 0; next
    }
    if (active) {
      print
      if ($0 ~ /[^[:space:]]/) nonempty++
    }
  }
  END {
    if (starts != 1 || ends != 1 || end <= start + 1 || !nonempty) {
      print "EX18 gemm-call requires exactly one nonempty ordered marker pair" > "/dev/stderr"
      exit 2
    }
  }
' examples/ex18-cublas-gemm/src/cublas_gemm.cu > "$temporary_dir/lab12-ex18-gemm-call.inc"
cp "$temporary_dir/lab12-ex18-gemm-call.inc" "$result_dir/"

IFS=. read -r major minor patch build <<< "$expected_cublas_version"
common_args=(
  --std=c++17
  --generate-code=arch=compute_75,code=sm_75
  --generate-code=arch=compute_75,code=compute_75
  "-DEX18_EXPECTED_CUBLAS_MAJOR=$major"
  "-DEX18_EXPECTED_CUBLAS_MINOR=$minor"
  "-DEX18_EXPECTED_CUBLAS_PATCH=$patch"
  "-DEX18_EXPECTED_CUBLAS_BUILD=$build"
  -I . -I "$temporary_dir"
  -I examples/ex15-tiled-gemm/include -I examples/ex18-cublas-gemm/include
)
runner_source=public/assets/exercise-solutions/lab12-gemm-comparison.cu
nvcc="${NVCC:-nvcc}"
binary="$temporary_dir/lab12-gemm-comparison"

run_recorded() {
  local stage="$1"
  shift
  (set -x; "$@") > "$result_dir/lab12-$stage.log" 2>&1
}

printf 'expected-cublas-version=%s\ndialect=c++17\nbinary-executed=false\n' \
  "$expected_cublas_version" > "$result_dir/lab12-profile.txt"
run_recorded preprocess "$nvcc" "${common_args[@]}" --preprocess "$runner_source" \
  -o "$temporary_dir/lab12-gemm-comparison.ii"
run_recorded compile "$nvcc" "${common_args[@]}" --compile "$runner_source" \
  -o "$temporary_dir/lab12-gemm-comparison.o"
run_recorded link "$nvcc" --std=c++17 "$temporary_dir/lab12-gemm-comparison.o" \
  -lcublas -o "$binary"
run_recorded dynamic-section readelf -d "$binary"
grep -Eq 'NEEDED.*\[libcublas\.so\.' "$result_dir/lab12-dynamic-section.log"
run_recorded dynamic-linkage ldd "$binary"
grep -Eq 'libcublas\.so\.[0-9]+ => /' "$result_dir/lab12-dynamic-linkage.log"
if grep -q 'not found' "$result_dir/lab12-dynamic-linkage.log"; then
  printf 'LAB12 has unresolved dynamic libraries\n' >&2
  exit 1
fi
run_recorded cubin cuobjdump --list-elf "$binary"
grep -Eq 'sm_75' "$result_dir/lab12-cubin.log"
run_recorded ptx cuobjdump --dump-ptx "$binary"
grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' "$result_dir/lab12-ptx.log"
printf 'LAB12 runner compile-check completed (no CUDA execution).\n'
