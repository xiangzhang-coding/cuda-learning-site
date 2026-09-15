# SPDX-License-Identifier: Apache-2.0
import math
import random
import unittest
from contract import reference, verify, validate_shape, traffic, record_samples


class AttentionContract(unittest.TestCase):
    def test_online_matches_independent_dense_with_tails(self):
        rng = random.Random(50)
        for n in (1, 17, 33, 65):
            q, k, v = [[[rng.uniform(-4, 4) for _ in range(16)] for _ in range(n)] for _ in range(3)]
            for causal in (False, True):
                expected = reference(q, k, v, causal)
                for tile in (1, 16, 32):
                    verify(reference(q, k, v, causal, tile), expected, 1e-12, 1e-12)

    def test_extreme_shift_and_mask(self):
        q = [[1000.0], [1000.0]]
        k, v = [[1.0], [1.0]], [[2.0], [4.0]]
        self.assertEqual(reference(q, k, v), [[3.0], [3.0]])
        self.assertEqual(reference(q, k, v, True, 1), [[2.0], [3.0]])
        self.assertEqual(reference([[0.0]], [[0.0]], [[-4.0]], True), [[-4.0]])

    def test_rejections_and_tolerance(self):
        for shape in ((0, 1, 1, 16), (1, 1, 129, 16), (1, 1, 1, 128), (True, 1, 1, 16)):
            with self.assertRaises(ValueError): validate_shape(shape)
        for actual in ([[math.nan]], [[math.inf]], [[0.03]], [[]]):
            with self.assertRaises(ValueError): verify(actual, [[0.0]])
        verify([[0.019]], [[0.0]])

    def test_mixed_width_io_ledger(self):
        self.assertEqual(traffic(32, 16), {'materializedBytes': 28672, 'tiledBytes': 6144})

    def test_rejected_samples_are_retained(self):
        report = {}
        with self.assertRaises(ValueError): record_samples(report, [1.0, math.nan, 0.0])
        self.assertEqual(report, {'rawMs': [1.0, 'nan', 0.0], 'status': 'rejected'})
        record_samples(report, [1.0, 3.0, 2.0])
        self.assertEqual(report['medianMs'], 2.0)


if __name__ == '__main__':
    unittest.main()
