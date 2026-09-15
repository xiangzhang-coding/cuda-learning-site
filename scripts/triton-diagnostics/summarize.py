# SPDX-License-Identifier: Apache-2.0
"""Read a private sanitizer log from stdin; emit a counts-only JSON derivative."""
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from contract import sanitizer_summary

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tool', required=True, choices=['memcheck', 'racecheck', 'initcheck', 'synccheck'])
    parser.add_argument('--exit-code', required=True, type=int)
    args = parser.parse_args()
    print(json.dumps(sanitizer_summary(sys.stdin.read(), args.tool, args.exit_code), sort_keys=True))
