// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  MEMORY_HIERARCHY_MODEL_CONTRACT,
  MEMORY_HIERARCHY_RECORDS,
  createDefaultMemoryHierarchyFilter,
  filterMemoryHierarchy,
  isMemoryLifecycleFilter,
  isMemoryScopeFilter,
  type MemoryHierarchyFilter,
} from '../../src/visuals/memory-hierarchy-model';

describe('VIS06 memory hierarchy and lifetime model', () => {
  it('catalogs all six records in deterministic layer order with complete lifecycle fields', () => {
    expect(MEMORY_HIERARCHY_RECORDS.map(({ id }) => id)).toEqual([
      'host',
      'global',
      'constant',
      'shared',
      'local',
      'register',
    ]);
    for (const record of MEMORY_HIERARCHY_RECORDS) {
      expect(record.ownerAcquisition.length).toBeGreaterThan(30);
      expect(record.accessibleScope.length).toBeGreaterThan(30);
      expect(record.lifetime.length).toBeGreaterThan(30);
      expect(record.releaseEnd.length).toBeGreaterThan(30);
      expect(record.physicalAddressSpaceCaveat.length).toBeGreaterThan(30);
    }
  });

  it('distinguishes caches from address spaces and local scope from physical placement', () => {
    expect(MEMORY_HIERARCHY_MODEL_CONTRACT.cachesAreAddressSpaces).toBe(false);
    expect(MEMORY_HIERARCHY_RECORDS.find(({ id }) => id === 'global')?.physicalAddressSpaceCaveat).toMatch(
      /caches are not replacement address spaces/i,
    );
    expect(MEMORY_HIERARCHY_RECORDS.find(({ id }) => id === 'shared')?.physicalAddressSpaceCaveat).toMatch(
      /does not make it a cache/i,
    );
    expect(MEMORY_HIERARCHY_RECORDS.find(({ id }) => id === 'local')).toMatchObject({
      physicalLayer: 'device-memory',
      scope: 'thread',
    });
    expect(MEMORY_HIERARCHY_RECORDS.find(({ id }) => id === 'local')?.physicalAddressSpaceCaveat).toMatch(
      /not on-chip placement/i,
    );
  });

  it.each([
    [{ scope: 'grid', lifecycle: 'all' }, ['global', 'constant']],
    [{ scope: 'thread', lifecycle: 'all' }, ['local', 'register']],
    [{ scope: 'all', lifecycle: 'explicit-release' }, ['host', 'global']],
    [{ scope: 'block', lifecycle: 'block-end' }, ['shared']],
    [{ scope: 'thread', lifecycle: 'thread-end' }, ['local', 'register']],
    [{ scope: 'host', lifecycle: 'thread-end' }, []],
  ] as const)('filters %j without changing catalog order', (filter, expected) => {
    const result = filterMemoryHierarchy(filter);
    expect(result.valid).toBe(true);
    expect(result.records.map(({ id }) => id)).toEqual(expected);
  });

  it('fails closed for unknown scope or lifecycle values', () => {
    const badScope = filterMemoryHierarchy(
      { scope: 'device', lifecycle: 'all' } as unknown as MemoryHierarchyFilter,
    );
    const badLifecycle = filterMemoryHierarchy(
      { scope: 'all', lifecycle: 'launch' } as unknown as MemoryHierarchyFilter,
    );

    expect(badScope).toMatchObject({ valid: false, issues: ['scope-invalid'], filter: null, records: [] });
    expect(badLifecycle).toMatchObject({ valid: false, issues: ['lifecycle-invalid'], filter: null, records: [] });
    expect(isMemoryScopeFilter('device')).toBe(false);
    expect(isMemoryLifecycleFilter('launch')).toBe(false);
  });

  it('resets to the complete catalog and remains evidence-neutral', () => {
    expect(createDefaultMemoryHierarchyFilter()).toEqual({ scope: 'all', lifecycle: 'all' });
    const result = filterMemoryHierarchy(createDefaultMemoryHierarchyFilter());
    expect(result.records).toHaveLength(6);
    expect(MEMORY_HIERARCHY_MODEL_CONTRACT).toMatchObject({
      executesCuda: false,
      placementProbe: 'none',
      performanceInference: 'none',
      evidenceStatusEffect: 'none',
    });
  });
});
