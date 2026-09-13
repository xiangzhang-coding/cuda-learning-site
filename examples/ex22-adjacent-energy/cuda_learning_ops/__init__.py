# SPDX-License-Identifier: Apache-2.0
"""Original adjacent-difference energy operator; import the installed package."""
# [ex22-imports-start]
import torch
from . import _C  # Load schemas and CPU/CUDA registrations before Python registrations.
from . import _registration

adjacent_energy = torch.ops.cuda_learning.adjacent_energy.default
__all__ = ["adjacent_energy"]
# [ex22-imports-end]
