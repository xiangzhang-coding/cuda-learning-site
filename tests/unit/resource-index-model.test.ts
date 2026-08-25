// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import {
  INDEX_GROUPS,
  PUBLISHED_DESTINATIONS,
  projectResourceIndex,
  validateResourceCatalog,
  type PublishedDestination,
  type ResourceIndexRecord,
} from '../../src/resource-indexes/resource-index-model';

const asOf = new Date('2026-08-25T12:00:00Z');

function replaceRecord(planningId: string, replacement: (record: ResourceIndexRecord) => ResourceIndexRecord) {
  return RESOURCE_INDEX_RECORDS.map((record) =>
    record.planningId === planningId ? replacement(record) : record,
  );
}

describe('resource index catalog', () => {
  it('validates the complete eligible production catalog and projects every index group', () => {
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, { asOf })).not.toThrow();
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(59);
    expect(
      Object.fromEntries(INDEX_GROUPS.map((group) => [
        group,
        projectResourceIndex(RESOURCE_INDEX_RECORDS, group, 'en', { asOf }).length,
      ])),
    ).toEqual({ labs: 1, practice: 5, visuals: 2, glossary: 34, sources: 17 });
  });

  it('projects current destinations, relationships, and evidence without deriving URLs from IDs', () => {
    const [lab] = projectResourceIndex(RESOURCE_INDEX_RECORDS, 'labs', 'en', { asOf });

    expect(lab).toMatchObject({
      planningId: 'LAB02',
      href: '/en/labs/vector-addition/',
      counterpart: '/labs/vector-addition/',
      difficulty: 'introductory',
      evidence: {
        compilation: ['Compile-Checked'],
        runtime: ['Pending Hardware Verification'],
      },
    });
    expect(lab.prerequisites.map(({ id, href }) => [id, href])).toEqual([
      ['O03', '/en/start/environment-manifest/'],
      ['F01', '/en/foundations/first-cuda-kernel/'],
    ]);
    expect(lab.searchText).toContain('CUDA Toolkit Lane 11.8.0');
  });

  it('sorts a growing fixture set by stable planning ID instead of input order', () => {
    const base = RESOURCE_INDEX_RECORDS.find(({ planningId }) => planningId === 'TERM-034');
    expect(base).toBeDefined();
    const growth = Array.from({ length: 25 }, (_, index) => {
      const suffix = String(100 + (24 - index));
      return {
        ...base,
        planningId: `TERM-${suffix}`,
        title: { 'zh-CN': `增长词条 ${suffix}`, en: `Growth term ${suffix}` },
        href: { 'zh-CN': `/glossary/#term-${suffix}`, en: `/en/glossary/#term-${suffix}` },
      } as ResourceIndexRecord;
    });
    const projected = projectResourceIndex(
      [...RESOURCE_INDEX_RECORDS, ...growth],
      'glossary',
      'en',
      { asOf },
    );

    expect(projected).toHaveLength(59);
    expect(projected.slice(-25).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 25 }, (_, index) => `TERM-${100 + index}`),
    );
  });

  it.each([
    {
      name: 'duplicate planning IDs',
      records: () => [...RESOURCE_INDEX_RECORDS, RESOURCE_INDEX_RECORDS[0]],
      message: /LAB02 is duplicated/,
    },
    {
      name: 'empty localized metadata',
      records: () => replaceRecord('TERM-001', (record) => ({
        ...record,
        title: { ...record.title, en: ' ' },
      })),
      message: /TERM-001 has an empty en title/,
    },
    {
      name: 'missing Publication Pair destinations',
      records: () => replaceRecord('PB-R0-001', (record) => ({
        ...record,
        href: { ...record.href, en: '/en/practice/#different-entry' },
      })),
      message: /missing an aligned Publication Pair destination/,
    },
    {
      name: 'empty planned destinations',
      records: () => replaceRecord('TERM-001', (record) => ({
        ...record,
        href: { 'zh-CN': '#', en: '#' },
      })),
      message: /empty or non-internal zh-CN destination/,
    },
    {
      name: 'invalid prerequisite edges',
      records: () => replaceRecord('PB-R0-002', (record) => ({ ...record, prerequisites: ['F99'] })),
      message: /links to unknown curriculum ID F99/,
    },
    {
      name: 'prerequisites listed after their dependants',
      records: () => replaceRecord('PB-R0-005', (record) => ({
        ...record,
        prerequisites: ['F01', 'O03', 'O02'],
      })),
      message: /lists F01 before its prerequisite O03/,
    },
    {
      name: 'indexed subject prerequisite drift',
      records: () => replaceRecord('LAB02', (record) => ({
        ...record,
        prerequisites: ['F01', 'O03'],
      })),
      message: /LAB02 prerequisites do not match its published subject/,
    },
    {
      name: 'detail links that drift from their published subjects',
      records: () => replaceRecord('LAB02', (record) => ({
        ...record,
        href: { 'zh-CN': '/labs/not-vector-addition/', en: '/en/labs/not-vector-addition/' },
      })),
      message: /LAB02 does not link to its published subject/,
    },
    {
      name: 'unknown Evidence Status values',
      records: () => replaceRecord('LAB02', (record) => ({
        ...record,
        evidence: { compilation: ['Built'], runtime: ['Pending Hardware Verification'] },
      })),
      message: /unknown compilation status Built/,
    },
    {
      name: 'Evidence Status upgrades on Visual Explainers',
      records: () => replaceRecord('VIS01', (record) => ({
        ...record,
        evidence: { compilation: ['Compile-Checked'], runtime: [] },
      })),
      message: /VIS01 must not receive CUDA Evidence Status/,
    },
    {
      name: 'mixed Runtime-Not-Applicable status',
      records: () => replaceRecord('LAB02', (record) => ({
        ...record,
        evidence: { compilation: ['Compile-Checked'], runtime: ['Runtime-Not-Applicable', 'Pending Hardware Verification'] },
      })),
      message: /Runtime-Not-Applicable cannot coexist with another runtime status/,
    },
    {
      name: 'contradictory verified and pending runtime status',
      records: () => replaceRecord('LAB02', (record) => ({
        ...record,
        evidence: { compilation: ['Compile-Checked'], runtime: ['Runtime-Verified', 'Pending Hardware Verification'] },
      })),
      message: /Runtime-Verified cannot remain Pending Hardware Verification/,
    },
    {
      name: 'missing source access dates',
      records: () => replaceRecord('SRC-WEB-001', (record) => ({ ...record, sourceAccessDate: undefined })),
      message: /SRC-WEB-001 is missing a source access date/,
    },
    {
      name: 'stale source dates',
      records: () => replaceRecord('SRC-WEB-001', (record) => ({
        ...record,
        reviewedOn: '2025-01-01',
        sourceAccessDate: '2025-01-01',
      })),
      message: /SRC-WEB-001 sourceAccessDate is stale/,
    },
    {
      name: 'impossible calendar dates',
      records: () => replaceRecord('TERM-002', (record) => ({ ...record, reviewedOn: '2026-02-30' })),
      message: /TERM-002 reviewedOn must be a real ISO date/,
    },
    {
      name: 'source dates newer than their review',
      records: () => replaceRecord('SRC-WEB-002', (record) => ({
        ...record,
        reviewedOn: '2026-08-23',
        sourceAccessDate: '2026-08-24',
      })),
      message: /reviewed before its source was accessed/,
    },
  ])('rejects $name', ({ records, message }) => {
    expect(() => validateResourceCatalog(records(), { asOf })).toThrow(message);
  });

  it('rejects orphaned indexed subjects and cycles across the full prerequisite graph', () => {
    expect(() => validateResourceCatalog(
      RESOURCE_INDEX_RECORDS.filter(({ planningId }) => planningId !== 'VIS02'),
      { asOf },
    )).toThrow(/VIS02 is orphaned from the visuals index/);

    const destinations: Record<string, PublishedDestination> = {
      ...PUBLISHED_DESTINATIONS,
      O01: { ...PUBLISHED_DESTINATIONS.O01, prerequisites: ['O02'] },
    };
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, { asOf, destinations })).toThrow(
      /prerequisite graph contains a cycle/,
    );
  });
});
