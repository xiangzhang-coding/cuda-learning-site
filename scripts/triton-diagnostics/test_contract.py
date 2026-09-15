# SPDX-License-Identifier: Apache-2.0
"""Synthetic host fixtures; these are not sanitizer or GPU observations."""
import json
import unittest
from contract import assignments, sanitizer_summary, verify_increment


class DiagnosticContractTests(unittest.TestCase):
    def test_tail_and_missing_output_are_distinct_failures(self):
        verify_increment(list(range(1, 18)) + [-999], 17)
        with self.assertRaisesRegex(ValueError, 'write guard'):
            verify_increment(list(range(1, 19)), 17)
        with self.assertRaisesRegex(ValueError, 'logical output'):
            verify_increment([0] * 17 + [-999], 17)

    def test_cyclic_ownership_is_complete_unique_and_balanced(self):
        for tiles in [1, 3, 17, 35, 257]:
            for programs in [1, min(3, tiles), tiles]:
                work = assignments(tiles, programs)
                self.assertEqual(sorted(x for row in work for x in row), list(range(tiles)))
                self.assertLessEqual(max(map(len, work)) - min(map(len, work)), 1)
        self.assertEqual(assignments(10, 3), [[0, 3, 6, 9], [1, 4, 7], [2, 5, 8]])
        for args in [(0, 1), (1, 0), (2, 3), (True, 1), (4, 1.0)]:
            with self.assertRaises(ValueError):
                assignments(*args)

    def test_export_never_copies_free_text(self):
        private = 'synthetic-user@example.invalid token=NOT_A_REAL_SECRET host=internal.invalid address=0xdeadbeef'
        log = private + '\n========= ERROR SUMMARY: 2 errors\n' + private
        result = sanitizer_summary(log, 'memcheck', 86)
        self.assertEqual(result['reportedErrors'], 2)
        for fragment in private.split():
            self.assertNotIn(fragment, json.dumps(result))
        self.assertTrue(result['requiresPrivateLogReview'])
        self.assertEqual(result['runtimeEvidence'], 'Pending Hardware Verification')

    def test_missing_ambiguous_or_malformed_summary_never_means_clean(self):
        for text in ['', 'ERROR SUMMARY: 0 errors', '========= ERROR SUMMARY: -1 errors',
                     '========= ERROR SUMMARY: 0 errors\n========= ERROR SUMMARY: 1 error']:
            self.assertIsNone(sanitizer_summary(text, 'memcheck', 0)['reportedErrors'])
        self.assertEqual(sanitizer_summary('========= ERROR SUMMARY: 0 errors', 'memcheck', 1)['exitCode'], 1)
        for tool, code in [('unknown', 0), ('memcheck', -1), ('memcheck', True), ('memcheck', 256)]:
            with self.assertRaises(ValueError):
                sanitizer_summary('', tool, code)


if __name__ == '__main__':
    unittest.main()
