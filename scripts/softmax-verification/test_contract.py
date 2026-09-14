# SPDX-License-Identifier: Apache-2.0
"""Independent host checks; never GPU evidence."""
import unittest

from contract import reference_row, verify_rows


class NumericalContractTests(unittest.TestCase):
    def test_rejects_missing_nonfinite_and_misnormalized_outputs(self):
        for bad in ([0.5], [float('nan'), 0.5], [float('inf'), 0.5], [-0.5, 1.5], [0.6, 0.6]):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                verify_rows([bad], [[0.5, 0.5]])
        with self.assertRaises(ValueError):
            verify_rows([], [[1.0]])
        self.assertEqual(verify_rows([[0.5, 0.5]], [[0.5, 0.5]])['maxAbsoluteError'], 0.0)

    def test_large_equal_logits_and_shift_invariance(self):
        self.assertEqual(reference_row([1000.0, 1000.0]), [0.5, 0.5])
        self.assertEqual(reference_row([-1000.0] * 4), [0.25] * 4)
        for actual, expected in zip(reference_row([1000.0, 1001.0, 1002.0]),
                                    [0.09003057317038046, 0.24472847105479764, 0.6652409557748218]):
            self.assertAlmostEqual(actual, expected, places=14)

    def test_row_sum_catches_collective_drift_inside_element_tolerance(self):
        with self.assertRaisesRegex(ValueError, 'normalization'):
            verify_rows([[0.0009785625] * 1024], [[0.0009765625] * 1024])

    def test_reference_rejects_empty_and_semantically_masked_rows(self):
        for row in ([], [float('-inf')], [float('inf')], [float('nan')]):
            with self.subTest(row=row), self.assertRaises(ValueError):
                reference_row(row)


if __name__ == '__main__':
    unittest.main()
