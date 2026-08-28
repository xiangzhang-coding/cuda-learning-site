// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');

type UnitContract = {
  id: 'M01' | 'M02' | 'M03' | 'M04';
  pairId: 'm01' | 'm02' | 'm03' | 'm04';
  slug: string;
  zhTitle: string;
  enTitle: string;
  prerequisites: readonly string[];
  relatedUnits: readonly string[];
  structure: readonly string[];
  sourceVersions: string;
  sourceUrls: readonly string[];
  practiceId: string;
  canonical?: {
    example: 'EX05' | 'EX06';
    range: 'access-kernel' | 'tiled-kernels' | 'shared-layouts';
  };
};

const units: readonly UnitContract[] = [
  {
    id: 'M01',
    pairId: 'm01',
    slug: 'address-spaces',
    zhTitle: 'M01：地址空间、所有权、作用域与生命周期',
    enTitle: 'M01: Address spaces, ownership, scope, and lifetime',
    prerequisites: ['F04', 'F06'],
    relatedUnits: ['VIS06'],
    structure: [
      'outcome',
      'prerequisites',
      'classification-model',
      'host-global-constant',
      'shared-local-register',
      'cache-boundary',
      'release-ledger',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3,13.3.1',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html',
      'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__MEMORY.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#memory-hierarchy',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-runtime-api/group__CUDART__MEMORY.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-runtime-api/group__CUDART__MEMORY.html',
    ],
    practiceId: 'PB-R1-013',
  },
  {
    id: 'M02',
    pairId: 'm02',
    slug: 'coalescing-transactions',
    zhTitle: 'M02：把合并访问理解为事务塑形',
    enTitle: 'M02: Coalescing as transaction shaping',
    prerequisites: ['M01', 'F03'],
    relatedUnits: ['EX05', 'VIS04'],
    structure: [
      'outcome',
      'prerequisites',
      'model',
      'aligned',
      'offset',
      'stride',
      'active-lanes',
      'canonical-example',
      'measurement-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#memory-optimizations',
      'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#coalesced-access-to-global-memory',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#memory-hierarchy',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html',
    ],
    practiceId: 'PB-R1-014',
    canonical: {
      example: 'EX05',
      range: 'access-kernel',
    },
  },
  {
    id: 'M03',
    pairId: 'm03',
    slug: 'shared-memory-tiling',
    zhTitle: 'M03：共享内存分块',
    enTitle: 'M03: Shared-memory tiling',
    prerequisites: ['M01', 'M02'],
    relatedUnits: ['EX06'],
    structure: [
      'outcome',
      'prerequisites',
      'tile-contract',
      'load',
      'first-barrier',
      'use',
      'second-barrier',
      'bounds',
      'canonical-example',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html',
      'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#memory-optimizations',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#memory-hierarchy',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html',
    ],
    practiceId: 'PB-R1-015',
    canonical: {
      example: 'EX06',
      range: 'tiled-kernels',
    },
  },
  {
    id: 'M04',
    pairId: 'm04',
    slug: 'bank-conflicts-layouts',
    zhTitle: 'M04：Bank conflict 与布局变换',
    enTitle: 'M04: Bank conflicts and layout transforms',
    prerequisites: ['M03'],
    relatedUnits: ['EX06', 'VIS05'],
    structure: [
      'outcome',
      'prerequisites',
      'fixture',
      'conflict-broadcast',
      'strides',
      'tile-layout',
      'padding',
      'canonical-example',
      'measurement-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#memory-optimizations',
      'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#shared-memory-and-memory-banks',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#memory-hierarchy',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html',
    ],
    practiceId: 'PB-R1-016',
    canonical: {
      example: 'EX06',
      range: 'shared-layouts',
    },
  },
] as const;

async function readPage(localePrefix: '' | 'en/', slug: string, child?: 'exercises' | 'solutions') {
  const extension = child ? 'md' : 'mdx';
  const relativePath = child
    ? `${localePrefix}memory/${slug}/${child}.${extension}`
    : `${localePrefix}memory/${slug}.${extension}`;
  return readFile(path.join(docsRoot, relativePath), 'utf8');
}

function frontmatter(source: string) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function yamlList(metadata: string, field: string) {
  const match = new RegExp(`^${field}:\\n((?:  - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function projectedMetadata(metadata: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(
    `attrs: \\{ name: '${escaped}', content: (?:'([^']*)'|([^ }]+)) \\}`,
  ).exec(metadata);
  return match?.[1] ?? match?.[2];
}

