// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, expect, it } from 'vitest';
import { parseFrontmatter } from '@astrojs/markdown-remark';

import { readCanonicalRange } from '../../scripts/lib/canonical-examples.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const directory = mkdtempSync(path.join(tmpdir(), 'lab12-host-'));
const binary = path.join(directory, 'lab12-host');

beforeAll(() => {
  const build = spawnSync('c++', [
    '-std=c++17', '-Wall', '-Wextra', '-Werror', '-DLAB12_HOST_ONLY', '-x', 'c++',
    '-I', 'examples/ex15-tiled-gemm/include',
    '-I', 'examples/ex18-cublas-gemm/include',
    'public/assets/exercise-solutions/lab12-gemm-comparison.cu', '-o', binary,
  ], { cwd: root, encoding: 'utf8' });
  expect(build.status, build.stderr).toBe(0);
});

afterAll(() => rmSync(directory, { recursive: true, force: true }));

it('checks a complete row-major matrix against the real double CPU oracle without CUDA', () => {
  const result = spawnSync(binary, ['--check-output', '2x3x2-hand'], {
    input: '22 28 49 64\n', encoding: 'utf8',
  });
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain('correctness=PASS');
  expect(result.stdout).not.toContain('elapsed');
});

it('checks actual EX15/EX18 fixture bytes, scalars and CPU references before GPU acquisition', () => {
  const result = spawnSync(binary, ['--check-fixtures'], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim().split('\n')).toEqual([
    'fixture=2x3x2-hand alpha=1 beta=0 input_contract=PASS',
    'fixture=33x31x35-partial alpha=0.75 beta=0.25 input_contract=PASS',
    'fixture=32x32x32-aligned alpha=1 beta=0 input_contract=PASS',
  ]);
});

it.each([
  ['wrong row-major order', '22 49 28 64'],
  ['outside tolerance', '22.01 28 49 64'],
  ['NaN', 'nan 28 49 64'],
  ['infinity', '22 inf 49 64'],
  ['short matrix', '22 28 49'],
  ['extra value', '22 28 49 64 0'],
  ['malformed value', '22x 28 49 64'],
])('rejects %s instead of reporting a CUDA result', (_, input) => {
  const result = spawnSync(binary, ['--check-output', '2x3x2-hand'], { input, encoding: 'utf8' });
  expect(result.status).not.toBe(0);
  expect(result.stdout).not.toContain('correctness=PASS');
  expect(result.stderr.length).toBeGreaterThan(0);
});

it('the published extraction command supplies exactly the displayed EX18 GEMM range to the build', async () => {
  const page = readFileSync(path.join(root, 'src/content/docs/en/labs/compare-gemm-with-cublas.mdx'), 'utf8');
  const command = page.match(/^sed -n [^\n]+\n[^\n]+/m)?.[0];
  expect(command).toBeDefined();
  const result = spawnSync('bash', ['-c', command!], {
    cwd: root, env: { ...process.env, run_dir: directory }, encoding: 'utf8',
  });
  expect(result.status, result.stderr).toBe(0);
  const generated = readFileSync(path.join(directory, 'lab12-ex18-gemm-call.inc'), 'utf8');
  const canonical = await readCanonicalRange(root, 'EX18', 'gemm-call');
  expect(generated.trimEnd().split('\n').slice(1, -1).join('\n')).toBe(canonical.code);
  expect(canonical.code).toContain('cublasGemmEx(');
});

it('publishes the same LAB12 contract, canonical ranges, and executable instructions in both locales', () => {
  const pages = ['', 'en/'].map((locale) => parseFrontmatter(readFileSync(path.join(
    root, `src/content/docs/${locale}labs/compare-gemm-with-cublas.mdx`,
  ), 'utf8')));
  for (const { frontmatter, content } of pages) {
    expect(frontmatter).toMatchObject({
      pairId: 'lab12', unitId: 'LAB12', resourceKind: 'lab',
      factCheckDate: '2026-09-06', prerequisites: ['Q13', 'L06'],
      relatedUnits: ['L07', 'EX15', 'EX18', 'VIS12'],
      canonicalExample: 'EX18', canonicalRanges: ['cpu-reference', 'gemm-call', 'stream-lifecycle'],
      minimumComputeCapability: '7.5', gpuCount: 1, maximumProblemMemoryBytes: 8000000000,
      evidence: { compilation: [], runtime: ['Pending Hardware Verification'], recordedObservations: [] },
    });
    expect(frontmatter.estimatedMinutes).toBeGreaterThanOrEqual(60);
    expect(frontmatter.estimatedMinutes).toBeLessThanOrEqual(90);
    expect(content).toContain('/assets/exercise-solutions/lab12-gemm-comparison.cu');
    expect(content).toContain('data-locale-counterpart');
    expect(content.match(/<CanonicalCode[^>]+\/>/g)).toEqual([
      '<CanonicalCode exampleId="EX18" range="cpu-reference" />',
      '<CanonicalCode exampleId="EX18" range="gemm-call" />',
      '<CanonicalCode exampleId="EX18" range="stream-lifecycle" />',
    ]);
  }
  for (const key of ['structure', 'sources', 'evidence', 'toolkitLanes']) {
    expect(pages[0].frontmatter[key], key).toEqual(pages[1].frontmatter[key]);
  }
  const fences = (content: string) => content.match(/```[^`]*```/g);
  expect(fences(pages[0].content)).toEqual(fences(pages[1].content));
  for (const block of pages[0].content.matchAll(/```bash\n([\s\S]*?)```/g)) {
    const syntax = spawnSync('bash', ['-n'], { input: block[1], encoding: 'utf8' });
    expect(syntax.status, syntax.stderr).toBe(0);
  }
});
