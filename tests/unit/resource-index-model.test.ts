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

const asOf = new Date('2026-09-05T12:00:00Z');

function replaceRecord(planningId: string, replacement: (record: ResourceIndexRecord) => ResourceIndexRecord) {
  return RESOURCE_INDEX_RECORDS.map((record) =>
    record.planningId === planningId ? replacement(record) : record,
  );
}

describe('resource index catalog', () => {
  it('validates the complete eligible production catalog and projects every index group', () => {
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, { asOf })).not.toThrow();
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(370);
    expect(
      Object.fromEntries(INDEX_GROUPS.map((group) => [
        group,
        projectResourceIndex(RESOURCE_INDEX_RECORDS, group, 'en', { asOf }).length,
      ])),
    ).toEqual({ labs: 11, practice: 72, visuals: 19, glossary: 186, sources: 82 });
    for (const absentId of ['L06', 'LAB12']) {
      expect(RESOURCE_INDEX_RECORDS.some(({ planningId }) => planningId === absentId)).toBe(false);
      expect(PUBLISHED_DESTINATIONS[absentId]).toBeUndefined();
    }

    expect(Object.fromEntries(
      ['L03', 'L04', 'L05', 'EX17', 'LAB11'].map((planningId) => [
        planningId,
        {
          href: PUBLISHED_DESTINATIONS[planningId].href.en,
          prerequisites: PUBLISHED_DESTINATIONS[planningId].prerequisites,
        },
      ]),
    )).toEqual({
      L03: { href: '/en/libraries/cub-device-primitives/', prerequisites: ['A02', 'A03', 'M07', 'L01'] },
      L04: { href: '/en/libraries/cub-warp-block-primitives/', prerequisites: ['F02', 'M03', 'M05', 'A02', 'A03', 'L03'] },
      L05: { href: '/en/libraries/libcu-plus-plus-synchronization/', prerequisites: ['M05', 'M13', 'M19'] },
      EX17: { href: '/en/examples/cub-device-reduction-scan/', prerequisites: ['L03'] },
      LAB11: { href: '/en/labs/compare-custom-reduction-with-cub/', prerequisites: ['Q12', 'L03'] },
    });

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
      ['Q06', 'Q07', 'Q08', 'LAB06', 'LAB08', 'VIS14'].map((planningId) => [
        planningId,
        {
          href: PUBLISHED_DESTINATIONS[planningId].href.en,
          prerequisites: PUBLISHED_DESTINATIONS[planningId].prerequisites,
        },
      ]),
    )).toEqual({
      Q06: { href: '/en/correctness/apod-optimization-loop/', prerequisites: ['Q05'] },
      Q07: { href: '/en/correctness/timeline-first-nsight-systems/', prerequisites: ['M07', 'M09', 'Q05'] },
      Q08: { href: '/en/correctness/kernel-first-nsight-compute/', prerequisites: ['Q07', 'M02', 'M03'] },
      LAB06: { href: '/en/labs/build-overlapped-pipeline/', prerequisites: ['M09', 'Q07'] },
      LAB08: { href: '/en/labs/profile-full-application-before-kernel/', prerequisites: ['Q07', 'Q08'] },
      VIS14: { href: '/en/visuals/nsight-systems-versus-nsight-compute/', prerequisites: ['Q07', 'Q08'] },
    });

    expect(Object.fromEntries(
      ['A14', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13', 'LAB09', 'LAB10', 'VIS13'].map((planningId) => [
        planningId,
        {
          href: PUBLISHED_DESTINATIONS[planningId].href.en,
          prerequisites: PUBLISHED_DESTINATIONS[planningId].prerequisites,
        },
      ]),
    )).toEqual({
      A14: { href: '/en/algorithms/algorithm-choice-arithmetic-intensity/', prerequisites: ['A01', 'A02', 'A05', 'A08'] },
      Q09: { href: '/en/correctness/occupancy-stalls-throughput/', prerequisites: ['Q08', 'F08'] },
      Q10: { href: '/en/correctness/roofline-arithmetic-intensity/', prerequisites: ['Q05', 'A14'] },
      Q11: { href: '/en/correctness/transpose-optimization-case-study/', prerequisites: ['A05', 'Q06', 'Q08', 'Q10'] },
      Q12: { href: '/en/correctness/reduction-optimization-case-study/', prerequisites: ['A02', 'Q02', 'Q06', 'Q08'] },
      Q13: { href: '/en/correctness/gemm-optimization-case-study/', prerequisites: ['A08', 'Q06', 'Q08', 'Q10'] },
      LAB09: { href: '/en/labs/build-original-roofline/', prerequisites: ['Q10'] },
      LAB10: { href: '/en/labs/optimize-canonical-transpose/', prerequisites: ['Q11'] },
      VIS13: { href: '/en/visuals/roofline/', prerequisites: ['Q10'] },
    });

    expect(Object.fromEntries(
      ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10', 'A11', 'A12', 'A13', 'Q02', 'EX11', 'EX12', 'EX13', 'EX14', 'EX15'].map((planningId) => [
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
      A10: { href: '/en/algorithms/numerically-stable-softmax/', prerequisites: ['A02', 'M02', 'M03'] },
      A11: { href: '/en/algorithms/attention-as-an-io-problem/', prerequisites: ['A08', 'A10'] },
      A12: { href: '/en/algorithms/sparse-formats-spmv/', prerequisites: ['M01', 'M02'] },
      A13: { href: '/en/algorithms/sparse-matrix-multiplication-preprocessing/', prerequisites: ['A12', 'A08'] },
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
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^PB-R3-(?:00[1-9]|01[0-6])$/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'PB-R3-001', 'PB-R3-002', 'PB-R3-003', 'PB-R3-004', 'PB-R3-005', 'PB-R3-006', 'PB-R3-007', 'PB-R3-008', 'PB-R3-009', 'PB-R3-010', 'PB-R3-011', 'PB-R3-012', 'PB-R3-013', 'PB-R3-014', 'PB-R3-015', 'PB-R3-016',
    ]);
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^PB-R4-/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'PB-R4-001', 'PB-R4-002', 'PB-R4-003', 'PB-R4-004', 'PB-R4-005', 'PB-R4-006',
    ]);
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^TERM-(?:09[6-9]|1(?:[0-4]\d|5[01]))$/.test(planningId)).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 56 }, (_, index) => `TERM-${String(96 + index).padStart(3, '0')}`),
    );
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^TERM-15[2-9]$/.test(planningId)).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 8 }, (_, index) => `TERM-${152 + index}`),
    );
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^TERM-16[0-5]$/.test(planningId)).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 6 }, (_, index) => `TERM-${160 + index}`),
    );
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^TERM-(?:16[6-9]|17[0-6])$/.test(planningId)).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 11 }, (_, index) => `TERM-${166 + index}`),
    );
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^TERM-(?:17[7-9]|18[0-6])$/.test(planningId)).map(({ planningId }) => planningId)).toEqual(
      Array.from({ length: 10 }, (_, index) => `TERM-${177 + index}`),
    );
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^SRC-CUDA-0(?:2[5-9]|3\d|4[0-5])$/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'SRC-CUDA-025', 'SRC-CUDA-026', 'SRC-CUDA-027', 'SRC-CUDA-028', 'SRC-CUDA-029', 'SRC-CUDA-030',
      'SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033', 'SRC-CUDA-034', 'SRC-CUDA-035',
      'SRC-CUDA-036', 'SRC-CUDA-037', 'SRC-CUDA-038', 'SRC-CUDA-039', 'SRC-CUDA-040',
      'SRC-CUDA-041', 'SRC-CUDA-042', 'SRC-CUDA-043', 'SRC-CUDA-044', 'SRC-CUDA-045',
    ]);
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^SRC-CUDA-04[6-9]$/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'SRC-CUDA-046', 'SRC-CUDA-047', 'SRC-CUDA-048', 'SRC-CUDA-049',
    ]);
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^SRC-CUDA-(?:05\d|060)$/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'SRC-CUDA-050', 'SRC-CUDA-051', 'SRC-CUDA-052', 'SRC-CUDA-053', 'SRC-CUDA-054', 'SRC-CUDA-055', 'SRC-CUDA-056', 'SRC-CUDA-057', 'SRC-CUDA-058', 'SRC-CUDA-059', 'SRC-CUDA-060',
    ]);
    expect(RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^SRC-CUDA-06[1-6]$/.test(planningId)).map(({ planningId }) => planningId)).toEqual([
      'SRC-CUDA-061', 'SRC-CUDA-062', 'SRC-CUDA-063', 'SRC-CUDA-064', 'SRC-CUDA-065', 'SRC-CUDA-066',
    ]);
    expect(RESOURCE_INDEX_RECORDS.some(({ planningId }) => planningId === 'SRC-HIST-003')).toBe(true);

    for (const expected of [
      ...TOOLCHAIN_CATALOG_RELATIONSHIPS,
      { planningId: 'PB-R4-005', group: 'practice', prerequisites: ['L05'], relatedUnits: ['M05', 'M19', 'L05'] },
      { planningId: 'PB-R4-006', group: 'practice', prerequisites: ['L05'], relatedUnits: ['M05', 'M13', 'M19', 'L05'] },
      { planningId: 'TERM-185', group: 'glossary', prerequisites: [], relatedUnits: ['M05', 'L05'] },
      { planningId: 'TERM-186', group: 'glossary', prerequisites: [], relatedUnits: ['M05', 'M13', 'L05'] },
      { planningId: 'SRC-CUDA-065', group: 'sources', prerequisites: [], relatedUnits: ['M05', 'M13', 'L05'] },
      { planningId: 'SRC-CUDA-066', group: 'sources', prerequisites: [], relatedUnits: ['M19', 'L05'] },
    ]) {
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
      asOf: new Date('2026-09-04T16:00:00Z'),
    })).not.toThrow();
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, {
      asOf: new Date('2026-09-04T15:59:59Z'),
    })).toThrow(/reviewedOn must not be in the future/);
  });

  it('projects current destinations, relationships, and evidence without deriving URLs from IDs', () => {
    const labs = projectResourceIndex(RESOURCE_INDEX_RECORDS, 'labs', 'en', { asOf });
    const lab01 = labs.find(({ planningId }) => planningId === 'LAB01');
    const lab = labs.find(({ planningId }) => planningId === 'LAB02');
    const lab03 = labs.find(({ planningId }) => planningId === 'LAB03');
    const lab09 = labs.find(({ planningId }) => planningId === 'LAB09');
    const lab10 = labs.find(({ planningId }) => planningId === 'LAB10');
    const lab11 = labs.find(({ planningId }) => planningId === 'LAB11');

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
    expect(lab09).toMatchObject({
      planningId: 'LAB09',
      href: '/en/labs/build-original-roofline/',
      counterpart: '/labs/build-original-roofline/',
      difficulty: 'advanced',
      evidence: { compilation: [], runtime: ['Pending Hardware Verification'] },
      reviewedOn: '2026-09-01',
    });
    expect(lab09?.prerequisites.map(({ id }) => id)).toEqual(['Q10']);
    expect(lab09?.relatedUnits.map(({ id }) => id)).toEqual(['Q09', 'A14', 'EX02', 'VIS13']);
    expect(lab10).toMatchObject({
      planningId: 'LAB10',
      href: '/en/labs/optimize-canonical-transpose/',
      counterpart: '/labs/optimize-canonical-transpose/',
      difficulty: 'advanced',
      evidence: { compilation: [], runtime: ['Pending Hardware Verification'] },
      reviewedOn: '2026-09-02',
    });
    expect(lab10?.prerequisites.map(({ id }) => id)).toEqual(['Q11']);
    expect(lab10?.relatedUnits.map(({ id }) => id)).toEqual(['A05', 'Q06', 'Q08', 'Q10', 'EX14', 'VIS11']);
    expect(lab10?.hardwareGate).toContain('134,221,952 bytes');
    expect(lab10?.hardwareGate).toContain('Node.js 24.19.0');
    expect(lab10?.hardwareGate).toContain('node --version output v24.19.0');
    expect(lab10?.versionGate).toContain('Nsight Compute 2022.3.0.22/2025.2.1.3/2026.2.1.5');
    expect(lab10?.versionGate).toContain('exact Node.js 24.19.0');
    expect(lab11).toMatchObject({
      planningId: 'LAB11',
      href: '/en/labs/compare-custom-reduction-with-cub/',
      counterpart: '/labs/compare-custom-reduction-with-cub/',
      difficulty: 'advanced',
      evidence: { compilation: [], runtime: ['Pending Hardware Verification'] },
      reviewedOn: '2026-09-05',
    });
    expect(lab11?.prerequisites.map(({ id, href }) => [id, href])).toEqual([
      ['Q12', '/en/correctness/reduction-optimization-case-study/'],
      ['L03', '/en/libraries/cub-device-primitives/'],
    ]);
    expect(lab11?.relatedUnits.map(({ id }) => id)).toEqual([
      'A02', 'Q01', 'Q02', 'Q06', 'Q08', 'Q10', 'L01', 'L04', 'EX11', 'EX17', 'VIS10',
    ]);
    expect(lab11?.hardwareGate).toContain('8000000000 bytes');
    expect(lab11?.versionGate).toContain('bundled CUB 1.15.1/2.8.2/3.3.4');
    expect(lab11?.versionGate).toContain('selected CCCL 3.4.2 only with cuda-12.9/cuda-13.3');

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

    for (const expected of [
      {
        planningId: 'LAB06',
        href: '/en/labs/build-overlapped-pipeline/',
        counterpart: '/labs/build-overlapped-pipeline/',
        prerequisites: ['M09', 'Q07'],
        relatedUnits: ['EX07', 'LAB08', 'VIS14'],
        profilerGate: 'Nsight Systems 2022.4.2.1/2025.1.3.140/2026.1.3.425',
      },
      {
        planningId: 'LAB08',
        href: '/en/labs/profile-full-application-before-kernel/',
        counterpart: '/labs/profile-full-application-before-kernel/',
        prerequisites: ['Q07', 'Q08'],
        relatedUnits: ['EX07', 'LAB06', 'VIS14'],
        profilerGate: 'Nsight Compute 2022.3.0.22/2025.2.1.3/2026.2.1.5',
      },
    ] as const) {
      const currentLab = labs.find(({ planningId }) => planningId === expected.planningId);
      expect(currentLab).toMatchObject({
        planningId: expected.planningId,
        href: expected.href,
        counterpart: expected.counterpart,
        difficulty: 'intermediate',
        evidence: {
          compilation: [],
          runtime: ['Pending Hardware Verification'],
        },
        reviewedOn: '2026-08-31',
      });
      expect(currentLab?.prerequisites.map(({ id }) => id)).toEqual(expected.prerequisites);
      expect(currentLab?.relatedUnits.map(({ id }) => id)).toEqual(expected.relatedUnits);
      expect(currentLab?.hardwareGate).toContain('49,176 bytes');
      expect(currentLab?.versionGate).toContain(expected.profilerGate);
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
      'VIS13',
      'VIS14',
      'VIS18',
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
        planningId: 'VIS13',
        href: '/en/visuals/roofline/',
        counterpart: '/visuals/roofline/',
        prerequisites: [['Q10', '/en/correctness/roofline-arithmetic-intensity/']],
      },
      {
        planningId: 'VIS14',
        href: '/en/visuals/nsight-systems-versus-nsight-compute/',
        counterpart: '/visuals/nsight-systems-versus-nsight-compute/',
        prerequisites: [
          ['Q07', '/en/correctness/timeline-first-nsight-systems/'],
          ['Q08', '/en/correctness/kernel-first-nsight-compute/'],
        ],
      },
      {
        planningId: 'VIS18',
        href: '/en/visuals/attention-memory-traffic/',
        counterpart: '/visuals/attention-memory-traffic/',
        prerequisites: [['A11', '/en/algorithms/attention-as-an-io-problem/']],
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

    expect(projected).toHaveLength(211);
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
