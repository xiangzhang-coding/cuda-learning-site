// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import {
  INDEX_GROUPS,
  INDEX_LOCALES,
  INDEX_ROUTES,
  projectResourceIndex,
} from '../../src/resource-indexes/resource-index-model';
import { TOOLCHAIN_CATALOG_RELATIONSHIPS } from '../helpers/toolchain-catalog-contract';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const asOf = new Date('2026-09-02T12:00:00Z');

async function readRoute(route: string) {
  const relativePath = route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
  return parseHTML(await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8')).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function detailSection(source: string, planningId: string) {
  const marker = `<span id="${planningId.toLowerCase()}"`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing detail marker for ${planningId}`);
  const next = source.indexOf('<span id="', start + marker.length);
  return source.slice(start, next < 0 ? undefined : next);
}

function linkedPlanningIds(line = '') {
  return [...line.matchAll(/\[([A-Z][A-Z0-9-]*\d+)(?:(?::|：)[^\]]*)?\]\(/g)].map((match) => match[1]);
}

function declaredRelationships(
  source: string,
  planningId: string,
  group: 'practice' | 'glossary' | 'sources',
  locale: (typeof INDEX_LOCALES)[number],
) {
  if (group === 'sources') {
    const row = detailSection(source, planningId).split('\n')[0];
    const related = locale === 'en' ? row.match(/Related IDs: ([^.]+)\./) : row.match(/相关 ID：([^。]+)。/);
    return { prerequisites: [], relatedUnits: related?.[1].split(/,\s*|、/).map((id) => id.trim()) ?? [] };
  }

  const section = detailSection(source, planningId).split('\n');
  const relatedLabel = group === 'practice'
    ? (locale === 'en' ? '**Related Learning Units and resources:**' : '**相关学习单元与资源：**')
    : (locale === 'en' ? '**Related resources:**' : '**相关资源：**');
  const prerequisiteLabel = locale === 'en' ? '**Direct prerequisite:**' : '**直接先修条件：**';
  return {
    prerequisites: group === 'practice'
      ? linkedPlanningIds(section.find((line) => line.includes(prerequisiteLabel)))
      : [],
    relatedUnits: linkedPlanningIds(section.find((line) => line.includes(relatedLabel))),
  };
}

describe('published resource indexes', () => {
  it.each(INDEX_GROUPS.flatMap((group) => INDEX_LOCALES.map((locale) => ({ group, locale }))))(
    'renders every eligible $group record in $locale from the validated catalog',
    async ({ group, locale }) => {
      const document = await readRoute(INDEX_ROUTES[group][locale]);
      const expected = projectResourceIndex(RESOURCE_INDEX_RECORDS, group, locale, { asOf });
      const cards = [...document.querySelectorAll<HTMLElement>('[data-resource-card]')];

      expect(cards.map((card) => card.dataset.resourceId)).toEqual(expected.map(({ planningId }) => planningId));
      expect(document.querySelector('[data-resource-controls]')?.hasAttribute('hidden')).toBe(true);
      expect(cards.every((card) => !card.hasAttribute('hidden'))).toBe(true);
      expect(document.querySelector('[data-resource-empty]')?.hasAttribute('hidden')).toBe(true);

      for (const [index, item] of expected.entries()) {
        const card = cards[index];
        expect(card.querySelector('h3 a')?.getAttribute('href'), item.planningId).toBe(item.href);
        expect(card.querySelector('h3 a')?.textContent, item.planningId).toBe(item.title);
        expect(card.dataset.resourceType, item.planningId).toBe(item.resourceType);
        expect(card.dataset.resourceCounterpart, item.planningId).toBe(item.counterpart);
        expect(card.textContent, item.planningId).toContain(item.hardwareGate);
        expect(card.textContent, item.planningId).toContain(item.versionGate);
        expect(card.textContent, item.planningId).toContain(item.reviewedOn);
        for (const relation of [...item.prerequisites, ...item.relatedUnits]) {
          expect(card.querySelector(`a[href="${relation.href}"]`), `${item.planningId} -> ${relation.id}`).not.toBeNull();
        }
      }
    },
  );

  it('matches the exact relationships declared by every bilingual toolchain detail entry', async () => {
    for (const locale of INDEX_LOCALES) {
      const localePrefix = locale === 'en' ? 'en/' : '';
      const detailSources = {
        practice: await readFile(path.join(projectRoot, 'src/content/docs', localePrefix, 'practice.mdx'), 'utf8'),
        glossary: await readFile(path.join(projectRoot, 'src/content/docs', localePrefix, 'glossary.mdx'), 'utf8'),
        sources: await readFile(path.join(projectRoot, 'src/content/docs', localePrefix, 'sources-and-versions.mdx'), 'utf8'),
      };
      for (const expected of TOOLCHAIN_CATALOG_RELATIONSHIPS) {
        const declared = declaredRelationships(
          detailSources[expected.group],
          expected.planningId,
          expected.group,
          locale,
        );
        const catalog = RESOURCE_INDEX_RECORDS.find(({ planningId }) => planningId === expected.planningId);
        expect(declared, `${locale} ${expected.planningId} detail`).toEqual({
          prerequisites: expected.prerequisites,
          relatedUnits: expected.relatedUnits,
        });
        expect(catalog, `${locale} ${expected.planningId} catalog`).toMatchObject(declared);
      }
    }
  });

  it('keeps all fifty-eight bilingual Practice Bank entries complete and nonduplicative', async () => {
    const practiceIds = RESOURCE_INDEX_RECORDS
      .filter(({ group }) => group === 'practice')
      .map(({ planningId }) => planningId);
    expect(practiceIds).toHaveLength(58);

    const localeContracts = [
      {
        locale: 'zh-CN',
        source: await readFile(path.join(projectRoot, 'src/content/docs/practice.mdx'), 'utf8'),
        prerequisite: /- \*\*(?:直接先修条件|先修条件)：\*\*[^\n]*\]\(\//,
        hardwareGate: /- \*\*硬件门槛（Hardware gate）：\*\*[^\n]+/,
        reviewDate: /- \*\*最后复核（Last reviewed）：\*\* \d{4}-\d{2}-\d{2}。/,
        expectedEvidence: /\*\*预期证据：\*\*[^\n]+/,
        acceptanceCriteria: /\*\*验收条件：\*\*/,
        hint: /<details><summary>提示 [^<]+<\/summary>/g,
        solution: /\*\*(?:解答|参考解答（Reviewed solution）)：\*\*[^\n]+/,
        sourceBasis: /\*\*来源依据（Source basis）：\*\*[^\n]+/,
        prompt: /\*\*题目：\*\*\s*([^\n]+)/,
      },
      {
        locale: 'en',
        source: await readFile(path.join(projectRoot, 'src/content/docs/en/practice.mdx'), 'utf8'),
        prerequisite: /- \*\*(?:Direct prerequisite|Prerequisite):\*\*[^\n]*\]\(\/en\//,
        hardwareGate: /- \*\*Hardware gate:\*\*[^\n]+/,
        reviewDate: /- \*\*Last reviewed:\*\* \d{4}-\d{2}-\d{2}\./,
        expectedEvidence: /\*\*Expected evidence:\*\*[^\n]+/,
        acceptanceCriteria: /\*\*Acceptance criteria:\*\*/,
        hint: /<details><summary>Hint [^<]+<\/summary>/g,
        solution: /\*\*(?:Solution|Reviewed solution):\*\*[^\n]+/,
        sourceBasis: /\*\*Source basis:\*\*[^\n]+/,
        prompt: /\*\*Prompt:\*\*\s*([^\n]+)/,
      },
    ] as const;

    for (const contract of localeContracts) {
      const sourceIds = [...contract.source.matchAll(/<span id="(pb-[^"]+)"/g)]
        .map((match) => match[1].toUpperCase());
      expect(sourceIds, contract.locale).toEqual(practiceIds);
      const prompts = new Set<string>();

      for (const planningId of practiceIds) {
        const section = detailSection(contract.source, planningId);
        expect(section, `${contract.locale} ${planningId} Publication Pair`).toMatch(/ID.*Publication Pair|ID.*双语发布对/);
        expect(section, `${contract.locale} ${planningId} prerequisite`).toMatch(contract.prerequisite);
        expect(section, `${contract.locale} ${planningId} hardware gate`).toMatch(contract.hardwareGate);
        expect(section, `${contract.locale} ${planningId} review date`).toMatch(contract.reviewDate);
        expect(section, `${contract.locale} ${planningId} expected evidence`).toMatch(contract.expectedEvidence);
        expect(section, `${contract.locale} ${planningId} acceptance criteria`).toMatch(contract.acceptanceCriteria);
        expect(section.match(contract.hint), `${contract.locale} ${planningId} layered hints`).toHaveLength(2);
        expect(section, `${contract.locale} ${planningId} solution`).toMatch(contract.solution);
        expect(section, `${contract.locale} ${planningId} source basis`).toMatch(contract.sourceBasis);
        const prompt = section.match(contract.prompt)?.[1].trim();
        expect(prompt, `${contract.locale} ${planningId} prompt`).toBeTruthy();
        expect(prompts.has(prompt ?? ''), `${contract.locale} duplicate prompt: ${prompt}`).toBe(false);
        prompts.add(prompt ?? '');
      }
      expect(prompts.size).toBe(58);
    }
  });

  it('publishes no planned placeholder and keeps exact eligible populations', async () => {
    const counts = Object.fromEntries(
      INDEX_GROUPS.map((group) => [group, RESOURCE_INDEX_RECORDS.filter((record) => record.group === group).length]),
    );
    expect(counts).toEqual({ labs: 10, practice: 58, visuals: 18, glossary: 165, sources: 70 });
    expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(321);
    expect(counts.glossary).toBeGreaterThanOrEqual(30);

    const indexDocuments = await Promise.all(INDEX_GROUPS.map((group) => readRoute(INDEX_ROUTES[group].en)));
    const indexedText = indexDocuments.map((document) => document.querySelector('main')?.textContent ?? '').join(' ');
    const indexedIds = indexDocuments.flatMap((document) =>
      [...document.querySelectorAll<HTMLElement>('[data-resource-card]')].map((card) => card.dataset.resourceId),
    );
    for (const absentId of ['Q13', 'L06', 'LAB12', 'LAB99', 'VIS99', 'PB-R0-999', 'TERM-999']) {
      expect(indexedIds).not.toContain(absentId);
    }
    expect(indexedText).not.toMatch(/coming soon|即将推出/i);

    for (const planningId of [
      'PB-R1-017', 'PB-R1-018', 'PB-R1-019', 'PB-R1-020',
      'VIS03', 'VIS07',
      'TERM-077', 'TERM-078', 'TERM-079', 'TERM-080', 'TERM-081',
      'TERM-082', 'TERM-083', 'TERM-084', 'TERM-085', 'TERM-086',
      'LAB04', 'LAB05', 'LAB07',
      'PB-R1-021', 'PB-R1-022', 'PB-R1-023', 'PB-R1-024',
      'TERM-087', 'TERM-088', 'TERM-089', 'TERM-090', 'TERM-091',
      'TERM-092', 'TERM-093', 'TERM-094', 'TERM-095',
      'SRC-CUDA-020', 'SRC-CUDA-021', 'SRC-CUDA-022', 'SRC-CUDA-023', 'SRC-CUDA-024',
    ]) {
      expect(RESOURCE_INDEX_RECORDS.find((record) => record.planningId === planningId)?.reviewedOn).toBe('2026-08-28');
    }

    for (const planningId of [
      'PB-R2-001', 'PB-R2-002', 'PB-R2-003', 'PB-R2-004', 'PB-R2-005', 'PB-R2-006',
      'PB-R2-007', 'PB-R2-008', 'PB-R2-009', 'PB-R2-010', 'PB-R2-011',
      'TERM-096', 'TERM-097', 'TERM-098', 'TERM-099', 'TERM-100', 'TERM-101',
      'TERM-102', 'TERM-103', 'TERM-104', 'TERM-105', 'TERM-106', 'TERM-107',
      'TERM-108', 'TERM-109', 'TERM-110', 'TERM-111', 'TERM-112', 'TERM-113', 'TERM-114',
      'TERM-115', 'TERM-116', 'TERM-117', 'TERM-118', 'TERM-119', 'TERM-120',
      'TERM-121', 'TERM-122', 'TERM-123', 'TERM-124', 'TERM-125',
      'SRC-CUDA-025', 'SRC-CUDA-026', 'SRC-CUDA-027', 'SRC-CUDA-028', 'SRC-CUDA-029', 'SRC-CUDA-030',
      'SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033', 'SRC-CUDA-034', 'SRC-CUDA-035',
      'VIS08', 'VIS09',
    ]) {
      const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
      expect(record?.reviewedOn).toBe('2026-08-29');
      if (planningId.startsWith('SRC-')) expect(record?.sourceAccessDate).toBe('2026-08-29');
    }

    for (const planningId of [
      'PB-R2-012', 'PB-R2-013', 'PB-R2-014', 'PB-R2-015', 'PB-R2-016',
      'PB-R2-017', 'PB-R2-018', 'PB-R2-019',
      'TERM-126', 'TERM-127', 'TERM-128', 'TERM-129', 'TERM-130', 'TERM-131', 'TERM-132',
      'TERM-133', 'TERM-134', 'TERM-135', 'TERM-136', 'TERM-137', 'TERM-138', 'TERM-139',
      'TERM-140', 'TERM-141', 'TERM-142', 'TERM-143', 'TERM-144', 'TERM-145', 'TERM-146',
      'SRC-HIST-003', 'SRC-CUDA-036', 'SRC-CUDA-037', 'SRC-CUDA-038', 'SRC-CUDA-039', 'SRC-CUDA-040',
      'SRC-CUDA-041', 'SRC-CUDA-042', 'SRC-CUDA-043',
      'VIS10', 'VIS11',
    ]) {
      const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
      expect(record?.reviewedOn, planningId).toBe('2026-08-30');
      if (planningId.startsWith('SRC-')) expect(record?.sourceAccessDate, planningId).toBe('2026-08-30');
    }

    for (const planningId of [
      'PB-R2-020', 'PB-R2-021', 'VIS12',
      'TERM-147', 'TERM-148', 'TERM-149', 'TERM-150', 'TERM-151',
      'SRC-CUDA-044', 'SRC-CUDA-045',
    ]) {
      const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
      expect(record?.reviewedOn, planningId).toBe('2026-08-31');
      if (planningId.startsWith('SRC-')) expect(record?.sourceAccessDate, planningId).toBe('2026-08-31');
    }

    for (const planningId of [
      'LAB06', 'LAB08', 'VIS14',
      'PB-R3-001', 'PB-R3-002', 'PB-R3-003',
      'TERM-152', 'TERM-153', 'TERM-155', 'TERM-157', 'TERM-159',
      'SRC-CUDA-046', 'SRC-CUDA-047', 'SRC-CUDA-048', 'SRC-CUDA-049',
    ]) {
      const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
      expect(record?.reviewedOn, planningId).toBe('2026-08-31');
      if (planningId.startsWith('SRC-')) expect(record?.sourceAccessDate, planningId).toBe('2026-08-31');
    }

    for (const planningId of [
      'LAB09', 'VIS13',
      'PB-R3-004', 'PB-R3-005', 'PB-R3-006',
      'TERM-040', 'TERM-043', 'TERM-044', 'TERM-154', 'TERM-156', 'TERM-158',
      'TERM-160', 'TERM-161', 'TERM-162', 'TERM-163', 'TERM-164', 'TERM-165',
      'SRC-CUDA-050', 'SRC-CUDA-051', 'SRC-CUDA-052',
    ]) {
      const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
      expect(record?.reviewedOn, planningId).toBe('2026-09-01');
      if (planningId.startsWith('SRC-')) expect(record?.sourceAccessDate, planningId).toBe('2026-09-01');
    }

    for (const planningId of ['LAB10', 'PB-R3-007', 'PB-R3-008', 'SRC-CUDA-053', 'SRC-CUDA-054']) {
      const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
      expect(record?.reviewedOn, planningId).toBe('2026-09-02');
      if (planningId.startsWith('SRC-')) expect(record?.sourceAccessDate, planningId).toBe('2026-09-02');
    }
  });

  it('indexes every built Lab and formal Visual Explainer identity discovered from production output', async () => {
    const discovered = { labs: new Set<string>(), visuals: new Set<string>() };
    const htmlFiles = (await readdir(path.join(projectRoot, 'dist'), { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.html') && !file.startsWith('en/'));

    for (const file of htmlFiles) {
      const document = parseHTML(await readFile(path.join(projectRoot, 'dist', file), 'utf8')).document;
      expect(document.documentElement.lang, file).toBe('zh-CN');
      const resourceKind = metadata(document, 'cuda:resource-kind');
      const unitId = metadata(document, 'cuda:unit-id');
      if (resourceKind === 'lab' && unitId) discovered.labs.add(unitId);
      if (resourceKind === 'visual-explainer' && unitId) discovered.visuals.add(unitId);
      for (const visual of document.querySelectorAll<HTMLElement>('[data-visual-id]')) {
        if (visual.dataset.visualId) discovered.visuals.add(visual.dataset.visualId);
      }
    }

    for (const group of ['labs', 'visuals'] as const) {
      const indexed = RESOURCE_INDEX_RECORDS
        .filter((record) => record.group === group)
        .map(({ planningId }) => planningId)
        .sort();
      expect([...discovered[group]].sort()).toEqual(indexed);
    }
  }, 15_000);

  it('projects every Lab title and Evidence Status exactly and grants Visual Explainers no CUDA status', async () => {
    for (const locale of INDEX_LOCALES) {
      const labIndex = await readRoute(INDEX_ROUTES.labs[locale]);
      for (const item of projectResourceIndex(RESOURCE_INDEX_RECORDS, 'labs', locale, { asOf })) {
        const labCard = labIndex.querySelector(`[data-resource-id="${item.planningId}"]`);
        const lab = await readRoute(item.href);
        expect(labCard?.querySelector('h3 a')?.textContent, item.planningId).toBe(lab.querySelector('main h1')?.textContent);
        expect(labCard?.querySelector('[data-evidence-compilation]')?.getAttribute('data-evidence-compilation')).toBe(
          metadata(lab, 'cuda:evidence-compilation'),
        );
        expect(labCard?.querySelector('[data-evidence-runtime]')?.getAttribute('data-evidence-runtime')).toBe(
          metadata(lab, 'cuda:evidence-runtime'),
        );
      }
    }

    for (const route of ['/visuals/', '/en/visuals/']) {
      const document = await readRoute(route);
      expect(document.querySelectorAll('[data-resource-evidence]').length).toBe(0);
      expect(document.querySelectorAll('[data-resource-card] [data-no-evidence]').length).toBe(18);
      for (const card of document.querySelectorAll('[data-resource-card]')) {
        expect(card.textContent).not.toMatch(/Compile-Checked|Community-Observed|Runtime-Verified/);
        const href = card.querySelector('h3 a')?.getAttribute('href');
        expect(href).toBeTruthy();
        const destination = new URL(href ?? '', 'https://resource-index.invalid');
        const visual = await readRoute(destination.pathname);
        if (destination.hash) {
          const anchor = visual.getElementById(destination.hash.slice(1));
          const planningId = card.getAttribute('data-resource-id');
          const embedded = visual.querySelector(`[data-visual-id="${planningId}"]`);
          expect(anchor, href ?? '').not.toBeNull();
          expect(embedded, planningId ?? '').not.toBeNull();
        } else {
          expect(card.querySelector('h3 a')?.textContent).toBe(visual.querySelector('main h1')?.textContent);
        }
      }
    }
  });

  it.each([
    { group: 'practice', route: '/practice/', selector: '.resource-target[id^="pb-r"]' },
    { group: 'practice', route: '/en/practice/', selector: '.resource-target[id^="pb-r"]' },
    { group: 'glossary', route: '/glossary/', selector: '.resource-target[id^="term-"]' },
    { group: 'glossary', route: '/en/glossary/', selector: '.resource-target[id^="term-"]' },
    { group: 'sources', route: '/sources-and-versions/', selector: '.resource-target[id^="src-"]' },
    { group: 'sources', route: '/en/sources-and-versions/', selector: '.resource-target[id^="src-"]' },
  ] as const)('rejects orphaned $group detail anchors', async ({ group, route, selector }) => {
    const document = await readRoute(route);
    const detailIds = [...document.querySelectorAll(selector)].map(({ id }) => id.toUpperCase());
    const catalogIds = RESOURCE_INDEX_RECORDS
      .filter((record) => record.group === group)
      .map(({ planningId }) => planningId);
    expect(detailIds).toEqual(catalogIds);
  });

  it('ships an ephemeral static-first filter with no account or progress transport', async () => {
    for (const group of INDEX_GROUPS) {
      const route = INDEX_ROUTES[group].en;
      const relativePath = `${route.slice(1)}index.html`;
      const html = await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8');
      const document = parseHTML(html).document;
      const resourceScript = [...document.querySelectorAll('script')].find((script) =>
        script.textContent?.includes('cuda-resource-index'),
      )?.textContent ?? '';
      expect(html, route).toContain('customElements.define');
      expect(html, route).toContain('cuda-resource-index');
      expect(resourceScript, route).not.toBe('');
      expect(resourceScript, route).not.toMatch(/localStorage|sessionStorage|document\.cookie|indexedDB\.open|\bfetch\s*\(/);
      expect(html, route).not.toContain('<form');
    }
  });
});
