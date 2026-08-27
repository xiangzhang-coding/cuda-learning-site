// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  MEMORY_HIERARCHY_MODEL_CONTRACT,
  MEMORY_HIERARCHY_RECORDS,
  MEMORY_OPERATION_FILTERS,
  createDefaultMemoryHierarchyFilter,
  filterMemoryHierarchy,
  isMemoryOperationFilter,
  isMemoryScopeFilter,
  type MemoryHierarchyFilter,
} from '../../src/visuals/memory-hierarchy-model';

describe('VIS06 memory hierarchy, scope, and operation model', () => {
  it('catalogs all six records with the exact operation inventory and complete lifecycle fields', () => {
    expect(MEMORY_HIERARCHY_RECORDS.map(({ id }) => id)).toEqual([
      'host',
      'global',
      'constant',
      'shared',
      'local',
      'register',
    ]);
    expect(MEMORY_OPERATION_FILTERS).toEqual([
      'all',
      'host-language',
      'runtime-api',
      'symbol-api',
      'kernel-declaration',
      'compiler-placement',
    ]);
    expect(MEMORY_HIERARCHY_RECORDS.map(({ id, operationPaths }) => [id, operationPaths])).toEqual([
      ['host', ['host-language', 'runtime-api']],
      ['global', ['runtime-api']],
      ['constant', ['symbol-api']],
      ['shared', ['kernel-declaration']],
      ['local', ['compiler-placement']],
      ['register', ['compiler-placement']],
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
    [{ scope: 'grid', operation: 'all' }, ['global', 'constant']],
    [{ scope: 'thread', operation: 'all' }, ['local', 'register']],
    [{ scope: 'all', operation: 'host-language' }, ['host']],
    [{ scope: 'all', operation: 'runtime-api' }, ['host', 'global']],
    [{ scope: 'all', operation: 'symbol-api' }, ['constant']],
    [{ scope: 'block', operation: 'kernel-declaration' }, ['shared']],
    [{ scope: 'thread', operation: 'compiler-placement' }, ['local', 'register']],
    [{ scope: 'host', operation: 'runtime-api' }, ['host']],
  ] as const)('filters %j without changing catalog order', (filter, expected) => {
    const result = filterMemoryHierarchy(filter);
    expect(result.valid).toBe(true);
    expect(result.records.map(({ id }) => id)).toEqual(expected);
  });

  it('fails closed for unknown scope or operation values', () => {
    const badScope = filterMemoryHierarchy(
      { scope: 'device', operation: 'all' } as unknown as MemoryHierarchyFilter,
    );
    const badOperation = filterMemoryHierarchy(
      { scope: 'all', operation: 'launch' } as unknown as MemoryHierarchyFilter,
    );

    expect(badScope).toMatchObject({ valid: false, issues: ['scope-invalid'], filter: null, records: [] });
    expect(badOperation).toMatchObject({ valid: false, issues: ['operation-invalid'], filter: null, records: [] });
    expect(isMemoryScopeFilter('device')).toBe(false);
    expect(isMemoryOperationFilter('launch')).toBe(false);
  });

  it('resets to the complete catalog and remains evidence-neutral', () => {
    expect(createDefaultMemoryHierarchyFilter()).toEqual({ scope: 'all', operation: 'all' });
    const result = filterMemoryHierarchy(createDefaultMemoryHierarchyFilter());
    expect(result.records).toHaveLength(6);
    expect(MEMORY_HIERARCHY_MODEL_CONTRACT).toMatchObject({
      executesCuda: false,
      filterAxes: 'scope-and-operation-path',
      placementProbe: 'none',
      performanceInference: 'none',
      evidenceStatusEffect: 'none',
    });
  });
});
