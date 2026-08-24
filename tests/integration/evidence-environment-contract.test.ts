// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

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

describe('O02 Evidence Status contract', () => {
  it.each([
    { route: '/start/evidence-status/', independent: '编译证据和运行证据相互独立' },
    { route: '/en/start/evidence-status/', independent: 'Compilation evidence and runtime evidence are independent' },
  ])('publishes exact statuses and legal combinations in $route', async ({ route, independent }) => {
    const document = await readRoute(route);
    const text = mainText(document);

    for (const status of ['Compile-Checked', 'Community-Observed', 'Runtime-Verified', 'Pending Hardware Verification', 'Runtime-Not-Applicable']) {
      expect(text).toContain(status);
    }
    for (const combination of [
      'Compile-Checked + Pending Hardware Verification',
      'Compile-Checked + Runtime-Verified',
      'Compile-Checked + Runtime-Not-Applicable',
      'Community-Observed + Pending Hardware Verification',
    ]) {
      expect(text).toContain(combination);
    }
    expect(text).toContain(independent);
    expect(text).toMatch(/expected, not observed|预期，不是已记录观察/);
    expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
    expect(metadata(document, 'cuda:evidence-runtime')).toBe('none');
    expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
  });

  it('binds every localized example to the same Evidence Status classification', async () => {
    const scenarios = [
      {
        route: '/start/evidence-status/',
        facts: {
          'O02-CASE-A': /构建成功.*没有运行/,
          'O02-CASE-B': /构建成功.*Reference Environment.*标准均满足/,
          'O02-CASE-C': /构建和检查均成功/,
          'O02-CASE-D': /社区提交完整 manifest.*维护者尚未复现/,
          'O02-CASE-E': /编译任务被阻塞/,
          'O02-CASE-F': /浏览器模型和网页质量测试全部通过/,
        },
      },
      {
        route: '/en/start/evidence-status/',
        facts: {
          'O02-CASE-A': /Lane built.*no run occurred/,
          'O02-CASE-B': /Build passed.*Reference Environment.*met every criterion/,
          'O02-CASE-C': /both build and inspection succeed/,
          'O02-CASE-D': /contributor supplied a complete manifest.*not reproduced/,
          'O02-CASE-E': /registry outage blocked the compile job/,
          'O02-CASE-F': /Browser interaction and every web-quality test passed/,
        },
      },
    ] as const;
    const classifications = {
      'O02-CASE-A': 'Compile-Checked + Pending Hardware Verification',
      'O02-CASE-B': 'Compile-Checked + Runtime-Verified',
      'O02-CASE-C': 'Compile-Checked + Runtime-Not-Applicable',
      'O02-CASE-D': 'Community-Observed + Pending Hardware Verification',
      'O02-CASE-E': 'Pending Hardware Verification',
      'O02-CASE-F': 'CUDA Evidence Status',
    } as const;

    for (const { route, facts } of scenarios) {
      const document = await readRoute(route);
      const rows = new Map(
        [...document.querySelectorAll('table tbody tr')].map((row) => {
          const cells = [...row.querySelectorAll('td')].map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim() ?? '');
          return [cells[0], { fact: cells[1], classification: cells[2] }];
        }),
      );

      for (const [caseId, factPattern] of Object.entries(facts)) {
        const row = rows.get(caseId);
        expect(row?.fact, `${route} ${caseId}`).toMatch(factPattern);
        expect(row?.classification, `${route} ${caseId}`).toContain(classifications[caseId as keyof typeof classifications]);
        if (caseId === 'O02-CASE-F') expect(row?.classification, `${route} ${caseId}`).toMatch(/^(?:无|No) CUDA Evidence Status$/);
      }
    }
  });
});

describe('O03 Environment Manifest contract', () => {
  it.each([
    { route: '/start/environment-manifest/', supported: '原生 Linux 是唯一的受支持环境', undeclared: '目前没有声明任何基准环境' },
    { route: '/en/start/environment-manifest/', supported: 'Native Linux is the only Supported Environment', undeclared: 'No Reference Environment is currently declared' },
  ])('separates complete environment coordinates in $route', async ({ route, supported, undeclared }) => {
    const text = mainText(await readRoute(route));

    expect(text).toContain('O03-MANIFEST-TEMPLATE');
    expect(text).toContain('O03-INCOMPLETE-A');

    for (const coordinate of [
      'GPU',
      'compute capability',
      'GPU count',
      'driver',
      'CUDA Toolkit',
      'component',
      'NVCC',
      'host compiler',
      'operating system',
      'workload',
      'memory',
      'permissions',
      'exact command',
      'correctness',
      'observation date',
    ]) {
      expect(text.toLowerCase()).toContain(coordinate.toLowerCase());
    }
    for (const lane of ['11.8.0', '12.9.2', '13.3.1']) expect(text).toContain(lane);
    expect(text).toContain('C++23');
    expect(text).toContain('Baseline GPU Capability Tier');
    expect(text).toContain('7.5');
    expect(text).toContain('Modern Single-GPU Capability Tier');
    expect(text).toContain('8.0');
    expect(text).toContain('8 GB');
    expect(text).toContain(supported);
    expect(text).toContain(undeclared);
  });

  it.each([
    {
      route: '/start/environment-manifest/',
      templateBoundary: /字段模板，不是某台机器的记录/,
      incompleteConclusion: /只有.*缺少.*不能支持可解释的正确性或性能结论/,
    },
    {
      route: '/en/start/environment-manifest/',
      templateBoundary: /field template, not a machine record/,
      incompleteConclusion: /says only.*omits.*cannot support an interpretable correctness or performance conclusion/,
    },
  ])('binds localized O03 example IDs to aligned facts in $route', async ({ route, templateBoundary, incompleteConclusion }) => {
    const text = mainText(await readRoute(route));
    const templateStart = text.indexOf('O03-MANIFEST-TEMPLATE');
    const incompleteStart = text.indexOf('O03-INCOMPLETE-A');
    const template = text.slice(templateStart, incompleteStart);
    const incomplete = text.slice(incompleteStart);

    expect(templateStart).toBeGreaterThanOrEqual(0);
    expect(incompleteStart).toBeGreaterThan(templateStart);
    expect(template).toMatch(templateBoundary);
    for (const field of ['GPU identity', 'compute capability', 'GPU count', 'driver version', 'CUDA Toolkit version', 'component versions', 'compiler information', 'operating system', 'workload and shape', 'memory requirement', 'permissions', 'exact command', 'correctness method', 'correctness criteria', 'observation date']) {
      expect(template).toContain(field);
    }
    expect(incomplete).toMatch(incompleteConclusion);
  });
});

