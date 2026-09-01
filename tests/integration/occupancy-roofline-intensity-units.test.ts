// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const docsRoot = path.resolve(import.meta.dirname, '../../src/content/docs');
const reviewDate = '2026-09-01';

const units = [
  {
    id: 'Q09',
    pairId: 'q09',
    section: 'correctness',
    slug: 'occupancy-stalls-throughput',
    prerequisites: ['Q08', 'F08'],
    related: ['Q10', 'LAB09', 'VIS13'],
    practiceId: 'PB-R3-004',
  },
  {
    id: 'Q10',
    pairId: 'q10',
    section: 'correctness',
    slug: 'roofline-arithmetic-intensity',
    prerequisites: ['Q05', 'A14'],
    related: ['Q09', 'LAB09', 'VIS13'],
    practiceId: 'PB-R3-005',
  },
  {
    id: 'A14',
    pairId: 'a14',
    section: 'algorithms',
    slug: 'algorithm-choice-arithmetic-intensity',
    prerequisites: ['A01', 'A02', 'A05', 'A08'],
    related: ['Q10', 'EX02', 'EX11', 'EX14', 'EX15', 'VIS13'],
    practiceId: 'PB-R3-006',
  },
] as const;

function frontmatter(source: string) {
  return /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
}

function body(source: string) {
  return /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(source)?.[1] ?? '';
}

