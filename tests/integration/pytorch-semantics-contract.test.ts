// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { curriculumIdSchema, evidenceMetadataSchema, sourceReferenceSchema } from '../../src/content-metadata';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const root = path.resolve(import.meta.dirname, '../..');
const reviewedOn = '2026-09-12';
const commit = '70d99e998b4955e0049d13a98d77ae1b14db1f45';
const owner = `https://github.com/pytorch/pytorch/blob/${commit}/`;
const kineto = 'https://github.com/pytorch/kineto/blob/7a731b6ae01cfc2b1fc75d83a91f84e682e43fd7/';
const artifact = 'https://download.pytorch.org/whl/cu128/torch-2.11.0%2Bcu128-cp312-cp312-manylinux_2_28_x86_64.whl';
const profile = 'https://github.com/xiangzhang-coding/cuda-learning-site/blob/main/scripts/pytorch-environment/';
const locales = ['', 'en/'];
const emptyEvidence = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };
const units = [
  { id: 'P04', slug: 'frameworks/queued-work-timing', prerequisites: ['M07', 'Q05'], related: ['P05', 'P06', 'P07'], practice: 'PB-R5-004', source: '081' },
  { id: 'P05', slug: 'frameworks/streams-and-storage-lifetime', prerequisites: ['P04', 'M08'], related: ['P04'], practice: 'PB-R5-005', source: '081' },
  { id: 'P06', slug: 'frameworks/mixed-precision-contracts', prerequisites: ['Q02', 'P04', 'L08'], related: ['P04', 'P07'], practice: 'PB-R5-006', source: '082' },
  { id: 'P07', slug: 'frameworks/python-to-cuda-profiling', prerequisites: ['P04', 'Q07', 'Q08'], related: ['P05', 'P06'], practice: 'PB-R5-007', source: '083' },
];
const terms = [
  { id: 'TERM-201', title: 'Storage lifetime tracking', related: ['P04', 'P05'], source: '081' },
  { id: 'TERM-202', title: 'Autocast', related: ['L08', 'P06'], source: '082' },
  { id: 'TERM-203', title: 'Gradient scaling', related: ['Q02', 'P06'], source: '082' },
  { id: 'TERM-204', title: 'Profiler correlation', related: ['Q07', 'Q08', 'P07'], source: '083' },
];

async function source(route: string, suffix = '') {
  const raw = await readFile(path.join(root, 'src/content/docs', `${route}${suffix}${suffix ? '.md' : '.mdx'}`), 'utf8');
  return { raw, metadata: parseFrontmatter(raw).frontmatter };
}

async function readRoute(route: string) {
  return parseHTML(await readFile(path.join(root, 'dist', route, 'index.html'), 'utf8')).document;
}

