#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail
# Invoke from the canonical project root with the selected venv activated.
test ! -e dist || { printf '%s\n' 'Use a fresh project copy; preserve previous dist results.' >&2; exit 1; }
export CUDA_HOME=/usr/local/cuda-12.8
export CC=gcc-13 CXX=g++-13
export TORCH_CUDA_ARCH_LIST='8.0+PTX'
export PYTORCH_ALLOC_CONF=backend:native
python -m pip wheel --no-build-isolation --no-deps . --wheel-dir dist
shopt -s nullglob
wheels=(dist/cuda_learning_ops-*.whl)
test "${#wheels[@]}" -eq 1
python -m pip install --no-deps "${wheels[0]}"
python -m pip check
# -I removes the source directory and PYTHONPATH from imports. Each call is a
# fresh process; neither editable installs nor JIT recompilation can hide gaps.
python -I -c 'import torch, cuda_learning_ops; from pathlib import Path; assert "site-packages" in Path(cuda_learning_ops.__file__).parts; print("installed-wheel import passed")'
python -I verify.py --device cpu
python -I verify_install.py
