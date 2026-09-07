// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const root = path.resolve(import.meta.dirname, '../..');
const reviewedOn = '2026-09-07';
const commit = 'f77fbc3d21be3f24cd0286b9b368105f7c518b8a';
const owner = `https://github.com/NVIDIA/cudnn-frontend/blob/${commit}/`;
const backend = 'https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/';
const release = 'https://github.com/NVIDIA/cudnn-frontend/releases/tag/v1.27.0';
const preview = 'https://docs.nvidia.com/deeplearning/cudnn/backend/v9.25.0/release-notes.html#cudnn-9-25-0-developer-preview';
const locales = ['', 'en/'];
const units = [
  { id: 'L10', slug: 'libraries/cudnn-graphs-and-plans', prerequisites: ['A07', 'L01', 'Q05'], related: ['L11'], practice: 'PB-R4-011' },
  { id: 'L11', slug: 'libraries/attention-backend-dispatch', prerequisites: ['A11', 'L10', 'L08'], related: ['VIS18'], practice: 'PB-R4-012' },
];
const emptyEvidence = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };

async function source(route: string) {
  const raw = await readFile(path.join(root, 'src/content/docs', route), 'utf8');
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
  return [...new Set([...node.querySelectorAll('a[href]')]
    .map((link) => link.getAttribute('href')!).filter((href) => href.startsWith('https://')))].sort();
}

function section(document: Document, title: RegExp) {
  const headings = [...document.querySelectorAll('main h2')].filter((heading) => title.test(text(heading)));
  expect(headings, `one section matching ${title}`).toHaveLength(1);
  const heading = headings[0]!;
  const result = document.createElement('section');
  // Starlight wraps headings; standalone h2 also works without depending on generated anchor slugs.
  for (let node = (heading.closest('.sl-heading-wrapper') ?? heading).nextElementSibling;
    node && !node.matches('h2') && !node.querySelector('h2'); node = node.nextElementSibling) {
    result.append(node.cloneNode(true));
  }
  return result;
}

function rows(node: ParentNode, firstCell: RegExp) {
  const matches = [...node.querySelectorAll('table')]
    .filter((table) => firstCell.test(text(table.querySelector('tbody tr td'))));
  expect(matches, `one table starting with ${firstCell}`).toHaveLength(1);
  return [...matches[0]!.querySelectorAll('tbody tr')].map((row) => [...row.querySelectorAll('td')]);
}

