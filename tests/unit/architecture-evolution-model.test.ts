// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { filterArchitectures } from '../../src/visuals/architecture-evolution-model';
const blackwell = ['10.0', '10.3', '10.7', '11.0', '12.0', '12.1'];

describe('VIS15 exact capability and feature intersection', () => {
  it('never infers native FP64 Tensor Cores from a larger Ampere CC', () => {
    expect(filterArchitectures('all', 'fp64').map(row => row.cc)).toEqual(['8.0', '9.0', '10.0', '10.7']);
    expect(filterArchitectures('8.6', 'fp64')).toEqual([]);
    expect(filterArchitectures('8.7', 'fp64')).toEqual([]);
  });
  it('keeps exact stable order and intersects asynchronous-copy and capability filters', () => {
    expect(filterArchitectures('all', 'all').map(row => row.cc)).toEqual(['7.5', '8.0', '8.6', '8.7', '8.9', '9.0', ...blackwell]);
    expect(filterArchitectures('all', 'async-copy').map(row => row.cc)).toEqual(['8.0', '8.6', '8.7', '8.9', '9.0', ...blackwell]);
    expect(filterArchitectures('7.5', 'async-copy')).toEqual([]);
    expect(filterArchitectures('7.5', 'its').map(row => row.cc)).toEqual(['7.5']);
    expect(filterArchitectures('all', 'split-barrier').map(row => row.cc)).toEqual(['8.0', '8.6', '8.7', '8.9', '9.0', ...blackwell]);
    expect(filterArchitectures('all', 'fp16')).toHaveLength(12);
    for (const feature of ['bf16', 'tf32']) expect(filterArchitectures('7.5', feature)).toEqual([]);
  });
  it.each(['clusters', 'dsm', 'tma'])('admits %s on reviewed Hopper and Blackwell rows', feature => {
    expect(filterArchitectures('all', feature).map(row => row.cc)).toEqual(['9.0', ...blackwell]);
    for (const cc of ['7.5', '8.0', '8.6', '8.7', '8.9']) expect(filterArchitectures(cc, feature)).toEqual([]);
    expect(filterArchitectures('9.0', feature)[0]).toMatchObject({ target: 'compute_90 / sm_90', sharedKiB: 227 });
  });
  it('separates Ada L2 policy from Hopper-only features and native FP64', () => {
    expect(filterArchitectures('8.9', 'l2-policy')[0]).toMatchObject({ architecture: 'Ada', target: 'compute_89 / sm_89', sharedKiB: 99 });
    expect(filterArchitectures('8.9', 'fp64')).toEqual([]);
    expect(filterArchitectures('all', 'l2-policy').map(row => row.cc)).toEqual(['8.0', '8.6', '8.7', '8.9', '9.0', ...blackwell]);
  });
  it('distinguishes Blackwell precision and memory instead of inheriting a higher-number rule', () => {
    for (const feature of ['family-target', 'fp4']) expect(filterArchitectures('all', feature).map(row => row.cc)).toEqual(blackwell);
    for (const cc of ['10.3', '11.0', '12.0', '12.1']) expect(filterArchitectures(cc, 'fp64')).toEqual([]);
    expect(blackwell.map(cc => filterArchitectures(cc, 'all')[0].sharedKiB)).toEqual([227, 227, 327, 227, 99, 99]);
  });
  it.each([['13.0', 'all'], ['all', 'future'], ['', 'all']])('rejects unsupported filters %s / %s', (cc, feature) => {
    expect(() => filterArchitectures(cc, feature)).toThrow(RangeError);
    expect(filterArchitectures('all', 'all')).toHaveLength(12);
  });
});
