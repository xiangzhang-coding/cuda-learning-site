# SPDX-License-Identifier: Apache-2.0
import math
import json
import unittest

from contract import reference_product, verify_product, summarize_samples, selection_record, record_samples


class NumericalContract(unittest.TestCase):
    def test_rejected_samples_remain_json_safe_and_inspectable(self):
        record = {'status': 'incomplete'}
        with self.assertRaises(ValueError):
            record_samples(record, [1.0, 0.0, -2.0, math.nan, math.inf, -math.inf])
        retained = json.loads(json.dumps(record, allow_nan=False))
        self.assertEqual(retained['status'], 'rejected')
        self.assertEqual(retained['samples']['rawMilliseconds'], [1.0, 0.0, -2.0, 'nan', 'inf', '-inf'])
        self.assertIn('positive finite', retained['rejection'])

    def test_configuration_identity_does_not_depend_on_dictionary_order(self):
        trials = [{'config': {'BM': 32, 'BN': 64}, 'samples': summarize_samples([1.0])},
                  {'config': {'BN': 64, 'BM': 32}, 'samples': summarize_samples([2.0])}]
        with self.assertRaises(ValueError):
            selection_record(trials, {'BM': 32, 'BN': 64}, 2)

    def test_selection_requires_complete_finite_candidate_measurements(self):
        trials = [{'config': {'BM': 32}, 'samples': summarize_samples([3.0, 1.0, 2.0])},
                  {'config': {'BM': 64}, 'samples': summarize_samples([4.0, 3.0, 5.0])}]
        self.assertEqual(selection_record(trials, {'BM': 32}, 2)['selectedConfig'], {'BM': 32})
        for candidate, count in (({'BM': 64}, 2), ({'BM': 32}, 3), ({'BM': 128}, 2)):
            with self.assertRaises(ValueError):
                selection_record(trials, candidate, count)
        for samples in ([], [0.0], [-1.0], [math.inf], [math.nan]):
            with self.assertRaises(ValueError):
                summarize_samples(samples)

    def test_rectangular_product_and_rejection_of_corrupt_results(self):
        expected = reference_product([[1, -2, 3], [0, 4, -1]], [[2, 1], [3, -1], [-2, 2]])
        self.assertEqual(expected, [[-10, 9], [14, -6]])
        self.assertEqual(verify_product(expected, expected)['elements'], 4)
        for damaged in ([[0, 9], [14, -6]], [[math.nan, 9], [14, -6]],
                        [[math.inf, 9], [14, -6]], [[-10, 9]]):
            with self.assertRaises(ValueError):
                verify_product(damaged, expected)


if __name__ == '__main__':
    unittest.main()
