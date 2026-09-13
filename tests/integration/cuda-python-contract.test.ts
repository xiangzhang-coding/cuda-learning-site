// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { curriculumIdSchema, evidenceMetadataSchema, sourceReferenceSchema } from '../../src/content-metadata';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS, validateResourceCatalog } from '../../src/resource-indexes/resource-index-model';

const root = path.resolve(import.meta.dirname, '../..');
const units = [
  { id: 'P01', slug: 'python/cuda-python-bridge', prerequisites: ['F04', 'M07'] },
  { id: 'P02', slug: 'python/devices-contexts-launches', prerequisites: ['P01', 'F07'] },
  { id: 'P03', slug: 'python/runtime-compilation-linking', prerequisites: ['P02', 'M15', 'M16'] },
];
const example = 'examples/cuda-python-launch';
const locales = ['', 'en/'];
const reviewedOn = '2026-09-12';
const emptyEvidence = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };

async function source(locale: string, slug: string, extension = 'mdx') {
  const raw = await readFile(path.join(root, 'src/content/docs', `${locale}${slug}.${extension}`), 'utf8');
  return { raw, metadata: parseFrontmatter(raw).frontmatter };
}

describe('issue #42 CUDA Python publication contract', () => {
  it('static: extends the current scope without certifying R5 or upgrading evidence', async () => {
    const [current, r4] = await Promise.all(['current-publication', 'r4-release'].map(async (name) =>
      JSON.parse(await readFile(path.join(root, `src/${name}-manifest.json`), 'utf8'))));
    expect(current).toMatchObject({
      reviewDate: '2026-09-12',
      releaseReview: { latestCompleted: 'R4', next: 'R5', status: 'pending' },
      scope: { publicationPairs: 299, sourceRoutes: 598, exerciseSetPublicationPairs: 81,
        solutionSetPublicationPairs: 81, practiceBankEntries: 89, sourceRecords: 99 },
    });
    expect(current.scope.learningUnits).toEqual([...r4.scope.learningUnits, 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07']);
    expect(current.scope.runnableExamples).toEqual([...r4.scope.runnableExamples, 'EX21']);
    for (const field of ['labs', 'visualExplainers', 'nsightReportAnalysisPracticeEntries', 'libraryAlgorithmChoicePracticeEntries']) {
      expect(current.scope[field], field).toEqual(r4.scope[field]);
    }
    expect(current.compatibility).toMatchObject(r4.compatibility);
    expect(current.compatibility.componentBoundaries.cudaPython).toEqual({
      selection: 'independently-pinned', reviewedOn: '2026-09-12',
      core: { version: '1.2.0', commit: '53b43746e501f1a0b627f951604991636f77cd9c' },
      bindings: { version: '13.4.1', commit: '0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa' },
      python: { version: '3.14.7', abi: 'cp314-cp314', freeThreaded: false },
      runtimeDependencies: { 'cuda-pathfinder': '1.8.1', numpy: '2.5.3' },
      exampleProfile: { environmentId: 'cpython-3-14-7-cuda-13-3-1', host: 'Ubuntu 24.04 x86-64', toolkit: '13.3.1', driver: '610.43.02',
        nvrtc: '13.3.33', nvJitLink: '13.3.33', minimumComputeCapability: '7.5', gpuCount: 1 },
      compileCheckedToolkitLanes: [],
    });
    expect(current.evidence).toEqual({
      ...r4.evidence,
      noCompileCheckedClaim: [...r4.evidence.noCompileCheckedClaim.filter((id: string) => id.startsWith('EX')), 'EX21',
        ...r4.evidence.noCompileCheckedClaim.filter((id: string) => id.startsWith('LAB'))],
      pendingHardwareVerification: [...r4.evidence.pendingHardwareVerification.filter((id: string) => id.startsWith('EX')), 'EX21',
        ...r4.evidence.pendingHardwareVerification.filter((id: string) => id.startsWith('LAB'))],
      r5EvidenceNeutralLearningUnits: ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07'],
    });
    expect(current.knownLimitations.join(' ')).toMatch(/EX21.*Pending Hardware Verification/);
    expect(current.knownLimitations.join(' ')).toMatch(/P01-P07.*no Evidence Status/);
    expect(current.scope.glossaryTerms).toBe(204);
  });

  it.each(units)('static: publishes $id and its original exercises and solutions as complete evidence-neutral pairs', async ({ id, slug, prerequisites }) => {
    for (const suffix of ['', 'exercises', 'solutions']) {
      const pageSlug = suffix ? `${slug}/${suffix}` : slug;
      const pageId = suffix ? `${id}-${suffix.toUpperCase()}` : id;
      const required = suffix === 'exercises' ? [id] : suffix === 'solutions' ? [`${id}-EXERCISES`] : prerequisites;
      const kind = suffix === 'exercises' ? 'exercise-set' : suffix === 'solutions' ? 'solution-set' : 'learning-unit';
      const pages = await Promise.all(locales.map((locale) => source(locale, pageSlug, suffix ? 'md' : 'mdx')));
      for (const field of ['pairId', 'structure', 'unitId', 'resourceKind', 'prerequisites', 'relatedUnits', 'sources', 'factCheckDate', 'evidence']) {
        expect(pages[0].metadata[field], `${pageId}: ${field}`).toEqual(pages[1].metadata[field]);
      }
      for (const [index, { raw, metadata: m }] of pages.entries()) {
        const counterpart = `/${locales[1 - index]}${pageSlug}/`;
        expect(m).toMatchObject({ pairId: pageId.toLowerCase(), unitId: pageId, resourceKind: kind,
          prerequisites: required, counterpart, factCheckDate: reviewedOn, evidence: emptyEvidence,
          hardwareGate: 'none', license: 'CC-BY-4.0', provenance: 'original' });
        expect(curriculumIdSchema.safeParse(m.unitId).success).toBe(true);
        expect(evidenceMetadataSchema.safeParse(m.evidence).success).toBe(true);
        const head = Object.fromEntries(m.head.map((entry: { attrs: { name: string; content: string } }) => [entry.attrs.name, entry.attrs.content]));
        expect(head).toMatchObject({
          'cuda:pair-id': pageId.toLowerCase(), 'cuda:unit-id': pageId, 'cuda:resource-kind': kind,
          'cuda:counterpart': counterpart, 'cuda:prerequisites': required.join(','),
          'cuda:structure': m.structure.join(','), 'cuda:fact-check-date': reviewedOn,
          'cuda:license': 'CC-BY-4.0', 'cuda:provenance': 'original',
          'cuda:evidence-compilation': 'none', 'cuda:evidence-runtime': 'none',
          'cuda:expected-observations': 'none', 'cuda:recorded-observations': 'none',
          'cuda:source-count': String(m.sources.length),
        });
        expect(m.sources.length).toBeGreaterThan(0);
        for (const record of m.sources) {
          expect(sourceReferenceSchema.safeParse(record).success, record.url).toBe(true);
          expect(record.accessDate).toBe(reviewedOn);
        }
        expect(raw).toContain(`href="${counterpart}"`);
        expect(raw).toContain(`/${locales[index]}${example}/`);
        expect(raw).not.toMatch(/<iframe\b|<canvas\b/);
        if (!suffix) {
          expect(m.canonicalExample).toBe('EX21');
          expect(m.canonicalRanges.length).toBeGreaterThan(0);
          const imports = [...raw.matchAll(/<CanonicalCode exampleId="EX21" range="([a-z0-9-]+)"\s*\/>/g)].map((match) => match[1]);
          expect(imports).toEqual(m.canonicalRanges);
          expect(head['cuda:canonical-ranges']).toBe(m.canonicalRanges.join(','));
          expect(head['cuda:canonical-example']).toBe('EX21');
        }
      }
    }
    for (const locale of locales) {
      const lesson = await source(locale, slug);
      const retrieval = lesson.raw.split(locale ? '## Retrieval check' : '## 提取式自测')[1]?.split('\n## ')[0];
      expect(retrieval?.match(/^\d\. /gm), `${locale}${id} retrieval`).toHaveLength(5);
      const exercises = await source(locale, `${slug}/exercises`, 'md');
      const solutions = await source(locale, `${slug}/solutions`, 'md');
      const tasks = [...exercises.raw.matchAll(/^## (?:Exercise|练习) (\d+)[:：]([^]*?)(?=^## |$(?![^]))/gm)];
      expect(tasks.length).toBeGreaterThanOrEqual(2);
      for (const task of tasks) {
        for (const label of locale ? ['Goal', 'Constraints', 'Expected evidence', 'Acceptance criteria'] : ['目标', '约束', '预期提交证据', '验收标准']) {
          expect(task[2]).toContain(`**${label}`);
        }
        const hints = [...parseHTML(task[2]).document.querySelectorAll('details')];
        expect(hints).toHaveLength(2);
        for (const [index, hint] of hints.entries()) {
          expect(hint.hasAttribute('open')).toBe(false);
          const summary = hint.querySelector('summary')!.textContent!;
          expect(summary).toMatch(new RegExp(`^(?:Hint|提示) ${index + 1}[:：]`));
          expect(hint.textContent!.replace(summary, '').trim().length).toBeGreaterThan(30);
        }
      }
      expect([...solutions.raw.matchAll(/^## (?:Solution|解答) (\d+)[:：]/gm)].map((match) => match[1]))
        .toEqual(tasks.map((task) => task[1]));
      expect(solutions.raw).not.toContain('<details');
      expect(solutions.raw).toMatch(/^## (?:Valid alternatives|合法替代)/m);
      expect(solutions.raw).toMatch(/^## (?:Common errors|常见错误)/m);
    }
  });

  it('static: P02 maps C++ lifecycle responsibilities to core and exercises that transfer', async () => {
    const mappings = [
      ['cudaSetDevice', 'dev.set_current()'],
      ['cuDevicePrimaryCtxRetain', 'dev.context'],
      ['cudaMalloc', 'dev.allocate'],
      ['cudaMallocAsync', 'dev.allocate'],
      ['cudaMallocHost', 'LegacyPinnedMemoryResource'],
      ['cudaMemcpyAsync', 'copy_from'],
      ['cudaStreamCreateWithFlags', 'create_stream'],
      ['cuModuleGetFunction', 'get_kernel'],
      ['cuLaunchKernel', 'launch('],
      ['cudaStreamSynchronize', 's.sync()'],
      ['cudaFree', 'buffer.close'],
      ['cudaStreamDestroy', 's.close()'],
    ];
    for (const locale of locales) {
      const lesson = await source(locale, 'python/devices-contexts-launches');
      const rows = lesson.raw.split('\n').filter((line) => line.startsWith('|'));
      for (const [cpp, python] of mappings) {
        expect(rows.some((row) => row.includes(cpp) && row.includes(python)),
          `${locale}P02: ${cpp} -> ${python}`).toBe(true);
      }
      const exercises = await source(locale, 'python/devices-contexts-launches/exercises', 'md');
      expect(exercises.raw).toContain(locale ? '**Transfer task:**' : '**迁移任务：**');
      for (const api of ['cudaMalloc', 'cudaMemcpyAsync', 'cudaStreamSynchronize']) {
        expect(exercises.raw).toContain(api);
      }
      const solutions = await source(locale, 'python/devices-contexts-launches/solutions', 'md');
      expect(solutions.raw.split('\n').some((line) => line.startsWith('|')
        && line.includes('cudaMemcpyAsync') && line.includes('copy_from'))).toBe(true);
    }
  });

  it('static: gives each Python Practice Bank entry and source record a published prerequisite destination', async () => {
    expect(() => validateResourceCatalog(RESOURCE_INDEX_RECORDS, { asOf: new Date('2026-09-12T12:00:00Z') })).not.toThrow();
    const practice = RESOURCE_INDEX_RECORDS.filter(({ planningId }) => /^PB-R5-00[1-3]$/.test(planningId));
    expect(practice.map(({ planningId }) => planningId)).toEqual(['PB-R5-001', 'PB-R5-002', 'PB-R5-003']);
    for (const [index, record] of practice.entries()) {
      expect(record.prerequisites).toEqual([units[index].id]);
      expect(record.evidence).toBeUndefined();
      for (const locale of ['zh-CN', 'en'] as const) {
        expect(record.versionGate[locale]).toBeTruthy();
        expect(record.hardwareGate[locale]).toBeTruthy();
        expect(PUBLISHED_DESTINATIONS[units[index].id].href[locale]).toContain(units[index].slug);
      }
    }
    for (const id of ['SRC-CUDA-077', 'SRC-CUDA-078', 'SRC-CUDA-079']) {
      const record = RESOURCE_INDEX_RECORDS.find(({ planningId }) => planningId === id);
      expect(record, id).toMatchObject({ group: 'sources', reviewedOn, sourceAccessDate: reviewedOn });
      expect(record!.relatedUnits.some((id) => /^P0[123]$/.test(id)), id).toBe(true);
    }
    for (const locale of locales) {
      const page = await source(locale, 'practice');
      const sources = await source(locale, 'sources-and-versions');
      for (const record of practice) {
        expect(page.raw).toContain(`id="${record.planningId.toLowerCase()}"`);
        expect(page.raw).toContain(`/${locale}${units.find(({ id }) => id === record.prerequisites[0])!.slug}/`);
      }
      for (const id of ['077', '078', '079']) expect(sources.raw).toContain(`id="src-cuda-${id}"`);
    }
  });

  it('static: keeps EX21 canonical, independently pinned, and pending hardware verification', async () => {
    const project = JSON.parse(await readFile(path.join(root, 'examples/ex21-cuda-python-launch/project.json'), 'utf8'));
    expect(project).toMatchObject({
      id: 'EX21', license: 'Apache-2.0', provenance: 'original',
      build: { hostLanguage: 'python', gpuExecutionInBuild: false, driverInitializationInBuild: false },
      compatibility: { lanes: [], pythonEnvironment: {
        id: 'cpython-3-14-7-cuda-13-3-1',
        python: { implementation: 'CPython', version: '3.14.7', gil: true, abi: 'cp314-cp314' },
        distributions: { 'cuda-core': '1.2.0', 'cuda-bindings': '13.4.1', 'cuda-pathfinder': '1.8.1', numpy: '2.5.3' },
        extras: [], toolkit: '13.3.1', nvrtc: '13.3.33', nvJitLink: '13.3.33', driver: { target: '610.43.02' },
      } },
      evidence: { compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] },
    });
    const pages = await Promise.all(locales.map((locale) => source(locale, example)));
    for (const field of ['pairId', 'structure', 'unitId', 'prerequisites', 'canonicalExample', 'canonicalRanges', 'toolkitLanes', 'evidence', 'sources']) {
      expect(pages[0].metadata[field], field).toEqual(pages[1].metadata[field]);
    }
    for (const [index, { raw, metadata: m }] of pages.entries()) {
      expect(m).toMatchObject({ pairId: 'ex21', unitId: 'EX21', resourceKind: 'runnable-example',
        factCheckDate: reviewedOn, prerequisites: ['P02'], canonicalExample: 'EX21', exampleIds: ['EX21'],
        minimumComputeCapability: '7.5', gpuCount: 1,
        evidence: { compilation: [], runtime: ['Pending Hardware Verification'], recordedObservations: [] },
        license: 'CC-BY-4.0', provenance: 'original' });
      expect(evidenceMetadataSchema.safeParse(m.evidence).success).toBe(true);
      expect(m.evidence.expectedObservations.length).toBeGreaterThan(0);
      expect(m.canonicalRanges.length).toBeGreaterThanOrEqual(3);
      expect(new Set(m.canonicalRanges).size).toBe(m.canonicalRanges.length);
      for (const range of m.canonicalRanges) expect(project.ranges, range).toHaveProperty(range);
      const imports = [...raw.matchAll(/<CanonicalCode exampleId="EX21" range="([a-z0-9-]+)"\s*\/>/g)].map((match) => match[1]);
      expect(imports).toEqual(m.canonicalRanges);
      expect(raw).not.toMatch(/```(?:python|py|cuda|cpp|c\+\+)\b/);
      for (const pin of ['3.14.7', '1.2.0', '13.4.1', '1.8.1', '2.5.3', '13.3.1', '13.3.33', '610.43.02']) {
        expect(raw, pin).toContain(pin);
      }
      expect(raw).toMatch(/host-test/);
      expect(raw).toMatch(/build/);
      expect(raw).toContain(`href="/${locales[1 - index]}${example}/"`);
      for (const record of m.sources) {
        expect(sourceReferenceSchema.safeParse(record).success, record.url).toBe(true);
        expect(record.accessDate).toBe(reviewedOn);
      }
    }
  });
});
