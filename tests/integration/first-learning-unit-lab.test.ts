// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { readCanonicalRange } from '../../scripts/lib/canonical-examples.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const relativePath = route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
  const html = await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8');
  return parseHTML(html).document;
}

function mainText(document: Document) {
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ') ?? '';
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

describe('F01 first-kernel Learning Unit', () => {
  it.each([
    {
      route: '/foundations/first-cuda-kernel/',
      headings: ['动机：', '预测：', '实现：', '正确性：', '测量：', '优化边界：', '解释：'],
      tolerance: /绝对容差.*或相对容差.*两者都不接受才失败/,
    },
    {
      route: '/en/foundations/first-cuda-kernel/',
      headings: ['Motivation:', 'Prediction:', 'Implementation:', 'Correctness:', 'Measurement:', 'Optimization boundaries:', 'Explanation:'],
      tolerance: /absolute tolerance 1e-5 and relative tolerance 1e-5.*passes when either.*fails only when neither accepts/i,
    },
  ])('publishes the required teaching progression in $route', async ({ route, headings, tolerance }) => {
    const document = await readRoute(route);
    const text = mainText(document);
    let previous = -1;

    for (const heading of headings) {
      const position = text.indexOf(heading);
      expect(position, `${route}: ${heading}`).toBeGreaterThan(previous);
      previous = position;
    }

    expect(text).toMatch(tolerance);
    expect(text).toContain('blockIdx.x * blockDim.x + threadIdx.x');
    expect(text).toContain('cudaGetLastError');
    expect(text).toContain('cudaDeviceSynchronize');
    expect(document.querySelector('a[href*="visuals/kernel-journey"]')).not.toBeNull();
    expect(document.querySelector('a[href*="visuals/indexing"]')).not.toBeNull();
    expect(document.querySelector('a[href*="labs/vector-addition"]')).not.toBeNull();
    expect(document.querySelector('cuda-kernel-journey')).not.toBeNull();
    expect(document.querySelector('cuda-indexing-explorer')).not.toBeNull();
    expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
    expect(metadata(document, 'cuda:evidence-runtime')).toBe('none');
  });

  it.each([
    '/foundations/first-cuda-kernel/',
    '/en/foundations/first-cuda-kernel/',
    '/labs/vector-addition/',
    '/en/labs/vector-addition/',
  ])('renders every displayed EX02 excerpt from its declared canonical range in $route', async (route) => {
    const document = await readRoute(route);
    const declared = (metadata(document, 'cuda:canonical-ranges') ?? '').split(',');
    const figures = [...document.querySelectorAll('[data-canonical-example="EX02"]')];

    expect(figures.map((figure) => figure.getAttribute('data-canonical-range'))).toEqual(declared);
    expect(document.querySelector('a[href="https://github.com/xiangzhang-coding/cuda-learning-site/tree/d69f7131acff7f8b1dfcd780b494426b5948735b/examples/ex02-vector-addition"]')).not.toBeNull();

    for (const figure of figures) {
      const range = figure.getAttribute('data-canonical-range') ?? '';
      const excerpt = await readCanonicalRange(projectRoot, 'EX02', range);
      expect(figure.getAttribute('data-canonical-file')).toBe(excerpt.file);
      expect(figure.getAttribute('data-canonical-lines')).toBe(`${excerpt.startLine}-${excerpt.endLine}`);
      expect(figure.querySelector('pre code')?.textContent?.trim()).toBe(excerpt.code.trim());
      expect(figure.querySelector('figcaption a')?.getAttribute('href')).toContain('/blob/d69f7131acff7f8b1dfcd780b494426b5948735b/');
    }
  });
});

describe('LAB02 external verification contract', () => {
  it.each([
    { route: '/labs/vector-addition/', supported: '仅原生 Linux', difficulty: '入门' },
    { route: '/en/labs/vector-addition/', supported: 'Native Linux only', difficulty: 'Introductory' },
  ])('records a complete bounded Lab contract in $route', async ({ route, supported, difficulty }) => {
    const document = await readRoute(route);
    const text = mainText(document);

    expect(metadata(document, 'cuda:resource-kind')).toBe('lab');
    expect(metadata(document, 'cuda:estimated-minutes')).toBe('45');
    expect(metadata(document, 'cuda:difficulty')).toBe('introductory');
    expect(metadata(document, 'cuda:toolkit-lanes')).toBe('cuda-11.8,cuda-12.9,cuda-13.3');
    expect(metadata(document, 'cuda:minimum-compute-capability')).toBe('7.5');
    expect(Number(metadata(document, 'cuda:maximum-problem-memory-bytes'))).toBeLessThan(8 * 1024 ** 3);
    expect(metadata(document, 'cuda:gpu-count')).toBe('1');
    expect(metadata(document, 'cuda:permissions')).toBeTruthy();
    expect(metadata(document, 'cuda:evidence-compilation')).toBe('Compile-Checked');
    expect(metadata(document, 'cuda:evidence-runtime')).toBe('Pending Hardware Verification');
    expect(metadata(document, 'cuda:recorded-observations')).toBe('none');

    expect(text).toContain('45');
    expect(text).toContain(difficulty);
    expect(text).toContain(supported);
    for (const coordinate of ['11.8.0', '12.9.2', '13.3.1', '7.5', '8 GB', 'GPU', 'permissions']) {
      expect(text.toLowerCase()).toContain(coordinate.toLowerCase());
    }
    for (const boundary of ['cudaMalloc', 'cudaGetLastError', 'cudaDeviceSynchronize', 'cudaFree', 'CPU reference']) {
      expect(text).toContain(boundary);
    }
    expect(text).toMatch(/absolute.*or.*relative|绝对.*或.*相对/i);
    expect(text).toMatch(/Expected observations|预期观察/);
    expect(text).toMatch(/Recorded observations|已记录运行观察|记录结果/);
    expect(document.querySelector('a[href*="visuals/kernel-journey"]')).not.toBeNull();
    expect(document.querySelector('a[href*="visuals/indexing"]')).not.toBeNull();
    expect(text).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ms|us|ns|GB\/s|TFLOP\/s)\b/i);
  });
});

