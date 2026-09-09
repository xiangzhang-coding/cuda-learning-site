// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const slug = 'libraries/cufft-plans-layouts-startup';
const locales = ['', 'en/'];
const reviewedOn = '2026-09-08';
const emptyEvidence = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };

async function source(locale: string, suffix = '') {
  const raw = await readFile(path.join(root, 'src/content/docs', `${locale}${slug}${suffix}${suffix ? '.md' : '.mdx'}`), 'utf8');
  return { raw, metadata: parseFrontmatter(raw).frontmatter };
}

describe('issue #39 L12 cuFFT publication contract', () => {
  it('static: publishes three evidence-neutral pairs with exact prerequisite and source-date contracts', async () => {
    for (const suffix of ['', '/exercises', '/solutions']) {
      const pages = await Promise.all(locales.map((locale) => source(locale, suffix)));
      const id = `L12${suffix.replace('/', '-').toUpperCase()}`;
      const prerequisites = suffix === '/exercises' ? ['L12'] : suffix === '/solutions' ? ['L12-EXERCISES'] : ['Q05', 'M07'];
      const kind = suffix === '/exercises' ? 'exercise-set' : suffix === '/solutions' ? 'solution-set' : 'learning-unit';
      for (const field of ['pairId', 'structure', 'resourceKind', 'unitId', 'prerequisites', 'relatedUnits', 'sources', 'factCheckDate', 'evidence']) {
        expect(pages[0].metadata[field], `${id}: ${field}`).toEqual(pages[1].metadata[field]);
      }
      for (const [index, page] of pages.entries()) {
        const m = page.metadata;
        const counterpart = `/${locales[1 - index]}${slug}${suffix}/`;
        expect(m).toMatchObject({
          pairId: id.toLowerCase(), unitId: id, prerequisites, resourceKind: kind, counterpart,
          factCheckDate: reviewedOn, hardwareGate: 'none', evidence: emptyEvidence,
          license: 'CC-BY-4.0', provenance: 'original',
        });
        if (!suffix) expect(m.relatedUnits).toEqual(['EX19']);
        expect(m.canonicalExample).toBeUndefined();
        expect(m.exampleIds ?? []).toEqual([]);
        expect(m.toolkitLanes ?? []).toEqual([]);
        const head = Object.fromEntries(m.head.map((entry: { attrs: { name: string; content: string } }) => [entry.attrs.name, entry.attrs.content]));
        expect(head).toMatchObject({
          'cuda:pair-id': id.toLowerCase(), 'cuda:unit-id': id, 'cuda:resource-kind': kind,
          'cuda:counterpart': counterpart, 'cuda:prerequisites': prerequisites.join(','),
          'cuda:fact-check-date': reviewedOn, 'cuda:structure': m.structure.join(','),
          'cuda:hardware-gate': 'none', 'cuda:license': 'CC-BY-4.0', 'cuda:provenance': 'original',
          'cuda:evidence-compilation': 'none', 'cuda:evidence-runtime': 'none',
          'cuda:expected-observations': 'none', 'cuda:recorded-observations': 'none',
        });
        expect(m.sources.length).toBeGreaterThan(0);
        for (const record of m.sources) expect(record.accessDate).toBe(reviewedOn);
        expect(head['cuda:source-count']).toBe(String(m.sources.length));
        expect(page.raw).not.toMatch(/^import\s|```|data-canonical-example|<canvas\b|<svg\b|<iframe\b/m);
      }
    }
  });

  it('static: separates three original tasks, two closed hints per task, and detailed solutions', async () => {
    for (const locale of locales) {
      const exercises = await source(locale, '/exercises');
      const solutions = await source(locale, '/solutions');
      expect(exercises.metadata.structure).toEqual(['prerequisites', 'instructions', 'exercise-1', 'exercise-2', 'exercise-3', 'next']);
      expect(solutions.metadata.structure).toEqual(['review', 'solution-1', 'solution-2', 'solution-3', 'valid-alternatives', 'common-errors']);
      const tasks = [...exercises.raw.matchAll(/^## (?:Exercise|练习) ([123])[:：]([^]*?)(?=^## |$(?![^]))/gm)];
      expect(tasks.map((task) => task[1])).toEqual(['1', '2', '3']);
      for (const task of tasks) {
        for (const label of locale ? ['Goal', 'Constraints', 'Expected evidence', 'Acceptance criteria'] : ['目标', '约束', '预期提交证据', '验收标准']) {
          expect(task[2]).toContain(`**${label}`);
        }
        const { document } = parseHTML(task[2]);
        const hints = Array.from(document.querySelectorAll('details'));
        expect(hints).toHaveLength(2);
        for (const [index, hint] of hints.entries()) {
          expect(hint.hasAttribute('open')).toBe(false);
          expect(hint.querySelector('summary')?.textContent).toMatch(new RegExp(`^(?:Hint|提示) ${index + 1}[:：]`));
          expect(hint.textContent?.replace(hint.querySelector('summary')!.textContent!, '').trim().length).toBeGreaterThan(30);
        }
      }
      expect(exercises.raw).not.toMatch(/^## (?:Solution|解答)/m);
      expect(solutions.raw.match(/^## (?:Solution|解答) [123][:：]/gm)).toHaveLength(3);
      expect(solutions.raw).not.toContain('<details');
      expect(solutions.raw).toMatch(/^## (?:Valid alternatives|合法替代)/m);
      expect(solutions.raw).toMatch(/^## (?:Common errors|常见错误)/m);
    }
  });

  it('static: publishes independently specified real-storage and custom C2C arithmetic in both solutions', async () => {
    for (const locale of locales) {
      const { raw } = await source(locale, '/solutions');
      // Literal results are the paper problem's oracle, not values generated by EX19.
      for (const result of [
        'K=floor(10/2)+1=6', '2*K=12', '3*12=36', '36*4=144',
        '| `R2C` | 12 | 6 | 36 | 144 |', '| `C2R` | 6 | 12 | 36 | 144 |',
        '| 0 | `0,2,4,6` | `0,3,6,9` |', '| 1 | `11,13,15,17` | `16,19,22,25` |',
        '1+11+3*2=18', '1+16+3*3=26', '22*8=176', '32*8=256',
        '[1,-i,-1,i]', '[10,-2+2i,-2,-2-2i]', '[0,4,0,0]', '[4,8,12,16]',
      ]) expect(raw, `${locale || 'zh-CN'}: ${result}`).toContain(result);
      expect(raw).toMatch(/1\/10/);
      expect(raw).toMatch(/1\/4/);
      expect(raw).toMatch(/4096\+6144=10240/);
      expect(raw).toMatch(/max\(4096,6144\)=6144/);
    }
  });
});
