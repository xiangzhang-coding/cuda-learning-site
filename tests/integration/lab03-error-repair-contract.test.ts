// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const relativePath = `${route.slice(1)}index.html`;
  return parseHTML(await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8')).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function mainText(document: Document) {
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function sectionElements(document: Document, headingPattern: RegExp) {
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
  return elements;
}

describe('LAB03 break-and-repair contract', () => {
  it.each([
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
  ])('publishes exact gates, prerequisites, canonical ranges, and evidence metadata in $route', async (route) => {
    const document = await readRoute(route);
    const expectedMetadata = {
      'cuda:pair-id': 'lab03',
      'cuda:fact-check-date': '2026-08-26',
      'cuda:resource-kind': 'lab',
      'cuda:unit-id': 'LAB03',
      'cuda:prerequisites': 'F03,F05',
      'cuda:related-units': 'EX04,F08',
      'cuda:example-ids': 'EX04',
      'cuda:canonical-example': 'EX04',
      'cuda:canonical-ranges': 'indexing-kernels,host-verification',
      'cuda:hardware-gate': 'Native Linux only; one CUDA GPU with compute capability 7.5 or newer; fixed 7 x 5 indexing extent; one 35-element uint32_t output allocation of 140 bytes; workload below 8 GB',
      'cuda:estimated-minutes': '60',
      'cuda:difficulty': 'intermediate',
      'cuda:toolkit-lanes': 'cuda-11.8,cuda-12.9,cuda-13.3',
      'cuda:minimum-compute-capability': '7.5',
      'cuda:maximum-problem-memory-bytes': '140',
      'cuda:gpu-count': '1',
      'cuda:permissions': 'CUDA device; compiler, make, and binary execution; EX04 build/evidence-directory write/delete',
      'cuda:evidence-compilation': 'none',
      'cuda:evidence-runtime': 'Pending Hardware Verification',
      'cuda:expected-observations': '4 declared expectations',
      'cuda:recorded-observations': 'none',
      'cuda:source-count': '7',
      'cuda:source-versions': '11.8.0,12.9.2,13.3.1,13.3',
    } as const;

    for (const [name, value] of Object.entries(expectedMetadata)) {
      expect(metadata(document, name), `${route} ${name}`).toBe(value);
    }
    expect(document.querySelectorAll(
      'figure[data-canonical-example="EX04"][data-canonical-range="indexing-kernels"]',
    )).toHaveLength(1);
    expect(document.querySelectorAll(
      'figure[data-canonical-example="EX04"][data-canonical-range="host-verification"]',
    )).toHaveLength(1);
  });

  it.each([
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
  ])('requires isolated fail and repair scenarios with explicit acceptance criteria in $route', async (route) => {
    const text = mainText(await readRoute(route));

    for (const scenario of ['launch-config', 'deferred-access', 'indexing-defect', 'repaired-indexing']) {
      expect(text, `${route} ${scenario}`).toContain(scenario);
    }
    expect(text).toMatch(/one scenario per process|每个进程只接受一个 scenario/i);
    expect(text).toMatch(/launch-config.*immediate-after-submission/i);
    expect(text).toMatch(/deferred-access.*immediate check.*(?:clear|无 launch error).*synchronization/is);
    expect(text).toMatch(/indexing-defect.*allocation.*synchronization.*D2H.*free.*mismatch/is);
    expect(text).toMatch(/expected defect.*status zero|预期 defect.*状态.*0/i);
    expect(text).toMatch(/repaired-indexing.*35.*exact|repaired-indexing.*35.*精确/is);
    expect(text).toMatch(/row-major|行主序/);
    expect(text).toMatch(/independent.*host comparison|独立 host 比较/i);
    expect(text).toMatch(/no cleanup or recovery|不.*cleanup.*recovery/i);
    expect(text).toMatch(/no latency|不.*latency/i);
  });

  it('publishes the exact build and four external run commands with retained statuses', async () => {
    const commands = [
      'make preprocess DIALECT=c++17 BUILD_DIR=build',
      'make compile DIALECT=c++17 BUILD_DIR=build',
      'make link DIALECT=c++17 BUILD_DIR=build',
      'make inspect DIALECT=c++17 BUILD_DIR=build',
      'make host-test DIALECT=c++17 BUILD_DIR=build',
      './build/ex04-error-handling-lifecycle launch-config',
      './build/ex04-error-handling-lifecycle deferred-access',
      './build/ex04-error-handling-lifecycle indexing-defect',
      './build/ex04-error-handling-lifecycle repaired-indexing',
      'make clean BUILD_DIR=build',
    ];

    for (const localePrefix of ['', 'en/']) {
      const source = await readFile(
        path.join(projectRoot, `src/content/docs/${localePrefix}labs/break-and-repair-indexing.mdx`),
        'utf8',
      );
      for (const command of commands) expect(source, `${localePrefix}${command}`).toContain(command);
      for (const stage of [
        '01-preprocess',
        '02-compile',
        '03-link',
        '04-inspect',
        '05-host-test',
        '06-launch-config',
        '07-deferred-access',
        '08-indexing-defect',
        '09-repaired-indexing',
      ]) {
        expect(source, `${localePrefix}${stage}`).toContain(`lab03-evidence/${stage}.status`);
      }
      expect(source).toMatch(/make host-test.*executes no CUDA binary|make host-test.*不执行 CUDA binary/is);
      expect(source.match(/accessDate: '2026-08-26'/g)).toHaveLength(7);
    }
  });

  it.each([
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
  ])('keeps four expected observations separate from an empty recorded axis in $route', async (route) => {
    const document = await readRoute(route);
    const observations = sectionElements(document, /预期观察.*记录结果|Expected observations, not recorded results/);
    const text = observations.map((element) => element.textContent ?? '').join(' ').replace(/\s+/g, ' ');
    const listItems = observations.flatMap((element) => [...element.querySelectorAll('li')]);

    expect(listItems).toHaveLength(4);
    expect(text).toMatch(/should|应当|应该/);
    expect(text).toMatch(/pre-run expected|运行前.*预期/i);
    expect(text).toMatch(/recorded observations remain empty|recorded observation.*为空/i);
    expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
  });

  it.each([
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
  ])('contains criteria and templates but no invented CUDA transcript in $route', async (route) => {
    const document = await readRoute(route);
    const text = mainText(document);
    const codeBlocks = [...document.querySelectorAll('main pre code')]
      .map((code) => code.textContent ?? '')
      .join('\n');

    expect(text).toMatch(/no prefilled runtime output|没有预先填入任何实际输出/i);
    expect(text).toMatch(/Do not prefill|不预填/i);
    expect(text).toMatch(/specific error name|固定.*error name|具体错误名/i);
    expect(codeBlocks).not.toMatch(/(?:^|\n)\s*(?:stage|operation)=.*status=/);
    expect(codeBlocks).not.toMatch(/cudaError(?:InvalidConfiguration|IllegalAddress|LaunchFailure)/);
    expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
    expect(metadata(document, 'cuda:evidence-runtime')).toBe('Pending Hardware Verification');
  });
});
