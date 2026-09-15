# SPDX-License-Identifier: Apache-2.0
"""Run in the EX23 full-lock CI environment; no CUDA execution."""
import importlib.util
import unittest
from check import compare_tensor


@unittest.skipUnless(importlib.util.find_spec('torch'), 'pinned torch unavailable')
class OutputBoundary(unittest.TestCase):
    def test_exact_shape_dtype_and_device(self):
        import torch
        prototype = torch.zeros((1, 2, 17, 32), dtype=torch.float16)
        expected = prototype.flatten(0, 1).tolist()
        compare_tensor(prototype, expected, prototype)
        for actual in (prototype.view(2, 1, 17, 32), prototype.float(), torch.empty_like(prototype, device='meta')):
            with self.assertRaisesRegex(ValueError, 'shape, dtype or device'):
                compare_tensor(actual, expected, prototype)


if __name__ == '__main__':
    unittest.main()
