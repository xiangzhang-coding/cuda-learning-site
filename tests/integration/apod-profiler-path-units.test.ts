// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const docsRoot = path.resolve(import.meta.dirname, '../../src/content/docs');
const reviewDate = '2026-08-31';

const units = [
  {
    id: 'Q06',
    pairId: 'q06',
    slug: 'apod-optimization-loop',
    prerequisites: ['Q05'],
    terms: [/Assess/i, /Parallelize/i, /Optimize/i, /Deploy/i, /baseline/i, /hypothesis/i],
    practiceId: 'PB-R3-001',
  },
  {
    id: 'Q07',
    pairId: 'q07',
    slug: 'timeline-first-nsight-systems',
    prerequisites: ['M07', 'M09', 'Q05'],
    terms: [/Nsight Systems/i, /timeline/i, /CPU.{0,40}gap/is, /launch overhead/i, /cop(?:y|ies).{0,60}overlap/is, /before.{0,80}(?:kernel )?metrics/is],
    practiceId: 'PB-R3-002',
  },
  {
    id: 'Q08',
    pairId: 'q08',
    slug: 'kernel-first-nsight-compute',
    prerequisites: ['Q07', 'M02', 'M03'],
    terms: [/Nsight Compute/i, /selected kernel/i, /question/i, /metric/i, /replay/i, /\.ncu-rep/i],
    practiceId: 'PB-R3-003',
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
  return [...metadata.matchAll(/^\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm)]
    .map(([, url, version, platform, accessDate]) => ({ url, version, platform, accessDate }));
}

async function readUnit(locale: '' | 'en/', slug: string, child?: 'exercises' | 'solutions') {
  const relative = child ? `${locale}correctness/${slug}/${child}.md` : `${locale}correctness/${slug}.mdx`;
  return readFile(path.join(docsRoot, relative), 'utf8');
}

describe('Q06-Q08 APOD and profiler decision path', () => {
  it.each(units)('publishes an aligned complete $id Publication Pair', async (unit) => {
    const [zh, en] = await Promise.all([readUnit('', unit.slug), readUnit('en/', unit.slug)]);
    const zhMeta = frontmatter(zh);
    const enMeta = frontmatter(en);
    for (const [source, locale, counterpart] of [
      [zh, 'zh-CN', `/en/correctness/${unit.slug}/`],
      [en, 'en', `/correctness/${unit.slug}/`],
    ] as const) {
      const metadata = frontmatter(source);
      const content = body(source);
      expect(metadata).toContain(`pairId: ${unit.pairId}`);
      expect(metadata).toContain(`unitId: ${unit.id}`);
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'prerequisites')).toEqual(unit.prerequisites);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(content.trimStart()).toMatch(new RegExp(`^<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${locale === 'en' ? 'zh-CN' : 'en'}">`));
      expect(content.match(/^\d+\. /gm)).toHaveLength(5);
      expect(content).toContain(unit.practiceId);
      for (const pattern of unit.terms) expect(content).toMatch(pattern);
      for (const { url } of sourceCoordinates(metadata)) expect(content).toContain(`](${url})`);
      expect(content).toContain(`Fact checked: ${reviewDate}`);
    }
    expect(yamlList(zhMeta, 'structure')).toEqual(yamlList(enMeta, 'structure'));
    expect(sourceCoordinates(zhMeta)).toEqual(sourceCoordinates(enMeta));
  });

  it.each(units)('publishes layered $id Exercises and separate reviewed solutions', async (unit) => {
    const pages = await Promise.all([
      readUnit('', unit.slug, 'exercises'),
      readUnit('en/', unit.slug, 'exercises'),
      readUnit('', unit.slug, 'solutions'),
      readUnit('en/', unit.slug, 'solutions'),
    ]);
    for (const exercise of pages.slice(0, 2)) {
      const metadata = frontmatter(exercise);
      expect(metadata).toContain(`pairId: ${unit.pairId}-exercises`);
      expect(metadata).toContain(`unitId: ${unit.id}-EXERCISES`);
      expect(yamlList(metadata, 'prerequisites')).toEqual([unit.id]);
      expect(body(exercise).match(/^## Exercise \d:|^## 练习 \d：/gm)).toHaveLength(3);
      expect(body(exercise).match(/<details><summary>Hint [12]<\/summary>|<details><summary>提示 [12]<\/summary>/g)).toHaveLength(6);
      for (const label of [/\*\*Goal:|\*\*目标：/, /\*\*Constraints:|\*\*约束：/, /\*\*Expected evidence:|\*\*预期证据：/, /\*\*Acceptance criteria:|\*\*验收标准：/]) {
        expect(body(exercise)).toMatch(label);
      }
    }
    for (const solution of pages.slice(2)) {
      const metadata = frontmatter(solution);
      expect(metadata).toContain(`pairId: ${unit.pairId}-solutions`);
      expect(metadata).toContain(`unitId: ${unit.id}-SOLUTIONS`);
      expect(yamlList(metadata, 'prerequisites')).toEqual([`${unit.id}-EXERCISES`]);
      expect(body(solution).match(/^## Solution \d:|^## 解答 \d：/gm)).toHaveLength(3);
      expect(body(solution)).toMatch(/Reviewed: \*\*2026-08-31\*\*|复核日期：\*\*2026-08-31\*\*/);
    }
  });

  it('keeps the Systems-to-Compute handoff explicit and avoids metric dumping', async () => {
    const [q07, q08] = await Promise.all([
      readUnit('en/', 'timeline-first-nsight-systems'),
      readUnit('en/', 'kernel-first-nsight-compute'),
    ]);
    expect(q07).toMatch(/Nsight Systems[\s\S]{0,1200}before[\s\S]{0,200}Nsight Compute/i);
    expect(q07).toMatch(/select one exact kernel instance|selected kernel instance/i);
    expect(q08).toMatch(/selected kernel[\s\S]{0,240}(?:declared|specific|predeclared) question/i);
    expect(q08).toMatch(/collect only[\s\S]{0,240}(?:section|metric)/i);
    expect(q08).toMatch(/replay[\s\S]{0,500}(?:perturb|serialize|overhead|different execution)/i);
    expect(q08).toMatch(/metric dump|dumping metrics/i);
  });
});
