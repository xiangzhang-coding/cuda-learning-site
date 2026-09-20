// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import fixture from '../../public/assets/ddp-fixtures/g07-diagnosis.json';

describe('G07 independent host oracle and synthetic diagnostic evidence', () => {
  it('checks signed two-step updates and accumulation scaling without importing torch', () => {
    const result = execFileSync('python3', ['-I', '-S', '-c', `
import runpy, json, sys
m = runpy.run_path('public/assets/exercise-solutions/g07-ddp.py')
f = m['reference_values']
assert 'torch' not in sys.modules
for args in [(1, 'baseline'), (9, 'baseline'), (2, 'unknown')]:
    try: f(*args)
    except ValueError: pass
    else: raise AssertionError('invalid scenario accepted')
print(json.dumps([f(2, 'baseline'), f(2, 'accumulate'), f(3, 'baseline')]))
`], { encoding: 'utf8' });
    expect(JSON.parse(result)).toEqual([
      [[2.5, 0.6875], [1.71875, 0.47265625]],
      [[4.5, 0.4375], [1.96875, 0.19140625]],
      [[14 / 3, 5 / 12], [35 / 18, 25 / 144]],
    ].map(rows => rows.map(row => row.map(value => expect.closeTo(value, 12)))));
  });

  it('distinguishes ownership, first failure, sequence mismatch and incomplete evidence', () => {
    expect(fixture).toMatchObject({ provenance: 'original-synthetic', captured: false,
      runtimeEvidence: 'Pending Hardware Verification', recordedObservations: [] });
    const classify = (entry: { owners: (string | null)[]; sequences: (string[] | null)[]; firstFailure: string | null; missingRanks: number[] }) => {
      if (entry.missingRanks.length || entry.owners.includes(null) || entry.sequences.includes(null)) return 'insufficient-evidence';
      if (new Set(entry.owners).size !== entry.owners.length) return 'duplicate-device';
      if (entry.firstFailure) return 'earlier-rank-failure';
      if (new Set(entry.sequences.map(sequence => JSON.stringify(sequence))).size !== 1) return 'sequence-mismatch';
      return 'no-listed-mismatch';
    };
    expect(fixture.cases.map(classify)).toEqual(['duplicate-device', 'earlier-rank-failure', 'sequence-mismatch', 'insufficient-evidence']);
    for (const entry of fixture.cases) expect(entry).not.toHaveProperty('classification');
    expect(classify({ ...fixture.cases[1], firstFailure: null })).toBe('sequence-mismatch');
    expect(classify({ ...fixture.cases[0], missingRanks: [1] })).toBe('insufficient-evidence');
    expect(classify({ ...fixture.cases[0], owners: ['device-A', 'device-B'] })).toBe('no-listed-mismatch');
  });

  it('keeps the launcher solution bounded and avoids a failure-path collective', () => {
    const source = readFileSync('public/assets/exercise-solutions/g07-ddp.py', 'utf8');
    expect(source).toContain('timeout=timedelta(seconds=60)');
    expect(source).toContain('device_ids=[local_rank]');
    expect(source).not.toMatch(/dist\.barrier\(|finally:/);
    expect(source).toContain('consumer.synchronize()');
  });
});
