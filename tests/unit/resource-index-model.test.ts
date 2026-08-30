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
import { TOOLCHAIN_CATALOG_RELATIONSHIPS } from '../helpers/toolchain-catalog-contract';

const asOf = new Date('2026-08-31T12:00:00Z');

function replaceRecord(planningId: string, replacement: (record: ResourceIndexRecord) => ResourceIndexRecord) {
  return RESOURCE_INDEX_RECORDS.map((record) =>
    record.planningId === planningId ? replacement(record) : record,
  );
}

describe('resource index catalog', () => {
  it('validates the complete eligible production catalog and projects every index group', () => {
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, { asOf })).not.toThrow();
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(284);
    expect(
      Object.fromEntries(INDEX_GROUPS.map((group) => [
        group,
        projectResourceIndex(RESOURCE_INDEX_RECORDS, group, 'en', { asOf }).length,
      ])),
    ).toEqual({ labs: 6, practice: 50, visuals: 16, glossary: 151, sources: 61 });
    for (const absentId of ['LAB06', 'Q11', 'LAB10', 'Q13', 'L06', 'LAB12']) {
      expect(RESOURCE_INDEX_RECORDS.some(({ planningId }) => planningId === absentId)).toBe(false);
      expect(PUBLISHED_DESTINATIONS[absentId]).toBeUndefined();
    }

    expect(Object.fromEntries(
      ['Q01', 'Q03', 'Q04', 'Q05', 'EX16', 'LAB04', 'LAB05', 'LAB07'].map((planningId) => [
        planningId,
        {
          href: PUBLISHED_DESTINATIONS[planningId].href.en,
          prerequisites: PUBLISHED_DESTINATIONS[planningId].prerequisites,
        },
      ]),
    )).toEqual({
      Q01: { href: '/en/correctness/cpu-references-tolerances-invariants/', prerequisites: ['F04', 'O04'] },
      Q03: { href: '/en/correctness/memcheck-invalid-memory-access/', prerequisites: ['F05', 'Q01'] },
      Q04: { href: '/en/correctness/racecheck-initcheck-synccheck/', prerequisites: ['M05', 'M06', 'Q03'] },
      Q05: { href: '/en/correctness/timing-asynchronous-gpu-work/', prerequisites: ['M08', 'Q01'] },
      EX16: { href: '/en/examples/sanitizer-defect-suite/', prerequisites: ['Q03', 'Q04'] },
      LAB04: { href: '/en/labs/observe-coalescing/', prerequisites: ['M02', 'Q05'] },
      LAB05: { href: '/en/labs/remove-shared-memory-bank-conflicts/', prerequisites: ['M04', 'Q05'] },
      LAB07: { href: '/en/labs/diagnose-four-sanitizer-failures/', prerequisites: ['Q03', 'Q04'] },
    });

    expect(Object.fromEntries(
      ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'Q02', 'EX11', 'EX12', 'EX13', 'EX14', 'EX15'].map((planningId) => [
        planningId,
        {
          href: PUBLISHED_DESTINATIONS[planningId].href.en,
          prerequisites: PUBLISHED_DESTINATIONS[planningId].prerequisites,
        },
      ]),
    )).toEqual({
      A01: { href: '/en/algorithms/elementwise-map/', prerequisites: ['F03', 'F04', 'M02'] },
      A02: { href: '/en/algorithms/multi-stage-reduction/', prerequisites: ['M03', 'M05', 'M06'] },
      A03: { href: '/en/algorithms/inclusive-exclusive-scan/', prerequisites: ['A02', 'M05'] },
      A04: { href: '/en/algorithms/privatized-histogram/', prerequisites: ['M03', 'M05'] },
      A05: { href: '/en/algorithms/matrix-transpose-layout/', prerequisites: ['M02', 'M03', 'M04'] },
      A06: { href: '/en/algorithms/stencil-neighborhood-reuse/', prerequisites: ['M03', 'M04', 'M05'] },
      A07: { href: '/en/algorithms/convolution-reuse-layout/', prerequisites: ['A06', 'M03'] },
      A08: { href: '/en/algorithms/tiled-gemm-correctness/', prerequisites: ['A05', 'M03', 'M04', 'A02'] },
      A09: { href: '/en/algorithms/sorting-selection-compaction/', prerequisites: ['A03', 'A04'] },
      Q02: { href: '/en/correctness/floating-point-order-reproducibility/', prerequisites: ['Q01', 'A02'] },
      EX11: { href: '/en/examples/multi-stage-reduction/', prerequisites: ['A02', 'Q02'] },
      EX12: { href: '/en/examples/inclusive-exclusive-scan/', prerequisites: ['A03'] },
      EX13: { href: '/en/examples/privatized-histogram/', prerequisites: ['A04'] },
      EX14: { href: '/en/examples/tiled-transpose/', prerequisites: ['A05'] },
      EX15: { href: '/en/examples/tiled-gemm/', prerequisites: ['A08'] },
    });

    expect(Object.fromEntries(
      ['M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'EX07', 'EX08', 'EX09', 'VIS08'].map((planningId) => [
        planningId,
        {
          href: PUBLISHED_DESTINATIONS[planningId].href.en,
          prerequisites: PUBLISHED_DESTINATIONS[planningId].prerequisites,
        },
      ]),
    )).toEqual({
      M09: { href: '/en/memory/pinned-memory-transfer-overlap/', prerequisites: ['M07', 'M08'] },
      M10: { href: '/en/memory/unified-memory-page-migration/', prerequisites: ['M01', 'M02'] },
      M11: { href: '/en/memory/stream-ordered-allocation-memory-pools/', prerequisites: ['M07', 'M08'] },
      M12: { href: '/en/memory/cooperative-groups/', prerequisites: ['M05', 'M06'] },
      M13: { href: '/en/memory/asynchronous-copy-pipelines/', prerequisites: ['M03', 'M05', 'M08'] },
      M14: { href: '/en/memory/cuda-graphs/', prerequisites: ['M07', 'M08'] },
      EX07: { href: '/en/examples/streams-events-overlap/', prerequisites: ['M07', 'M08', 'M09'] },
      EX08: { href: '/en/examples/unified-memory-migration/', prerequisites: ['M10'] },
      EX09: { href: '/en/examples/graph-capture/', prerequisites: ['M14'] },
      VIS08: { href: '/en/visuals/page-migration/', prerequisites: ['M01', 'M02', 'M10'] },
    });

    expect(Object.fromEntries(
      ['M15', 'M16', 'M17', 'M18', 'M19', 'EX10', 'VIS09'].map((planningId) => [
        planningId,
        {
          href: PUBLISHED_DESTINATIONS[planningId].href.en,
          title: PUBLISHED_DESTINATIONS[planningId].title.en,
          prerequisites: PUBLISHED_DESTINATIONS[planningId].prerequisites,
        },
      ]),
    )).toEqual({
      M15: {
        href: '/en/toolchain/nvcc-compilation-flow/',
        title: 'M15: NVCC Host/Device Compilation Flow',
        prerequisites: ['F04', 'O04'],
      },
      M16: {
        href: '/en/toolchain/ptx-cubin-fatbinary/',
        title: 'M16: PTX, Cubins, SASS, and Fatbinaries',
        prerequisites: ['M15', 'F06'],
      },
      M17: {
        href: '/en/toolchain/compiler-architecture-targets/',
        title: 'M17: Choosing Compiler Architecture Targets',
        prerequisites: ['M16', 'F06'],
      },
      M18: {
        href: '/en/toolchain/separate-compilation-device-linking/',
        title: 'M18: Separate Compilation and Device Linking',
        prerequisites: ['M15', 'M16'],
      },
      M19: {
        href: '/en/toolchain/cpp-dialect-boundaries/',
        title: 'M19: CUDA C++17, C++20, and C++23 Dialect Boundaries',
        prerequisites: ['O04', 'M15'],
      },
      EX10: {
        href: '/en/examples/ptx-fatbinary-inspection/',
        title: 'EX10: PTX and Fatbinary Inspection Runnable Example',
        prerequisites: ['M15', 'M16'],
      },
      VIS09: {
        href: '/en/visuals/artifact-pipeline/',
        title: 'NVCC Artifact Pipeline',
        prerequisites: ['M15', 'M16', 'M17'],
      },
    });

    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^PB-R2-/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'PB-R2-001', 'PB-R2-002', 'PB-R2-003', 'PB-R2-004', 'PB-R2-005', 'PB-R2-006',
      'PB-R2-007', 'PB-R2-008', 'PB-R2-009', 'PB-R2-010', 'PB-R2-011',
      'PB-R2-012', 'PB-R2-013', 'PB-R2-014', 'PB-R2-015', 'PB-R2-016',
      'PB-R2-017', 'PB-R2-018', 'PB-R2-019', 'PB-R2-020', 'PB-R2-021',
    ]);
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^TERM-(?:09[6-9]|1(?:[0-4]\d|5[01]))$/.test(planningId)).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 56 }, (_, index) => `TERM-${String(96 + index).padStart(3, '0')}`),
    );
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^SRC-CUDA-0(?:2[5-9]|3\d|4[0-5])$/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'SRC-CUDA-025', 'SRC-CUDA-026', 'SRC-CUDA-027', 'SRC-CUDA-028', 'SRC-CUDA-029', 'SRC-CUDA-030',
      'SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033', 'SRC-CUDA-034', 'SRC-CUDA-035',
      'SRC-CUDA-036', 'SRC-CUDA-037', 'SRC-CUDA-038', 'SRC-CUDA-039', 'SRC-CUDA-040',
      'SRC-CUDA-041', 'SRC-CUDA-042', 'SRC-CUDA-043', 'SRC-CUDA-044', 'SRC-CUDA-045',
    ]);
    expect(RESOURCE_INDEX_RECORDS.some(({ planningId }) => planningId === 'SRC-HIST-003')).toBe(true);

    for (const expected of TOOLCHAIN_CATALOG_RELATIONSHIPS) {
      const record = RESOURCE_INDEX_RECORDS.find(({ planningId }) => planningId === expected.planningId);
      expect(record, expected.planningId).toMatchObject({
        group: expected.group,
        prerequisites: expected.prerequisites,
        relatedUnits: expected.relatedUnits,
      });
    }
    expect(RESOURCE_INDEX_RECORDS.find(({ planningId }) => planningId === 'SRC-WEB-001')?.versionGate.en)
      .toBe('Astro 7.2.4; @astrojs/markdown-remark 7.2.4 unified({ rehypePlugins })');

    const toolchainPractice = RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^PB-R2-0(?:0[7-9]|1[01])$/.test(planningId));
    for (const record of toolchainPractice) {
      expect(record.hardwareGate.en, record.planningId).toMatch(/^None;/);
      expect(record.versionGate.en, record.planningId).toContain('11.8.0');
      expect(record.versionGate.en, record.planningId).toContain('12.9.2');
      expect(record.versionGate.en, record.planningId).toContain('13.3.1');
      expect(record.relatedUnits, record.planningId).toContain('EX10');
    }
  });

  it('keeps one canonical Glossary entry per term in both locales', () => {
    const glossary = RESOURCE_INDEX_RECORDS.filter(({ group }) => group === 'glossary');

    for (const locale of ['zh-CN', 'en'] as const) {
      const canonicalTerms = glossary.map(({ title }) =>
        title[locale].split('·')[0].trim().toLocaleLowerCase(locale),
      );
      expect(new Set(canonicalTerms).size, locale).toBe(canonicalTerms.length);
    }
  });

  it('interprets date-only review records in the declared maintainer review timezone', () => {
    expect(REVIEW_DATE_TIME_ZONE).toBe('Asia/Shanghai');
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, {
      asOf: new Date('2026-08-30T16:00:00Z'),
    })).not.toThrow();
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, {
      asOf: new Date('2026-08-30T15:59:59Z'),
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

    for (const expected of [
      {
        planningId: 'LAB04',
        href: '/en/labs/observe-coalescing/',
        counterpart: '/labs/observe-coalescing/',
        prerequisites: ['M02', 'Q05'],
        relatedUnits: ['EX05'],
        memory: '3,068 bytes',
      },
      {
        planningId: 'LAB05',
        href: '/en/labs/remove-shared-memory-bank-conflicts/',
        counterpart: '/labs/remove-shared-memory-bank-conflicts/',
        prerequisites: ['M04', 'Q05'],
        relatedUnits: ['EX06'],
        memory: '8,576 bytes',
      },
      {
        planningId: 'LAB07',
        href: '/en/labs/diagnose-four-sanitizer-failures/',
        counterpart: '/labs/diagnose-four-sanitizer-failures/',
        prerequisites: ['Q03', 'Q04'],
        relatedUnits: ['EX16'],
        memory: '128 bytes',
      },
    ]) {
      const releaseLab = labs.find(({ planningId }) => planningId === expected.planningId);
      expect(releaseLab).toMatchObject({
        planningId: expected.planningId,
        href: expected.href,
        counterpart: expected.counterpart,
        difficulty: 'intermediate',
        evidence: {
          compilation: [],
          runtime: ['Pending Hardware Verification'],
        },
        reviewedOn: '2026-08-28',
      });
      expect(releaseLab?.prerequisites.map(({ id }) => id)).toEqual(expected.prerequisites);
      expect(releaseLab?.relatedUnits.map(({ id }) => id)).toEqual(expected.relatedUnits);
      expect(releaseLab?.hardwareGate).toContain(expected.memory);
      expect(releaseLab?.versionGate).toContain('CUDA Toolkit Lane 11.8.0, 12.9.2, or 13.3.1');
    }

    const visuals = projectResourceIndex(RESOURCE_INDEX_RECORDS, 'visuals', 'en', { asOf });
    expect(visuals.map(({ planningId }) => planningId)).toEqual([
      'VIS01',
      'VIS02',
      'VIS03',
      'VIS04',
      'VIS05',
      'VIS06',
      'VIS07',
      'VIS08',
      'VIS09',
      'VIS10',
      'VIS11',
      'VIS12',
      'VIS19',
      'VIS20',
      'VIS21',
      'VIS22',
    ]);
    for (const expected of [
      {
        planningId: 'VIS03',
        href: '/en/visuals/warp-divergence/',
        counterpart: '/visuals/warp-divergence/',
        prerequisites: [],
      },
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
        planningId: 'VIS07',
        href: '/en/visuals/stream-event-dependencies/',
        counterpart: '/visuals/stream-event-dependencies/',
        prerequisites: [],
      },
      {
        planningId: 'VIS08',
        href: '/en/visuals/page-migration/',
        counterpart: '/visuals/page-migration/',
        prerequisites: [
          ['M01', '/en/memory/address-spaces/'],
          ['M02', '/en/memory/coalescing-transactions/'],
          ['M10', '/en/memory/unified-memory-page-migration/'],
        ],
      },
      {
        planningId: 'VIS09',
        href: '/en/visuals/artifact-pipeline/',
        counterpart: '/visuals/artifact-pipeline/',
        prerequisites: [
          ['M15', '/en/toolchain/nvcc-compilation-flow/'],
          ['M16', '/en/toolchain/ptx-cubin-fatbinary/'],
          ['M17', '/en/toolchain/compiler-architecture-targets/'],
        ],
      },
      {
        planningId: 'VIS10',
        href: '/en/visuals/reduction-stages/',
        counterpart: '/visuals/reduction-stages/',
        prerequisites: [['A02', '/en/algorithms/multi-stage-reduction/']],
      },
      {
        planningId: 'VIS11',
        href: '/en/visuals/tiled-transpose/',
        counterpart: '/visuals/tiled-transpose/',
        prerequisites: [['A05', '/en/algorithms/matrix-transpose-layout/']],
      },
      {
        planningId: 'VIS12',
        href: '/en/visuals/gemm-tiling-hierarchy/',
        counterpart: '/visuals/gemm-tiling-hierarchy/',
        prerequisites: [['A08', '/en/algorithms/tiled-gemm-correctness/']],
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
      const suffix = String(200 + (24 - index));
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

    expect(projected).toHaveLength(176);
    expect(projected.slice(-25).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 25 }, (_, index) => `TERM-${200 + index}`),
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