function section(source: string, heading: RegExp) {
  const match = new RegExp(`^## ${heading.source}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm').exec(source);
  expect(match, heading.source).not.toBeNull();
  return match?.[1] ?? '';
}

describe('M01-M04 publication-pair source contracts', () => {
  it('publishes exact routes, frozen titles, direct counterparts, and F08-style head projections', async () => {
    for (const unit of units) {
      for (const localePrefix of ['', 'en/'] as const) {
        const source = await readPage(localePrefix, unit.slug);
        const metadata = frontmatter(source);
        const isEnglish = localePrefix === 'en/';
        const counterpart = isEnglish
          ? `/memory/${unit.slug}/`
          : `/en/memory/${unit.slug}/`;

        expect(metadata).toContain(`title: '${isEnglish ? unit.enTitle : unit.zhTitle}'`);
        expect(metadata).toContain(`pairId: ${unit.pairId}`);
        expect(metadata).toContain(`counterpart: ${counterpart}`);
        expect(metadata).toContain("factCheckDate: '2026-08-27'");
        expect(metadata).toContain('license: CC-BY-4.0');
        expect(metadata).toContain('provenance: original');
        expect(metadata).toContain('resourceKind: learning-unit');
        expect(metadata).toContain(`unitId: ${unit.id}`);
        expect(metadata).toContain('hardwareGate: none');
        expect(yamlList(metadata, 'structure')).toEqual(unit.structure);
        expect(yamlList(metadata, 'prerequisites')).toEqual(unit.prerequisites);
        expect(yamlList(metadata, 'relatedUnits')).toEqual(unit.relatedUnits);

        expect(projectedMetadata(metadata, 'cuda:pair-id')).toBe(unit.pairId);
        expect(projectedMetadata(metadata, 'cuda:fact-check-date')).toBe('2026-08-27');
        expect(projectedMetadata(metadata, 'cuda:license')).toBe('CC-BY-4.0');
        expect(projectedMetadata(metadata, 'cuda:structure')).toBe(unit.structure.join(','));
        expect(projectedMetadata(metadata, 'cuda:resource-kind')).toBe('learning-unit');
        expect(projectedMetadata(metadata, 'cuda:unit-id')).toBe(unit.id);
        expect(projectedMetadata(metadata, 'cuda:prerequisites')).toBe(unit.prerequisites.join(','));
        expect(projectedMetadata(metadata, 'cuda:related-units')).toBe(unit.relatedUnits.join(','));
        expect(projectedMetadata(metadata, 'cuda:hardware-gate')).toBe('none');
        expect(projectedMetadata(metadata, 'cuda:evidence-compilation')).toBe('none');
        expect(projectedMetadata(metadata, 'cuda:evidence-runtime')).toBe('none');
        expect(projectedMetadata(metadata, 'cuda:recorded-observations')).toBe('none');
        expect(projectedMetadata(metadata, 'cuda:source-count')).toBe(String(unit.sourceUrls.length));
        expect(projectedMetadata(metadata, 'cuda:source-versions')).toBe(unit.sourceVersions);
        expect(source).toContain(`data-locale-counterpart href="${counterpart}"`);

        expect(metadata).toMatch(
          /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
        );
      }
    }
  });

  it('pins every owner source to the shared review date in both locales', async () => {
    for (const unit of units) {
      for (const localePrefix of ['', 'en/'] as const) {
        const source = await readPage(localePrefix, unit.slug);
        for (const url of unit.sourceUrls) expect(source, `${localePrefix}${unit.id} ${url}`).toContain(url);
        expect(source.match(/accessDate: '2026-08-27'/g)).toHaveLength(unit.sourceUrls.length);
        expect(source).toMatch(/\*\*(?:Fact checked: |事实核查日期：)2026-08-27[。.]\*\*/);
        expect(source).toMatch(/No owner(?:-documentation)? example or figure is copied|没有复制 owner (?:documentation 的 )?example 或 figure/);
      }
    }
  });

  it('keeps canonical example/range metadata and code imports explicit', async () => {
    for (const unit of units.filter((candidate) => candidate.canonical)) {
      const canonical = unit.canonical;
      if (!canonical) throw new Error(`${unit.id} canonical contract is missing`);

      for (const localePrefix of ['', 'en/'] as const) {
        const source = await readPage(localePrefix, unit.slug);
        const metadata = frontmatter(source);
        expect(yamlList(metadata, 'exampleIds')).toEqual([canonical.example]);
        expect(metadata).toContain(`canonicalExample: ${canonical.example}`);
        expect(yamlList(metadata, 'canonicalRanges')).toEqual([canonical.range]);
        expect(projectedMetadata(metadata, 'cuda:example-ids')).toBe(canonical.example);
        expect(projectedMetadata(metadata, 'cuda:canonical-example')).toBe(canonical.example);
        expect(projectedMetadata(metadata, 'cuda:canonical-ranges')).toBe(canonical.range);
        expect(source).toContain(
          `import CanonicalCode from '${localePrefix ? '../../../../' : '../../../'}components/CanonicalCode.astro';`,
        );
        expect(source).toContain(`<CanonicalCode exampleId="${canonical.example}" range="${canonical.range}" />`);
      }
    }
  });
});

describe('M01-M04 frozen teaching models', () => {
  it('classifies address spaces by ownership, scope, lifetime, location, and release rather than cache rank', async () => {
    for (const localePrefix of ['', 'en/'] as const) {
      const source = await readPage(localePrefix, 'address-spaces');
      for (const term of ['host', 'global', 'constant', 'shared', 'local', 'register', 'cudaFree', 'cudaFreeHost']) {
        expect(source.toLowerCase(), `${localePrefix}M01 ${term}`).toContain(term.toLowerCase());
      }
      expect(source).toMatch(/thread-private.*physically.*device memory|thread-private.*物理位于 device memory/i);
      expect(source).toMatch(/register spill|寄存器溢出/);
      expect(source).toMatch(/not (?:rungs in )?a cache-level|不是.*缓存层级/i);
      expect(source).toMatch(/capacity.*vary|容量.*随 architecture|容量.*取决于/i);
    }

    const chinese = await readPage('', 'address-spaces');
    for (const firstUse of [
      '地址空间（address space）',
      '所有权（ownership）',
      '作用域（scope）',
      '生命周期（lifetime）',
      '主机内存（host memory）',
      '全局内存（global memory）',
      '常量内存（constant memory）',
      '共享内存（shared memory）',
      '本地内存（local memory）',
      '寄存器（register）',
    ]) expect(chinese, firstUse).toContain(firstUse);
  });

  it('derives the CC 6.0+ 32-byte segment fixtures without converting them into speed claims', async () => {
    for (const localePrefix of ['', 'en/'] as const) {
      const source = await readPage(localePrefix, 'coalescing-transactions');
      expect(source).toMatch(/CC 6\.0|compute capability 6\.0/i);
      expect(source).toContain('CC 7.5+');
      expect(source).toMatch(/naturally aligned.*32-byte|自然对齐.*32-byte/i);
      expect(source).toMatch(/aligned contiguous.*\*\*4|aligned contiguous fixture.*\*\*4/is);
      expect(source).toMatch(/one-word offset.*\*\*5|Offset (?:by )?one word.*\*\*5/is);
      expect(source).toMatch(/Stride (?:two|2).*\*\*8|Stride 2.*\*\*8/is);
      expect(source).toMatch(/actual issued transactions|Actual issued transactions/i);
      expect(source).toMatch(/cache reuse/i);
      expect(source).toMatch(/cannot be rewritten.*runtime|不能被改写成.*runtime/i);
    }

    const chinese = await readPage('', 'coalescing-transactions');
    for (const firstUse of [
      '合并访问（coalescing）',
      '事务塑形（transaction shaping）',
      '活跃地址（active address）',
      '自然对齐（naturally aligned）',
    ]) expect(chinese, firstUse).toContain(firstUse);
  });

  it('publishes the portable synchronous tiling contract with neutral edge loads and two barriers', async () => {
    for (const localePrefix of ['', 'en/'] as const) {
      const source = await readPage(localePrefix, 'shared-memory-tiling');
      expect(source).toContain('portable C++17');
      expect(source).toMatch(/load -> __syncthreads\(\) -> use\/reuse/);
      expect(source).toContain('tile[threadIdx.x] = input_index < n ? input[input_index] : neutral;');
      expect(source).toMatch(/all participating threads|所有 participating threads/i);
      expect(source).toMatch(/invalid loader.*neutral|invalid load.*neutral|越界 load.*中性值/i);
      expect(source).toMatch(/second `__syncthreads\(\)`.*required|需要 second `__syncthreads\(\)`/is);
      expect(source).toMatch(/\[M05[^\]]*\]\(\/(?:en\/)?memory\/synchronization-scopes\/\)/);
      expect(source).not.toMatch(/future M05|未来 M05/);
      expect(source).toMatch(/no.*speedup|不.*speedup/i);
    }

    const chinese = await readPage('', 'shared-memory-tiling');
    for (const firstUse of [
      '共享内存分块（shared-memory tiling）',
      '加载阶段（load phase）',
      '线程块屏障（thread-block barrier）',
      '使用/复用阶段（use/reuse phase）',
      '中性值（neutral value）',
    ]) expect(chinese, firstUse).toContain(firstUse);
  });

  it('derives the selected 32-bank fixture, broadcast exception, and 32x33 transform without speedup', async () => {
    for (const localePrefix of ['', 'en/'] as const) {
      const source = await readPage(localePrefix, 'bank-conflicts-layouts');
      expect(source).toContain('32 banks');
      expect(source).toMatch(/successive 32-bit words|连续 32-bit words/);
      expect(source).toContain('bank(word_index) = word_index mod 32');
      expect(source).toMatch(/(?:stride one|\| 1 \|).*conflict-free/is);
      expect(source).toMatch(/(?:stride two|\| 2 \|).*2-way/is);
      expect(source).toMatch(/(?:stride 32|\| 32 \|).*32-way/is);
      expect(source).toMatch(/same-address.*broadcast.*not a bank conflict|同地址读取广播.*不是 bank conflict/is);
      expect(source).toContain('float tile[32][33]');
      expect(source).toContain('(i * 33 + c) mod 32 = (i + c) mod 32');
      expect(source).toMatch(/128 bytes per tile|128 bytes/);
      expect(source).toMatch(/does not prove.*faster|没有证明.*更快|不能产生 speedup/i);
    }

    const chinese = await readPage('', 'bank-conflicts-layouts');
    for (const firstUse of [
      '存储体冲突（bank conflict）',
      '布局变换（layout transform）',
      '同地址读取广播（same-address read broadcast）',
    ]) expect(chinese, firstUse).toContain(firstUse);
  });
});

describe('M01-M04 retrieval and deeper practice', () => {
  it('publishes four to five retrieval questions, exact prerequisites, child links, and PB-R1-013 through PB-R1-016', async () => {
    for (const unit of units) {
      for (const localePrefix of ['', 'en/'] as const) {
        const source = await readPage(localePrefix, unit.slug);
        const retrieval = section(source, localePrefix ? /Retrieval check/ : /离开前检查/);
        const questions = retrieval.match(/^\d+\. /gm) ?? [];
        expect(questions.length, `${localePrefix}${unit.id}`).toBeGreaterThanOrEqual(4);
        expect(questions.length, `${localePrefix}${unit.id}`).toBeLessThanOrEqual(5);

        for (const prerequisite of unit.prerequisites) expect(source).toContain(`[${prerequisite}`);
        expect(source).toContain(`/${localePrefix}memory/${unit.slug}/exercises/`);
        expect(source).toContain(`/${localePrefix}memory/${unit.slug}/solutions/`);
        expect(source).toContain(unit.practiceId);
      }
    }
  });

  it('publishes three contract-complete Exercises and separate reviewed solutions per unit and locale', async () => {
    for (const unit of units) {
      for (const localePrefix of ['', 'en/'] as const) {
        const exercises = await readPage(localePrefix, unit.slug, 'exercises');
        const solutions = await readPage(localePrefix, unit.slug, 'solutions');
        const isEnglish = localePrefix === 'en/';

        for (const [kind, source, pairSuffix, resourceKind, prerequisite] of [
          ['EXERCISES', exercises, 'exercises', 'exercise-set', unit.id],
          ['SOLUTIONS', solutions, 'solutions', 'solution-set', `${unit.id}-EXERCISES`],
        ] as const) {
          const metadata = frontmatter(source);
          expect(metadata).toContain(`pairId: ${unit.pairId}-${pairSuffix}`);
          expect(metadata).toContain(`resourceKind: ${resourceKind}`);
          expect(metadata).toContain(`unitId: ${unit.id}-${kind}`);
          expect(yamlList(metadata, 'prerequisites')).toEqual([prerequisite]);
          expect(metadata).toMatch(
            /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
          );
          expect(projectedMetadata(metadata, 'cuda:pair-id')).toBe(`${unit.pairId}-${pairSuffix}`);
          expect(projectedMetadata(metadata, 'cuda:unit-id')).toBe(`${unit.id}-${kind}`);
          expect(projectedMetadata(metadata, 'cuda:evidence-compilation')).toBe('none');
          expect(projectedMetadata(metadata, 'cuda:evidence-runtime')).toBe('none');
          expect(source).toContain("factCheckDate: '2026-08-27'");
        }

        const exerciseMatches = [...exercises.matchAll(/^## (?:练习|Exercise) [1-3][^\n]*\n([\s\S]*?)(?=^## |\Z)/gm)];
        expect(exerciseMatches, `${localePrefix}${unit.id}`).toHaveLength(3);
        const labels = isEnglish
          ? ['**Goal:**', '**Constraints:**', '**Expected evidence:**', '**Acceptance criteria:**', '<summary>Hint 1</summary>', '<summary>Hint 2</summary>']
          : ['**目标：**', '**约束：**', '**预期证据：**', '**验收条件：**', '<summary>提示 1</summary>', '<summary>提示 2</summary>'];
        for (const [, exercise] of exerciseMatches) {
          for (const label of labels) expect(exercise, `${localePrefix}${unit.id} ${label}`).toContain(label);
          expect(exercise).not.toMatch(/Reviewed solution|参考解答/);
        }

        expect(solutions.match(/^## (?:解答|Solution) [1-3]/gm)).toHaveLength(3);
        expect(solutions).toMatch(/## (?:有效替代方案|Valid alternatives)/);
        expect(solutions).toMatch(/## (?:常见错误|Common errors)/);
      }
    }
  });
});
