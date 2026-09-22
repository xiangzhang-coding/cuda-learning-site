// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import release from '../../src/r5-release-manifest.json';
import current from '../../src/current-publication-manifest.json';
import r4 from '../../src/r4-release-manifest.json';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const root = path.resolve(import.meta.dirname, '../..');
const ids = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`);
const read = (file: string) => readFile(path.join(root, file), 'utf8');
const metadata = (doc: Document, key: string) => doc.querySelector(`meta[name="cuda:${key}"]`)?.getAttribute('content');

describe('R5 aggregate release review', () => {
  it('freezes the complete R5 scope without expanding historical R4 or future destinations', () => {
    expect(release).toMatchObject({ releaseId: 'R5', schemaVersion: 6, reviewDate: '2026-09-19' });
    expect(current.releaseReview).toEqual({ latestCompleted: 'R6', next: 'R7', status: 'pending' });
    expect(current.scope.learningUnits).toEqual([...release.scope.learningUnits, 'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08', 'G09', 'H01', 'H02']);
    expect(current.scope).toMatchObject({ publicationPairs: 383, sourceRoutes: 766,
      exerciseSetPublicationPairs: 105, solutionSetPublicationPairs: 105, practiceBankEntries: 117, sourceRecords: 119 });
    const { nccl, r6Distributed, ...priorComponents } = current.compatibility.componentBoundaries;
    expect({ ...current.compatibility, componentBoundaries: priorComponents }).toEqual(release.compatibility);
    expect(nccl.version).toBe('2.31.2');
    expect(current.evidence).toEqual({ ...release.evidence,
      r6EvidenceNeutralLearningUnits: ids('G', 9),
      noCompileCheckedClaim: ['LAB18', 'EX24', 'LAB17', ...release.evidence.noCompileCheckedClaim],
      pendingHardwareVerification: ['LAB18', 'EX24', 'LAB17', ...release.evidence.pendingHardwareVerification],
      evidenceNeutralVisualExplainers: [...release.evidence.evidenceNeutralVisualExplainers, 'VIS15', 'VIS16'].sort(),
    });
    expect(release.scope.learningUnits).toEqual([...r4.scope.learningUnits, ...ids('P', 12), ...ids('T', 8)]);
    expect(release.scope.practiceBankEntries).toBeGreaterThanOrEqual(95);
    expect(release.scope).toMatchObject({ publicationPairs: 345, sourceRoutes: 690, practiceBankEntries: 102 });
    for (const id of [...release.scope.learningUnits, ...release.scope.runnableExamples, ...release.scope.labs, ...release.scope.visualExplainers]) {
      expect(PUBLISHED_DESTINATIONS[id], id).toBeDefined();
      for (const prerequisite of PUBLISHED_DESTINATIONS[id].prerequisites) expect(PUBLISHED_DESTINATIONS[prerequisite], id).toBeDefined();
    }
    for (const id of ['D01', 'EX25', 'LAB19', 'T09']) expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(id);
    expect(r4.scope.learningUnits).toHaveLength(75);
  });

  it('binds the independent Triton release profile to the canonical project rather than a Toolkit Lane', async () => {
    const project = JSON.parse(await read('examples/ex23-triton-vector-add/project.json'));
    const profile = project.compatibility.pythonEnvironment;
    const triton = release.compatibility.componentBoundaries.triton;
    expect(triton).toMatchObject({ version: profile.triton, torch: profile.torch, python: profile.python.version,
      minimumDriver: profile.minimumDriver, ptxas: profile.generatedToolchain.ptxas,
      ptxasBlackwell: profile.generatedToolchain.ptxasBlackwell, nvccInvoked: false,
      gpuCount: 1, minimumComputeCapability: project.compatibility.minimumComputeCapability,
      compilerSubsetIsRuntimeEnvironment: false, compileCheckedToolkitLanes: [], runtimeVerified: false });
    for (const file of [triton.requirementsLock, triton.compilerLock, triton.diagnosticRequirementsLock]) {
      expect(await read(file), file).toContain('--hash=sha256:');
    }
    expect(release.evidence.pendingHardwareVerification).toHaveLength(38);
    expect(release.evidence.compileChecked).toEqual(['EX02', 'EX10', 'LAB02']);
    for (const key of ['runtimeVerified', 'communityObserved', 'referenceEnvironments', 'performanceObservations', 'capturedProfilerReports'] as const) {
      expect(release.evidence[key], key).toEqual([]);
    }
  });

  it.each(['', 'en/'])('renders complete R5 units and distinct practice qualifications in %s', async (prefix) => {
    const locale = prefix ? 'en' : 'zh-CN';
    for (const slug of ['', 'about/', 'start/using-the-learning-site/', 'labs/', 'sources-and-versions/']) {
      const { document } = parseHTML(await read(`dist/${prefix}${slug}index.html`));
      expect(metadata(document, 'fact-check-date'), `${prefix}${slug}`).toBe('2026-09-22');
      expect(document.body.textContent, `${prefix}${slug}`).not.toMatch(/(?:further Triton units remain unpublished|Triton destinations remain absent|更后续 Triton 单元尚未发布|Triton 目的地仍不存在|All 19 Visual Explainers|19 项可视化讲解仍)/i);
    }
    for (const id of [...ids('P', 12), ...ids('T', 8)]) {
      const route = PUBLISHED_DESTINATIONS[id].href[locale];
      const { document } = parseHTML(await read(`dist${route}index.html`));
      for (const field of ['evidence-compilation', 'evidence-runtime', 'expected-observations', 'recorded-observations']) {
        expect(metadata(document, field), `${id} ${field}`).toBe('none');
      }
      expect(document.querySelector(`a[href="${route}exercises/"]`), id).not.toBeNull();
      expect(document.querySelector(`a[href="${route}solutions/"]`), id).not.toBeNull();
    }
    const { document } = parseHTML(await read(`dist/${prefix}practice/index.html`));
    const qualified = release.scope.pytorchAndTritonPracticeEntries;
    expect(qualified.length).toBeGreaterThanOrEqual(8);
    expect(new Set(qualified).size).toBe(qualified.length);
    const titles = new Set<string>();
    for (const id of qualified) {
      const card = document.querySelector(`[data-resource-id="${id}"]`);
      expect(card, id).not.toBeNull();
      expect(document.getElementById(id.toLowerCase()), id).not.toBeNull();
      const heading = card?.querySelector('h3, h2, h4')?.textContent?.trim();
      expect(heading, id).toBeTruthy();
      titles.add(heading!);
      expect([...card!.querySelectorAll('a[href]')].some((a) => /\/(frameworks|triton)\//.test(a.getAttribute('href') ?? '')), id).toBe(true);
    }
    expect(titles.size).toBe(qualified.length);
    const sourcePage = parseHTML(await read(`dist/${prefix}sources-and-versions/index.html`)).document;
    expect(sourcePage.getElementById('r5-aggregate-review')).not.toBeNull();
    expect(sourcePage.body.textContent).toContain('2026-09-19');
  });
});
