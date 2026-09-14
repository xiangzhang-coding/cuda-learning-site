// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const root = 'examples/ex23-triton-vector-add';
describe('EX23 host acceptance boundary', () => {
  it('checks independently derived literals and rejects corrupt/nonfinite output without GPU imports', () => {
    expect(execFileSync('python3', [`${root}/ex23.py`, 'host-test'], { encoding: 'utf8' })).toContain('CPU contract passed');
    const script = `import runpy\nm = runpy.run_path('${root}/ex23.py')\nfor n in [0, -1, True, 1.5, 1000001]:\n try: m['validate_size'](n)\n except ValueError: pass\n else: raise AssertionError(n)\ntry: m['compare']([], [1], [2])\nexcept ValueError: pass\nelse: raise AssertionError('length')\nimport sys\nassert 'torch' not in sys.modules and 'triton' not in sys.modules`;
    execFileSync('python3', ['-c', script]);
  });
  it('retains the exact owner MIT notice and independent unobserved evidence', () => {
    expect(createHash('sha256').update(readFileSync(`${root}/TRITON-LICENSE`)).digest('hex')).toBe('92640fb97222fd0a698ff28ce0c3782c172623f8d6c609b557636a80f28fb946');
    const manifest = JSON.parse(readFileSync(`${root}/project.json`, 'utf8'));
    expect(manifest.evidence).toMatchObject({ compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] });
    expect(manifest.compatibility.lanes).toEqual([]);
  });
});
