// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { filterArchitectures } from '../../src/visuals/architecture-evolution-model';

describe('VIS15 exact capability and feature intersection', () => {
  it('never infers native FP64 Tensor Cores from a larger Ampere CC', () => {
    expect(filterArchitectures('all', 'fp64').map(row => row.cc)).toEqual(['8.0']);
    expect(filterArchitectures('8.6', 'fp64')).toEqual([]);
    expect(filterArchitectures('8.7', 'fp64')).toEqual([]);
  });
  it('keeps exact stable order and intersects asynchronous-copy and capability filters', () => {
    expect(filterArchitectures('all', 'all').map(row => row.cc)).toEqual(['7.5', '8.0', '8.6', '8.7']);
    expect(filterArchitectures('all', 'async-copy').map(row => row.cc)).toEqual(['8.0', '8.6', '8.7']);
    expect(filterArchitectures('7.5', 'async-copy')).toEqual([]);
    expect(filterArchitectures('7.5', 'its').map(row => row.cc)).toEqual(['7.5']);
    expect(filterArchitectures('all', 'split-barrier').map(row => row.cc)).toEqual(['8.0', '8.6', '8.7']);
    expect(filterArchitectures('all', 'fp16')).toHaveLength(4);
    for (const feature of ['bf16', 'tf32']) expect(filterArchitectures('7.5', feature)).toEqual([]);
  });
  it.each([['9.0', 'all'], ['all', 'future'], ['', 'all']])('rejects unsupported filters %s / %s', (cc, feature) => {
    expect(() => filterArchitectures(cc, feature)).toThrow(RangeError);
    expect(filterArchitectures('all', 'all')).toHaveLength(4);
  });
});
