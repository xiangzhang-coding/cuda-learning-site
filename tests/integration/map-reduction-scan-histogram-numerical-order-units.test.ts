// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const reviewDate = '2026-08-30';

type UnitContract = {
  id: 'A01' | 'A02' | 'A03' | 'A04' | 'Q02';
  pairId: 'a01' | 'a02' | 'a03' | 'a04' | 'q02';
  relativePath: string;
  prerequisites: readonly string[];
  structure: readonly string[];
  canonicalExample: 'EX02' | 'EX11' | 'EX12' | 'EX13';
  relatedUnits?: readonly string[];
};

const unitContracts = [
  {
    id: 'A01',
    pairId: 'a01',
    relativePath: 'algorithms/elementwise-map.mdx',
    prerequisites: ['F03', 'F04', 'M02'],
    structure: [
      'outcome',
      'prerequisites',
      'map-contract',
      'ownership',
      'memory-movement',
      'scalable-grid',
      'canonical-example',
      'production-baseline',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    canonicalExample: 'EX02',
  },
  {
    id: 'A02',
    pairId: 'a02',
    relativePath: 'algorithms/multi-stage-reduction.mdx',
    prerequisites: ['M03', 'M05', 'M06'],
    structure: [
      'outcome',
      'prerequisites',
      'reduction-contract',
      'tree-shape',
      'inactive-lanes',
      'barriers',
      'multi-stage',
      'operation-order',
      'canonical-example',
      'production-baseline',
      'visual-explainer',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    canonicalExample: 'EX11',
    relatedUnits: ['VIS10', 'Q02'],
  },
  {
    id: 'A03',
    pairId: 'a03',
    relativePath: 'algorithms/inclusive-exclusive-scan.mdx',
    prerequisites: ['A02', 'M05'],
    structure: [
      'outcome',
      'prerequisites',
      'scan-contract',
      'inclusive-exclusive',
      'dependency-transformation',
      'block-scan',
      'multi-block-scan',
      'canonical-example',
      'production-baseline',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    canonicalExample: 'EX12',
  },
  {
    id: 'A04',
    pairId: 'a04',
    relativePath: 'algorithms/privatized-histogram.mdx',
    prerequisites: ['M03', 'M05'],
    structure: [
      'outcome',
      'prerequisites',
      'histogram-contract',
      'global-atomics',
      'contention',
      'privatization',
      'merge',
      'canonical-example',
      'production-baseline',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    canonicalExample: 'EX13',
  },
  {
    id: 'Q02',
    pairId: 'q02',
    relativePath: 'correctness/floating-point-order-reproducibility.mdx',
    prerequisites: ['Q01', 'A02'],
    structure: [
      'outcome',
      'prerequisites',
      'nonassociativity',
      'reduction-order',
      'fma',
      'compiler-flags',
      'tolerance',
      'determinism',
      'bitwise-reproducibility',
      'canonical-example',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    canonicalExample: 'EX11',
  },
] as const satisfies readonly UnitContract[];

const exampleContracts = [
  {
    id: 'EX11',
    pairId: 'ex11',
    relativePath: 'examples/multi-stage-reduction.mdx',
    prerequisites: ['A02', 'Q02'],
    factTokens: ['C++17', 'CPU reference', 'reduction order', 'tolerance'],
  },
  {
    id: 'EX12',
    pairId: 'ex12',
    relativePath: 'examples/inclusive-exclusive-scan.mdx',
    prerequisites: ['A03'],
    factTokens: ['C++17', 'CPU reference', 'inclusive', 'exclusive', 'invariant'],
  },
  {
    id: 'EX13',
    pairId: 'ex13',
    relativePath: 'examples/privatized-histogram.mdx',
    prerequisites: ['A04'],
    factTokens: ['C++17', 'CPU reference', 'histogram', 'invariant', 'exact'],
  },
] as const;

const visualContract = {
  id: 'VIS10',
  pairId: 'vis10',
  relativePath: 'visuals/reduction-stages.mdx',
  prerequisites: ['A02'],
} as const;

const exerciseStructure = ['prerequisites', 'instructions', 'exercise-1', 'exercise-2', 'exercise-3', 'next'];
const solutionStructure = ['review', 'solution-1', 'solution-2', 'solution-3', 'valid-alternatives', 'common-errors'];

async function readSource(relativePath: string, english = false) {
  return readFile(path.join(docsRoot, english ? 'en' : '', relativePath), 'utf8');
}

async function readRoute(route: string) {
  const pathname = new URL(route, 'https://issue-21.invalid').pathname;
  const html = await readFile(path.join(projectRoot, 'dist', pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function routeFor(relativePath: string, english = false) {
  return `/${english ? 'en/' : ''}${relativePath.replace(/\.(?:md|mdx)$/, '/')}`;
}

function frontmatter(source: string) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function body(source: string) {
  const match = /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function yamlScalar(metadataSource: string, field: string) {
  const match = new RegExp(`^${field}: (?:'([^']*)'|"([^"]*)"|(.+))$`, 'm').exec(metadataSource);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function yamlList(metadataSource: string, field: string) {
  if (new RegExp(`^${field}: \[\]$`, 'm').test(metadataSource)) return [];
  const match = new RegExp(`^${field}:\n((?:  - .+\n?)+)`, 'm').exec(metadataSource);
  const values = match?.[1];
  if (!values) return [];
  return values
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, ''));
}

function evidenceList(metadataSource: string, field: string) {
  const evidence = /^evidence:\n((?:  .*\n?)*)/m.exec(metadataSource)?.[1] ?? '';
  if (new RegExp(`^  ${field}: \[\]$`, 'm').test(evidence)) return [];
  const match = new RegExp(`^  ${field}:\n((?:    - .+\n?)+)`, 'm').exec(evidence);
  const values = match?.[1];
  if (!values) return [];
  return values
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, ''));
}

function sourceCoordinates(source: string) {
  return [...frontmatter(source).matchAll(
    /^\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm,
  )].map((match) => ({
    url: match[1] ?? '',
    version: match[2] ?? '',
    platform: match[3] ?? '',
    accessDate: match[4] ?? '',
  }));
}

function canonicalImports(source: string) {
  return [...source.matchAll(/<CanonicalCode\s+exampleId="([^"]+)"\s+range="([^"]+)"\s*\/>/g)].map(
    (match) => ({ exampleId: match[1] ?? '', range: match[2] ?? '' }),
  );
}

function retrievalQuestions(source: string) {
  const section = /^## (?:离开前检查|Retrieval check)\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(source)?.[1] ?? '';
  return [...section.matchAll(/^\d+\. .+$/gm)].map((match) => match[0]);
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function mainText(document: Document) {
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function expectText(text: string, tokens: readonly string[]) {
  const normalized = text.toLowerCase();
  for (const token of tokens) expect(normalized, token).toContain(token.toLowerCase());
}

function expectEmptyEvidence(metadataSource: string) {
  expect(metadataSource).toMatch(
    /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
  );
}

function expectEmptyBuiltEvidence(document: Document, includeExpected = false) {
  expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
  expect(metadata(document, 'cuda:evidence-runtime')).toBe('none');
  expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
  if (includeExpected) expect(metadata(document, 'cuda:expected-observations')).toBe('none');
}

describe('A01-A04 and Q02 bilingual publication contracts', () => {
  for (const contract of unitContracts) {
    it(`publishes ${contract.id} at its exact route with aligned metadata, sources, and canonical code`, async () => {
      const [chinese, english] = await Promise.all([
        readSource(contract.relativePath),
        readSource(contract.relativePath, true),
      ]);
      const sources = [chinese, english] as const;
      const chineseCoordinates = sourceCoordinates(chinese);
      const englishCoordinates = sourceCoordinates(english);

      expect(chineseCoordinates.length, `${contract.id} source count`).toBeGreaterThanOrEqual(3);
      expect(chineseCoordinates, `${contract.id} source parity`).toEqual(englishCoordinates);
      expect(chineseCoordinates.map(({ accessDate }) => accessDate), contract.id).toEqual(
        chineseCoordinates.map(() => reviewDate),
      );
      expect(chineseCoordinates.every(({ url, version, platform }) =>
        url.startsWith('https://') && version.length > 0 && platform.length > 0
      )).toBe(true);
      const sourceVersions = chineseCoordinates.map(({ version }) => version).join(',');
      for (const laneVersion of ['11.8', '12.9', '13.3']) {
        expect(sourceVersions, `${contract.id} ${laneVersion} source`).toContain(laneVersion);
      }

      for (const [index, source] of sources.entries()) {
        const isEnglish = index === 1;
        const metadataSource = frontmatter(source);
        const route = routeFor(contract.relativePath, isEnglish);
        const counterpart = routeFor(contract.relativePath, !isEnglish);
        const ranges = yamlList(metadataSource, 'canonicalRanges');
        const imports = canonicalImports(source);

        expect(yamlScalar(metadataSource, 'title')).toBeTruthy();
        expect(yamlScalar(metadataSource, 'pairId')).toBe(contract.pairId);
        expect(yamlScalar(metadataSource, 'counterpart')).toBe(counterpart);
        expect(yamlScalar(metadataSource, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(metadataSource, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(metadataSource, 'provenance')).toBe('original');
        expect(yamlScalar(metadataSource, 'resourceKind')).toBe('learning-unit');
        expect(yamlScalar(metadataSource, 'unitId')).toBe(contract.id);
        expect(yamlScalar(metadataSource, 'hardwareGate')).toBe('none');
        expect(yamlList(metadataSource, 'structure')).toEqual(contract.structure);
        expect(yamlList(metadataSource, 'prerequisites')).toEqual(contract.prerequisites);
        if ('relatedUnits' in contract) {
          expect(yamlList(metadataSource, 'relatedUnits')).toEqual(contract.relatedUnits);
        }
        expect(yamlList(metadataSource, 'exampleIds')).toEqual([contract.canonicalExample]);
        expect(yamlScalar(metadataSource, 'canonicalExample')).toBe(contract.canonicalExample);
        expect(ranges.length, `${contract.id} canonical ranges`).toBeGreaterThan(0);
        expect(imports).toEqual(
          ranges.map((range) => ({ exampleId: contract.canonicalExample, range })),
        );
        expectEmptyEvidence(metadataSource);
        expect(body(source)).toContain(
          `<a class="locale-pair" data-locale-counterpart href="${counterpart}"`,
        );

        const questions = retrievalQuestions(source);
        expect(questions.length, `${route} retrieval questions`).toBeGreaterThanOrEqual(3);
        expect(questions.length, `${route} retrieval questions`).toBeLessThanOrEqual(5);
        expect(questions.map((question) => Number.parseInt(question, 10))).toEqual(
          Array.from({ length: questions.length }, (_, questionIndex) => questionIndex + 1),
        );

        const document = await readRoute(route);
        expect(document.documentElement.lang).toBe(isEnglish ? 'en' : 'zh-CN');
        expect(document.querySelector('main h1')?.textContent?.trim()).toBe(
          yamlScalar(metadataSource, 'title'),
        );
        expect(document.querySelector(`[data-locale-counterpart][href="${counterpart}"]`)).not.toBeNull();
        expect(metadata(document, 'cuda:pair-id')).toBe(contract.pairId);
        expect(metadata(document, 'cuda:fact-check-date')).toBe(reviewDate);
        expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
        expect(metadata(document, 'cuda:structure')).toBe(contract.structure.join(','));
        expect(metadata(document, 'cuda:resource-kind')).toBe('learning-unit');
        expect(metadata(document, 'cuda:unit-id')).toBe(contract.id);
        expect(metadata(document, 'cuda:prerequisites')).toBe(contract.prerequisites.join(','));
        if ('relatedUnits' in contract) {
          expect(metadata(document, 'cuda:related-units')).toBe(contract.relatedUnits.join(','));
        }
        expect(metadata(document, 'cuda:canonical-example')).toBe(contract.canonicalExample);
        expect(metadata(document, 'cuda:canonical-ranges')).toBe(ranges.join(','));
        expect(metadata(document, 'cuda:example-ids')).toBe(contract.canonicalExample);
        expect(metadata(document, 'cuda:source-count')).toBe(String(chineseCoordinates.length));
        expect(metadata(document, 'cuda:source-versions')).toBeTruthy();
        expectEmptyBuiltEvidence(document);

        for (const range of ranges) {
          expect(document.querySelector(
            `[data-canonical-example="${contract.canonicalExample}"][data-canonical-range="${range}"]`,
          ), `${route} ${contract.canonicalExample}:${range}`).not.toBeNull();
        }
        for (const { url } of chineseCoordinates) {
          expect(document.querySelector(`main a[href="${url}"]`), `${route}: ${url}`).not.toBeNull();
        }
      }

      expect(yamlList(frontmatter(chinese), 'relatedUnits')).toEqual(
        yamlList(frontmatter(english), 'relatedUnits'),
      );
      expect(yamlList(frontmatter(chinese), 'canonicalRanges')).toEqual(
        yamlList(frontmatter(english), 'canonicalRanges'),
      );
    });
  }
});

describe('A01-A04 and Q02 retrieval and deeper practice', () => {
  for (const contract of unitContracts) {
    it(`publishes exactly three learner-owned ${contract.id} Exercises and separate reviewed solutions`, async () => {
      const stem = contract.relativePath.replace(/\.mdx$/, '');

      for (const isEnglish of [false, true]) {
        const localePrefix = isEnglish ? 'en/' : '';
        const [exercise, solution] = await Promise.all([
          readSource(`${stem}/exercises.md`, isEnglish),
          readSource(`${stem}/solutions.md`, isEnglish),
        ]);
        const exerciseMetadata = frontmatter(exercise);
        const solutionMetadata = frontmatter(solution);
        const exerciseRoute = `/${localePrefix}${stem}/exercises/`;
        const solutionRoute = `/${localePrefix}${stem}/solutions/`;
        const exerciseCounterpart = `/${isEnglish ? '' : 'en/'}${stem}/exercises/`;
        const solutionCounterpart = `/${isEnglish ? '' : 'en/'}${stem}/solutions/`;

        expect(yamlScalar(exerciseMetadata, 'pairId')).toBe(`${contract.pairId}-exercises`);
        expect(yamlScalar(exerciseMetadata, 'counterpart')).toBe(exerciseCounterpart);
        expect(yamlScalar(exerciseMetadata, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(exerciseMetadata, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(exerciseMetadata, 'provenance')).toBe('original');
        expect(yamlScalar(exerciseMetadata, 'resourceKind')).toBe('exercise-set');
        expect(yamlScalar(exerciseMetadata, 'unitId')).toBe(`${contract.id}-EXERCISES`);
        expect(yamlList(exerciseMetadata, 'structure')).toEqual(exerciseStructure);
        expect(yamlList(exerciseMetadata, 'prerequisites')).toEqual([contract.id]);
        expectEmptyEvidence(exerciseMetadata);

        expect(yamlScalar(solutionMetadata, 'pairId')).toBe(`${contract.pairId}-solutions`);
        expect(yamlScalar(solutionMetadata, 'counterpart')).toBe(solutionCounterpart);
        expect(yamlScalar(solutionMetadata, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(solutionMetadata, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(solutionMetadata, 'provenance')).toBe('original');
        expect(yamlScalar(solutionMetadata, 'resourceKind')).toBe('solution-set');
        expect(yamlScalar(solutionMetadata, 'unitId')).toBe(`${contract.id}-SOLUTIONS`);
        expect(yamlList(solutionMetadata, 'structure')).toEqual(solutionStructure);
        expect(yamlList(solutionMetadata, 'prerequisites')).toEqual([`${contract.id}-EXERCISES`]);
        expectEmptyEvidence(solutionMetadata);

        expect(body(exercise)).toContain(
          `<a class="locale-pair" data-locale-counterpart href="${exerciseCounterpart}"`,
        );
        expect(body(solution)).toContain(
          `<a class="locale-pair" data-locale-counterpart href="${solutionCounterpart}"`,
        );
        expect(exercise).toContain(solutionRoute);
        expect(solution).toContain(exerciseRoute);

        const tasks = [...exercise.matchAll(
          /^## (?:练习|Exercise) [1-3][^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/gm,
        )];
        expect(tasks, `${localePrefix}${contract.id} exercises`).toHaveLength(3);
        const labels = isEnglish
          ? ['**Goal:**', '**Constraints:**', '**Expected evidence:**', '**Acceptance criteria:**']
          : ['**目标：**', '**约束：**', '**预期证据：**', '**验收条件：**'];
        for (const match of tasks) {
          const task = match[1] ?? '';
          for (const label of labels) expect(task).toContain(label);
          expect(task.match(/<summary>(?:提示|Hint) [12]<\/summary>/g)).toEqual(
            isEnglish
              ? ['<summary>Hint 1</summary>', '<summary>Hint 2</summary>']
              : ['<summary>提示 1</summary>', '<summary>提示 2</summary>'],
          );
          expect(task).not.toMatch(/Reviewed solution|参考解答|^Solution|^解答/m);
        }
        expect(solution.match(/^## (?:解答|Solution) [1-3]/gm)).toHaveLength(3);
        expect(solution).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
        expect(solution).toMatch(/^## (?:常见错误|Common errors)$/m);

        const [exerciseDocument, solutionDocument] = await Promise.all([
          readRoute(exerciseRoute),
          readRoute(solutionRoute),
        ]);
        expect(metadata(exerciseDocument, 'cuda:structure')).toBe(exerciseStructure.join(','));
        expect(metadata(exerciseDocument, 'cuda:unit-id')).toBe(`${contract.id}-EXERCISES`);
        expect(metadata(exerciseDocument, 'cuda:prerequisites')).toBe(contract.id);
        expect(exerciseDocument.querySelector(
          `[data-locale-counterpart][href="${exerciseCounterpart}"]`,
        )).not.toBeNull();
        expectEmptyBuiltEvidence(exerciseDocument);

        expect(metadata(solutionDocument, 'cuda:structure')).toBe(solutionStructure.join(','));
        expect(metadata(solutionDocument, 'cuda:unit-id')).toBe(`${contract.id}-SOLUTIONS`);
        expect(metadata(solutionDocument, 'cuda:prerequisites')).toBe(`${contract.id}-EXERCISES`);
        expect(solutionDocument.querySelector(
          `[data-locale-counterpart][href="${solutionCounterpart}"]`,
        )).not.toBeNull();
        expectEmptyBuiltEvidence(solutionDocument);
      }
    });
  }
});

describe('issue #21 algorithm and numerical semantics', () => {
  it('defines map ownership and accounts for memory movement separately from element arithmetic', async () => {
    for (const route of ['/algorithms/elementwise-map/', '/en/algorithms/elementwise-map/']) {
      const text = mainText(await readRoute(route));
      expectText(text, ['elementwise map', 'ownership', 'memory movement', 'global memory', 'load', 'store']);
      expect(text).toMatch(
        /(?:each|one).*element.*(?:owner|thread)|(?:每个|每一).*element.*(?:thread|owner|线程|负责)/i,
      );
      expect(text).toMatch(/load.{0,80}(?:map|transform).{0,80}store|加载.{0,80}(?:映射|变换).{0,80}存储/i);
      expect(text).toMatch(/(?:host.*device|device.*host|H2D|D2H).*(?:copy|transfer|movement)|数据.*(?:移动|传输)/i);
    }
  });

  it('models reduction as ordered tree stages with inactive lanes, barriers, and kernel boundaries', async () => {
    for (const route of ['/algorithms/multi-stage-reduction/', '/en/algorithms/multi-stage-reduction/']) {
      const text = mainText(await readRoute(route));
      expectText(text, [
        'reduction tree',
        'stage',
        'partial',
        'inactive lane',
        'barrier',
        '__syncthreads',
        'kernel',
        'operation order',
      ]);
      expect(text).toMatch(/(?:half|halves|fewer).{0,80}(?:active|participating)|(?:减半|更少).{0,80}(?:active|参与)/i);
      expect(text).toMatch(/(?:write|store).{0,80}(?:barrier|__syncthreads).{0,80}(?:read|load)|写.{0,80}(?:屏障|barrier|__syncthreads).{0,80}读/i);
      expect(text).toMatch(/(?:kernel boundary|separate kernel|next launch).{0,100}(?:global|grid)|(?:kernel 边界|下一次 launch).{0,100}(?:全局|grid)/i);
      expect(text).toMatch(/(?:tree|parallel).{0,80}order.{0,80}(?:serial|sequential)|(?:树形|并行).{0,80}顺序.{0,80}(?:串行|sequential)/i);
    }
  });

  it('defines inclusive and exclusive scan and transforms the sequential dependency graph', async () => {
    for (const route of ['/algorithms/inclusive-exclusive-scan/', '/en/algorithms/inclusive-exclusive-scan/']) {
      const text = mainText(await readRoute(route));
      expectText(text, ['inclusive scan', 'exclusive scan', 'identity', 'dependency', 'stage', 'barrier']);
      expect(text).toMatch(/inclusive.{0,100}(?:includes|包含).{0,50}(?:current|自身|x\[i\])/i);
      expect(text).toMatch(/exclusive.{0,100}(?:excludes|不包含).{0,50}(?:current|自身|x\[i\])/i);
      expect(text).toMatch(/(?:sequential|serial).{0,100}dependenc.{0,120}(?:tree|parallel|stage)|(?:顺序|串行).{0,100}依赖.{0,120}(?:树|并行|stage)/i);
      expect(text).toMatch(/(?:partial|block).{0,100}(?:offset|prefix).{0,100}(?:add|propagat|分发|加回)/i);
    }
  });

  it('keeps histogram atomicity, contention, privatization, and merge as separate concerns', async () => {
    for (const route of ['/algorithms/privatized-histogram/', '/en/algorithms/privatized-histogram/']) {
      const text = mainText(await readRoute(route));
      expectText(text, ['histogram', 'atomicAdd', 'contention', 'privatization', 'shared memory', 'merge', 'bin']);
      expect(text).toMatch(/atomic.{0,100}(?:lost update|correctness|丢失更新|正确性)/i);
      expect(text).toMatch(/(?:same|hot).{0,60}bin.{0,100}(?:contention|serialize|争用|串行)/i);
      expect(text).toMatch(/(?:private|privatized|shared).{0,100}histogram.{0,120}(?:merge|global)|(?:私有|局部).{0,100}histogram.{0,120}(?:合并|global)/i);
      expect(text).toMatch(/(?:initialize|zero).{0,100}(?:barrier|__syncthreads)|(?:初始化|清零).{0,100}(?:屏障|barrier|__syncthreads)/i);
    }
  });

  it('separates acceptable numerical variation, determinism, and bitwise reproducibility', async () => {
    for (const route of [
      '/correctness/floating-point-order-reproducibility/',
      '/en/correctness/floating-point-order-reproducibility/',
    ]) {
      const text = mainText(await readRoute(route));
      expectText(text, [
        'FMA',
        '--fmad',
        '--use_fast_math',
        'tolerance',
        'determinism',
        'bitwise reproducibility',
        'reduction order',
      ]);
      expect(text).toMatch(/non-?associativ|非结合/i);
      expect(text).toMatch(/\(a \+ b\) \+ c|a \+ \(b \+ c\)/);
      expect(text).toMatch(/FMA.{0,120}(?:single|one|一次).{0,40}round|(?:single|one|一次).{0,40}round.{0,120}FMA/i);
      expect(text).toMatch(/(?:compiler|编译器).{0,80}(?:flag|选项).{0,120}(?:record|declare|记录|声明)/i);
      expect(text).toMatch(/tolerance.{0,120}(?:does not|not|不).{0,80}(?:bitwise|reproduc)/i);
      expect(text).toMatch(/determin(?:ism|istic).{0,120}(?:does not|not|不).{0,80}bitwise/i);
    }
  });
});

describe('production primitive positioning', () => {
  it('acknowledges CUB production baselines while retaining the exact foundational prerequisites', async () => {
    const contracts = [
      { unit: unitContracts[1], primitive: 'DeviceReduce' },
      { unit: unitContracts[2], primitive: 'DeviceScan' },
      { unit: unitContracts[3], primitive: 'DeviceHistogram' },
    ] as const;

    for (const { unit, primitive } of contracts) {
      for (const isEnglish of [false, true]) {
        const source = await readSource(unit.relativePath, isEnglish);
        const sourceMetadata = frontmatter(source);
        const text = mainText(await readRoute(routeFor(unit.relativePath, isEnglish)));

        expect(yamlList(sourceMetadata, 'prerequisites')).toEqual(unit.prerequisites);
        expect(yamlList(sourceMetadata, 'prerequisites')).not.toContain('L03');
        expectText(text, ['CUB', primitive]);
        expect(text).toMatch(/production.{0,60}(?:baseline|comparison)|生产.{0,60}(?:基线|对照|比较)/i);
        expect(text).toMatch(/(?:custom|hand-written|teaching).{0,100}(?:learn|understand)|(?:手写|自定义|教学).{0,100}(?:学习|理解)/i);
      }
    }
  });

  it('pins the reviewed CCCL coordinates and the exact M06 prerequisite route', async () => {
    const [a01Zh, a01En, a02Zh, a02En, q02Zh, q02En, practiceZh, practiceEn, sourcesZh, sourcesEn, maintenance] =
      await Promise.all([
        readSource('algorithms/elementwise-map.mdx'),
        readSource('algorithms/elementwise-map.mdx', true),
        readSource('algorithms/multi-stage-reduction.mdx'),
        readSource('algorithms/multi-stage-reduction.mdx', true),
        readSource('correctness/floating-point-order-reproducibility.mdx'),
        readSource('correctness/floating-point-order-reproducibility.mdx', true),
        readSource('practice.mdx'),
        readSource('practice.mdx', true),
        readSource('sources-and-versions.mdx'),
        readSource('sources-and-versions.mdx', true),
        readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
      ]);

    for (const source of [a01Zh, a01En, a02Zh, a02En, q02Zh, q02En]) {
      expect(source).not.toContain('last updated 2026-08-27');
    }
    for (const source of [a02Zh, a02En]) {
      expect(source).toContain('/memory/warp-divergence-reconvergence/');
      expect(source).not.toMatch(/M06[^\n]*Cooperative Groups/);
      expect(source).toContain('https://github.com/NVIDIA/cccl/blob/v3.4.2/docs/cub/api_docs/device_wide.rst');
    }

    const exactSourceSet = [q02Zh, q02En, practiceZh, practiceEn, sourcesZh, sourcesEn, maintenance].join('\n');
    expect(exactSourceSet).toContain(
      'https://github.com/NVIDIA/cccl/blob/v3.4.2/cub/cub/device/device_reduce.cuh',
    );
    expect(exactSourceSet).not.toMatch(/docs\/cub\/(?:device_wide|determinism)\.rst/);
  });
});

describe('EX11-EX13 and VIS10 page evidence boundaries', () => {
  for (const contract of exampleContracts) {
    it(`publishes ${contract.id} as a C++17 canonical page with pending runtime evidence`, async () => {
      const [chinese, english] = await Promise.all([
        readSource(contract.relativePath),
        readSource(contract.relativePath, true),
      ]);
      const coordinates = sourceCoordinates(chinese);
      expect(coordinates.length, `${contract.id} sources`).toBeGreaterThan(0);
      expect(coordinates).toEqual(sourceCoordinates(english));
      expect(coordinates.every(({ accessDate }) => accessDate === reviewDate)).toBe(true);

      for (const [index, source] of [chinese, english].entries()) {
        const isEnglish = index === 1;
        const metadataSource = frontmatter(source);
        const route = routeFor(contract.relativePath, isEnglish);
        const counterpart = routeFor(contract.relativePath, !isEnglish);

        expect(yamlScalar(metadataSource, 'pairId')).toBe(contract.pairId);
        expect(yamlScalar(metadataSource, 'counterpart')).toBe(counterpart);
        expect(yamlScalar(metadataSource, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(metadataSource, 'resourceKind')).toBe('runnable-example');
        expect(yamlScalar(metadataSource, 'unitId')).toBe(contract.id);
        expect(yamlList(metadataSource, 'prerequisites')).toEqual(contract.prerequisites);
        expect(yamlList(metadataSource, 'exampleIds')).toEqual([contract.id]);
        expect(yamlScalar(metadataSource, 'canonicalExample')).toBe(contract.id);
        expect(evidenceList(metadataSource, 'compilation')).toEqual([]);
        expect(evidenceList(metadataSource, 'runtime')).toEqual(['Pending Hardware Verification']);
        expect(evidenceList(metadataSource, 'expectedObservations')).toHaveLength(3);
        expect(evidenceList(metadataSource, 'recordedObservations')).toEqual([]);
        expect(body(source)).toContain(
          `<a class="locale-pair" data-locale-counterpart href="${counterpart}"`,
        );

        const document = await readRoute(route);
        expect(metadata(document, 'cuda:pair-id')).toBe(contract.pairId);
        expect(metadata(document, 'cuda:fact-check-date')).toBe(reviewDate);
        expect(metadata(document, 'cuda:resource-kind')).toBe('runnable-example');
        expect(metadata(document, 'cuda:unit-id')).toBe(contract.id);
        expect(metadata(document, 'cuda:prerequisites')).toBe(contract.prerequisites.join(','));
        expect(metadata(document, 'cuda:canonical-example')).toBe(contract.id);
        expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
        expect(metadata(document, 'cuda:evidence-runtime')).toBe('Pending Hardware Verification');
        expect(metadata(document, 'cuda:expected-observations')).toBe('3 declared expectations');
        expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
        expect(document.querySelector(`[data-locale-counterpart][href="${counterpart}"]`)).not.toBeNull();
        expectText(mainText(document), contract.factTokens);
        expectText(mainText(document), ['11.8.0', '12.9.2', '13.3.1']);
      }
    });
  }

  it('publishes VIS10 as a deterministic, static-capable, CUDA-evidence-neutral model', async () => {
    const [chinese, english] = await Promise.all([
      readSource(visualContract.relativePath),
      readSource(visualContract.relativePath, true),
    ]);
    const coordinates = sourceCoordinates(chinese);
    const structure = yamlList(frontmatter(chinese), 'structure');
    expect(coordinates.length, 'VIS10 sources').toBeGreaterThan(0);
    expect(coordinates).toEqual(sourceCoordinates(english));
    expect(coordinates.every(({ accessDate }) => accessDate === reviewDate)).toBe(true);
    expect(structure.length, 'VIS10 structure').toBeGreaterThan(0);
    expect(structure).toEqual(yamlList(frontmatter(english), 'structure'));

    for (const [index, source] of [chinese, english].entries()) {
      const isEnglish = index === 1;
      const metadataSource = frontmatter(source);
      const route = routeFor(visualContract.relativePath, isEnglish);
      const counterpart = routeFor(visualContract.relativePath, !isEnglish);

      expect(yamlScalar(metadataSource, 'pairId')).toBe(visualContract.pairId);
      expect(yamlScalar(metadataSource, 'counterpart')).toBe(counterpart);
      expect(yamlScalar(metadataSource, 'factCheckDate')).toBe(reviewDate);
      expect(yamlScalar(metadataSource, 'resourceKind')).toBe('visual-explainer');
      expect(yamlScalar(metadataSource, 'unitId')).toBe(visualContract.id);
      expect(yamlList(metadataSource, 'prerequisites')).toEqual(visualContract.prerequisites);
      expectEmptyEvidence(metadataSource);

      const document = await readRoute(route);
      const visual = document.querySelector('[data-visual-id="VIS10"]');
      expect(metadata(document, 'cuda:pair-id')).toBe(visualContract.pairId);
      expect(metadata(document, 'cuda:fact-check-date')).toBe(reviewDate);
      expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
      expect(metadata(document, 'cuda:unit-id')).toBe(visualContract.id);
      expect(metadata(document, 'cuda:prerequisites')).toBe(visualContract.prerequisites.join(','));
      expectEmptyBuiltEvidence(document, true);
      expect(visual).not.toBeNull();
      expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
      expect(visual?.querySelector('[data-measured], [data-recorded-observation]')).toBeNull();
      expectText(mainText(document), ['deterministic', 'algorithm variant', 'reduction stage', 'inactive lane']);
    }
  });
});

describe('issue #21 performance-claim boundary', () => {
  it('contains no fabricated timing, bandwidth, throughput, or speedup number', async () => {
    const fabricatedPerformance = /\b\d+(?:\.\d+)?\s*(?:ns|us|µs|μs|ms|milliseconds?|seconds?|GB\/s|GiB\/s|elements\/s)\b|\b\d+(?:\.\d+)?\s*[x×]\s*(?:speedup|faster|加速)\b/i;
    const issuePaths = [
      ...unitContracts.flatMap(({ relativePath }) => {
        const stem = relativePath.replace(/\.mdx$/, '');
        return [relativePath, `${stem}/exercises.md`, `${stem}/solutions.md`];
      }),
      ...exampleContracts.map(({ relativePath }) => relativePath),
      visualContract.relativePath,
    ];

    for (const relativePath of issuePaths) {
      for (const isEnglish of [false, true]) {
        expect(
          await readSource(relativePath, isEnglish),
          `${isEnglish ? 'en/' : ''}${relativePath}`,
        ).not.toMatch(fabricatedPerformance);
      }
    }

    const projectPaths = [
      'examples/ex11-multi-stage-reduction/src/multi_stage_reduction.cu',
      'examples/ex11-multi-stage-reduction/README.md',
      'examples/ex11-multi-stage-reduction/evidence/README.md',
      'examples/ex12-inclusive-exclusive-scan/src/inclusive_exclusive_scan.cu',
      'examples/ex12-inclusive-exclusive-scan/README.md',
      'examples/ex12-inclusive-exclusive-scan/evidence/README.md',
      'examples/ex13-privatized-histogram/src/privatized_histogram.cu',
      'examples/ex13-privatized-histogram/README.md',
      'examples/ex13-privatized-histogram/evidence/README.md',
    ];
    for (const relativePath of projectPaths) {
      const source = await readFile(path.join(projectRoot, relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(fabricatedPerformance);
      expect(source, relativePath).not.toMatch(/cudaEventElapsedTime|std::chrono|clock_gettime/i);
    }
  });
});
