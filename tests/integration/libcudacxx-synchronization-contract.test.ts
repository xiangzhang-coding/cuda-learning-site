// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const slug = 'libraries/libcu-plus-plus-synchronization';
const publications = [
  { suffix: '', pairId: 'l05', unitId: 'L05', kind: 'learning-unit', prerequisites: 'M05,M13,M19' },
  { suffix: '/exercises', pairId: 'l05-exercises', unitId: 'L05-EXERCISES', kind: 'exercise-set', prerequisites: 'L05' },
  { suffix: '/solutions', pairId: 'l05-solutions', unitId: 'L05-SOLUTIONS', kind: 'solution-set', prerequisites: 'L05-EXERCISES' },
] as const;

async function readRoute(route: string) {
  return parseHTML(await readFile(path.join(projectRoot, 'dist', route, 'index.html'), 'utf8')).document;
}

describe('L05 libcu++ synchronization publication contract', () => {
  it('publishes three aligned pairs with direct locale links and no inferred evidence or code', async () => {
    for (const publication of publications) {
      const structures = [];
      for (const locale of ['', 'en/']) {
        const route = `${locale}${slug}${publication.suffix}`;
        const counterpart = `/${locale ? '' : 'en/'}${slug}${publication.suffix}/`;
        const document = await readRoute(route);
        for (const [key, value] of Object.entries({
          'pair-id': publication.pairId,
          'unit-id': publication.unitId,
          'resource-kind': publication.kind,
          prerequisites: publication.prerequisites,
          counterpart,
          'fact-check-date': '2026-09-05',
          license: 'CC-BY-4.0',
          provenance: 'original',
          'evidence-compilation': 'none',
          'evidence-runtime': 'none',
          'expected-observations': 'none',
          'recorded-observations': 'none',
        })) {
          expect(document.querySelector(`meta[name="cuda:${key}"]`)?.getAttribute('content'), `${route}: ${key}`)
            .toBe(value);
        }
        expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
        expect(document.querySelector('main pre, [data-canonical-example], meta[name="cuda:canonical-example"]')).toBeNull();
        structures.push(document.querySelector('meta[name="cuda:structure"]')?.getAttribute('content'));
      }
      expect(structures[0]).toBeTruthy();
      expect(structures[0]).toBe(structures[1]);
    }
  });

  it('bounds published owner-test and compilation-mode claims to the inspected contracts', async () => {
    for (const locale of ['', 'en/']) {
      const unit = await readRoute(`${locale}${slug}`);
      const text = unit.querySelector('main')?.textContent ?? '';
      expect(/three copied values|三个复制值/.test(text), 'owner tests check copied values').toBe(true);
      expect(/three producer-count values|三个 producer-count 值/.test(text)).toBe(false);
      for (const fact of ['v3.4.2', 'SM70', 'SM75', 'SM80', '12.9.2', '13.3.1', '11.8.0', 'C++17', 'C++20', 'C++23', '13.2']) {
        expect(text, fact).toContain(fact);
      }
      for (const issue of ['10967', '10499']) {
        expect(unit.querySelector(`main a[href="https://github.com/NVIDIA/cccl/issues/${issue}"]`)).not.toBeNull();
      }
      for (const route of ['sources-and-versions', 'practice']) {
        const document = await readRoute(`${locale}${route}`);
        const copyParagraph = [...document.querySelectorAll('main p')]
          .find((paragraph) => paragraph.textContent?.includes('CUDA-compilation')
            && paragraph.textContent.includes('memcpy_async'))?.textContent ?? '';
        expect(copyParagraph, `${locale}${route}: scoped compilation guard`).toMatch(/barrier-bound/);
        expect(copyParagraph).toMatch(/pipeline-bound/);
        expect(copyParagraph).not.toMatch(/all reviewed memcpy_async overloads|overloads 均有/);
      }
    }
  });

  it('offers layered exercises, separate solutions, and license-reviewed primary sources in both locales', async () => {
    const licenses = await readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8');
    const sourceLists = [];
    for (const locale of ['', 'en/']) {
      const unit = await readRoute(`${locale}${slug}`);
      const exercises = await readRoute(`${locale}${slug}/exercises`);
      const solutions = await readRoute(`${locale}${slug}/solutions`);
      const hints = [...exercises.querySelectorAll('main details')];
      expect(hints).toHaveLength(6);
      for (const hint of hints) {
        expect(hint.hasAttribute('open')).toBe(false);
        expect(hint.querySelector('summary')?.textContent?.trim()).toBeTruthy();
        expect([...hint.childNodes].filter((node) => node.nodeName !== 'SUMMARY')
          .map((node) => node.textContent ?? '').join('').trim()).not.toBe('');
      }
      expect(exercises.querySelector(`main a[href="/${locale}${slug}/solutions/"]`)).not.toBeNull();
      expect(solutions.querySelectorAll('main details')).toHaveLength(0);
      expect(solutions.querySelectorAll('main table').length).toBeGreaterThan(0);
      for (const id of ['pb-r4-005', 'pb-r4-006']) {
        expect(unit.querySelector(`main a[href="/${locale}practice/#${id}"]`)).not.toBeNull();
      }
      const primarySources = [...new Set([...unit.querySelectorAll('main a[href]')]
        .map((link) => link.getAttribute('href')!)
        .filter((href) => href.startsWith('https://github.com/NVIDIA/cccl/blob/')))];
      expect(primarySources.length).toBeGreaterThan(20);
      for (const href of primarySources) {
        expect(href).toContain('/blob/v3.4.2/');
        expect(licenses.includes(`](${href})`), `${href}: individual license review`).toBe(true);
      }
      sourceLists.push(primarySources.sort());
    }
    expect(sourceLists[0]).toEqual(sourceLists[1]);
  });

  it('requires all continuing barrier participants to finish each phase before arriving again', async () => {
    for (const locale of ['', 'en/']) {
      const solutions = await readRoute(`${locale}${slug}/solutions`);
      const phases = [...solutions.querySelectorAll('main tbody tr')].filter((row) =>
        /^(?:ready|consumed)-[01]$/.test(row.querySelector('td')?.textContent?.trim() ?? ''));
      expect(phases.map((row) => row.querySelector('td')?.textContent?.trim()))
        .toEqual(['ready-0', 'consumed-0', 'ready-1', 'consumed-1']);
      for (const phase of phases) {
        const contribution = phase.querySelectorAll('td')[1];
        expect(contribution.textContent).toMatch(/A.*B.*C/);
        expect(contribution.querySelector('code')?.textContent).toBe('arrive_and_wait');
      }
      const paragraphs = [...solutions.querySelectorAll('main p')].map((paragraph) => paragraph.textContent ?? '');
      expect(paragraphs.some((text) => text.includes('arrive_and_wait')
        && /Each continuing participant waits|每个继续参与的线程必须等待/.test(text))).toBe(true);
      expect(paragraphs.some((text) => text.includes('consumed-0') && text.includes('ready-1')
        && /current countdown|当前倒计数/.test(text))).toBe(true);
    }
  });
});
