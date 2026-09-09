// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { expect, it } from 'vitest';
import { loadCanonicalExample, loadCompileEvidence, readCanonicalRange,
  validateCanonicalExample } from '../../scripts/lib/canonical-examples.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const exampleRoot = path.join(root, 'examples/ex19-cufft-batched-transform');
const ranges = ['cpu-reference', 'plan-layout', 'stream-lifecycle'];
const execFileAsync = promisify(execFile);

it('binds every standalone file to the immutable downloadable source revision', async () => {
  const example = await loadCanonicalExample(root, 'EX19');
  for (const relative of ['project.json', 'README.md', 'evidence/README.md', ...new Set([
    ...example.build.inputs, ...example.build.hostTestInputs, ...example.build.contractFiles,
  ])]) {
    const file = `${example.root}/${relative}`;
    const { stdout } = await execFileAsync('git', ['show', `${example.sourceCommit}:${file}`], {
      cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024,
    });
    expect(await readFile(path.join(root, file), 'utf8'), file).toBe(stdout);
  }
});

it('exposes a standalone eight-file C2C project and three nonempty canonical build-input ranges', async () => {
  const example = await loadCanonicalExample(root, 'EX19');
  expect(example).toMatchObject({
    id: 'EX19', root: 'examples/ex19-cufft-batched-transform', license: 'Apache-2.0', provenance: 'original',
    build: { standard: 'c++17', stages: ['preprocess', 'compile', 'link', 'inspect'] },
    correctness: {
      transformType: 'CUFFT_C2C', precision: 'FP32', placement: 'out-of-place',
      rank: 1, length: 4, batch: 2,
      inputLayout: { stride: 2, distance: 11, embedding: [4], allocationElements: 22 },
      outputLayout: { stride: 3, distance: 16, embedding: [4], allocationElements: 32 },
      absoluteTolerance: 0.0001, relativeTolerance: 0.00002,
    },
    compatibility: { supportedEnvironment: 'Native Linux', minimumComputeCapability: '7.5' },
    evidence: { compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] },
  });
  const files = (await readdir(exampleRoot, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(exampleRoot, path.join(entry.parentPath, entry.name)))
    .filter((file) => !file.startsWith(`build${path.sep}`)).sort();
  expect(files).toEqual([
    'Makefile', 'README.md', 'evidence/README.md', 'include/cufft_batched_reference.hpp',
    'project.json', 'scripts/compile-check.sh', 'src/cufft_batched_transform.cu', 'tests/host_reference_test.cpp',
  ]);
  expect(Object.keys(example.ranges)).toEqual(ranges);
  for (const name of ranges) {
    const range = await readCanonicalRange(root, 'EX19', name);
    expect(range.code.trim()).not.toBe('');
    expect(example.build.inputs).toContain(range.file);
    expect(range.language).toBe('cpp');
  }
  expect(await validateCanonicalExample(root, 'EX19')).toEqual([]);
  expect(await loadCompileEvidence(root, 'EX19')).toEqual([]);
});

it('keeps cuFFT component pins independent of Toolkit labels and matches the owner archive hashes', async () => {
  const example = await loadCanonicalExample(root, 'EX19');
  const ex18 = await loadCanonicalExample(root, 'EX18');
  expect(example.compatibility.lanes).toEqual(ex18.compatibility.lanes);
  expect(example.compatibility.checks.map((check: Record<string, unknown>) => [
    check.toolkitLane, check.dialect, check.kind, check.component, check.componentVersion,
    check.expectedCufftVersion, check.archiveSha256,
  ])).toEqual([
    ['cuda-11.8', 'c++17', 'ex19', 'cuFFT', '10.9.0.58', '10.9.0.58', 'eadca0b30a4a2c1f741fde88d6dd611604e488fdb51c676861eabc08d2c4612f'],
    ['cuda-12.9', 'c++17', 'ex19', 'cuFFT', '11.4.1.4', '11.4.1.4', 'b0e65af59b0c2f6c8ed9f5552a9b375890855b7926ae2c0404d15dcf2565bda4'],
    ['cuda-13.3', 'c++17', 'ex19', 'cuFFT', '12.3.0.29', '12.3.0.29', 'b2404952a5d630fbbc13e12d36975ef87a9c05c71c321c2cb5b3820789e47462'],
  ]);
  expect(example.compatibility.versionGate.macros).toEqual([
    'CUFFT_VER_MAJOR', 'CUFFT_VER_MINOR', 'CUFFT_VER_PATCH', 'CUFFT_VER_BUILD',
  ]);
  expect(example.compatibility.versionGate.runtime).toContain('major/minor/patch');
  expect(example.compatibility.versionGate.runtime).toContain('not exposed');
});

it('publishes the EX19 pair through the canonical registry without copying its code or upgrading evidence', async () => {
  const example = await loadCanonicalExample(root, 'EX19');
  const registry = JSON.parse(await readFile(path.join(root, 'src/canonical-example-publications.json'), 'utf8'));
  expect(registry.examples.EX19).toBeDefined();
  expect(example.sourceUrl).toBe(registry.examples.EX19.sourceUrl);
  expect(example.downloadUrl).toBe(registry.examples.EX19.downloadUrl);
  const pages = await Promise.all(['', 'en/'].map(async (locale) => parseFrontmatter(await readFile(
    path.join(root, 'src/content/docs', `${locale}examples/cufft-batched-transform.mdx`), 'utf8'))));
  for (const page of pages) {
    expect(page.frontmatter).toMatchObject({
      pairId: 'ex19', unitId: 'EX19', resourceKind: 'runnable-example', prerequisites: ['L12'],
      canonicalExample: 'EX19', canonicalRanges: ranges,
      evidence: { compilation: [], runtime: ['Pending Hardware Verification'], recordedObservations: [] },
    });
    expect([...page.content.matchAll(/<CanonicalCode\s+exampleId="EX19"\s+range="([^"]+)"\s*\/>/g)]
      .map((match) => match[1])).toEqual(ranges);
    expect(page.content).toContain(example.sourceUrl);
    expect(page.content).toContain(example.downloadUrl);
    expect(page.content).not.toMatch(/```(?:cuda|cpp|c\+\+)/i);
  }
  for (const field of ['structure', 'sources', 'factCheckDate', 'relatedUnits']) {
    expect(pages[0].frontmatter[field], field).toEqual(pages[1].frontmatter[field]);
  }
});

it('includes the four issue-39 Publication Pairs in the public inventory', async () => {
  const { scope } = JSON.parse(await readFile(path.join(root, 'src/current-publication-manifest.json'), 'utf8'));
  expect(scope.learningUnits).toContain('L12');
  expect(scope.runnableExamples).toContain('EX19');
  expect(scope.publicationPairs).toBe(277);
  expect(scope.sourceRoutes).toBe(554);
  for (const [pair, slug] of [
    ['l12', 'libraries/cufft-plans-layouts-startup.mdx'],
    ['l12-exercises', 'libraries/cufft-plans-layouts-startup/exercises.md'],
    ['l12-solutions', 'libraries/cufft-plans-layouts-startup/solutions.md'],
    ['ex19', 'examples/cufft-batched-transform.mdx'],
  ]) {
    for (const locale of ['', 'en/']) {
      const page = parseFrontmatter(await readFile(path.join(root, 'src/content/docs', `${locale}${slug}`), 'utf8'));
      expect(page.frontmatter.pairId).toBe(pair);
    }
  }
});