function text(node: Node | null | undefined) {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function codes(node: ParentNode) {
  return [...node.querySelectorAll('code')].map(text);
}

function externalLinks(node: ParentNode) {
  return [...new Set([...node.querySelectorAll('a[href]')].map((link) => link.getAttribute('href')!)
    .filter((href) => href.startsWith('https://')))].sort();
}

function section(document: Document, title: RegExp, level = 'h2') {
  // Lookup cards repeat glossary titles but are links to definitions, not the authored sections.
  const headings = [...document.querySelectorAll(`main ${level}`)]
    .filter((heading) => !heading.closest('[data-resource-card]') && title.test(text(heading)));
  expect(headings.map(text), `one ${level} section matching ${title}`).toHaveLength(1);
  const heading = headings[0]!;
  const result = document.createElement('section');
  // Work with either Starlight's heading wrapper or a standalone heading, not generated anchor text.
  for (let node = (heading.closest('.sl-heading-wrapper') ?? heading).nextElementSibling;
    node && !node.matches('h2, h3') && !node.querySelector('h2, h3'); node = node.nextElementSibling) {
    result.append(node.cloneNode(true));
  }
  return result;
}

function rows(node: ParentNode, firstCell: RegExp) {
  const tables = [...node.querySelectorAll('table')].filter((table) => firstCell.test(text(table.querySelector('tbody tr td'))));
  expect(tables, `one table starting with ${firstCell}`).toHaveLength(1);
  return [...tables[0]!.querySelectorAll('tbody tr')].map((row) => [...row.querySelectorAll('td')]);
}

function scalar(value: string): number {
  const power = value.match(/^(-?)2\^(-?\d+)$/);
  if (power) return (power[1] ? -1 : 1) * 2 ** Number(power[2]);
  expect(value, 'a worksheet number, not executable code').toMatch(/^-?\d+(?:\.\d+)?(?:\/\d+)?$/);
  const [numerator, denominator = '1'] = value.split('/');
  return Number(numerator) / Number(denominator);
}

describe('issue #43 PyTorch semantics publication contract', () => {
  it.each(units)('static: $id publishes the exact prerequisite graph and original evidence-neutral practice pairs', async (unit) => {
    for (const suffix of ['', '/exercises', '/solutions']) {
      const pages = await Promise.all(locales.map((locale) => source(`${locale}${unit.slug}`, suffix)));
      const id = unit.id + suffix.replace('/', '-').toUpperCase();
      const prerequisites = suffix === '/exercises' ? [unit.id] : suffix === '/solutions' ? [`${unit.id}-EXERCISES`] : unit.prerequisites;
      const kind = suffix === '/exercises' ? 'exercise-set' : suffix === '/solutions' ? 'solution-set' : 'learning-unit';
      expect(PUBLISHED_DESTINATIONS[id].prerequisites).toEqual(prerequisites);
      for (const field of ['pairId', 'structure', 'unitId', 'resourceKind', 'prerequisites', 'relatedUnits', 'sources', 'factCheckDate', 'evidence']) {
        expect(pages[0].metadata[field], `${id}: ${field}`).toEqual(pages[1].metadata[field]);
      }
      for (const [index, { raw, metadata: m }] of pages.entries()) {
        const locale = locales[index];
        const counterpart = `/${locales[1 - index]}${unit.slug}${suffix}/`;
        expect(m).toMatchObject({ pairId: id.toLowerCase(), unitId: id, resourceKind: kind, prerequisites,
          counterpart, factCheckDate: reviewedOn, evidence: emptyEvidence, hardwareGate: 'none', license: 'CC-BY-4.0', provenance: 'original' });
        expect(PUBLISHED_DESTINATIONS[id].href[index ? 'en' : 'zh-CN']).toBe(`/${locale}${unit.slug}${suffix}/`);
        expect(curriculumIdSchema.safeParse(id).success).toBe(true);
        expect(evidenceMetadataSchema.safeParse(m.evidence).success).toBe(true);
        expect(m.toolkitLanes ?? []).toEqual([]);
        expect(m.exampleIds ?? []).toEqual([]);
        expect(m.canonicalExample).toBeUndefined();
        expect(m.canonicalRanges ?? []).toEqual([]);
        const head = Object.fromEntries(m.head.map((entry: { attrs: { name: string; content: string } }) => [entry.attrs.name, entry.attrs.content]));
        expect(head).toMatchObject({
          'cuda:pair-id': id.toLowerCase(), 'cuda:unit-id': id, 'cuda:resource-kind': kind,
          'cuda:counterpart': counterpart, 'cuda:prerequisites': prerequisites.join(','),
          'cuda:structure': m.structure.join(','), 'cuda:fact-check-date': reviewedOn, 'cuda:hardware-gate': 'none',
          'cuda:license': 'CC-BY-4.0', 'cuda:provenance': 'original', 'cuda:evidence-compilation': 'none',
          'cuda:evidence-runtime': 'none', 'cuda:expected-observations': 'none', 'cuda:recorded-observations': 'none',
        });
        if (!suffix) {
          expect(m.relatedUnits).toEqual(unit.related);
          expect(head['cuda:related-units']).toBe(unit.related.join(','));
          expect(m.sources.length).toBeGreaterThanOrEqual(3);
          const retrieval = raw.split(/^## (?:Retrieval check|提取式自测|检索检查)\s*$/m)[1]?.split('\n## ')[0];
          expect(retrieval?.match(/^\d+\. /gm)).toHaveLength(5);
        }
        if (m.sources) expect(head['cuda:source-count']).toBe(String(m.sources.length));
        for (const record of m.sources ?? []) {
          expect(sourceReferenceSchema.safeParse(record).success, record.url).toBe(true);
          expect(record.accessDate).toBe(reviewedOn);
          if (record.url.startsWith('https://github.com/pytorch/pytorch/')) expect(record.url).toContain(owner);
        }
        expect(raw).toContain(`href="${counterpart}"`);
        expect(raw).toContain(`/${locale}practice/#${unit.practice.toLowerCase()}`);
        for (const id of ['080', unit.source]) expect(raw).toContain(`/${locale}sources-and-versions/#src-cuda-${id}`);
        expect(raw).not.toMatch(/^import\s|```|~~~|<pre\b|CanonicalCode|<canvas\b|<iframe\b|torch\.utils\.cpp_extension|torch\.library\.custom_op|TORCH_LIBRARY\s*\(/m);
        const sections = raw.split(/^## /m).slice(1);
        expect(sections).toHaveLength(m.structure.length);
        if (suffix === '/exercises') {
          const exercises = sections.filter((item) => /^(?:Exercise|练习) [1-3][:：]/.test(item));
          expect(exercises.map((item) => item.match(/ (\d)[:：]/)![1])).toEqual(['1', '2', '3']);
          for (const exercise of exercises) {
            for (const label of ['Goal|目标', 'Constraints|约束', 'Expected evidence|预期证据|预期提交证据|应提交证据', 'Acceptance criteria|验收标准']) {
              const body = exercise.match(new RegExp(`\\*\\*(?:${label})[:：]\\*\\* ([^\\n]+)`))?.[1];
              expect(body?.trim().length ?? 0, `${id}: meaningful ${label}`).toBeGreaterThan(label.startsWith('Goal') ? 15 : 25);
            }
            const hints = [...parseHTML(exercise).document.querySelectorAll('details')];
            expect(hints).toHaveLength(2);
            hints.forEach((hint, n) => {
              expect(hint.hasAttribute('open')).toBe(false);
              expect(text(hint.querySelector('summary'))).toMatch(new RegExp(`^(?:Hint|提示) ${n + 1}[:：]`));
              expect([...hint.childNodes].filter((node) => node.nodeName !== 'SUMMARY').map(text).join('').length).toBeGreaterThan(20);
            });
          }
          expect(raw).toContain(`/${locale}${unit.slug}/solutions/`);
        } else if (suffix === '/solutions') {
          const solutions = sections.filter((item) => /^(?:Solution|解答) [1-3][:：]/.test(item));
          expect(solutions.map((item) => item.match(/ (\d)[:：]/)![1])).toEqual(['1', '2', '3']);
          for (const solution of solutions) expect(solution.length).toBeGreaterThan(200);
          expect(raw).not.toContain('<details');
          expect(raw).toMatch(/Valid alternative|有效替代方案|合法替代/);
          expect(raw).toMatch(/Common errors|常见错误/);
          expect(raw).toContain(`/${locale}${unit.slug}/exercises/`);
        }
      }
    }
  });

  it.each(units)('$id renders paired metadata, technical table cells, sources, retrieval and separate answers', async (unit) => {
    for (const suffix of ['', '/exercises', '/solutions']) {
      const documents = await Promise.all(locales.map((locale) => readRoute(`${locale}${unit.slug}${suffix}`)));
      for (const [index, document] of documents.entries()) {
        const { metadata: m } = await source(`${locales[index]}${unit.slug}`, suffix);
        const main = document.querySelector('main')!;
        expect(main).not.toBeNull();
        expect(text(main)).not.toContain('**');
        expect(main.querySelector('pre, [data-canonical-example], [data-visual-id], canvas, iframe, astro-island')).toBeNull();
        for (const entry of m.head) {
          const metas = document.querySelectorAll(`meta[name="${entry.attrs.name}"]`);
          expect(metas, entry.attrs.name).toHaveLength(1);
          expect(metas[0]?.getAttribute('content')).toBe(entry.attrs.content);
        }
        expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(m.counterpart);
        expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('lang')).toBe(index ? 'zh-CN' : 'en');
        for (const prerequisite of m.prerequisites) {
          const href = PUBLISHED_DESTINATIONS[prerequisite].href[index ? 'en' : 'zh-CN'];
          expect(main.querySelector(`a[href="${href}"]`), prerequisite).not.toBeNull();
        }
        expect(main.querySelectorAll('h2')).toHaveLength(m.structure.length);
        expect(main.querySelectorAll('details')).toHaveLength(suffix === '/exercises' ? 6 : 0);
        if (!suffix) {
          expect(section(document, /^(?:Retrieval check|提取式自测|检索检查)/).querySelectorAll('ol > li')).toHaveLength(5);
        } else {
          for (let n = 1; n <= 3; n++) {
            const exercise = suffix === '/exercises';
            const item = section(document, new RegExp(`^(?:${exercise ? 'Exercise' : 'Solution'} ${n}:|${exercise ? '练习' : '解答'} ${n}：)`));
            expect(text(item).length).toBeGreaterThan(150);
            if (exercise) {
              expect(item.querySelectorAll('details')).toHaveLength(2);
              expect(item.querySelectorAll('details[open]')).toHaveLength(0);
              for (const label of [/^Goal|^目标/, /^Constraints|^约束/, /^Expected evidence|^预期证据|^预期提交证据|^应提交证据/, /^Acceptance criteria|^验收标准/]) {
                expect([...item.querySelectorAll('strong')].filter((node) => label.test(text(node)))).toHaveLength(1);
              }
            }
          }
        }
        for (const id of ['080', unit.source]) {
          expect(main.querySelector(`a[href="/${locales[index]}sources-and-versions/#src-cuda-${id}"]`)).not.toBeNull();
        }
        for (const record of m.sources ?? []) {
          expect(externalLinks(main).map((href) => href.split('#')[0])).toContain(record.url.split('#')[0]);
        }
      }
      const tables = documents.map((document) => [...document.querySelectorAll('main table')]
        .map((table) => [...table.querySelectorAll('tr')].map((row) => [...row.querySelectorAll('th, td')].map(codes))));
      expect(tables[0], `${unit.id}${suffix}: paired table shape and code in each cell`).toEqual(tables[1]);
      const links = documents.map((document) => externalLinks(document.querySelector('main')!));
      expect(links[0], `${unit.id}${suffix}: paired exact sources`).toEqual(links[1]);
      for (const href of links[0]) {
        if (href.startsWith('https://github.com/pytorch/pytorch/')) expect(href.startsWith(owner), href).toBe(true);
        if (href.startsWith('https://github.com/pytorch/kineto/')) expect(href.startsWith(kineto), href).toBe(true);
      }
    }
  });

  it.each(locales)('audits P04 host, wall, and event coverage without retroactive timestamp repair (%s)', async (locale) => {
    const lesson = await readRoute(`${locale}${units[0].slug}`);
    const cases = rows(lesson, /^T0$/);
    expect(cases.map((cells) => text(cells[0]))).toEqual(['T0', 'T1', 'T2', 'T3', 'T4', 'T5']);
    const decisions = [
      /^Host observation only|^只能作为主机观察/,
      /^Valid completed wall boundary|^对声明区域有效的完成墙钟边界/,
      /^Valid same-stream event boundary|^有效的同流事件边界/,
      /B need not finish before end|B 不必先于 end 完成/,
      /B may begin before start|B 可能先于 start 开始/,
      /^Valid multi-stream event boundary|^有效的多流事件边界/,
    ];
    cases.forEach((cells, index) => expect(text(cells[2]), `T${index}`).toMatch(decisions[index]));
    expect(text(cases[3][1])).toMatch(/without joining B|没有汇合 B/);
    expect(text(cases[4][1])).toMatch(/B has no dependency on start|B 没有 start 依赖/);
    const audit = section(lesson, /^Predict and audit|^先预测，再审查/);
    expect(text(audit)).toMatch(/repairs neither a missing start dependency nor a missing join|既不能修复缺失的开始依赖，也不能修复缺失的结束汇合/);
    const solution = await readRoute(`${locale}${units[0].slug}/solutions`);
    expect(rows(solution, /^T0$/).map((cells) => text(cells[0]))).toEqual(['T0', 'T1', 'T2']);
    const repaired = section(solution, /^Solution 2:|^解答 2：/);
    const edges = [...repaired.querySelectorAll('ol > li')].map(text);
    expect(edges).toHaveLength(5);
    for (const [index, branch] of ['A', 'B'].entries()) {
      expect(edges[index]).toContain(branch);
      expect(edges[index]).toContain('start');
      expect(edges[index + 2]).toContain(branch);
      expect(edges[index + 2]).toContain('end');
    }
    expect(edges[4]).toMatch(/successful end completion|end 成功完成之后/);
    expect(text(repaired)).toMatch(/does not rewrite an already reached start or end marker|不会重写已经到达的 start 或 end 标记/);
  });

  it.each(locales)('audits P05 allocation origins, two-way protection and deallocation-time coverage (%s)', async (locale) => {
    const lesson = await readRoute(`${locale}${units[1].slug}`);
    const storage = rows(lesson, /^x$/);
    expect(storage.map((cells) => text(cells[0]))).toEqual(['x', 'y', 'z']);
    for (const [index, [origin, consumer]] of [['A', 'B'], ['B', 'A'], ['A', 'B']].entries()) {
      expect(text(storage[index][1])).toMatch(new RegExp(`(?:on ${origin}|在 ${origin})`));
      expect(text(storage[index][2])).toMatch(new RegExp(`^${consumer} (?:waits|在)`));
      expect(text(storage[index][3])).toMatch(new RegExp(`(?:origin|来源) ${origin}$`));
    }
    expect(codes(storage[2][1])).toEqual(['torch.empty']);
    const cases = rows(lesson, /^S0$/);
    expect(cases.map((cells) => text(cells[0]))).toEqual(['S0', 'S1', 'S2', 'S3', 'S4']);
    const decisions = [
      /y['\u2019]s non-origin A use lacks lifetime protection|y 的非来源 A 使用缺少生命周期保护/,
      /lifetime registration does not establish data readiness|生命周期登记不建立数据就绪/,
      /submission is not completion|提交不是完成/,
      /^Complete for the stipulated use graph|^对给定使用图完整/,
      /^Valid manual alternative|^对给定使用图有效的手动替代方案/,
    ];
    cases.forEach((cells, index) => expect(text(cells[2]), `S${index}`).toMatch(decisions[index]));
    const solution = await readRoute(`${locale}${units[1].slug}/solutions`);
    const coverage = rows(solution, /^U1$/);
    expect(coverage.map((cells) => text(cells[0]))).toEqual(['U1', 'U2', 'U3']);
    expect(coverage.map((cells) => cells.slice(2).map(text))).toEqual(locale
      ? [['Covered', 'Covered'], ['Covered', 'Not covered'], ['Not authorized', 'Not authorized']]
      : [['覆盖', '覆盖'], ['覆盖', '不覆盖'], ['不授权', '不授权']]);
    coverage.slice(0, 2).forEach((cells) => expect(text(cells[1])).toMatch(/after R, before F|R 后、F 前/));
    expect(text(coverage[2][1])).toMatch(/after F|F 后/);
    expect(text(section(lesson, /^Predict and solve|^先预测，再解/))).toMatch(/origin is still A|来源仍是 A/);
    const failures = text(section(lesson, /^Failure cases|^失败是依赖图/));
    expect(failures).toMatch(/reciprocal stream directions alone do not create a cyclic device wait|仅流方向相反不会形成循环设备等待/);
    expect(failures).toMatch(/miss required coverage or unnecessarily serialize work|遗漏必需的覆盖或造成不必要的串行化/);
  });

  it.each(locales)('derives P06 independent references, signed errors and both tolerance decisions (%s)', async (locale) => {
    const lesson = await readRoute(`${locale}${units[2].slug}`);
    const exercise = await readRoute(`${locale}${units[2].slug}/exercises`);
    expect(codes(section(exercise, /^Exercise 1:|^练习 1：/))).toEqual(expect.arrayContaining([
      'a=[1+2^-12,1]', 'b=[1,-1/2]', 'a=[1+2^-10,1]', 'b=[1+2^-10,-1]', 'atol=2^-21', 'rtol=2^-11', 'rtol=0',
    ]));
    const fixture = rows(lesson, /^S$/);
    expect(fixture.map((cells) => text(cells[0]))).toEqual(['S', 'R']);
    expect(fixture.map((cells) => cells.slice(1, 5).map(text))).toEqual([
      ['[1+2^-12,1]', '[1,-1/2]', '[1,1]', '[1,-1/2]'],
      ['[1+2^-10,1]', '[1+2^-10,-1]', '[1+2^-10,1]', '[1+2^-10,-1]'],
    ]);
    // These binary fractions are exact in JS; expected values come from the independently supplied worksheet.
    const original = [(1 + 2 ** -12) - 1 / 2, (1 + 2 ** -10) ** 2 - 1];
    const stored = [1 / 2, 2049 / 1048576];
    const output = [1 / 2, 1 / 512];
    expect(fixture.map((cells) => cells.slice(5).map((cell) => scalar(text(cell)))))
      .toEqual(original.map((value, index) => [value, stored[index], output[index]]));
    const solution = await readRoute(`${locale}${units[2].slug}/solutions`);
    const worked = section(solution, /^Solution 1:|^解答 1：/);
    const values = rows(worked, /^S$/).map((cells) => cells.slice(1).map((cell) => scalar(text(cell))));
    expect(values).toEqual([
      [2049 / 4096, 0.5, 0.5, -(2 ** -12), 0],
      [2049 / 1048576, 2049 / 1048576, 1 / 512, -(2 ** -20), -(2 ** -20)],
    ]);
    expect(Math.max(...values.map((row) => Math.abs(row[3])))).toBe(2 ** -12);
    expect(Math.max(...values.map((row) => Math.abs(row[4])))).toBe(2 ** -20);
    expect(Math.hypot(...values.map((row) => row[3])) / Math.hypot(...values.map((row) => row[0]))).toBeCloseTo(1 / 2049, 15);
    const summary = [...worked.querySelectorAll('p')].filter((paragraph) => codes(paragraph).includes('norm(y-r)/norm(r) = 1/2049'));
    expect(summary).toHaveLength(1);
    expect(codes(summary[0]).slice(0, 2)).toEqual(['2^-12', '2^-20']);
    for (const [referenceIndex, deltaIndex] of [[0, 3], [1, 4]]) {
      const accepts = (rtol: number) => values.map((row) => Math.abs(row[deltaIndex]) <= 2 ** -21 + rtol * Math.abs(row[referenceIndex]));
      expect(accepts(2 ** -11)).toEqual([true, true]);
      expect(accepts(0)).toEqual(referenceIndex === 0 ? [false, false] : [true, false]);
    }
    const tolerance = [...worked.querySelectorAll('p')].filter((paragraph) => codes(paragraph).includes('atol=2^-21'));
    expect(tolerance).toHaveLength(1);
    expect(codes(tolerance[0])).toEqual(expect.arrayContaining(['atol=2^-21', 'rtol=2^-11', 'rtol=0']));
    expect(text(tolerance[0])).toMatch(/admits both rows against both references|两行相对两份参考均通过/);
    expect(text(tolerance[0])).toMatch(/both full-original checks fail|两份原值检查都失败/);
    expect(text(tolerance[0])).toMatch(/S['\u2019]s zero error passes while R still fails|S 的零误差通过，R 仍失败/);
  });

  it.each(locales)('checks P06 constant-scale, mixed-scale and nonfinite optimizer ledgers (%s)', async (locale) => {
    const exercise = await readRoute(`${locale}${units[2].slug}/exercises`);
    expect(codes(section(exercise, /^Exercise 3:|^练习 3：/))).toEqual(expect.arrayContaining([
      'p=2', 'lr=1/4', 'g1=3/4', 'g2=-1/4', 's=8', 'init_scale=0.5', 'backoff_factor=0.5',
    ]));
    const solution = await readRoute(`${locale}${units[2].slug}/solutions`);
    const worked = section(solution, /^Solution 3:|^解答 3：/);
    const ledger = rows(worked, /^Constant scale$|^固定尺度$/);
    expect(ledger).toHaveLength(3);
    expect(codes(worked)).toEqual(expect.arrayContaining(['8*(3/4)=6', '8*(-1/4)=-2']));
    const values = ledger.slice(0, 2).map((cells) => cells.slice(1, 4).map((cell) => scalar(text(cell).split('=').at(-1)!)));
    expect(values).toEqual([[4, 0.5, 1.875], [5, 1.25, 1.6875]]);
    expect(values[0][0]).toBe(8 * (3 / 4) + 8 * (-1 / 4));
    expect(values[1][0]).toBe(8 * (3 / 4) + 4 * (-1 / 4));
    values.forEach((row) => expect(row[2]).toBe(2 - (1 / 4) * row[1]));
    expect(codes(ledger[0][4])).toEqual(['8']);
    expect(codes(ledger[1][4])).toEqual(['8', '4']);
    expect(codes(ledger[2][3])).toEqual(['2']);
    expect(text(ledger[2][3])).toMatch(/unchanged|不变/);
    expect(codes(ledger[2][4])).toEqual(['0.5*0.5=0.25']);
    expect(text(ledger[2][2])).toMatch(/Nonfinite detected before update|更新前检测到非有限/);
  });

  it.each(locales)('attributes P07 supplied launch chains without guessing the owner of K-U (%s)', async (locale) => {
    for (const suffix of ['', '/exercises']) {
      const document = await readRoute(`${locale}${units[3].slug}${suffix}`);
      const mapping = rows(document, /^F-A$/);
      expect(mapping.map((cells) => cells.map(codes))).toEqual([
        [['F-A'], ['H-A1'], ['C-X'], ['K-A1'], ['0 / 3']],
        [['F-A'], ['H-A2'], ['C-Y'], ['K-A2'], ['0 / 3']],
        [['F-B'], [], [], [], []],
        [['F-C'], ['H-C1'], ['C-Z'], ['K-C1'], ['0 / 7']],
      ]);
      for (const cell of mapping[2].slice(1, 4)) expect(text(cell)).toMatch(/^None|^无/);
      const counts = ['F-A', 'F-B', 'F-C'].map((id) => mapping.filter((cells) => text(cells[0]) === id && codes(cells[3]).length).length);
      expect(counts).toEqual([2, 0, 1]);
    }
    const solution = await readRoute(`${locale}${units[3].slug}/solutions`);
    const attribution = section(solution, /^Solution 1:|^解答 1：/);
    expect(codes(attribution)).toEqual([
      'F-A -> H-A1 -> C-X -> K-A1', 'F-A -> H-A2 -> C-Y -> K-A2', 'F-C -> H-C1 -> C-Z -> K-C1',
    ]);
    expect([...attribution.querySelectorAll('strong')].map(text)).toEqual(locale ? ['two', 'zero', 'one', 'unresolved'] : ['两个', '零个', '一个', '未解析']);
    expect(text(attribution)).toMatch(/K-U remains unresolved|K-U 仍为未解析/);
  });

  it.each(locales)('predicts P07 ten schedule actions, six active iterations and two post-work callbacks (%s)', async (locale) => {
    const actions = ['NONE', 'WARMUP', 'RECORD', 'RECORD', 'RECORD_AND_SAVE'];
    const exercise = await readRoute(`${locale}${units[3].slug}/exercises`);
    expect(codes(section(exercise, /^Exercise 2:|^练习 2：/))).toEqual(expect.arrayContaining([
      'wait=1', 'warmup=1', 'active=3', 'repeat=2', 'skip_first=0', 'skip_first_wait=0', 'prof.step()',
    ]));
    for (const suffix of ['', '/solutions']) {
      const document = await readRoute(`${locale}${units[3].slug}${suffix}`);
      const schedule = rows(document, /^0$/);
      expect(schedule.map((cells) => [Number(text(cells[0])), text(cells[1])]))
        .toEqual(Array.from({ length: 10 }, (_, index) => [index, actions[index % 5]]));
      expect(['W1', 'W2'].map((window) => schedule.filter((cells) => text(cells[2]) === window).map((cells) => Number(text(cells[0])))))
        .toEqual([[2, 3, 4], [7, 8, 9]]);
      if (suffix) {
        expect(schedule.filter((cells) => codes(cells[3]).length).map((cells) => [Number(text(cells[0])), Number(text(cells[3]))]))
          .toEqual([[4, 5], [9, 10]]);
        const answer = section(document, /^Solution 2:|^解答 2：/);
        expect(codes(answer)).toEqual(expect.arrayContaining(['[2,3,4]', '[7,8,9]', 'on_trace_ready', 'acc_events=False', 'acc_events=True']));
      } else {
        const plan = section(document, /^Predict the schedule|^采集前先预测/);
        expect(codes(plan)).toEqual(expect.arrayContaining(['wait=1', 'warmup=1', 'active=3', 'repeat=2', 'skip_first=0', 'skip_first_wait=0']));
        expect(text(schedule[4][3])).toMatch(/Callback 1|回调 1/);
        expect(text(schedule[9][3])).toMatch(/Callback 2|回调 2/);
      }
    }
  });

  it('static: registers only the four new practice, source and glossary contracts at their own boundaries', async () => {
    for (const unit of units) {
      const records = RESOURCE_INDEX_RECORDS.filter(({ planningId }) => planningId === unit.practice);
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ group: 'practice', prerequisites: [unit.id], reviewedOn });
      expect(records[0].evidence).toBeUndefined();
      for (const locale of ['zh-CN', 'en'] as const) {
        expect(records[0].href[locale]).toBe(`/${locale === 'en' ? 'en/' : ''}practice/#${unit.practice.toLowerCase()}`);
        expect(records[0].versionGate[locale]).toContain('2.11.0+cu128');
        expect(records[0].hardwareGate[locale]).toBeTruthy();
      }
    }
    for (const [id, relatedUnits] of [
      ['080', ['P04', 'P05', 'P06', 'P07']], ['081', ['P04', 'P05']], ['082', ['L08', 'P06']], ['083', ['Q07', 'Q08', 'P07']],
    ] as const) {
      const records = RESOURCE_INDEX_RECORDS.filter(({ planningId }) => planningId === `SRC-CUDA-${id}`);
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ group: 'sources', reviewedOn, sourceAccessDate: reviewedOn, relatedUnits });
    }
    for (const term of terms) {
      const records = RESOURCE_INDEX_RECORDS.filter(({ planningId }) => planningId === term.id);
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ group: 'glossary', relatedUnits: term.related, reviewedOn });
    }
    for (const locale of locales) {
      const [practice, sources, glossary] = await Promise.all(['practice', 'sources-and-versions', 'glossary'].map((slug) => source(`${locale}${slug}`)));
      for (const unit of units) expect(practice.raw).toContain(`id="${unit.practice.toLowerCase()}"`);
      for (const id of ['080', '081', '082', '083']) expect(sources.raw).toContain(`id="src-cuda-${id}"`);
      for (const term of terms) expect(glossary.raw).toContain(`id="${term.id.toLowerCase()}"`);
      for (const url of [artifact, `${artifact}.metadata`, `${profile}profile.json`, `${profile}requirements.lock`, `${profile}check.py`]) {
        expect(sources.raw).toContain(`](${url})`);
      }
    }
  });

  it.each(locales)('renders useful practice, glossary and exact-artifact source destinations with paired technical content (%s)', async (locale) => {
    const [practice, sources, glossary, otherPractice, otherSources] = await Promise.all([
      `${locale}practice`, `${locale}sources-and-versions`, `${locale}glossary`,
      `${locale ? '' : 'en/'}practice`, `${locale ? '' : 'en/'}sources-and-versions`,
    ].map(readRoute));
    for (const unit of units) {
      const entry = section(practice, new RegExp(`^${unit.practice}[:：]`));
      const counterpart = section(otherPractice, new RegExp(`^${unit.practice}[:：]`));
      expect(practice.querySelectorAll(`#${unit.practice.toLowerCase()}`)).toHaveLength(1);
      expect(entry.querySelector(`a[href="/${locale}${unit.slug}/"]`)).not.toBeNull();
      expect(codes(entry)).toContain(`[${unit.id}]`);
      const details = [...entry.querySelectorAll('details')];
      expect(details).toHaveLength(3);
      details.forEach((detail) => {
        expect(detail.hasAttribute('open')).toBe(false);
        expect(text(detail).length).toBeGreaterThan(50);
      });
      expect(text(details[0].querySelector('summary'))).toMatch(/^(Hint|提示) 1/);
      expect(text(details[1].querySelector('summary'))).toMatch(/^(Hint|提示) 2/);
      expect(text(details[2].querySelector('summary'))).toMatch(/^Separate reviewed solution|^独立参考解答/);
      expect(externalLinks(entry)).toEqual(externalLinks(counterpart));
      expect([...entry.querySelectorAll('tr')].map(codes)).toEqual([...counterpart.querySelectorAll('tr')].map(codes));
      expect(text(entry)).toContain(reviewedOn);
    }
    for (const id of ['080', '081', '082', '083']) {
      expect(sources.querySelectorAll(`#src-cuda-${id}`)).toHaveLength(1);
      const entry = section(sources, new RegExp(`^SRC-CUDA-${id}[:：]`));
      const counterpart = section(otherSources, new RegExp(`^SRC-CUDA-${id}[:：]`));
      expect(externalLinks(entry)).toEqual(externalLinks(counterpart));
      expect([...entry.querySelectorAll('tr')].map(codes)).toEqual([...counterpart.querySelectorAll('tr')].map(codes));
      expect(text(entry)).toContain(reviewedOn);
      expect(externalLinks(entry).some((href) => href.startsWith(owner))).toBe(true);
    }
    const environment = section(sources, /^SRC-CUDA-080[:：]/);
    for (const href of [artifact, `${artifact}.metadata`, `${profile}profile.json`, `${profile}requirements.lock`, `${profile}check.py`]) {
      expect(environment.querySelector(`a[href="${href}"]`), href).not.toBeNull();
    }
    expect(codes(environment)).toContain('d252cf975fb18c94a85336323ad425f473df56dab35a44b00399bd70c7a3b997');
    for (const term of terms) {
      const anchor = term.id.toLowerCase();
      expect(glossary.querySelectorAll(`#${anchor}`).length, `unique ${term.id} definition anchor`).toBe(1);
      const cardLinks = [...glossary.querySelectorAll(`[data-resource-card][data-resource-id="${term.id}"] h3 a`)];
      expect(cardLinks.map((link) => link.getAttribute('href')), `${term.id} card targets its definition`)
        .toEqual([`/${locale}glossary/#${anchor}`]);
      const entry = section(glossary, new RegExp(term.title), 'h3');
      for (const id of term.related) {
        const href = PUBLISHED_DESTINATIONS[id].href[locale ? 'en' : 'zh-CN'];
        expect(entry.querySelector(`a[href="${href}"]`), `${term.id}: ${id}`).not.toBeNull();
      }
      expect(entry.querySelector(`a[href="/${locale}sources-and-versions/#src-cuda-${term.source}"]`)).not.toBeNull();
      expect(text(entry)).toContain(reviewedOn);
      expect(text(entry).length).toBeGreaterThan(150);
    }
  });
});
