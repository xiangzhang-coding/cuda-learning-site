// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  CAPABILITY_RECORDS,
  CAPABILITY_SOURCE_FACT_IDS,
  parseComputeCapability,
  resolveCapabilityContract,
} from '../../src/visuals/capability-filter-model';

describe('F06 capability filter model', () => {
  it.each([
    ['7.5', '7.5'],
    [' 8.0 ', '8.0'],
    ['9.0', '9.0'],
    ['10.0', '10.0'],
    ['12.0', '12.0'],
  ])('parses reviewed capability %j as %s', (input, expected) => {
    expect(parseComputeCapability(input)).toBe(expected);
  });

  it.each([
    '',
    ' ',
    '7',
    '75',
    '07.5',
    '7.05',
    '8.6',
    '10.00',
    '12.0.0',
    '1e1.0',
    'NaN',
    'Infinity',
  ])('fails closed for malformed or unreviewed capability %j', (input) => {
    expect(parseComputeCapability(input)).toBeNull();
    expect(resolveCapabilityContract(input)).toMatchObject({
      state: 'unknown',
      capability: null,
      featureAvailability: [],
      numericLimits: null,
      compilerTargets: [],
    });
  });

  it('rejects non-string values instead of coercing them into capabilities', () => {
    for (const input of [75, 8, null, undefined, {}, ['9.0']]) {
      expect(parseComputeCapability(input), String(input)).toBeNull();
      expect(resolveCapabilityContract(input).state).toBe('unknown');
    }
  });

  it('keeps the reviewed dataset small, ordered, and tied to one source bundle', () => {
    expect(CAPABILITY_RECORDS.map(({ id }) => id)).toEqual(['7.5', '8.0', '9.0', '10.0', '12.0']);
    expect(CAPABILITY_SOURCE_FACT_IDS).toEqual(['SRC-CUDA-016']);
    for (const record of CAPABILITY_RECORDS) {
      expect(record.sourceFactIds).toEqual(['SRC-CUDA-016']);
      expect(record.featureAvailability).toHaveLength(4);
      expect(record.numericLimits).toMatchObject({ warpSize: 32, maximumThreadsPerBlock: 1024 });
    }
  });

  it('separates feature availability from numeric limits and compiler targets', () => {
    const result = resolveCapabilityContract('9.0');
    expect(result.state).toBe('known');
    if (result.state !== 'known') throw new Error('Expected a reviewed capability');

    expect(result.featureAvailability).toEqual([
      { id: 'hardware-memcpy-async', available: true },
      { id: 'thread-block-clusters', available: true },
      { id: 'architecture-specific-feature-set', available: true },
      { id: 'family-specific-feature-set', available: false },
    ]);
    expect(result.numericLimits).toEqual({
      warpSize: 32,
      maximumThreadsPerBlock: 1024,
      maximumSharedMemoryPerSmKiB: 228,
      maximumSharedMemoryPerBlockKiB: 227,
    });
    expect(result.compilerTargets.map(({ set, virtual, real }) => [set, virtual, real])).toEqual([
      ['baseline', 'compute_90', 'sm_90'],
      ['architecture-specific', 'compute_90a', 'sm_90a'],
    ]);
  });

  it('records exact reviewed nvcc lanes for baseline and qualified targets', () => {
    const sevenFive = resolveCapabilityContract('7.5');
    const nine = resolveCapabilityContract('9.0');
    const ten = resolveCapabilityContract('10.0');
    const twelve = resolveCapabilityContract('12.0');
    if (sevenFive.state !== 'known' || nine.state !== 'known' || ten.state !== 'known' || twelve.state !== 'known') {
      throw new Error('Expected reviewed capabilities');
    }

    expect(sevenFive.compilerTargets[0]?.toolkitLanes).toEqual(['11.8.0', '12.9.2', '13.3.1']);
    expect(nine.compilerTargets[0]?.toolkitLanes).toEqual(['11.8.0', '12.9.2', '13.3.1']);
    expect(nine.compilerTargets[1]?.toolkitLanes).toEqual(['12.9.2', '13.3.1']);
    expect(ten.compilerTargets.map(({ set }) => set)).toEqual([
      'baseline',
      'family-specific',
      'architecture-specific',
    ]);
    expect(twelve.compilerTargets.map(({ set }) => set)).toEqual([
      'baseline',
      'family-specific',
      'architecture-specific',
    ]);
  });

  it('preserves the reviewed shared-memory limits without turning them into performance claims', () => {
    expect(CAPABILITY_RECORDS.map(({ id, numericLimits }) => [
      id,
      numericLimits.maximumSharedMemoryPerSmKiB,
      numericLimits.maximumSharedMemoryPerBlockKiB,
    ])).toEqual([
      ['7.5', 64, 64],
      ['8.0', 164, 163],
      ['9.0', 228, 227],
      ['10.0', 228, 227],
      ['12.0', 100, 99],
    ]);

    expect(resolveCapabilityContract('12.0')).toMatchObject({
      inferenceBoundaries: {
        productModel: 'not-inferred',
        environmentCompatibility: 'not-assessed',
        performance: 'not-assessed',
      },
      evidenceStatusEffect: 'none',
    });
  });

  it('returns deterministic contracts without broadening an unknown value', () => {
    expect(resolveCapabilityContract('10.0')).toEqual(resolveCapabilityContract('10.0'));
    expect(resolveCapabilityContract('10.1')).toEqual(resolveCapabilityContract('unknown'));
    expect(resolveCapabilityContract('10.1')).toMatchObject({
      sourceFactIds: ['SRC-CUDA-016'],
      inferenceBoundaries: {
        productModel: 'not-inferred',
        environmentCompatibility: 'not-assessed',
        performance: 'not-assessed',
      },
      evidenceStatusEffect: 'none',
    });
  });
});
