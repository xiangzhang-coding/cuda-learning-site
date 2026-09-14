# SPDX-License-Identifier: Apache-2.0
"""Exercise the report boundary before any external CUDA dependency is loaded."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


class ReportBoundaryTests(unittest.TestCase):
    def test_debug_launch_mode_fails_before_initialization_and_retains_report(self):
        with tempfile.TemporaryDirectory() as parent:
            output = Path(parent) / 'attempt'
            result = subprocess.run([sys.executable, '-I', str(Path(__file__).with_name('check.py')),
                                     '--mode', 'benchmark', '--output', str(output)],
                                    env={**os.environ, 'CUDA_LAUNCH_BLOCKING': '1'},
                                    capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 1)
            report = json.loads((output / 'report.json').read_text())
            self.assertEqual(report['result'], 'fail')
            self.assertEqual(report['phase'], 'environment')
            self.assertFalse(report['gpuExecuted'])
            self.assertEqual(report['cases'], [])
            self.assertIn('CUDA_LAUNCH_BLOCKING', report['error']['message'])


if __name__ == '__main__':
    unittest.main()
