// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import {
  INDEX_GROUPS,
  PUBLISHED_DESTINATIONS,
  REVIEW_DATE_TIME_ZONE,
  projectResourceIndex,
  validateResourceCatalog,
  type PublishedDestination,
  type ResourceIndexRecord,
} from '../../src/resource-indexes/resource-index-model';

const asOf = new Date('2026-08-27T12:00:00Z');

function replaceRecord(planningId: string, replacement: (record: ResourceIndexRecord) => ResourceIndexRecord) {
  return RESOURCE_INDEX_RECORDS.map((record) =>
    record.planningId === planningId ? replacement(record) : record,
  );
}

describe('resource index catalog', () => {
  it('validates the complete eligible production catalog and projects every index group', () => {
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, { asOf })).not.toThrow();
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(143);
    expect(
      Object.fromEntries(INDEX_GROUPS.map((group) => [
        group,
        projectResourceIndex(RESOURCE_INDEX_RECORDS, group, 'en', { asOf }).length,
      ])),
    ).toEqual({ labs: 3, practice: 21, visuals: 9, glossary: 76, sources: 34 });
    for (const absentId of ['LAB04', 'LAB05']) {
      expect(RESOURCE_INDEX_RECORDS.some(({ planningId }) => planningId === absentId)).toBe(false);
    }
  });

  it('interprets date-only review records in the declared maintainer review timezone', () => {
    expect(REVIEW_DATE_TIME_ZONE).toBe('Asia/Shanghai');
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, {
      asOf: new Date('2026-08-26T16:00:00Z'),
    })).not.toThrow();
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, {
      asOf: new Date('2026-08-26T15:59:59Z'),
    })).toThrow(/reviewedOn must not be in the future/);
  });

  it('projects current destinations, relationships, and evidence without deriving URLs from IDs', () => {
    const labs = projectResourceIndex(RESOURCE_INDEX_RECORDS, 'labs', 'en', { asOf });
    const lab01 = labs.find(({ planningId }) => planningId === 'LAB01');
    const lab = labs.find(({ planningId }) => planningId === 'LAB02');
    const lab03 = labs.find(({ planningId }) => planningId === 'LAB03');

    expect(lab01).toMatchObject({
      planningId: 'LAB01',
      href: '/en/labs/record-cuda-environment/',
      counterpart: '/labs/record-cuda-environment/',
      evidence: {
        compilation: [],
        runtime: ['Pending Hardware Verification'],
      },
    });
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
    expect(lab?.prerequisites.map(({ id, href }) => [id, href])).toEqual([
      ['O03', '/en/start/environment-manifest/'],
      ['F01', '/en/foundations/first-cuda-kernel/'],
    ]);
    expect(lab?.searchText).toContain('CUDA Toolkit Lane 11.8.0');
    expect(lab03).toMatchObject({
      planningId: 'LAB03',
      href: '/en/labs/break-and-repair-indexing/',
      counterpart: '/labs/break-and-repair-indexing/',
      difficulty: 'intermediate',
      evidence: {
        compilation: [],
        runtime: ['Pending Hardware Verification'],
      },
    });
    expect(lab03?.prerequisites.map(({ id, href }) => [id, href])).toEqual([
      ['F03', '/en/foundations/multidimensional-indexing/'],
      ['F05', '/en/foundations/asynchronous-errors/'],
    ]);
    expect(lab03?.searchText).toContain('EX04');

    const visuals = projectResourceIndex(RESOURCE_INDEX_RECORDS, 'visuals', 'en', { asOf });
    expect(visuals.map(({ planningId }) => planningId)).toEqual([
      'VIS01',
      'VIS02',
      'VIS04',
      'VIS05',
      'VIS06',
      'VIS19',
      'VIS20',
      'VIS21',
      'VIS22',
    ]);
    for (const expected of [
      {
        planningId: 'VIS04',
        href: '/en/visuals/memory-transactions/',
        counterpart: '/visuals/memory-transactions/',
        prerequisites: [],
      },
      {
        planningId: 'VIS05',
        href: '/en/visuals/shared-memory-banks/',
        counterpart: '/visuals/shared-memory-banks/',
        prerequisites: [],
      },
      {
        planningId: 'VIS06',
        href: '/en/visuals/memory-hierarchy-lifetime/',
        counterpart: '/visuals/memory-hierarchy-lifetime/',
        prerequisites: [],
      },
      {
        planningId: 'VIS19',
        href: '/en/foundations/asynchronous-errors/#vis19',
        counterpart: '/foundations/asynchronous-errors/#vis19',
        prerequisites: [['F04', '/en/foundations/host-device-lifecycle/']],
      },
      {
        planningId: 'VIS20',
        href: '/en/foundations/compute-capability/#vis20',
        counterpart: '/foundations/compute-capability/#vis20',
        prerequisites: [
          ['F02', '/en/foundations/execution-hierarchy/'],
          ['O03', '/en/start/environment-manifest/'],
        ],
      },
      {
        planningId: 'VIS21',
        href: '/en/foundations/runtime-driver-api/#vis21',
        counterpart: '/foundations/runtime-driver-api/#vis21',
        prerequisites: [
          ['F04', '/en/foundations/host-device-lifecycle/'],
          ['F05', '/en/foundations/asynchronous-errors/'],
        ],
      },
      {
        planningId: 'VIS22',
        href: '/en/foundations/launch-geometry/#vis22',
        counterpart: '/foundations/launch-geometry/#vis22',
        prerequisites: [
          ['F02', '/en/foundations/execution-hierarchy/'],
          ['F03', '/en/foundations/multidimensional-indexing/'],
          ['F06', '/en/foundations/compute-capability/'],
        ],
      },
    ] as const) {
      const visual = visuals.find(({ planningId }) => planningId === expected.planningId);
      expect(visual).toMatchObject({
        planningId: expected.planningId,
        href: expected.href,
        counterpart: expected.counterpart,
      });
      expect(visual?.evidence).toBeUndefined();
      expect(visual?.prerequisites.map(({ id, href }) => [id, href])).toEqual(expected.prerequisites);
    }
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

    expect(projected).toHaveLength(101);
    expect(projected.slice(-25).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 25 }, (_, index) => `TERM-${100 + index}`),
    );
  });

  it.each([
    {
      name: 'duplicate planning IDs',
      records: () => [...RESOURCE_INDEX_RECORDS, RESOURCE_INDEX_RECORDS[0]],
      message: /LAB01 is duplicated/,
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
      RESOURCE_INDEX_RECORDS.filter(({ planningId }) => planningId !== 'VIS22'),
      { asOf },
    )).toThrow(/VIS22 is orphaned from the visuals index/);

    const destinations: Record<string, PublishedDestination> = {
      ...PUBLISHED_DESTINATIONS,
      O01: { ...PUBLISHED_DESTINATIONS.O01, prerequisites: ['O02'] },
    };
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, { asOf, destinations })).toThrow(
      /prerequisite graph contains a cycle/,
    );
  });
});
