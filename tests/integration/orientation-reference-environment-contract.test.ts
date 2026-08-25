// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const relativePath = route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
  return parseHTML(await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8')).document;
}

function mainText(document: Document) {
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ') ?? '';
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

const orientationUnits = [
  {
    id: 'O04',
    slug: 'cpp17-for-cuda',
    prerequisite: 'O01',
    visual: 'annotations',
    terms: ['pointer', 'RAII', 'template', 'error', 'translation unit', 'undefined behavior', '__host__', '__device__', 'Compute Sanitizer'],
  },
  {
    id: 'O05',
    slug: 'linux-command-line',
    prerequisite: 'O01',
    visual: 'command-lifecycle',
    terms: ['physical', 'GNU Make', 'process', 'stdout', 'stderr', 'pipefail', 'tee', 'literal command', 'SHA-256'],
  },
  {
    id: 'O06',
    slug: 'architecture-refresher',
    prerequisite: 'O01',
    visual: 'architecture',
    terms: ['latency', 'throughput', 'cache', 'bandwidth', 'concurrency', 'arithmetic intensity', 'occupancy'],
  },
  {
    id: 'O07',
    slug: 'programmable-gpus',
    prerequisite: 'O06',
    visual: 'programmability',
    terms: ['fixed', 'vertex', 'fragment', 'GPGPU', 'Brook', 'CUDA', 'thread block'],
  },
] as const;

describe('O04-O07 focused prerequisite refreshers', () => {
  it.each(orientationUnits.flatMap((unit) => [
    { ...unit, locale: 'zh-CN', route: `/start/${unit.slug}/` },
    { ...unit, locale: 'en', route: `/en/start/${unit.slug}/` },
  ]))('publishes $id scope, exact prerequisite, and original visual in $locale', async ({ id, prerequisite, visual, terms, route }) => {
    const document = await readRoute(route);
    const text = mainText(document);

    expect(metadata(document, 'cuda:unit-id')).toBe(id);
    expect(metadata(document, 'cuda:prerequisites')).toBe(prerequisite);
    expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
    expect(metadata(document, 'cuda:evidence-runtime')).toBe('none');
    for (const term of terms) expect(text.toLowerCase(), `${route}: ${term}`).toContain(term.toLowerCase());

    const figure = document.querySelector(`[data-orientation-kind="${visual}"]`);
    expect(figure).not.toBeNull();
    expect(figure?.querySelectorAll('.orientation-track > *')).toHaveLength(4);
    expect(figure?.querySelector('.orientation-boundary')?.textContent?.trim().length).toBeGreaterThan(40);
    expect(figure?.querySelector('img, iframe, object, embed')).toBeNull();
  });

  it('keeps O07 concept-driven instead of publishing a product chronology or speed claim', async () => {
    for (const route of ['/start/programmable-gpus/', '/en/start/programmable-gpus/']) {
      const text = mainText(await readRoute(route));
      expect(text).not.toMatch(/RTX\s*\d|GeForce\s+\d|Tesla\s+[A-Z0-9]|times faster|倍加速/i);
      expect(text).toMatch(/fixed|固定/);
      expect(text).toMatch(/graphics abstraction|图形抽象/);
      expect(text).toMatch(/general-purpose|通用/);
    }
  });
});

describe('retrieval questions and deeper Exercises', () => {
  it.each(['cpp17-for-cuda', 'linux-command-line', 'architecture-refresher', 'programmable-gpus', 'reference-environment-candidate'])(
    'publishes three to five retrieval questions and exactly two deeper Exercises for %s in both locales',
    async (slug) => {
      for (const locale of ['zh-CN', 'en'] as const) {
        const prefix = locale === 'en' ? 'en/' : '';
        const unitPath = path.join(projectRoot, `src/content/docs/${prefix}start/${slug}.mdx`);
        const exercisePath = path.join(projectRoot, `src/content/docs/${prefix}start/${slug}/exercises.md`);
        const solutionPath = path.join(projectRoot, `src/content/docs/${prefix}start/${slug}/solutions.md`);
        const unit = await readFile(unitPath, 'utf8');
        const exercises = await readFile(exercisePath, 'utf8');
        const solutions = await readFile(solutionPath, 'utf8');
        const retrievalHeading = locale === 'en' ? '## Retrieval check' : '## 离开前检查';
        const retrieval = unit.split(retrievalHeading)[1]?.split('\n## ')[0] ?? '';
        const questionCount = (retrieval.match(/^\d+\.\s/gm) ?? []).length;
        const exercisePattern = locale === 'en' ? /^## Exercise \d+:/gm : /^## 练习 \d+：/gm;

        expect(questionCount, `${locale}/${slug}`).toBeGreaterThanOrEqual(3);
        expect(questionCount, `${locale}/${slug}`).toBeLessThanOrEqual(5);
        expect(exercises.match(exercisePattern) ?? [], `${locale}/${slug}`).toHaveLength(2);
        expect(exercises).toMatch(/Hint 1|提示 1/);
        expect(exercises).toMatch(/Hint 2|提示 2/);
        expect(exercises).not.toMatch(/^## (?:Solution|解答) \d+/m);
        expect(solutions).toMatch(/Reviewed solutions|参考解答/);
        expect(solutions).toMatch(/Common errors|常见错误/);
      }
    },
  );
});

describe('O08 and LAB01 Reference Environment candidate boundary', () => {
  it.each([
    { route: '/start/reference-environment-candidate/', undeclared: '目前没有声明任何基准环境' },
    { route: '/en/start/reference-environment-candidate/', undeclared: 'No Reference Environment is currently declared' },
  ])('requires every declaration gate in $route', async ({ route, undeclared }) => {
    const document = await readRoute(route);
    const text = mainText(document);

    expect(metadata(document, 'cuda:prerequisites')).toBe('O02,O03,O05');
    for (const term of [
      'Environment Manifest',
      'GPU Capability Tier',
      'compute capability',
      'maintainer control',
      'baseline',
      'documented-path',
      'not-documented',
      'indeterminate',
    ]) {
      expect(text, term).toContain(term);
    }
    expect(text).toContain(undeclared);
    expect(text).toMatch(/successful baseline|成功.*baseline/);
    expect(text).toMatch(/predeclared|预先声明|预先写/);

    const explorer = document.querySelector('cuda-compatibility-explorer');
    expect(explorer).not.toBeNull();
    expect(explorer?.getAttribute('data-assessment')).toBe('indeterminate');
    expect(explorer?.querySelector('[data-compatibility-controls][hidden]')).not.toBeNull();
    expect(explorer?.querySelectorAll('[data-static-fallback] tbody tr')).toHaveLength(3);
    expect(explorer?.textContent).toMatch(/Evidence Status/);
    expect(explorer?.textContent).toMatch(/runtime|运行/);
  });

  it.each(['/examples/environment-report/', '/en/examples/environment-report/'])(
    'keeps EX01 observations separate from compatibility, tier, declaration, and evidence at %s',
    async (route) => {
      const document = await readRoute(route);
      const text = mainText(document);
      expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
      expect(metadata(document, 'cuda:evidence-runtime')).toBe('Pending Hardware Verification');
      expect(metadata(document, 'cuda:canonical-ranges')).toBe('observation-model,version-query,device-inventory');
      expect(text).toContain('cudaDriverGetVersion');
      expect(text).toContain('cudaRuntimeGetVersion');
      expect(text).toMatch(/does not decide compatibility|不会给出兼容性.*判断|不判断兼容性/);
      expect(text).toMatch(/does not.*declare a Reference Environment|不.*声明.*Reference Environment/);
      expect(text).not.toMatch(/Device 0:|Result = PASS|\d+(?:\.\d+)?\s*(?:ms|GB\/s)/);
    },
  );

  it.each(['/labs/record-cuda-environment/', '/en/labs/record-cuda-environment/'])(
    'keeps all LAB01 gates and evidence axes independent at %s',
    async (route) => {
      const document = await readRoute(route);
      const text = mainText(document);
      expect(metadata(document, 'cuda:prerequisites')).toBe('O03,O08');
      expect(metadata(document, 'cuda:maximum-problem-memory-bytes')).toBe('0');
      expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
      expect(metadata(document, 'cuda:evidence-runtime')).toBe('Pending Hardware Verification');
      for (const token of ['candidate-ready', 'candidate-incomplete', 'candidate-rejected']) expect(text).toContain(token);
      expect(text).toMatch(/Build, hardware|构建、硬件/);
      expect(text).toMatch(/No Reference Environment is currently declared|目前没有声明任何(?:基准环境| Reference Environment)/);
      expect(text).toMatch(/successful baseline|成功.*baseline/);
      expect(text).not.toMatch(/Device 0:|Result = PASS|\d+(?:\.\d+)?\s*(?:ms|GB\/s)/);
    },
  );
});