describe('issue #38 cuDNN graph and attention contracts', () => {
  it.each(units)('static: $id keeps independently specified prerequisites and evidence-neutral Publication Pairs', async (unit) => {
    expect(PUBLISHED_DESTINATIONS[unit.id].prerequisites).toEqual(unit.prerequisites);
    expect(RESOURCE_INDEX_RECORDS.filter((record) => record.planningId === unit.practice)).toHaveLength(1);
    expect(RESOURCE_INDEX_RECORDS.find((record) => record.planningId === unit.practice)).toMatchObject({
      group: 'practice', prerequisites: [unit.id], reviewedOn,
    });
    for (const suffix of ['', '/exercises', '/solutions']) {
      const pages = await Promise.all(locales.map((locale) => source(`${locale}${unit.slug}${suffix}${suffix ? '.md' : '.mdx'}`)));
      const id = unit.id + suffix.replace('/', '-').toUpperCase();
      const prerequisites = suffix === '/exercises' ? [unit.id] : suffix === '/solutions' ? [`${unit.id}-EXERCISES`] : unit.prerequisites;
      const kind = suffix === '/exercises' ? 'exercise-set' : suffix === '/solutions' ? 'solution-set' : 'learning-unit';
      for (const field of ['pairId', 'structure', 'resourceKind', 'unitId', 'prerequisites', 'relatedUnits', 'sources', 'factCheckDate', 'evidence']) {
        expect(pages[0].metadata[field], `${id}: ${field}`).toEqual(pages[1].metadata[field]);
      }
      for (const [index, page] of pages.entries()) {
        const m = page.metadata;
        const counterpart = `/${locales[1 - index]}${unit.slug}${suffix}/`;
        expect(m).toMatchObject({
          pairId: id.toLowerCase(), unitId: id, prerequisites, resourceKind: kind, counterpart,
          factCheckDate: reviewedOn, evidence: emptyEvidence, hardwareGate: 'none', license: 'CC-BY-4.0', provenance: 'original',
        });
        expect(m.toolkitLanes ?? []).toEqual([]);
        expect(m.canonicalExample).toBeUndefined();
        expect(m.exampleIds ?? []).toEqual([]);
        if (!suffix) expect(m.relatedUnits).toEqual(unit.related);
        const head = Object.fromEntries(m.head.map((entry: { attrs: { name: string; content: string } }) => [entry.attrs.name, entry.attrs.content]));
        expect(head).toMatchObject({
          'cuda:pair-id': id.toLowerCase(), 'cuda:unit-id': id, 'cuda:resource-kind': kind,
          'cuda:counterpart': counterpart, 'cuda:prerequisites': prerequisites.join(','),
          'cuda:fact-check-date': reviewedOn, 'cuda:hardware-gate': 'none',
          'cuda:license': 'CC-BY-4.0', 'cuda:provenance': 'original', 'cuda:structure': m.structure.join(','),
          'cuda:evidence-compilation': 'none', 'cuda:evidence-runtime': 'none',
          'cuda:expected-observations': 'none', 'cuda:recorded-observations': 'none',
        });
        if (!suffix) expect(head['cuda:related-units']).toBe(unit.related.join(','));
        for (const record of m.sources ?? []) expect(record.accessDate).toBe(reviewedOn);
        if (m.sources) {
          expect(head['cuda:source-count']).toBe(String(m.sources.length));
          expect(head['cuda:source-versions'].match(/\d+\.\d+\.\d+/g)).toEqual(['9.24.0', '1.27.0']);
        }
        // These are original static worksheets, not copied sample listings or visual implementations.
        expect(page.raw).not.toMatch(/^import\s|```|data-canonical-example|<canvas\b|<svg\b|<iframe\b/m);
      }
      const sources = pages[0].metadata.sources;
      if (!suffix) {
        expect(sources).toEqual(expect.arrayContaining([
          expect.objectContaining({ url: `${backend}release-notes.html#cudnn-9-24-0`, version: expect.stringContaining('9.24.0') }),
          expect.objectContaining({ url: release, version: expect.stringContaining(`1.27.0; ${commit}`) }),
        ]));
      }
    }
  });

  it.each(units)('$id renders matching metadata, technical tables, owner links, and three separately answered exercises', async (unit) => {
    for (const suffix of ['', '/exercises', '/solutions']) {
      const documents = await Promise.all(locales.map((locale) => readRoute(`${locale}${unit.slug}${suffix}`)));
      for (const [index, document] of documents.entries()) {
        const { metadata: m } = await source(`${locales[index]}${unit.slug}${suffix}${suffix ? '.md' : '.mdx'}`);
        for (const entry of m.head) {
          const metas = document.querySelectorAll(`meta[name="${entry.attrs.name}"]`);
          expect(metas, entry.attrs.name).toHaveLength(1);
          expect(metas[0]?.getAttribute('content')).toBe(entry.attrs.content);
        }
        const main = document.querySelector('main')!;
        expect(main).not.toBeNull();
        expect(text(main), `${unit.id}${suffix}: rendered emphasis`).not.toContain('**');
        expect(main.querySelector('pre, [data-canonical-example], [data-visual-id], attention-io-explorer, astro-island')).toBeNull();
        const counterpart = document.querySelector('[data-locale-counterpart]');
        expect(counterpart?.getAttribute('href')).toBe(m.counterpart);
        expect(counterpart?.getAttribute('lang')).toBe(index === 0 ? 'en' : 'zh-CN');
        if (index === 1) expect(text(counterpart)).toBe('阅读中文对应页');
        expect(main.querySelector(`a[href="/${locales[index]}practice/#${unit.practice.toLowerCase()}"]`)).not.toBeNull();
        for (const id of ['071', '072']) {
          expect(main.querySelector(`a[href="/${locales[index]}sources-and-versions/#src-cuda-${id}"]`)).not.toBeNull();
        }
        const headings = [...main.querySelectorAll('h2')];
        expect(headings).toHaveLength(m.structure.length);
        if (!suffix) {
          for (const prerequisite of unit.prerequisites) {
            const href = PUBLISHED_DESTINATIONS[prerequisite].href[index === 0 ? 'zh-CN' : 'en'];
            expect(main.querySelector(`a[href="${href}"]`), prerequisite).not.toBeNull();
          }
          expect(section(document, /^Retrieval check|^检索(?:检查|练习)/).querySelectorAll('ol > li')).toHaveLength(5);
        } else {
          const exercise = suffix === '/exercises';
          const pattern = exercise ? /^(?:Exercise [1-3]:|练习(?: [1-3]|[一二三])：)/ : /^(?:Solution [1-3]:|解答(?: [1-3]|[一二三])：)/;
          expect(headings.filter((heading) => pattern.test(text(heading)))).toHaveLength(3);
          expect(main.querySelectorAll('details')).toHaveLength(exercise ? 6 : 0);
          expect(main.querySelector(`a[href="/${locales[index]}${unit.slug}/${exercise ? 'solutions' : 'exercises'}/"]`)).not.toBeNull();
          for (let n = 1; n <= 3; n++) {
            const item = section(document, new RegExp(`^(?:${exercise ? 'Exercise' : 'Solution'} ${n}:|${exercise ? '练习' : '解答'}(?: ${n}|${'一二三'[n - 1]})：)`));
            expect(text(item).length).toBeGreaterThan(150);
            if (!exercise) continue;
            for (const label of [/Goal|目标/, /Constraints|约束/, /Expected evidence|预期提交证据|应提交证据/, /Acceptance criteria|验收标准|验收条件/]) {
              expect([...item.querySelectorAll('strong')].some((node) => label.test(text(node))), String(label)).toBe(true);
            }
            expect(item.querySelectorAll('details')).toHaveLength(2);
            for (const hint of item.querySelectorAll('details')) {
              expect(hint.hasAttribute('open')).toBe(false);
              expect(hint.querySelectorAll('summary')).toHaveLength(1);
              expect([...hint.childNodes].filter((node) => node.nodeName !== 'SUMMARY').map(text).join('').length).toBeGreaterThan(20);
            }
          }
        }
      }
      const tableCode = documents.map((document) => [...document.querySelectorAll('main table')]
        .map((table) => [...table.querySelectorAll('tr')].map(codes)));
      expect(tableCode[0], `${unit.id}${suffix}: paired table code`).toEqual(tableCode[1]);
      const links = documents.map((document) => externalLinks(document.querySelector('main')!));
      expect(links[0], `${unit.id}${suffix}: exact external links`).toEqual(links[1]);
      for (const href of links[0].filter((href) => href.startsWith('https://github.com/NVIDIA/cudnn-frontend/blob/'))) {
        expect(href.startsWith(owner), href).toBe(true);
      }
    }
  });

  it.each(locales)('audits L10 candidate amounts and decisions without promoting C4 to success (%s)', async (locale) => {
    const document = await readRoute(`${locale}${units[0].slug}`);
    const audit = section(document, /^Audit a hypothetical|^审查一份假设/);
    const candidates = rows(audit, /^C0$/);
    const headers = [...candidates[0][0].closest('table')!.querySelectorAll('th')].slice(1, 4).map(text);
    expect(headers).toEqual(locale ? ['Backend MiB', 'Frontend MiB', 'Total MiB'] : ['后端 MiB', '前端 MiB', '总计 MiB']);
    // Independent worksheet inputs, not copied from registration or derived from the rendered values.
    const expected = [['C0', 2, 2, 4], ['C1', 9, 2, 11], ['C2', 7, 2, 9], ['C3', 4, 2, 6], ['C4', 5, 2, 7]];
    expect(candidates.map((cells) => [text(cells[0]), ...cells.slice(1, 4).map((cell) => Number(text(cell)))])).toEqual(expected);
    expect(text(audit)).toMatch(/8 MiB.*8 MiB.*6 MiB/);
    const decisions = [
      /Exclude by numerical policy|按数值策略排除/,
      /Exclude by backend cap.*over total budget|超过后端上限.*超过总预算/,
      /Backend cap passes, total budget fails|通过后端上限.*超过总预算/,
      /no executable plan from this attempt|这次尝试没有得到可执行计划/,
      /Fits budget, exceeds allocation.*further investigation|符合预算.*超过实际分配.*继续调查/,
    ];
    candidates.forEach((cells, index) => expect(text(cells[5])).toMatch(decisions[index]));
    expect(text(candidates[0][4])).toBe('NONDETERMINISTIC');
    expect(text(candidates[3][4])).toMatch(/support acceptance, then build failure|支持检查可接受，随后构建失败/);
    expect(text(candidates[4][4])).toMatch(/support\/build not yet attempted|尚未尝试支持检查和构建/);
    expect(text(audit)).toMatch(/C4 is not an observed success|C4 不是已观察到的成功/);
    expect(text(audit)).toMatch(/If no candidates remain.*FALLBACK under the same policy|若没有候选留下.*相同策略下尝试 FALLBACK/);
    const exercise = await readRoute(`${locale}${units[0].slug}/exercises`);
    expect(rows(exercise, /^C0$/).map((cells) => [text(cells[0]), ...cells.slice(1, 4).map((cell) => Number(text(cell)))])).toEqual(expected);
    const solution = await readRoute(`${locale}${units[0].slug}/solutions`);
    expect(rows(solution, /^C0$/).map((cells) => codes(cells[1]))).toEqual([
      ['2 + 2 = 4'], ['9 + 2 = 11'], ['7 + 2 = 9'], ['4 + 2 = 6'], ['5 + 2 = 7'],
    ]);
    const lifecycle = rows(document, /^validate$/);
    expect(lifecycle.map((cells) => codes(cells[0]))).toEqual([
      ['validate'], ['build_operation_graph'], ['create_execution_plans'], [], ['check_support'], ['build_plans'],
    ]);
    expect(text(lifecycle[2][1])).toMatch(/discovery and property queries|发现启发式引擎配置并查询属性/);
    expect(text(lifecycle[2][2])).toMatch(/Despite the name.*plan builds|尚未完成计划构建/);
    expect(text(lifecycle[4][1])).toMatch(/At least one acceptable configuration|至少存在一个可接受配置/);
    expect(text(lifecycle[4][2])).toMatch(/every candidate.*guaranteed later build success|每个候选都受支持.*构建必定成功/);
  });

  it.each(locales)('checks the two practice records at their own policy and dispatch boundaries (%s)', async (locale) => {
    const document = await readRoute(`${locale}practice`);
    for (const unit of units) {
      const entry = section(document, new RegExp(`^${unit.practice}[:：]`));
      expect(codes(entry)).toContain(`[${unit.id}]`);
      expect(entry.querySelector(`a[href="/${locale}${unit.slug}/"]`)).not.toBeNull();
      expect(entry.querySelectorAll('details')).toHaveLength(3);
      const details = [...entry.querySelectorAll('details')];
      details.forEach((detail) => expect(detail.hasAttribute('open')).toBe(false));
      expect(text(details[0].querySelector('summary'))).toMatch(/^(Hint|提示) 1/);
      expect(text(details[1].querySelector('summary'))).toMatch(/^(Hint|提示) 2/);
      expect(text(details[2].querySelector('summary'))).toMatch(/^Separate reviewed solution|^独立参考解答/);
      expect(text(entry)).toContain(reviewedOn);
      expect(codes(entry)).toContain(commit);
    }
    const graph = section(document, /^PB-R4-011[:：]/);
    const candidates = rows(graph, /^P$/);
    candidates.forEach((cells) => cells.slice(2, 4).forEach((cell) => expect(text(cell)).toMatch(/^\d+ MiB$/)));
    expect(candidates.map((cells) => [text(cells[0]), Number.parseInt(text(cells[2])), Number.parseInt(text(cells[3]))])).toEqual([
      ['P', 1, 1], ['Q', 2, 1], ['R', 6, 1], ['S', 3, 1], ['T', 4, 1],
    ]);
    expect(candidates.slice(0, 2).map((cells) => text(cells[1]))).toEqual(['NONDETERMINISTIC', 'DOWN_CONVERT_INPUTS']);
    expect(candidates.slice(2).map((cells) => text(cells[4]))).toEqual(locale ? ['Succeeds', 'Fails', 'Succeeds'] : ['成功', '失败', '成功']);
    const answer = [...graph.querySelectorAll('details')][2];
    expect(codes(answer)).toEqual(expect.arrayContaining(['6+1=7 MiB', '3+1=4 MiB', '4+1=5 MiB', 'HEURISTICS_CHOICE', 'ALL', 'check_support']));
    expect(text(answer)).toMatch(/T.*sole provisional admissible row|T.*唯一暂时可接受项/);
    expect(text(answer)).toMatch(/do not assume the library automatically continues to T|不能假设库会在应用拒绝后自动继续到 T/);
    const attention = section(document, /^PB-R4-012[:：]/);
    const records = rows(attention, /^A$/);
    expect(records.map((cells) => text(cells[0]))).toEqual(['A', 'B', 'C', 'D']);
    expect(codes(records[1][1])).toEqual(['[proposal X, backend Y]', 'NotImplementedError']);
    expect(codes(records[2][1])).toEqual(['select_plan(0)']);
    expect(text(records[3][1]).match(/\d+ MiB/g)).toEqual(['9 MiB', '3 MiB', '4 MiB']);
    const dispatchAnswer = text([...attention.querySelectorAll('details')][2]);
    expect(dispatchAnswer).toMatch(/9 MiB fails and 3 MiB passes only the budget test|9 MiB 失败，3 MiB 只通过预算检查/);
    expect(dispatchAnswer).toMatch(/C must report the pinned decline, not conceal a switch|C 必须报告固定项拒绝，不能隐藏切换/);
    const counterpart = await readRoute(`${locale ? '' : 'en/'}practice`);
    for (const id of ['011', '012']) {
      const pair = [document, counterpart].map((page) => section(page, new RegExp(`^PB-R4-${id}[:：]`)));
      expect(externalLinks(pair[0])).toEqual(externalLinks(pair[1]));
      expect([...pair[0].querySelectorAll('tr')].map(codes)).toEqual([...pair[1].querySelectorAll('tr')].map(codes));
    }
  });

  it.each(locales)('derives L11 tensor capacities and catches an in-bounds but wrong stride mapping (%s)', async (locale) => {
    const main = await readRoute(`${locale}${units[1].slug}`);
    const descriptor = section(main, /^Work the descriptor|^先推导描述符/);
    const elements = 1 * 2 * 128 * 64;
    expect(codes(descriptor)).toEqual(expect.arrayContaining(['[1,2,128,64]', `[${elements},${elements / 2},64,1]`, '[16384,64,128,1]']));
    expect(rows(descriptor, /^Element offset|^元素偏移/).map((cells) => codes(cells[1]))).toEqual([
      ['b*16384 + h*8192 + s*64 + d'], ['(0,1,127,63)', `8192+8128+63=${elements - 1}`],
      [`1*2*128*64=${elements}`], [`${elements}*2=${elements * 2} B`], ['[32768,16384,128,2]'],
      [`${elements * 2 - 2}..${elements * 2 - 1}`], [`4*${elements * 2}=${4 * elements * 2} B`], ['1/sqrt(64)=1/8=0.125'],
    ]);
    const solution = await readRoute(`${locale}${units[1].slug}/solutions`);
    const derivation = section(solution, /^Solution 1:|^解答一：/);
    const doubled = 1 * 2 * 128 * 128;
    expect(codes(derivation)).toContain('[32768,16384,128,1]');
    const values = rows(derivation, /^Byte strides|^真实 BF16/).map((cells) => codes(cells[1]));
    expect(values.slice(0, 6)).toEqual([
      ['[65536,32768,256,2]'], [`1*2*128*128=${doubled}`], [`${doubled}*2=${doubled * 2} B`],
      [`4*${doubled * 2}=${4 * doubled * 2} B`], ['(0,1,127,127)', `16384+16256+127=${doubled - 1}`],
      [`${doubled * 2 - 2}..${doubled * 2 - 1}`],
    ]);
    expect(values[6][0]).toBe('1/sqrt(128)=1/(8*sqrt(2))');
    expect(Number(values[6][1])).toBeCloseTo(1 / Math.sqrt(128), 15);
    expect(values.slice(7)).toEqual([['16384', '32768'], ['128', '256']]);
    expect(codes(derivation)).toContain(`128+127*256+127=${doubled - 1}`);
    expect(text(derivation)).toMatch(/same last-offset extent check.*does not make the two mappings equal|相同的最后偏移范围检查.*不会使两种映射相等/);
    expect(text(derivation)).toMatch(/no Stats output.*no Stats output allocation\/binding|不请求 Stats 输出.*不应加入 Stats 输出分配或绑定/);
    expect(codes(derivation)).toEqual(expect.arrayContaining(['[B,H,S,D]', 'K^T', 'generate_stats=false']));
  });

  it.each(locales)('keeps representation, dtype eligibility, and strict versus unpinned routing distinct (%s)', async (locale) => {
    const document = await readRoute(`${locale}${units[1].slug}`);
    const dtype = text(document.querySelector(`main a[href="${owner}include/cudnn_frontend/node/sdpa_support_surface.h#L435-L481"]`)?.closest('p'));
    expect(dtype).toMatch(/exclude FLOAT from UNIFIED.*allow FLOAT on COMPOSITE|将 FLOAT 排除在 UNIFIED.*COMPOSITE 允许 FLOAT/);
    expect(dtype).toMatch(/compiled and loaded backend versions at least 9\.13\.1|编译时与加载的后端版本均至少为 9\.13\.1/);
    expect(dtype).toMatch(/FP64 rejection for COMPOSITE|COMPOSITE 拒绝 FP64/);
    expect(dtype).toMatch(/skips if no supporting engine exists|没有支持引擎时会跳过/);
    expect(dtype).toMatch(/does not mean every cuDNN SDPA representation rejects FP32|不等于所有 cuDNN SDPA 表示都拒绝 FP32/);
    expect(dtype).toMatch(/Dtype acceptance still does not prove a plan exists|类型获准仍不证明存在计划/);
    expect(document.querySelector(`main a[href="${owner}test/python/test_sdpa_fp32_rejected.py#L87-L143"]`)).not.toBeNull();
    const auto = text(document.querySelector(`main a[href="${owner}include/cudnn_frontend/graph_properties.h#L2298-L2312"]`)?.closest('p'));
    expect(auto).toMatch(/first checks UNIFIED feature support, then COMPOSITE|先检查 UNIFIED 的特性支持，再检查 COMPOSITE/);
    expect(auto).toMatch(/AUTO is not a benchmark|AUTO 不是基准测试/);
    const routing = rows(section(document, /^Backend plans and Python|^后端计划与 Python/), /^router\.py:41-77/);
    expect(codes(routing[0][1])).toContain('engine_id');
    expect(codes(routing[1][0])).toEqual(['_pygraph.py:1346-1403', 'NotImplementedError', 'cudnnGraphNotSupportedError']);
    expect(text(routing[1][1])).toMatch(/not permission to swallow arbitrary failures|不允许吞掉任意失败/);
    expect(text(routing[2][1])).toMatch(/pinned decline raises rather than silently falling through|已固定候选拒绝时抛错，不静默尝试后项/);
    const dispatch = rows(section(document, /^A constructed dispatch|^构造的分派/), /^Pre-SM80|^SM80 之前/);
    expect(dispatch).toHaveLength(9);
    expect(text(dispatch[2][1])).toMatch(/UNIFIED rejects FLOAT; COMPOSITE\/AUTO may allow it, subject to engine support|UNIFIED 拒绝 FLOAT；COMPOSITE\/AUTO 可能允许，但仍受引擎支持约束/);
    expect(text(dispatch[7][1])).toMatch(/Raise instead of silently trying another plan|抛错，而非静默尝试其他计划/);
    expect(text(dispatch[8][2])).toMatch(/execution completion.*numerical acceptance remain missing|执行完成和数值验收/);
  });

  it.each(locales)('bounds the forward subset, architecture gates, current issues, and Developer Preview (%s)', async (locale) => {
    const document = await readRoute(`${locale}${units[1].slug}`);
    const contract = section(document, /^Freeze a narrow|^固定一个狭窄/);
    const fields = rows(contract, /^Heads and lengths|^头数与长度/);
    expect(fields).toHaveLength(7);
    expect(text(fields[0][1])).toMatch(/Equal Q\/K\/V head counts.*equal.*S > 1.*no decode|Q\/K\/V 头数相等.*长度相等且 S > 1.*不包含解码/);
    expect(text(fields[1][1]).match(/\d+/g)).toEqual(['64', '128']);
    expect(text(fields[2][1])).toMatch(/All Q\/K\/V\/O genuinely FP16, or all genuinely BF16|Q\/K\/V\/O 全部真实存为 FP16，或全部真实存为 BF16/);
    expect(text(fields[3][1])).toMatch(/FP32 compute and intermediate|FP32 计算与中间/);
    expect(codes(fields[5][1])).toEqual(['generate_stats=false']);
    expect(text(fields[6][1])).toMatch(/No mask, bias, dropout, paging, ragged offsets, backward, FP8, or dynamic shape overrides|不含掩码.*偏置.*dropout.*分页.*不规则偏移.*反向.*FP8 或动态形状覆盖/);
    expect(text(contract)).toMatch(/rejects pre-SM80 SDPA|拒绝 SM80 之前的 SDPA/);
    expect(text(contract)).toMatch(/does not admit this attention path on SM75|不使这条注意力路径能在 SM75 上使用/);
    const hardware = text(document.querySelector(`main a[href="${owner}include/cudnn_frontend/experimental/sm100_sdpa_prefill_engine.h#L36-L41"]`)?.closest('p'));
    expect(hardware).toMatch(/SM100 exactly.*not all Blackwell GPUs or SM103|恰好 SM100.*不涵盖全部 Blackwell GPU 或 SM103/);
    const issues = section(document, /^Keep known issues|^限定已知问题/);
    const issueRows = rows(issues, /^SDPA decode|^SDPA 解码/);
    expect(issueRows).toHaveLength(2);
    expect(text(issueRows[0][0])).toMatch(/decode with a causal mask and unequal Q versus K\/V head counts.*NaNs|解码同时使用因果掩码.*不相等的 Q 与 K\/V 头数.*NaN/);
    expect(text(issueRows[1][0])).toMatch(/backward with K\/V sequence length one is unsupported|K\/V 序列长度为一的 SDPA 反向不受支持/);
    const previewParagraph = text(issues.querySelector(`a[href="${preview}"]`)?.closest('p'));
    expect(previewParagraph).toMatch(/Developer Preview.*not GA|Developer Preview.*不是正式发布（GA）/);
    expect(previewParagraph).toMatch(/Neither enters this 9\.24 forward contract|两者均不进入本单元的 9\.24 前向契约/);
    for (const file of ['node/sdpa_support_surface.h#L515-L520', 'node/scaled_dot_product_flash_attention.h#L1613']) {
      expect(issues.querySelector(`a[href="${owner}include/cudnn_frontend/${file}"]`)).not.toBeNull();
    }
    const stale = text(document.querySelector(`main a[href="${owner}docs/operations/Attention.md#L16"]`)?.closest('p'));
    expect(stale).toMatch(/still labels itself backend 9\.18\.1|仍标注 backend 9\.18\.1/);
    expect(stale).toMatch(/not authority to apply that older matrix to all of 9\.24\.0|不能作为将旧矩阵应用到全部 9\.24\.0 的依据/);
  });

  it('static: retains independent reference-only component pins, without installation or evidence upgrades', async () => {
    const manifest = JSON.parse(await readFile(path.join(root, 'src/current-publication-manifest.json'), 'utf8'));
    expect(manifest.compatibility.componentBoundaries.cudnn).toMatchObject({
      version: '9.24.0', selection: 'independent-reference-only', reviewedOn, compileCheckedToolkitLanes: [],
    });
    expect(manifest.compatibility.componentBoundaries.cudnnFrontend).toMatchObject({
      version: '1.27.0', commit, releasedOn: '2026-08-06', selection: 'independent-reference-only', reviewedOn, compileCheckedToolkitLanes: [],
    });
    expect(manifest.evidence.r4EvidenceNeutralLearningUnits).toEqual(expect.arrayContaining(['L10', 'L11']));
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some((name) => /cudnn/i.test(name))).toBe(false);
    for (const file of ['CONTENT_LICENSES.md', 'THIRD_PARTY_NOTICES.md']) {
      const content = await readFile(path.join(root, file), 'utf8');
      const review = content.match(/## cuDNN[^\n]*\n([\s\S]*?)(?=\n## |$)/)?.[1] ?? '';
      expect(review).toContain(commit);
      expect(review).toContain('Apache-2.0 AND MIT');
      expect(review).toContain(`${backend}reference/eula.html`);
      expect(review).toMatch(/20[- ]file|all 20 inspected paths/);
      expect(review).toMatch(/No .*copied, adapted, bundled, or installed|no source, sample, test, diagram, or result is copied or adapted/);
    }
  });

  it.each(locales)('retains all twenty exact file licenses/years and separate backend SDK terms (%s)', async (locale) => {
    const document = await readRoute(`${locale}sources-and-versions`);
    const frontend = section(document, /^SRC-CUDA-072[:：]/);
    const architecture = text(frontend.querySelector(`a[href="${owner}include/cudnn_frontend/graph_interface.h#L515-L526"]`)?.closest('td'));
    expect(architecture).toMatch(/specific C\+\+ SM100 SDPA prefill engine|指定的 C\+\+ SM100 SDPA prefill 引擎/);
    expect(architecture).toMatch(/not a restriction on every OPENSOURCE engine|不是全部 OPENSOURCE 引擎的限制/);
    expect(architecture).toContain('SM90');
    // Exact reviewed files and SPDX years, independent of a repository badge or aggregate count.
    const expected = [
      ['include/cudnn_frontend.h', 'Apache-2.0', '2021'],
      ['include/cudnn_frontend_version.h', 'Apache-2.0', '2026'],
      ['include/cudnn_frontend/graph_interface.h', 'Apache-2.0', '2023'],
      ['include/cudnn_frontend/graph_properties.h', 'MIT', '2023'],
      ['include/cudnn_frontend/plans.h', 'Apache-2.0', '2023'],
      ['include/cudnn_frontend/node/scaled_dot_product_flash_attention.h', 'Apache-2.0', '2023'],
      ['include/cudnn_frontend/node/sdpa_support_surface.h', 'Apache-2.0', '2025'],
      ['include/cudnn_frontend/experimental/sm100_sdpa_prefill_engine.h', 'Apache-2.0', '2025'],
      ['samples/cpp/sdpa/fp16_fwd.cpp', 'MIT', '2023'],
      ['samples/cpp/sdpa/fp16_cached.cpp', 'MIT', '2023'],
      ['samples/cpp/misc/serialization.cpp', 'MIT', '2024'],
      ['samples/cpp/utils/helpers.h', 'Apache-2.0', '2024'],
      ['test/cpp/serialize.cpp', 'Apache-2.0', '2023'],
      ['test/python/test_mhas.py', 'Apache-2.0', '2024'],
      ['test/python/test_sdpa_fp32_rejected.py', 'Apache-2.0', '2026'],
      ['test/python/fe_api/sdpa/test_sdpa_fwd.py', 'Apache-2.0', '2026'],
      ['python/cudnn/engines/router.py', 'Apache-2.0', '2026'],
      ['python/cudnn/_pygraph.py', 'Apache-2.0', '2026'],
      ['test/python/test_engine_router.py', 'Apache-2.0', '2026'],
      ['CMakeLists.txt', 'MIT', '2021'],
    ];
    const ledger = rows(frontend, /^include\/cudnn_frontend\.h$/);
    expect(ledger.map((cells) => [cells[0].querySelector('a')?.getAttribute('href'), text(cells[1]), text(cells[2])]))
      .toEqual(expected.map(([file, license, year]) => [owner + file, license, year]));
    expect(text(frontend)).toContain('NVIDIA CORPORATION & AFFILIATES');
    for (const file of ['LICENSING.md', 'LICENSE.txt', 'LICENSE-MIT.txt', 'NOTICE', 'THIRD_PARTY_LICENSES.txt']) {
      expect(frontend.querySelector(`a[href="${owner}${file}"]`)).not.toBeNull();
    }
    expect(frontend.querySelector(`a[href="${release}"]`)).not.toBeNull();
    expect(codes(frontend)).toContain(commit);
    expect(text(frontend)).toMatch(/No implementation, sample, test, diagram, binary, or substantial prose is copied or adapted|没有复制或改编实现、样例、测试、图示、二进制或大段文字/);
    const backendRecord = section(document, /^SRC-CUDA-071[:：]/);
    for (const url of [`${backend}release-notes.html#cudnn-9-24-0`, `${backend}reference/support-matrix.html`, `${backend}reference/eula.html`, preview]) {
      expect(backendRecord.querySelector(`a[href="${url}"]`)).not.toBeNull();
    }
    const software = rows(backendRecord, /^CUDA 12\.x/)[1][1];
    expect(text(software)).toMatch(/13\.0-13\.3.*580\.65\.06.*13\.3/);
    expect(text(software)).toMatch(/not Compile-Checked Toolkit Lanes|不是编译已检查/);
    const counterpart = await readRoute(`${locale ? '' : 'en/'}sources-and-versions`);
    for (const id of ['071', '072']) {
      const pair = [document, counterpart].map((page) => section(page, new RegExp(`^SRC-CUDA-${id}[:：]`)));
      expect(externalLinks(pair[0])).toEqual(externalLinks(pair[1]));
      expect([...pair[0].querySelectorAll('tr')].map(codes)).toEqual([...pair[1].querySelectorAll('tr')].map(codes));
    }
  });

  it('static: preserves VIS18 original software/composition attribution', async () => {
    const licenses = await readFile(path.join(root, 'CONTENT_LICENSES.md'), 'utf8');
    const attribution = licenses.split('\n\n').find((paragraph) => paragraph.startsWith('Issue #30 A10/A11')) ?? '';
    expect(attribution).toMatch(/VIS18's component, pure model, copy data, CSS, and tests are original Apache-2\.0 software/);
    expect(attribution).toMatch(/inline SVG and static ledger are original CC BY 4\.0 instructional compositions/);
    expect(attribution).toMatch(/not copied, traced, or adapted paper figures/);
  });

  it.each(locales)('links VIS18 without cloning it or changing four-byte IO accounting into cuDNN evidence (%s)', async (locale) => {
    const document = await readRoute(`${locale}${units[1].slug}`);
    const reuse = section(document, /^Reuse VIS18|^复用 VIS18/);
    expect(reuse.querySelector(`a[href="/${locale}visuals/attention-memory-traffic/"]`)).not.toBeNull();
    expect(reuse.querySelector('[data-visual-id], attention-io-explorer, astro-island, canvas, svg, iframe')).toBeNull();
    const n = 8, d = 4, queryTiles = Math.ceil(n / 4);
    const materialized = 4 * n * d + 6 * n * n;
    const tiled = 2 * n * d + 2 * queryTiles * n * d;
    expect(text(reuse)).toContain(`${materialized} elements = ${materialized * 4} B`);
    expect(text(reuse)).toContain(`${tiled} elements = ${tiled * 4} B`);
    expect(text(reuse)).toContain(`${(materialized - tiled) * 4} B`);
    expect(text(reuse)).toMatch(/4 bytes per logical element|每个逻辑元素 4 字节/);
    expect(text(reuse)).toMatch(/does not authorize halving VIS18['\u2019]s totals|不允许把 VIS18 总数减半/);
    expect(text(reuse)).toMatch(/ledger is not cuDNN traffic|该账本不是 cuDNN 流量/);
    const visualPage = await readRoute(`${locale}visuals/attention-memory-traffic`);
    const visual = visualPage.querySelector('[data-visual-id="VIS18"]');
    expect(visual).not.toBeNull();
    for (const [attribute, value] of [
      ['data-sequence-shape', '8x4'], ['data-tile-shape', '4x4'],
      ['data-materialized-bytes', String(materialized * 4)], ['data-tiled-bytes', String(tiled * 4)],
      ['data-analysis-difference-bytes', String((materialized - tiled) * 4)], ['data-evidence-status-effect', 'none'],
    ]) expect(visual?.getAttribute(attribute), attribute).toBe(value);
    expect(visual?.querySelector('[data-backend], [data-measured], [data-timing], [data-speedup]')).toBeNull();
  });
});
