# SPDX-License-Identifier: Apache-2.0
"""Pinned Linux subprocess checks; run explicitly after installing the EX23 full lock."""
import json
from pathlib import Path
import subprocess
import sys
import unittest

CHECK = Path(__file__).with_name('check.py')


class PinnedDiagnosticsTests(unittest.TestCase):
    def run_case(self, mode, case):
        return subprocess.run([sys.executable, '-I', str(CHECK), '--mode', mode, '--case', case],
                              capture_output=True, text=True, timeout=120)

    def test_interpreter_clean_and_print(self):
        for case in ['clean', 'print']:
            result = self.run_case('interpreter', case)
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads(result.stdout.splitlines()[-1])
            self.assertFalse(report['gpuExecuted'])
            self.assertTrue(report['oraclePassed'])
            self.assertEqual(report['runtimeEvidence'], 'Pending Hardware Verification')
            if case == 'print':
                self.assertIn('offset', result.stdout)
                self.assertIn('block', result.stdout)

    def test_logical_tail_fails_for_the_intended_reason(self):
        result = self.run_case('interpreter', 'tail')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('write guard changed', result.stderr)

    def test_interpreter_assert_is_not_gpu_evidence(self):
        result = self.run_case('interpreter', 'assert')
        self.assertEqual(result.returncode, 2)
        self.assertIn('device assertion is a GPU check', result.stderr)

    def test_all_diagnostic_variants_compile_without_driver(self):
        for case in ['clean', 'tail', 'assert', 'print']:
            result = self.run_case('compile', case)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse(json.loads(result.stdout.splitlines()[-1])['gpuExecuted'])


if __name__ == '__main__':
    unittest.main()
