# SPDX-License-Identifier: Apache-2.0
"""Independent scalar specification; no framework, compiler or device import."""
import math
import statistics

ATOL, RTOL = 0.02, 0.01
BM, BN, WARPS, STAGES = 16, 32, 4, 2
SHAPES = ((1, 1, 1, 16), (1, 2, 17, 32), (2, 1, 33, 64), (1, 2, 65, 16), (1, 1, 128, 64))


def validate_shape(shape):
    if len(shape) != 4 or any(type(x) is not int for x in shape):
        raise ValueError('integer B,H,N,D required')
    b, h, n, d = shape
    if not (1 <= b <= 2 and 1 <= h <= 2 and 1 <= n <= 128 and d in (16, 32, 64)):
        raise ValueError('B,H in 1..2, N in 1..128, D in {16,32,64} required')


def reference(q, k, v, causal=False, tile=None):
    """One head; Python double arithmetic over values already stored in FP16.

    tile=None materializes normalized scores independently of the online path.
    A finite, nonempty square input means each causal row has at least one key.
    """
    n, d = len(q), len(q[0])
    if any(len(x) != n or any(len(row) != d for row in x) for x in (q, k, v)):
        raise ValueError('equal nonempty matrices required')
    if any(not math.isfinite(x) for a in (q, k, v) for row in a for x in row):
        raise ValueError('finite matrices required')
    if tile is not None and (type(tile) is not int or tile < 1):
        raise ValueError('positive tile required')
    result = []
    for i, query in enumerate(q):
        count = i + 1 if causal else n
        scores = [math.fsum(x*y for x, y in zip(query, key))/math.sqrt(d) for key in k[:count]]
        if tile is None:
            maximum = max(scores)
            weights = [math.exp(s-maximum) for s in scores]
            total = math.fsum(weights)
            result.append([math.fsum(w*v[j][c] for j, w in enumerate(weights))/total for c in range(d)])
        else:
            maximum, total, acc = -math.inf, 0.0, [0.0]*d
            for start in range(0, count, tile):
                block = scores[start:start+tile]
                merged = max(maximum, max(block))
                alpha = math.exp(maximum-merged)
                weights = [math.exp(s-merged) for s in block]
                total = alpha*total + math.fsum(weights)
                acc = [alpha*acc[c] + math.fsum(w*v[start+j][c] for j, w in enumerate(weights)) for c in range(d)]
                maximum = merged
            result.append([x/total for x in acc])
    return result


def verify(actual, expected, atol=ATOL, rtol=RTOL):
    if len(actual) != len(expected) or any(len(a) != len(e) for a, e in zip(actual, expected)):
        raise ValueError('output shape mismatch')
    maximum = 0.0
    for row, target in zip(actual, expected):
        for a, e in zip(row, target):
            if not math.isfinite(a) or not math.isfinite(e) or abs(a-e) > atol+rtol*abs(e):
                raise ValueError('nonfinite or out-of-tolerance output')
            maximum = max(maximum, abs(a-e))
    return {'maxAbsoluteError': maximum, 'absoluteTolerance': atol, 'relativeTolerance': rtol}


def traffic(n, d, bm=BM):
    """Logical bytes, FP16 Q/K/V/O, FP32 materialized S/P; no cache/spills."""
    return {'materializedBytes': 8*n*d + 24*n*n,
            'tiledBytes': 4*n*d + 4*math.ceil(n/bm)*n*d}


def record_samples(record, raw):
    # Preserve rejected observations without emitting invalid JSON NaN/Infinity.
    record['rawMs'] = [x if math.isfinite(x) else repr(x) for x in raw]
    record['status'] = 'rejected'
    if not raw or any(not math.isfinite(x) or x <= 0 for x in raw):
        raise ValueError('invalid timing samples')
    record.update(status='complete', medianMs=statistics.median(raw), minMs=min(raw), maxMs=max(raw))
