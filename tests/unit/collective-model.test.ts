// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { collectiveModel } from '../../src/visuals/collective-model';

describe('VIS16 logical collective message routes', () => {
  it('sums independent rank inputs and returns the same result at every rank', () => {
    const model = collectiveModel('all-reduce', 4, 'ring');
    expect(model.inputs).toEqual([[1], [2], [3], [4]]);
    expect(model.outputs).toEqual([[10], [10], [10], [10]]);
    expect(model.hops[0]).toMatchObject({ from: 1, to: 2, payload: [2], phase: 'gather' });
  });
  it('broadcasts only the root and gathers in rank order, independently of routes', () => {
    for (const topology of ['ring', 'star'] as const) {
      expect(collectiveModel('broadcast', 2, topology).outputs).toEqual([[1], [1]]);
      expect(collectiveModel('all-gather', 4, topology).outputs).toEqual(Array(4).fill([1, 2, 3, 4]));
      expect(collectiveModel('all-reduce', 8, topology).outputs).toEqual(Array(8).fill([36]));
    }
    expect(collectiveModel('all-reduce', 4, 'ring').hops).not.toEqual(collectiveModel('all-reduce', 4, 'star').hops);
  });
  it('routes every message only through permitted edges and is deterministic', () => {
    for (const ranks of [2, 4, 8]) for (const topology of ['ring', 'star'] as const)
      for (const collective of ['broadcast', 'all-gather', 'all-reduce'] as const) {
        const model = collectiveModel(collective, ranks, topology);
        expect(model).toEqual(collectiveModel(collective, ranks, topology));
        for (const hop of model.hops) {
          expect(hop.from).not.toBe(hop.to);
          expect(hop.from).toBeGreaterThanOrEqual(0); expect(hop.to).toBeLessThan(ranks);
          if (topology === 'ring') expect(hop.to).toBe((hop.from + 1) % ranks);
          else expect(hop.from === 0 || hop.to === 0).toBe(true);
        }
        if (collective === 'broadcast') expect(model.hops.every(hop => hop.phase === 'distribute')).toBe(true);
      }
    for (const ranks of [0, 1, 3, 9, NaN]) expect(() => collectiveModel('broadcast', ranks, 'star')).toThrow(RangeError);
  });
});
