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
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function sectionText(document: Document, headingPattern: RegExp) {
  const heading = [...document.querySelectorAll('main h2')].find((candidate) =>
    headingPattern.test(candidate.textContent ?? ''),
  );
  expect(heading, headingPattern.source).toBeDefined();

  const elements: Element[] = [];
  for (
    let element = heading?.parentElement?.nextElementSibling ?? null;
    element && !element.querySelector('h2');
    element = element.nextElementSibling
  ) {
    elements.push(element);
  }
  return elements.map((element) => element.textContent ?? '').join(' ').replace(/\s+/g, ' ');
}

describe('F05-F08 focused teaching contracts', () => {
  it('separates immediate launch state from deferred execution failure and imports EX04 once', async () => {
    for (const route of ['/foundations/asynchronous-errors/', '/en/foundations/asynchronous-errors/']) {
      const document = await readRoute(route);
      const text = mainText(document);

      expect(text).toMatch(/cudaPeekAtLastError.*(?:without resetting|不重置|不清除)/i);
      expect(text).toMatch(/cudaGetLastError.*(?:reset|clear|重置|清除)/i);
      expect(text).toMatch(/immediate.*launch|即时.*launch/i);
      expect(text).toMatch(/deferred.*device execution|device execution.*延后/i);
      expect(text).toMatch(/cudaDeviceSynchronize/);
      expect(text).toMatch(/does not (?:mean|prove).*kernel.*complet|不代表 kernel 已完成/i);
      expect(document.querySelectorAll(
        'figure[data-canonical-example="EX04"][data-canonical-range="error-lifecycle"]',
      )).toHaveLength(1);
    }
  });

  it('keeps capability, feature, limit, and compiler-target coordinates distinct', async () => {
    for (const route of ['/foundations/compute-capability/', '/en/foundations/compute-capability/']) {
      const document = await readRoute(route);
      const text = mainText(document);

      for (const term of [
        'compute capability',
        'baseline feature set',
        'architecture-specific',
        'family-specific',
        'compute_90',
        'sm_90',
        '11.8.0',
        '12.9.2',
        '13.3.1',
      ]) {
        expect(text.toLowerCase(), `${route} ${term}`).toContain(term.toLowerCase());
      }
      expect(text).toMatch(/feature availability.*numeric limits|功能可用性.*数值限制/i);
      expect(text).toMatch(/virtual target.*real target|Virtual target.*Real target/i);
      expect(text).toMatch(/does not infer.*product|不反推 GPU 型号/i);
      expect(text).toMatch(/indeterminate|不确定/);
      expect(document.querySelectorAll('cuda-capability-filter')).toHaveLength(1);
    }
  });

  it('compares Runtime and Driver API roles without creating a second canonical program', async () => {
    for (const route of ['/foundations/runtime-driver-api/', '/en/foundations/runtime-driver-api/']) {
      const document = await readRoute(route);
      const text = mainText(document);

      for (const term of [
        'CUDA Runtime API',
        'CUDA Driver API',
        'cuInit',
        'CUdevice',
        'CUcontext',
        'CUmodule',
        'CUfunction',
        'cuLaunchKernel',
      ]) {
        expect(text, `${route} ${term}`).toContain(term);
      }
      expect(text).toMatch(/implicit.*primary context|隐式.*primary context/i);
      expect(text).toMatch(/current context|current-context/i);
      expect(text).toMatch(/does not.*one-to-one|不.*一一对应/i);
      expect(text).toMatch(/does not remove asynchronous|不会消除异步/i);
      expect(text).toMatch(/no second|不.*第二|不复制完整实现|no duplicate/i);
      expect(document.querySelectorAll('[data-canonical-example="EX04"]')).toHaveLength(0);
      expect(document.querySelectorAll('cuda-api-boundary')).toHaveLength(1);
    }
  });

  it('requires correctness and device/kernel resource feasibility before speed claims', async () => {
    for (const route of ['/foundations/launch-geometry/', '/en/foundations/launch-geometry/']) {
      const document = await readRoute(route);
      const text = mainText(document);

      for (const term of [
        'maxThreadsDim',
        'maxThreadsPerBlock',
        'maxGridSize',
        'cudaFuncAttributes',
        'numRegs',
        'sharedSizeBytes',
        'fringe',
      ]) {
        expect(text, `${route} ${term}`).toContain(term);
      }
      expect(text).toContain('1 + floor((n - 1) / d)');
      expect(text).toMatch(/correctness.*launch-feasibility|正确性.*launch.*可行/i);
      expect(text).toMatch(/kernel-specific|特定.*kernel|函数自己的/i);
      expect(text).toMatch(/only after.*correct|正确.*之后.*测量/i);
      expect(text).toMatch(/no.*fastest|不.*最快/i);
      expect(document.querySelectorAll('cuda-block-shape-explorer')).toHaveLength(1);
    }
  });

  it('uses canonical English terminology at first introduction in Chinese prose', async () => {
    const contracts = [
      {
        route: '/foundations/asynchronous-errors/',
        terms: [
          '异步错误（asynchronous error）',
          '末次错误状态（last-error state）',
          '即时错误（immediate error）',
          '延后执行错误（deferred execution error）',
          '显式同步边界（explicit synchronization boundary）',
        ],
      },
      {
        route: '/foundations/compute-capability/',
        terms: ['compute capability', 'baseline feature set', 'architecture-specific', 'family-specific', 'virtual target', 'real target'],
      },
      {
        route: '/foundations/runtime-driver-api/',
        terms: ['CUDA Runtime API', 'CUDA Driver API', 'primary context', 'current context', 'ownership'],
      },
      {
        route: '/foundations/launch-geometry/',
        terms: ['launch geometry', 'logical extent', 'fringe', 'kernel resource', '测量'],
      },
    ] as const;

    for (const { route, terms } of contracts) {
      const text = mainText(await readRoute(route));
      for (const term of terms) {
        expect(text.toLowerCase(), `${route} ${term}`).toContain(term.toLowerCase());
      }
    }
  });
});

