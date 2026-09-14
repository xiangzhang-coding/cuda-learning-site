# SPDX-License-Identifier: Apache-2.0
"""LAB16 acceptance rules, independent of torch, Triton and the candidate kernel."""
import math
import statistics

ATOL = 0.02
RTOL = 0.002


def summarize_samples(samples):
    if not samples or any(not math.isfinite(x) or x <= 0 for x in samples):
        raise ValueError('positive finite event samples required')
    return {'rawMilliseconds': list(samples), 'medianMilliseconds': statistics.median(samples),
            'minMilliseconds': min(samples), 'maxMilliseconds': max(samples)}


def selection_record(trials, selected, candidate_count):
    if len(trials) != candidate_count or len({tuple(sorted(t['config'].items())) for t in trials}) != candidate_count:
        raise ValueError('incomplete or duplicated candidate measurements')
    best = min(trials, key=lambda t: summarize_samples(t['samples']['rawMilliseconds'])['medianMilliseconds'])
    if best['config'] != selected:
        raise ValueError('selected configuration disagrees with recorded median objective')
    return {'selectedConfig': selected, 'objective': 'minimum sample median; first candidate breaks exact ties',
            'candidateTrials': trials, 'qualification': 'shape/device-local observation; manifest review required'}


def record_samples(record, samples):
    """Retain rejected observations too; strings encode nonfinite values in strict JSON."""
    record['samples'] = {'rawMilliseconds': [x if math.isfinite(x) else str(x) for x in samples]}
    try:
        record['samples'] = summarize_samples(samples)
    except ValueError as error:
        record['status'] = 'rejected'
        record['rejection'] = str(error)
        raise
    record['status'] = 'complete'
    return record['samples']['medianMilliseconds']


def reference_product(left, right):
    if not left or not right or not right[0]:
        raise ValueError('nonempty matrices required')
    k, n = len(right), len(right[0])
    if any(len(row) != k for row in left) or any(len(row) != n for row in right):
        raise ValueError('incompatible or ragged matrices')
    if any(not math.isfinite(x) for matrix in (left, right) for row in matrix for x in row):
        raise ValueError('finite stored inputs required')
    columns = list(zip(*right))
    # Repeated fixture rows/columns share a result; every distinct dot uses scalar fsum.
    dots = {}
    result = []
    for row in left:
        values = []
        for column in columns:
            key = (tuple(row), column)
            if key not in dots:
                dots[key] = math.fsum(a * b for a, b in zip(row, column))
            values.append(dots[key])
        result.append(values)
    return result


def verify_product(actual, expected):
    if not expected or len(actual) != len(expected):
        raise ValueError('output shape mismatch')
    errors = []
    for row, target in zip(actual, expected):
        if len(row) != len(target):
            raise ValueError('output shape mismatch')
        for value, reference in zip(row, target):
            if not math.isfinite(value) or not math.isfinite(reference):
                raise ValueError('nonfinite result or oracle')
            error = abs(value - reference)
            if error > ATOL + RTOL * abs(reference):
                raise ValueError('numerical tolerance exceeded')
            errors.append(error)
    return {'elements': len(errors), 'maxAbsoluteError': max(errors)}
