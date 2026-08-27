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

function sectionText(heading: Element) {
  const elements: Element[] = [];
  for (
    let element = heading.parentElement?.nextElementSibling ?? null;
    element && !element.querySelector('h2');
    element = element.nextElementSibling
  ) {
    elements.push(element);
  }
  return elements.map((element) => element.textContent ?? '').join(' ').replace(/\s+/g, ' ');
}

describe('F02-F04 execution, indexing, and lifecycle publication', () => {
  it('separates the execution hierarchy without promising a scheduling order', async () => {
    const chinese = await readRoute('/foundations/execution-hierarchy/');
    const english = await readRoute('/en/foundations/execution-hierarchy/');

    for (const document of [chinese, english]) {
      const text = mainText(document);
      for (const term of ['kernel', 'grid', 'thread block', 'warp', 'lane', 'SM']) {
        expect(text, term).toContain(term);
      }
      expect(text).toMatch(/32-thread|32 个 lane|32-thread execution group/);
      expect(text).toMatch(/x-fastest|x 最快/);
      expect(text).toMatch(/does not promise|no promised|没有承诺|不保证/);
      expect(text).toMatch(/VIS01/);
      expect(text).toMatch(/VIS02/);
    }

    const chineseText = mainText(chinese);
    expect(chineseText).toMatch(/线程束（warp）/);
    expect(chineseText).toMatch(/通道（lane）/);
    expect(chineseText).toMatch(/流式多处理器（streaming multiprocessor，SM）/);
  });

  it('publishes per-axis indexing as a correctness contract and reuses VIS02 exactly once', async () => {
    const chinese = await readRoute('/foundations/multidimensional-indexing/');
    const english = await readRoute('/en/foundations/multidimensional-indexing/');

    for (const document of [chinese, english]) {
      const text = mainText(document);
      for (const equation of [
        'blockIdx.x * blockDim.x + threadIdx.x',
        'blockIdx.y * blockDim.y + threadIdx.y',
        'blockIdx.z * blockDim.z + threadIdx.z',
      ]) {
        expect(text).toContain(equation);
      }
      expect(text).toContain('((gz * height) + gy) * width + gx');
      expect(text).toMatch(/before flattening|展平前/);
      expect(text).toMatch(/application declares|应用声明/);
      expect(document.querySelectorAll('cuda-indexing-explorer[data-visual-id="VIS02"]')).toHaveLength(1);
      expect(document.querySelector('[data-static-fallback]')).not.toBeNull();
    }

    const chineseText = mainText(chinese);
    for (const firstUse of [
      /多维索引（multidimensional indexing）/,
      /逻辑范围（logical extent）/,
      /边界检查（bounds check）/,
      /行主序布局（row-major layout）/,
    ]) {
      expect(chineseText).toMatch(firstUse);
    }
  });

  it('orders the explicit lifecycle and provides an accessible static equivalent', async () => {
    for (const route of ['/foundations/host-device-lifecycle/', '/en/foundations/host-device-lifecycle/']) {
      const document = await readRoute(route);
      const text = mainText(document);
      const orderedSteps = [
        /initializ(?:e|ation)|初始化/,
        /allocat(?:e|ion)|分配/,
        /H2D/,
        /kernel launch/,
        /cudaGetLastError/,
        /cudaDeviceSynchronize/,
        /D2H/,
        /comparison/,
        /release/,
      ];

      let previousOffset = -1;
      for (const step of orderedSteps) {
        const match = step.exec(text.slice(previousOffset + 1));
        expect(match, `${route} ${step}`).not.toBeNull();
        previousOffset += (match?.index ?? -1) + 1;
      }

      const lifecycleTable = [...document.querySelectorAll('table')].find((table) =>
        table.querySelector('caption')?.textContent?.match(/lifecycle|生命周期/i),
      );
      expect(lifecycleTable).toBeDefined();
      expect(lifecycleTable?.querySelectorAll('tbody tr')).toHaveLength(9);
      expect(text).toMatch(/host-only test/);
      expect(text).toMatch(/Pending Hardware Verification/);
      expect(text).toMatch(/not a new Visual Explainer|不是新的 Visual Explainer/);
    }
  });

  it('publishes three to five retrieval questions and three separate reviewed Exercises per unit', async () => {
    for (const slug of ['execution-hierarchy', 'multidimensional-indexing', 'host-device-lifecycle']) {
      for (const localePrefix of ['', 'en/']) {
        const unit = await readRoute(`/${localePrefix}foundations/${slug}/`);
        const retrievalHeading = [...unit.querySelectorAll('main h2')].find((heading) =>
          heading.textContent?.match(/离开前检查|Retrieval check/),
        );
        expect(retrievalHeading, slug).toBeDefined();
        let retrievalList = retrievalHeading?.parentElement?.nextElementSibling ?? null;
        while (retrievalList && !retrievalList.querySelector('h2') && retrievalList.tagName !== 'OL') {
          retrievalList = retrievalList.nextElementSibling;
        }
        expect(retrievalList?.tagName, `${localePrefix}${slug}`).toBe('OL');
        const retrievalQuestions = [...(retrievalList?.children ?? [])].filter(
          (element) => element.tagName === 'LI',
        );
        expect(retrievalQuestions.length, `${localePrefix}${slug}`).toBeGreaterThanOrEqual(3);
        expect(retrievalQuestions.length, `${localePrefix}${slug}`).toBeLessThanOrEqual(5);

        const exercises = await readRoute(`/${localePrefix}foundations/${slug}/exercises/`);
        const exerciseHeadings = [...exercises.querySelectorAll('main h2')].filter((heading) =>
          heading.textContent?.match(/^(?:练习|Exercise)\s+[1-3]/),
        );
        expect(exerciseHeadings).toHaveLength(3);
        for (const heading of exerciseHeadings) {
          const text = sectionText(heading);
          for (const label of [
            /Goal|目标/,
            /Constraints|约束/,
            /Expected evidence|预期证据/,
            /Acceptance criteria|验收条件/,
            /Hint 1|提示 1/,
            /Hint 2|提示 2/,
          ]) {
            expect(text, `${localePrefix}${slug} ${heading.textContent}`).toMatch(label);
          }
          expect(text).not.toMatch(/Reviewed solution|参考解答|^Solution|^解答/);
        }

        const solutions = await readRoute(`/${localePrefix}foundations/${slug}/solutions/`);
        const solutionHeadings = [...solutions.querySelectorAll('main h2')].filter((heading) =>
          heading.textContent?.match(/^(?:解答|Solution)\s+[1-3]/),
        );
        expect(solutionHeadings).toHaveLength(3);
        expect(mainText(solutions)).toMatch(/Valid alternatives|有效替代方案/);
        expect(mainText(solutions)).toMatch(/Common errors|常见错误/);
      }
    }
  });

  it('keeps F02-F04 source facts aligned across locales', async () => {
    const ownerSources = new Map([
      ['execution-hierarchy', [
        'https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html',
        'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html',
      ]],
      ['multidimensional-indexing', [
        'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html',
        'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/intro-to-cuda-cpp.html',
      ]],
      ['host-device-lifecycle', [
        'https://docs.nvidia.com/cuda/cuda-runtime-api/index.html',
        'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__MEMORY.html',
        'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__DEVICE.html',
        'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/intro-to-cuda-cpp.html',
      ]],
    ] as const);

    for (const [slug, urls] of ownerSources) {
      for (const route of [`/foundations/${slug}/`, `/en/foundations/${slug}/`]) {
        const document = await readRoute(route);
        for (const url of urls) expect(document.querySelector(`a[href="${url}"]`), `${route} ${url}`).not.toBeNull();
      }
    }

  });
});
