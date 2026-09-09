// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const unit = 'libraries/cusparse-descriptors-spmv-spmm';
const locales = ['', 'en/'];
const reviewedOn = '2026-09-09';
const emptyEvidence = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };

async function source(locale: string, slug: string, extension = 'mdx') {
  const raw = await readFile(path.join(root, 'src/content/docs', `${locale}${slug}.${extension}`), 'utf8');
  return { raw, metadata: parseFrontmatter(raw).frontmatter };
}

describe('issue #40 cuSPARSE publication contract', () => {
  it('static: publishes an evidence-neutral L13 pair with exact prerequisites and archived source dates', async () => {
    const pages = await Promise.all(locales.map((locale) => source(locale, unit)));
    for (const field of ['pairId', 'structure', 'unitId', 'resourceKind', 'prerequisites', 'relatedUnits', 'sources', 'factCheckDate', 'evidence']) {
      expect(pages[0].metadata[field], field).toEqual(pages[1].metadata[field]);
    }
    for (const [index, { raw, metadata: m }] of pages.entries()) {
      const counterpart = `/${locales[1 - index]}${unit}/`;
      expect(m).toMatchObject({
        pairId: 'l13', unitId: 'L13', resourceKind: 'learning-unit',
        counterpart, prerequisites: ['A12', 'A13', 'L01'], relatedUnits: ['EX20'],
        factCheckDate: reviewedOn, hardwareGate: 'none', evidence: emptyEvidence,
        license: 'CC-BY-4.0', provenance: 'original',
      });
      const head = Object.fromEntries(m.head.map((entry: { attrs: { name: string; content: string } }) => [entry.attrs.name, entry.attrs.content]));
      expect(head).toMatchObject({
        'cuda:pair-id': 'l13', 'cuda:unit-id': 'L13', 'cuda:resource-kind': 'learning-unit',
        'cuda:counterpart': counterpart, 'cuda:prerequisites': 'A12,A13,L01', 'cuda:related-units': 'EX20',
        'cuda:fact-check-date': reviewedOn, 'cuda:structure': m.structure.join(','),
        'cuda:hardware-gate': 'none', 'cuda:license': 'CC-BY-4.0', 'cuda:provenance': 'original',
        'cuda:evidence-compilation': 'none', 'cuda:evidence-runtime': 'none',
        'cuda:expected-observations': 'none', 'cuda:recorded-observations': 'none',
        'cuda:source-count': String(m.sources.length),
      });
      for (const version of ['11.8.0', '12.9.2', '13.3.1']) {
        for (const document of ['cusparse', 'cuda-toolkit-release-notes']) {
          expect(m.sources.some((record: { url: string }) => record.url === `https://docs.nvidia.com/cuda/archive/${version}/${document}/index.html`)).toBe(true);
        }
      }
      for (const record of m.sources) expect(record.accessDate).toBe(reviewedOn);
      expect(m.canonicalExample).toBeUndefined();
      expect(raw).not.toMatch(/^import\s|```|data-canonical-example|<canvas\b|<svg\b|<iframe\b/m);
      expect(raw).toContain(`href="${counterpart}"`);
      expect(raw).toContain(`#src-cuda-075`);
      expect(raw).toContain(`#src-cuda-076`);
    }
  });

  it('static: separates three original exercises, six closed layered hints, and worked solutions in both locales', async () => {
    for (const suffix of ['exercises', 'solutions']) {
      const pages = await Promise.all(locales.map((locale) => source(locale, `${unit}/${suffix}`, 'md')));
      for (const field of ['pairId', 'structure', 'unitId', 'resourceKind', 'prerequisites', 'sources', 'evidence', 'factCheckDate']) {
        expect(pages[0].metadata[field], `${suffix}: ${field}`).toEqual(pages[1].metadata[field]);
      }
      for (const [index, { raw, metadata: m }] of pages.entries()) {
        const id = `L13-${suffix.toUpperCase()}`;
        const prerequisites = suffix === 'exercises' ? ['L13'] : ['L13-EXERCISES'];
        const kind = suffix === 'exercises' ? 'exercise-set' : 'solution-set';
        const counterpart = `/${locales[1 - index]}${unit}/${suffix}/`;
        expect(m).toMatchObject({ pairId: id.toLowerCase(), unitId: id, resourceKind: kind,
          prerequisites, counterpart, factCheckDate: reviewedOn, hardwareGate: 'none', evidence: emptyEvidence,
          license: 'CC-BY-4.0', provenance: 'original' });
        const head = Object.fromEntries(m.head.map((entry: { attrs: { name: string; content: string } }) => [entry.attrs.name, entry.attrs.content]));
        expect(head).toMatchObject({
          'cuda:pair-id': id.toLowerCase(), 'cuda:unit-id': id, 'cuda:resource-kind': kind,
          'cuda:counterpart': counterpart, 'cuda:prerequisites': prerequisites.join(','),
          'cuda:fact-check-date': reviewedOn, 'cuda:structure': m.structure.join(','),
          'cuda:hardware-gate': 'none', 'cuda:license': 'CC-BY-4.0', 'cuda:provenance': 'original',
          'cuda:evidence-compilation': 'none', 'cuda:evidence-runtime': 'none',
          'cuda:expected-observations': 'none', 'cuda:recorded-observations': 'none',
          'cuda:source-count': String(m.sources.length),
        });
        for (const record of m.sources) expect(record.accessDate).toBe(reviewedOn);
        expect(m.canonicalExample).toBeUndefined();
        expect(raw).toContain(`href="${counterpart}"`);
        expect(raw).not.toMatch(/^import\s|```|data-canonical-example/m);
      }
    }
    for (const locale of locales) {
      const exercises = await source(locale, `${unit}/exercises`, 'md');
      const solutions = await source(locale, `${unit}/solutions`, 'md');
      expect(exercises.metadata.structure).toEqual(['prerequisites', 'instructions', 'exercise-1', 'exercise-2', 'exercise-3', 'next']);
      expect(solutions.metadata.structure).toEqual(['review', 'solution-1', 'solution-2', 'solution-3', 'valid-alternatives', 'common-errors']);
      const tasks = [...exercises.raw.matchAll(/^## (?:Exercise|练习) ([123])[:：]([^]*?)(?=^## |$(?![^]))/gm)];
      expect(tasks.map((task) => task[1])).toEqual(['1', '2', '3']);
      for (const task of tasks) {
        for (const label of locale ? ['Goal', 'Constraints', 'Expected evidence', 'Acceptance criteria'] : ['目标', '约束', '预期提交证据', '验收标准']) {
          expect(task[2]).toContain(`**${label}`);
        }
        const hints = Array.from(parseHTML(task[2]).document.querySelectorAll('details'));
        expect(hints).toHaveLength(2);
        for (const [index, hint] of hints.entries()) {
          expect(hint.hasAttribute('open')).toBe(false);
          const summary = hint.querySelector('summary')!.textContent!;
          expect(summary).toMatch(new RegExp(`^(?:Hint|提示) ${index + 1}[:：]`));
          expect(hint.textContent!.replace(summary, '').trim().length).toBeGreaterThan(30);
        }
      }
      expect(solutions.raw.match(/^## (?:Solution|解答) [123][:：]/gm)).toHaveLength(3);
      expect(solutions.raw).not.toContain('<details');
      expect(solutions.raw).toMatch(/^## (?:Valid alternatives|合法替代)/m);
      expect(solutions.raw).toMatch(/^## (?:Common errors|常见错误)/m);
      // Independently derived paper answers, deliberately different from EX20 fixtures.
      for (const result of ['[0,0,1]', '[-1,2,-2]', '[[0,7],[0,0],[1,8]]', '[[-1,14],[2,-3],[-2,17]]',
        '8*4096+4*1025=36868', '12*4096=49152', '4096*4+256*4+257*4=18436',
        '200+30*R', 'R>20', '4096+4096=8192']) {
        expect(solutions.raw, `${locale}: ${result}`).toContain(result);
      }
      const lesson = await source(locale, unit);
      const retrieval = lesson.raw.split(locale ? '## Retrieval check' : '## 检索自测')[1]?.split('\n## ')[0];
      expect(retrieval?.match(/^\d\. /gm)).toHaveLength(5);
    }
  });
});