function yamlList(metadata: string, field: string) {
  const match = new RegExp(`^${field}:\\n((?:  - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function sourceCoordinates(metadata: string) {
  return [...metadata.matchAll(/^\s+- title: '([^']+)'\n\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm)]
    .map(([, title, url, version, platform, accessDate]) => ({ title, url, version, platform, accessDate }));
}

function retrievalQuestions(content: string) {
  const section = /## (?:离开前检查|Retrieval check)\n\n([\s\S]*?)(?=\n## )/.exec(content)?.[1] ?? '';
  return section.match(/^\d+\. /gm) ?? [];
}

async function readPage(unit: (typeof units)[number], locale: '' | 'en/', child?: 'exercises' | 'solutions') {
  const suffix = child ? `/${child}.md` : '.mdx';
  return readFile(path.join(docsRoot, `${locale}${unit.section}/${unit.slug}${suffix}`), 'utf8');
}

describe('Q09, Q10, and A14 occupancy and arithmetic-intensity units', () => {
  it.each(units)('publishes an aligned evidence-neutral $id Publication Pair', async (unit) => {
    const [zh, en] = await Promise.all([readPage(unit, ''), readPage(unit, 'en/')]);
    const zhMetadata = frontmatter(zh);
    const enMetadata = frontmatter(en);

    for (const [source, counterpart, language] of [
      [zh, `/en/${unit.section}/${unit.slug}/`, 'en'],
      [en, `/${unit.section}/${unit.slug}/`, 'zh-CN'],
    ] as const) {
      const metadata = frontmatter(source);
      const content = body(source);
      const localePrefix = language === 'en' ? '' : '/en';
      const localizedExerciseRoute = `${localePrefix}/${unit.section}/${unit.slug}/exercises/`;
      const localizedSolutionRoute = localizedExerciseRoute.replace('/exercises/', '/solutions/');

      expect(metadata).toContain(`pairId: ${unit.pairId}`);
      expect(metadata).toContain(`unitId: ${unit.id}`);
      expect(metadata).toContain('resourceKind: learning-unit');
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'prerequisites')).toEqual(unit.prerequisites);
      expect(yamlList(metadata, 'relatedUnits')).toEqual(unit.related);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(metadata).toContain(`attrs: { name: 'cuda:counterpart', content: '${counterpart}' }`);
      expect(metadata).toContain(`attrs: { name: 'cuda:fact-check-date', content: '${reviewDate}' }`);
      expect(metadata).toContain(`attrs: { name: 'cuda:prerequisites', content: '${unit.prerequisites.join(',')}' }`);
      expect(metadata).toContain(`attrs: { name: 'cuda:related-units', content: '${unit.related.join(',')}' }`);
      expect(metadata).toMatch(/attrs: \{ name: 'cuda:evidence-compilation', content: none \}[\s\S]*attrs: \{ name: 'cuda:evidence-runtime', content: none \}[\s\S]*attrs: \{ name: 'cuda:expected-observations', content: none \}[\s\S]*attrs: \{ name: 'cuda:recorded-observations', content: none \}/);
      expect(content.trimStart()).toMatch(new RegExp(`^<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`));
      expect(retrievalQuestions(content)).toHaveLength(5);
      expect(content).toContain(localizedExerciseRoute);
      expect(content).toContain(localizedSolutionRoute);
      expect(content).toContain(unit.practiceId);
      expect(content).not.toMatch(/Runtime-Verified|Compile-Checked|Community-Observed|Pending Hardware Verification|运行已验证|编译已检查|社区已观察|待硬件验证/);
      expect(content).not.toMatch(/\b(?:A100|H100|B100|GB200|RTX\s*\d+)\b/);

      const coordinates = sourceCoordinates(metadata);
      expect(coordinates.length).toBeGreaterThan(0);
      expect(coordinates.every(({ accessDate }) => accessDate === reviewDate)).toBe(true);
      for (const { url } of coordinates) expect(content).toContain(`](${url})`);
    }

    expect(yamlList(zhMetadata, 'structure')).toEqual(yamlList(enMetadata, 'structure'));
    expect(sourceCoordinates(zhMetadata)).toEqual(sourceCoordinates(enMetadata));
  });

  it.each(units)('publishes exactly three layered $id Exercises and three reviewed solutions', async (unit) => {
    const pages = await Promise.all([
      readPage(unit, '', 'exercises'),
      readPage(unit, 'en/', 'exercises'),
      readPage(unit, '', 'solutions'),
      readPage(unit, 'en/', 'solutions'),
    ]);

    for (const [index, exercise] of pages.slice(0, 2).entries()) {
      const metadata = frontmatter(exercise);
      const content = body(exercise);
      const english = index === 1;
      const counterpart = english
        ? `/${unit.section}/${unit.slug}/exercises/`
        : `/en/${unit.section}/${unit.slug}/exercises/`;

      expect(metadata).toContain(`pairId: ${unit.pairId}-exercises`);
      expect(metadata).toContain(`unitId: ${unit.id}-EXERCISES`);
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(yamlList(metadata, 'prerequisites')).toEqual([unit.id]);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(content.match(/^## (?:练习|Exercise) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      for (const label of [
        /\*\*(?:目标：|Goal:)\*\*/g,
        /\*\*(?:约束：|Constraints:)\*\*/g,
        /\*\*(?:预期证据：|Expected evidence:)\*\*/g,
        /\*\*(?:验收标准：|Acceptance criteria:)\*\*/g,
      ]) expect(content.match(label)).toHaveLength(3);
    }

    for (const [index, solution] of pages.slice(2).entries()) {
      const metadata = frontmatter(solution);
      const content = body(solution);
      const english = index === 1;
      const counterpart = english
        ? `/${unit.section}/${unit.slug}/solutions/`
        : `/en/${unit.section}/${unit.slug}/solutions/`;

      expect(metadata).toContain(`pairId: ${unit.pairId}-solutions`);
      expect(metadata).toContain(`unitId: ${unit.id}-SOLUTIONS`);
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(yamlList(metadata, 'prerequisites')).toEqual([`${unit.id}-EXERCISES`]);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(content.match(/^## (?:解答|Solution) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/\*\*(?:复核：|Review:)\*\*/g)).toHaveLength(3);
      expect(content).toMatch(/有效替代方案|Valid alternatives/);
      expect(content).toMatch(/常见错误|Common errors/);
      expect(content).toMatch(/复核日期：\*\*2026-09-01\*\*|Reviewed: \*\*2026-09-01\*\*/);
    }
  });

  it('locks the Q09 residency, scheduler, and non-causal interpretation ladder', async () => {
    const pages = await Promise.all([readPage(units[0], ''), readPage(units[0], 'en/')]);
    for (const page of pages) {
      expect(page).toContain('occupancy = active warps per SM / maximum active warps per SM');
      expect(page).toMatch(/theoretical occupancy/i);
      expect(page).toMatch(/achieved occupancy/i);
      expect(page).toMatch(/active\/resident[\s\S]{0,400}eligible\/ready-to-issue[\s\S]{0,400}issued/i);
      expect(page).toMatch(/hide latency|隐藏 latency/i);
      expect(page).toMatch(/throughput/i);
      expect(page).toMatch(/high occupancy[\s\S]{0,120}(?:not|不是)/i);
      expect(page).toMatch(/stall share[\s\S]{0,160}(?:not|不是)/i);
      expect(page).toContain('ncu --query-metrics');
      expect(page).toMatch(/\/(?:en\/)?foundations\/launch-geometry\//);
      expect(page).not.toMatch(/F08[^\n]{0,100}\/(?:en\/)?foundations\/compute-capability\//);
      expect(page).toMatch(/runs no GPU or profiler|没有运行 GPU 或 profiler/i);
    }
    expect(pages[0]).toContain('实际占用率（achieved occupancy）');
    expect(pages[0]).not.toContain('达成占用率');
  });

  it('locks the Q10 unit-complete roof, below-roof point, and above-roof audit', async () => {
    const pages = await Promise.all([readPage(units[1], ''), readPage(units[1], 'en/')]);
    for (const page of pages) {
      expect(page).toContain('I_path = W / T_path');
      expect(page).toContain('I_ridge = P_compute / B_path');
      expect(page).toContain('P_roof(I) = min(P_compute, I * B_path)');
      expect(page).toContain('P_achieved = W / t');
      expect(page).toContain('(2.0 FLOP/byte, 2.0 TFLOP/s)');
      expect(page).toContain('3.0 TFLOP/s');
      expect(page).toContain('4.0 TFLOP/s > 3.0 TFLOP/s');
      expect(page).toMatch(/theoretical[\s\S]{0,500}calibrated\/measured[\s\S]{0,500}tool-reported model/i);
      expect(page).toMatch(/never an observed bottleneck|从不等于 observed bottleneck/i);
      expect(page).toContain('https://doi.org/10.1145/1498765.1498785');
      expect(page).toMatch(/Every number is explicitly a synthetic|所有数值都明确是 synthetic/i);
    }
  });

  it('locks A14 operation and traffic estimates before any optimization choice', async () => {
    const pages = await Promise.all([readPage(units[2], ''), readPage(units[2], 'en/')]);
    for (const page of pages) {
      expect(page).toContain('T_map,compulsory = 8N byte');
      expect(page).toContain('T_vadd,compulsory = 12N byte');
      expect(page).toContain('W_reduce = N - 1 FLOP');
      expect(page).toContain('T_reduce,implementation = 4N + 8 * sum(P_i) + 4 byte');
      expect(page).toContain('T_transpose,compulsory = 8MN byte');
      expect(page).toContain('W_gemm = 2MNK FLOP');
      expect(page).toContain('T_gemm,compulsory = 4(MK + KN + MN) byte');
      expect(page).toContain('T_gemm,naive = 4(2MNK + MN) byte');
      expect(page).toContain('T_unfused = 20N byte');
      expect(page).toContain('T_fused = 12N byte');
      expect(page).toMatch(/falsifiable|可证伪/i);
      expect(page).toMatch(/Roofline cannot choose a winner automatically|Roofline 不能自动选择 winner/i);
      expect(page).toMatch(/static estimates|静态估算/i);
    }
    expect(pages[0]).toContain('traffic 未下降');
    expect(pages[1]).toContain('traffic does not fall');

    const solutions = await Promise.all([
      readPage(units[2], '', 'solutions'),
      readPage(units[2], 'en/', 'solutions'),
    ]);
    for (const solution of solutions) {
      expect(solution).toContain('T_candidate = T_base - 8P_j');
      expect(solution).toContain('8MN byte');
      expect(solution).toContain('4[ceil(N/TN0)MK + ceil(M/TM0)KN + MN]');
      expect(solution).toMatch(/reduction-stage fusion/i);
      expect(solution).toMatch(/tiled transpose/i);
      expect(solution).toMatch(/larger GEMM tile/i);
      expect(solution).toMatch(/threshold/i);
      expect(solution).toMatch(/rollback/i);
    }
  });
});