describe('F01 Exercises, Practice Bank, and Glossary', () => {
  it.each([
    '/foundations/first-cuda-kernel/exercises/',
    '/en/foundations/first-cuda-kernel/exercises/',
  ])('publishes three learner-owned tasks with layered hints in $route', async (route) => {
    const document = await readRoute(route);
    const text = mainText(document);
    const tasks = [...document.querySelectorAll('main h2')].filter((heading) => /练习 \d|Exercise \d/.test(heading.textContent ?? ''));

    expect(tasks).toHaveLength(3);
    for (const label of ['Goal|目标', 'Constraints|约束', 'Expected evidence|预期证据', 'Acceptance criteria|验收条件', 'Hint 1|提示 1', 'Hint 2|提示 2']) {
      expect(text).toMatch(new RegExp(label));
    }
    expect(text).not.toMatch(/Solution 1|解答 1/);
  });

  it.each([
    '/foundations/first-cuda-kernel/solutions/',
    '/en/foundations/first-cuda-kernel/solutions/',
  ])('keeps reviewed solutions, alternatives, and common errors separate in $route', async (route) => {
    const text = mainText(await readRoute(route));
    expect(text).toMatch(/Reviewed solutions|参考解答/);
    expect(text).toMatch(/Valid alternatives|有效替代方案/);
    expect(text).toMatch(/Common errors|常见错误/);
    expect(text).toMatch(/satisfies either|满足任一|accepts either/i);
  });

  it.each(['/practice/', '/en/practice/'])('links three original first-kernel entries back to F01 in $route', async (route) => {
    const document = await readRoute(route);
    const headings = [...document.querySelectorAll('main h2')].map((heading) => heading.textContent ?? '');
    for (const id of ['PB-R0-003', 'PB-R0-004', 'PB-R0-005']) {
      expect(headings.some((heading) => heading.startsWith(id))).toBe(true);
    }
    expect(document.querySelectorAll('a[href*="first-cuda-kernel"]').length).toBeGreaterThanOrEqual(3);
  });

  it.each(['/glossary/', '/en/glossary/'])('publishes the canonical first-kernel vocabulary in $route', async (route) => {
    const text = mainText(await readRoute(route));
    for (const term of ['kernel', 'execution configuration', 'grid', 'thread block', 'thread', 'host and device', 'bounds check', 'CPU reference', 'tolerance']) {
      expect(text.toLowerCase()).toContain(term.toLowerCase());
    }
  });
});