describe('F05-F08 retrieval and practice publication', () => {
  const slugs = [
    'asynchronous-errors',
    'compute-capability',
    'runtime-driver-api',
    'launch-geometry',
  ] as const;

  it('publishes three to five retrieval questions and three Exercises with separate solutions', async () => {
    for (const slug of slugs) {
      for (const localePrefix of ['', 'en/']) {
        const routePrefix = `/${localePrefix}foundations/${slug}`;
        const unit = await readRoute(`${routePrefix}/`);
        const retrieval = sectionText(unit, /离开前检查|Retrieval check/);
        const retrievalHeading = [...unit.querySelectorAll('main h2')].find((heading) =>
          heading.textContent?.match(/离开前检查|Retrieval check/),
        );
        let retrievalList = retrievalHeading?.parentElement?.nextElementSibling ?? null;
        while (retrievalList && !retrievalList.querySelector('h2') && retrievalList.tagName !== 'OL') {
          retrievalList = retrievalList.nextElementSibling;
        }
        const questions = [...(retrievalList?.children ?? [])].filter(({ tagName }) => tagName === 'LI');
        expect(retrieval).not.toBe('');
        expect(questions.length, routePrefix).toBeGreaterThanOrEqual(3);
        expect(questions.length, routePrefix).toBeLessThanOrEqual(5);

        const exercises = await readRoute(`${routePrefix}/exercises/`);
        const exerciseHeadings = [...exercises.querySelectorAll('main h2')].filter((heading) =>
          heading.textContent?.match(/^(?:练习|Exercise)\s+[1-3]/),
        );
        expect(exerciseHeadings, routePrefix).toHaveLength(3);
        for (const heading of exerciseHeadings) {
          const exercise = sectionText(exercises, new RegExp(`^${heading.textContent?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
          for (const label of [/Goal|目标/, /Constraints|约束/, /Expected evidence|预期证据/, /Acceptance criteria|验收条件/, /Hint 1|提示 1/, /Hint 2|提示 2/]) {
            expect(exercise, `${routePrefix} ${heading.textContent}`).toMatch(label);
          }
          expect(exercise).not.toMatch(/Reviewed solution|参考解答/);
        }

        const solutions = await readRoute(`${routePrefix}/solutions/`);
        const solutionHeadings = [...solutions.querySelectorAll('main h2')].filter((heading) =>
          heading.textContent?.match(/^(?:解答|Solution)\s+[1-3]/),
        );
        expect(solutionHeadings, routePrefix).toHaveLength(3);
        expect(mainText(solutions)).toMatch(/Valid alternatives|有效替代方案/);
        expect(mainText(solutions)).toMatch(/Common errors|常见错误/);
      }
    }
  });
});

describe('F05-F08 source-date contracts', () => {
  const sources = [
    {
      slug: 'asynchronous-errors',
      count: 9,
      versions: ['CUDA Runtime API 11.8.0', 'Archive path 12.9.2', 'CUDA Runtime API 13.3.1'],
    },
    {
      slug: 'compute-capability',
      count: 5,
      versions: ['last updated 2026-05-27', 'last updated 2022-10-03', 'CUDA Toolkit 12.9.2 archive path', 'CUDA Toolkit 13.3.1'],
    },
    {
      slug: 'runtime-driver-api',
      count: 10,
      versions: ['last updated 2022-10-03', 'last updated 2025-06-04', 'last updated 2026-06-29'],
    },
    {
      slug: 'launch-geometry',
      count: 3,
      versions: ['last updated 2026-05-27', 'last updated 2026-06-29'],
    },
  ] as const;

  it('pins every owner-source access date and preserves exact owner version dates in both locales', async () => {
    for (const { slug, count, versions } of sources) {
      for (const localePrefix of ['', 'en/']) {
        const source = await readFile(
          path.join(projectRoot, `src/content/docs/${localePrefix}foundations/${slug}.mdx`),
          'utf8',
        );
        expect(source.match(/accessDate: '2026-08-26'/g), `${localePrefix}${slug}`).toHaveLength(count);
        expect(source).toContain("factCheckDate: '2026-08-26'");
        for (const version of versions) expect(source, `${localePrefix}${slug} ${version}`).toContain(version);
      }

      const document = await readRoute(`/en/foundations/${slug}/`);
      expect(metadata(document, 'cuda:fact-check-date')).toBe('2026-08-26');
    }
  });
});
