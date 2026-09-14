#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail
lock=requirements.lock
args=()
case "${1:-}" in
  '') ;;
  --compiler-only) lock=compiler.lock; args=(--compiler-only) ;;
  *) printf '%s\n' 'Usage: bash scripts/setup.sh [--compiler-only]' >&2; exit 1 ;;
esac
test "$(uname -s)" = Linux && test "$(uname -m)" = x86_64
test ! -e .venv || { printf '%s\n' 'Refusing to replace .venv' >&2; exit 1; }
python3.14 -c 'import platform, sysconfig; assert platform.python_version() == "3.14.7"; assert not sysconfig.get_config_var("Py_GIL_DISABLED")'
python3.14 -m venv .venv
.venv/bin/python -m pip install --require-hashes --only-binary=:all: -r "$lock"
.venv/bin/python -m pip check
.venv/bin/python ex23.py check-environment "${args[@]}"
