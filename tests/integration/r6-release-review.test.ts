// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import release from '../../src/r6-release-manifest.json';
import current from '../../src/current-publication-manifest.json';
import r5 from '../../src/r5-release-manifest.json';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { parseFrontmatter } from '@astrojs/markdown-remark';

const root = path.resolve(import.meta.dirname, '../..');
const ids = Array.from({ length: 9 }, (_, index) => `G${String(index + 1).padStart(2, '0')}`);
const read = (file: string) => readFile(path.join(root, file), 'utf8');
const metadata = (doc: Document, key: string) => doc.querySelector(`meta[name="cuda:${key}"]`)?.getAttribute('content');

describe('R6 aggregate release review', () => {
  it('freezes all prior scope and G01-G09 with closed public dependencies and real catalog counts', () => {
    expect(release).toMatchObject({ releaseId: 'R6', schemaVersion: 7, reviewDate: '2026-09-22' });
    expect(current.releaseReview).toEqual({ latestCompleted: 'R6', next: 'R7', status: 'pending' });
    expect(current.scope).toEqual(release.scope);
    expect(current.compatibility).toEqual(release.compatibility);
    expect(current.evidence).toEqual(release.evidence);
    expect(release.scope.learningUnits).toEqual([...r5.scope.learningUnits, ...ids]);
    expect(release.scope).toMatchObject({ publicationPairs: 376, sourceRoutes: 752,
      exerciseSetPublicationPairs: 103, solutionSetPublicationPairs: 103, practiceBankEntries: 115,
      sourceRecords: 117, glossaryTerms: 207 });
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(478);
    expect(RESOURCE_INDEX_RECORDS.filter(record => record.group === 'practice')).toHaveLength(115);
    const completed = new Set<string>();
    const visit = (id: string, visiting = new Set<string>()) => {
      expect(visiting.has(id), `dependency cycle at ${id}`).toBe(false);
      if (completed.has(id)) return;
      expect(PUBLISHED_DESTINATIONS[id], id).toBeDefined();
      for (const prerequisite of PUBLISHED_DESTINATIONS[id].prerequisites) visit(prerequisite, new Set([...visiting, id]));
      completed.add(id);
    };
    for (const id of [...release.scope.learningUnits, ...release.scope.runnableExamples,
      ...release.scope.labs, ...release.scope.visualExplainers]) visit(id);
    for (const record of RESOURCE_INDEX_RECORDS) for (const id of record.prerequisites) visit(id);
    for (const id of ['D01', 'EX25', 'LAB19', 'T09']) expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(id);
    expect(r5.scope.learningUnits).toHaveLength(95);
    expect(r5.scope.practiceBankEntries).toBe(102);
  });

  it('keeps standalone NCCL, DDP, profiler and multi-node admission independent of GPU evidence', async () => {
    const project = JSON.parse(await read('examples/ex24-nccl-all-reduce/project.json'));
    expect(JSON.stringify(project)).toContain('2.31.2');
    expect(release.compatibility.componentBoundaries.r6Distributed).toMatchObject({
      standaloneNccl: '2.31.2', ddpPackagedNccl: '2.28.9', ddpTorch: '2.11.0+cu128',
      ddpPython: '3.12.14', minimumGpuCount: 2, overlapProfiler: 'Nsight Systems 2026.5',
      multiNodeLauncher: 'unselected; explicit admission gate', runtimeVerified: false,
    });
    expect(release.evidence.compileChecked).toEqual(r5.evidence.compileChecked);
    expect(release.evidence.runtimeNotApplicable).toEqual(['EX10']);
    expect(release.evidence.pendingHardwareVerification).toHaveLength(41);
    expect(new Set(release.evidence.pendingHardwareVerification).size).toBe(41);
    expect(release.evidence.r6EvidenceNeutralLearningUnits).toEqual(ids);
    for (const key of ['runtimeVerified', 'communityObserved', 'referenceEnvironments',
      'performanceObservations', 'capturedProfilerReports'] as const) expect(release.evidence[key], key).toEqual([]);
    for (const id of ['EX24', 'LAB17', 'LAB18']) {
      expect(release.evidence.noCompileCheckedClaim).toContain(id);
      expect(release.evidence.pendingHardwareVerification).toContain(id);
    }
    for (const file of ['DEPLOYMENT.md', 'src/content/docs/en/sources-and-versions.mdx', 'src/content/docs/sources-and-versions.mdx']) {
      const source = await read(file);
      expect(source, file).toMatch(/LOCAL_RANK[^\n]*(?:shared visible-device list|共享可见设备列表)/);
      expect(source, file).not.toMatch(/one visible GPU per process|逐进程一个可见 GPU/i);
    }
  });

  it.each(['zh-CN', 'en'] as const)('renders the bilingual R6 closure and 13 distinct qualified questions in %s', async (locale) => {
    const prefix = locale === 'en' ? 'en/' : '';
    for (const id of ids) {
      const route = PUBLISHED_DESTINATIONS[id].href[locale];
      const { document } = parseHTML(await read(`dist${route}index.html`));
      const { frontmatter } = parseFrontmatter(await read(`src/content/docs${route.slice(0, -1)}.md`));
      expect(frontmatter.evidence, id).toEqual({ compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] });
      for (const field of ['evidence-compilation', 'evidence-runtime']) {
        expect(metadata(document, field), `${id} ${field}`).toBe('none');
      }
      expect(document.querySelector(`a[href="${route}exercises/"]`), id).not.toBeNull();
      expect(document.querySelector(`a[href="${route}solutions/"]`), id).not.toBeNull();
      const other = PUBLISHED_DESTINATIONS[id].href[locale === 'en' ? 'zh-CN' : 'en'];
      expect(document.querySelector(`[data-locale-counterpart][href="${other}"]`), id).not.toBeNull();
    }
    const qualified = release.scope.multiGpuAndNcclPracticeEntries;
    expect(qualified).toEqual(Array.from({ length: 13 }, (_, index) => `PB-R6-${String(index + 1).padStart(3, '0')}`));
    expect(qualified.length).toBeGreaterThanOrEqual(5);
    const { document } = parseHTML(await read(`dist/${prefix}practice/index.html`));
    const titles = new Set<string>();
    for (const id of qualified) {
      const record = RESOURCE_INDEX_RECORDS.find(record => record.planningId === id)!;
      expect(record.prerequisites.some(prerequisite => ids.includes(prerequisite)), id).toBe(true);
      const card = document.querySelector(`[data-resource-id="${id}"]`)!;
      expect(card, id).not.toBeNull();
      expect(document.getElementById(id.toLowerCase()), id).not.toBeNull();
      const title = card.querySelector('h2, h3, h4')?.textContent?.trim();
      expect(title, id).toBeTruthy();
      titles.add(title!);
    }
    expect(titles.size).toBe(qualified.length);
    for (const slug of ['', 'about/', 'start/using-the-learning-site/', 'labs/', 'sources-and-versions/']) {
      const page = parseHTML(await read(`dist/${prefix}${slug}index.html`)).document;
      expect(metadata(page, 'fact-check-date'), slug).toBe('2026-09-22');
      expect(page.querySelector(`a[href="/${prefix}sources-and-versions/#r6-aggregate-review"], #r6-aggregate-review`), slug).not.toBeNull();
    }
    const source = parseHTML(await read(`dist/${prefix}sources-and-versions/index.html`)).document;
    for (const term of ['2.31.2', '2.28.9', '2026.5', 'G01-G09', 'PB-R6-013', '41']) expect(source.body.textContent).toContain(term);
  });
});
