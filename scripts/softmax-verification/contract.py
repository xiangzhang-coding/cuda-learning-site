# SPDX-License-Identifier: Apache-2.0
"""GPU-independent LAB15 numerical acceptance policy."""
import math

ATOL = 2e-6
RTOL = 2e-5
ROW_SUM_ATOL = 2e-5


def reference_row(values):
    if not values or any(not math.isfinite(value) for value in values):
        raise ValueError('a nonempty finite row is required')
    maximum = max(values)
    weights = [math.exp(value - maximum) for value in values]
    denominator = math.fsum(weights)
    return [weight / denominator for weight in weights]


def verify_rows(actual, expected):
    if not expected or len(actual) != len(expected):
        raise ValueError('row coverage mismatch')
    maximum_error = 0.0
    maximum_sum_error = 0.0
    for row_index, (row, oracle) in enumerate(zip(actual, expected)):
        if not oracle or len(row) != len(oracle):
            raise ValueError(f'column coverage mismatch at row {row_index}')
        for value, target in zip(row, oracle):
            if not math.isfinite(value) or not math.isfinite(target) or not 0 <= value <= 1:
                raise ValueError(f'nonfinite or invalid probability at row {row_index}')
            error = abs(value - target)
            maximum_error = max(maximum_error, error)
            if error > ATOL + RTOL * abs(target):
                raise ValueError(f'numerical mismatch at row {row_index}')
        sum_error = abs(math.fsum(row) - 1.0)
        maximum_sum_error = max(maximum_sum_error, sum_error)
        if sum_error > ROW_SUM_ATOL:
            raise ValueError(f'row normalization mismatch at row {row_index}')
    return {'maxAbsoluteError': maximum_error, 'maxRowSumError': maximum_sum_error}
