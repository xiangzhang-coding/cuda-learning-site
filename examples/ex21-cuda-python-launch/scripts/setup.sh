#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

if [[ $# == 1 && $1 == --help ]]; then
  printf '%s\n' 'usage: bash scripts/setup.sh' \
    'Uses python3.14 (ordinary GIL CPython 3.14.7) on Ubuntu 24.04 x86_64.' \
    'Creates a new .venv and installs four hash-locked wheels; never installs the Toolkit or driver.'
  exit 0
fi
if [[ $# != 0 ]]; then
  printf '%s\n' 'usage: bash scripts/setup.sh [--help]' >&2
  exit 2
fi

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
python3.14 -I "$root/ex21.py" check-environment --phase interpreter
if [[ -e "$root/.venv" || -L "$root/.venv" ]]; then
  printf '%s\n' 'Refusing to replace .venv; use a fresh EX21 working copy for a hash-checked install.' >&2
  exit 1
fi
python3.14 -I -m venv "$root/.venv"
mkdir -p -- "$root/build"
"$root/.venv/bin/python" -I -m pip --isolated install \
  --disable-pip-version-check --no-input --no-cache-dir \
  --index-url https://pypi.org/simple --require-hashes --only-binary=:all: \
  --report "$root/build/setup-install.json" -r "$root/requirements.lock"
"$root/.venv/bin/python" -I -m pip --isolated check
"$root/.venv/bin/python" -I "$root/ex21.py" check-environment --phase packages
