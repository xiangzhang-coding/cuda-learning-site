# SPDX-License-Identifier: Apache-2.0
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


class LabCommand(unittest.TestCase):
    def test_debug_override_fails_before_gpu_import_and_retains_report(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / 'attempt'
            result = subprocess.run([sys.executable, '-I', str(Path(__file__).with_name('check.py')),
                '--mode', 'benchmark', '--output', str(output)],
                env={**os.environ, 'CUDA_LAUNCH_BLOCKING': '1'}, capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            report = json.loads((output / 'report.json').read_text())
            self.assertEqual(report['phase'], 'environment')
            self.assertEqual(report['result'], 'fail')
            self.assertFalse(report['gpuExecuted'])
            self.assertEqual(report['cases'], [])
            self.assertIn('CUDA_LAUNCH_BLOCKING', report['error']['message'])


if __name__ == '__main__':
    unittest.main()
