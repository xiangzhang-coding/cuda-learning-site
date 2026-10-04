#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail
target=${1:-portable}
nvcc --version
nvcc --list-gpu-arch
nvcc --list-gpu-code
make TARGET="$target" host-test preprocess inspect
# No device executable is run. Each target needs its own retained record.