describe('Exercises and Practice Bank contract', () => {
  it.each([
    '/start/evidence-status/exercises/',
    '/en/start/evidence-status/exercises/',
    '/start/environment-manifest/exercises/',
    '/en/start/environment-manifest/exercises/',
    '/foundations/first-cuda-kernel/exercises/',
    '/en/foundations/first-cuda-kernel/exercises/',
  ])('provides goals, constraints, acceptance criteria, and layered hints in $route', async (route) => {
    const text = mainText(await readRoute(route));
    expect(text).toMatch(/Goal|目标/);
    expect(text).toMatch(/Constraints|约束/);
    expect(text).toMatch(/Expected evidence|预期证据/);
    expect(text).toMatch(/Acceptance criteria|验收条件/);
    expect(text).toMatch(/Hint 1|提示 1/);
    expect(text).toMatch(/Hint 2|提示 2/);
    expect(text).not.toMatch(/解答 1|Solution 1/);
  });

  it.each([
    '/start/evidence-status/solutions/',
    '/en/start/evidence-status/solutions/',
    '/start/environment-manifest/solutions/',
    '/en/start/environment-manifest/solutions/',
    '/foundations/first-cuda-kernel/solutions/',
    '/en/foundations/first-cuda-kernel/solutions/',
  ])('keeps reviewed solutions on a separate route in $route', async (route) => {
    const text = mainText(await readRoute(route));
    expect(text).toMatch(/参考解答|Reviewed solution/);
    expect(text).toMatch(/Common errors|常见错误/);
  });

  it.each(['/practice/', '/en/practice/'])('publishes five complete Practice Bank entries in $route', async (route) => {
    const document = await readRoute(route);
    const text = mainText(document);
    const entryIds = ['PB-R0-001', 'PB-R0-002', 'PB-R0-003', 'PB-R0-004', 'PB-R0-005'];
    const entryHeadings = [...document.querySelectorAll('main h2')].filter((heading) =>
      entryIds.some((entryId) => heading.textContent?.includes(entryId)),
    );

    expect(entryHeadings).toHaveLength(entryIds.length);
    for (const [index, entryId] of entryIds.entries()) {
      const heading = entryHeadings[index];
      expect(heading.textContent, route).toContain(entryId);

      const sectionElements: Element[] = [];
      for (
        let element = heading.parentElement?.nextElementSibling ?? null;
        element && !element.querySelector('h2');
        element = element.nextElementSibling
      ) {
        sectionElements.push(element);
      }
      const sectionText = sectionElements.map((element) => element.textContent ?? '').join(' ').replace(/\s+/g, ' ');
      const sectionLinks = sectionElements.flatMap((element) => [...element.querySelectorAll('a[href]')]);

      expect(sectionText, `${route} ${entryId}`).toMatch(/Prerequisite|先修条件/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Hardware gate|硬件门槛/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Constraints|约束/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Expected evidence|预期证据/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Acceptance criteria|验收条件/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Hint 1|提示 1/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Solution|解答/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Source basis|来源依据/);
      expect(sectionLinks.some((link) => /\/(?:en\/)?(?:start|foundations)\//.test(link.getAttribute('href') ?? ''))).toBe(true);
    }

    expect(text).not.toMatch(/EX01|LAB01/);
    expect(text).toMatch(/O02/);
    expect(text).toMatch(/O03/);
    expect(text).toMatch(/F01/);
    expect(text).toMatch(/Hardware gate|硬件门槛/);
    expect(text).toMatch(/Source basis|来源依据/);
    expect(text).toMatch(/Last reviewed|最后复核/);
    expect(document.querySelector('a[href*="evidence-status"]')).not.toBeNull();
    expect(document.querySelector('a[href*="environment-manifest"]')).not.toBeNull();
    expect(document.querySelector('a[href*="first-cuda-kernel"]')).not.toBeNull();
  });
});
