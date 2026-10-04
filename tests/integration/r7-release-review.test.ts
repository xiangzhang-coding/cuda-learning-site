// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import release from '../../src/r7-release-manifest.json';
import current from '../../src/current-publication-manifest.json';
import r6 from '../../src/r6-release-manifest.json';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const root = path.resolve(import.meta.dirname, '../..');
const read = (file: string) => readFile(path.join(root, file), 'utf8');
const first100 = release.practiceFirst100.flatMap(group => group.entries);

describe('R7 full-curriculum release review', () => {
  it('freezes the planned O–H sequence, complete public inventory and separate Watch', async () => {
    expect(release.scope).toEqual(current.scope);
    expect(current.releaseReview).toEqual({ latestCompleted: 'R7', next: null, status: 'complete' });
    const planned = Object.entries({ O: 8, F: 8, M: 19, A: 14, Q: 13, L: 13, P: 12, T: 8, G: 9, H: 6 })
      .flatMap(([prefix, count]) => Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`));
    expect(release.scope.learningUnits).toEqual(planned);
    expect(release.scope.emergingFeatureWatch).toEqual(['W01', 'W02', 'W03', 'W04', 'W05', 'W06']);
    expect(await discoverPublishedRoutes()).toHaveLength(release.scope.sourceRoutes);
    expect(release.scope.sourceRoutes).toBe(2 * release.scope.publicationPairs);
    const inventory = { labs: 20, practice: 121, visuals: 22, glossary: 207, sources: 124 };
    for (const [group, count] of Object.entries(inventory)) expect(RESOURCE_INDEX_RECORDS.filter(record => record.group === group), group).toHaveLength(count);
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(494);
    expect(release.scope.practiceBankEntries).toBeGreaterThanOrEqual(105);
  });

  it('closes every published dependency without cycles or Watch prerequisites in stable paths', () => {
    const visit = (id: string, ancestors: string[] = [], stable = true) => {
      expect(ancestors, `cycle at ${id}`).not.toContain(id);
      expect(PUBLISHED_DESTINATIONS[id], `missing ${id}`).toBeDefined();
      if (stable) expect(id).not.toMatch(/^W\d/);
      for (const dependency of PUBLISHED_DESTINATIONS[id].prerequisites) visit(dependency, [...ancestors, id], stable);
    };
    for (const id of Object.keys(PUBLISHED_DESTINATIONS)) visit(id, [], !/^W\d/.test(id));
    for (const record of RESOURCE_INDEX_RECORDS) for (const prerequisite of record.prerequisites) visit(prerequisite);
    for (const id of ['D01', 'LAB21', 'T09']) expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(id);
  });

  it('qualifies exactly 100 distinct entries under the eight independent category floors', () => {
    expect(release.practiceFirst100.map(group => [group.category, group.minimum])).toEqual([
      ['core-mental-models', 18], ['cuda-cpp-implementation', 18], ['debugging-correctness', 15],
      ['memory-performance', 18], ['nsight-report-analysis', 10], ['libraries-algorithm-choice', 8],
      ['pytorch-triton', 8], ['multi-gpu-nccl', 5],
    ]);
    expect(first100).toHaveLength(100);
    expect(new Set(first100).size).toBe(100);
    for (const group of release.practiceFirst100) {
      expect(group.entries.length).toBeGreaterThanOrEqual(group.minimum);
      for (const id of group.entries) expect(RESOURCE_INDEX_RECORDS.find(record => record.planningId === id)?.group, id).toBe('practice');
    }
    expect(release.practiceFirst100[4].entries).toEqual(release.scope.nsightReportAnalysisPracticeEntries);
    expect(release.practiceFirst100[5].entries).toEqual(release.scope.libraryAlgorithmChoicePracticeEntries);
    expect(release.scope.pytorchAndTritonPracticeEntries).toEqual(expect.arrayContaining(release.practiceFirst100[6].entries));
    expect(release.scope.multiGpuAndNcclPracticeEntries).toEqual(expect.arrayContaining(release.practiceFirst100[7].entries));
  });

  it('keeps historical components pinned and all 45 Example/Lab evidence subjects accounted for', async () => {
    expect(current.compatibility).toEqual(r6.compatibility);
    expect(current.compatibility).toMatchObject(release.compatibility);
    expect(release.evidence).toEqual(current.evidence);
    expect(release.compatibilityRecords.unchangedComponentAndProfilerSnapshot).toBe('src/r6-release-manifest.json');
    expect(JSON.parse(await read(release.compatibilityRecords.architectureProject)).id).toBe('EX25');
    const subjects = [...release.scope.runnableExamples, ...release.scope.labs].sort();
    expect([...release.evidence.compileChecked, ...release.evidence.noCompileCheckedClaim].sort()).toEqual(subjects);
    expect([...release.evidence.runtimeNotApplicable, ...release.evidence.pendingHardwareVerification].sort()).toEqual(subjects);
    expect(release.evidence.pendingHardwareVerification).toHaveLength(44);
    expect(release.evidence.compileChecked).toEqual(['EX02', 'EX10', 'LAB02']);
    for (const key of ['communityObserved', 'runtimeVerified', 'referenceEnvironments', 'performanceObservations', 'capturedProfilerReports'] as const) expect(release.evidence[key]).toEqual([]);
    expect(release.compatibilityRecords.watchPromotions).toEqual([]);
  });

  it.each(['zh-CN', 'en'] as const)('publishes the real first-100 order, local anchors and release record in %s', async locale => {
    const prefix = locale === 'en' ? 'en/' : '';
    const { document } = parseHTML(await read(`dist/${prefix}practice/index.html`));
    const positions = [...document.querySelectorAll('[data-practice-position]')];
    expect(positions.map(item => item.getAttribute('data-practice-position'))).toEqual(first100);
    expect(document.querySelectorAll('[data-practice-category]')).toHaveLength(8);
    const titles = new Set<string>();
    for (const id of first100) {
      expect(document.getElementById(id.toLowerCase()), id).not.toBeNull();
      const record = RESOURCE_INDEX_RECORDS.find(item => item.planningId === id)!;
      titles.add(record.title[locale]);
      expect(positions.find(item => item.getAttribute('data-practice-position') === id)?.querySelector('a')?.getAttribute('href')).toBe(record.href[locale]);
    }
    expect(titles.size).toBe(100);
    for (const slug of ['', 'about/', 'start/using-the-learning-site/', 'labs/', 'sources-and-versions/']) {
      const page = parseHTML(await read(`dist/${prefix}${slug}index.html`)).document;
      expect(page.querySelector(`a[href="/${prefix}sources-and-versions/#r7-full-curriculum-review"], #r7-full-curriculum-review`), slug).not.toBeNull();
      expect(page.querySelector('meta[name="cuda:fact-check-date"]')?.getAttribute('content'), slug).toBe(release.reviewDate);
    }
  });
});
