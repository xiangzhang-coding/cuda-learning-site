// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import {
  loadCanonicalExample,
  loadCompileEvidence,
  readCanonicalRange,
  validateCanonicalExample,
} from '../../scripts/lib/canonical-examples.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');
const exampleRoot = path.join(projectRoot, 'examples/ex16-sanitizer-defect-suite');

const tools = ['memcheck', 'racecheck', 'initcheck', 'synccheck'] as const;
const sourcePairs = tools.map((tool) => ({
  id: tool,
  tool,
  defectSource: `src/${tool}_defect.cu`,
  correctedSource: `src/${tool}_corrected.cu`,
})) as readonly {
  id: (typeof tools)[number];
  tool: (typeof tools)[number];
  defectSource: string;
  correctedSource: string;
}[];

function canonicalRangeContract(tool: (typeof tools)[number], variant: 'defect' | 'corrected') {
  return {
    file: `src/${tool}_${variant}.cu`,
    startMarker: `// [ex16-${tool}-${variant}-start]`,
    endMarker: `// [ex16-${tool}-${variant}-end]`,
    language: 'cpp',
  };
}

function makeTarget(makefile: string, target: string, nextTarget: string) {
  const start = makefile.indexOf(`${target}:`);
  const end = makefile.indexOf(`\n${nextTarget}:`, start);
  expect(start, target).toBeGreaterThanOrEqual(0);
  expect(end, nextTarget).toBeGreaterThan(start);
  return makefile.slice(start, end);
}

describe('EX16 standalone sanitizer defect-suite boundary', () => {
  it('declares exactly four defect/corrected scenario pairs in an original C++17 Make project', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX16');

    expect(await validateCanonicalExample(projectRoot, 'EX16')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX16',
      root: 'examples/ex16-sanitizer-defect-suite',
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build).toMatchObject({
      standard: 'c++17',
      hostTestInputs: [
        'include/sanitizer_suite_contract.hpp',
        'tests/host_utility_test.cpp',
      ],
      contractFiles: ['Makefile', 'scripts/compile-check.sh'],
      stages: ['preprocess', 'compile', 'link', 'inspect'],
      commands: {
        preprocess: 'make preprocess DIALECT={dialect} BUILD_DIR=build',
        compile: 'make compile DIALECT={dialect} BUILD_DIR=build',
        link: 'make link DIALECT={dialect} BUILD_DIR=build',
        inspect: 'make inspect DIALECT={dialect} BUILD_DIR=build',
        hostTest: 'make host-test DIALECT={dialect} BUILD_DIR=build',
      },
    });
    expect(example.correctness.scenarios).toHaveLength(4);
    expect(example.correctness.scenarios).toMatchObject(sourcePairs);

    const expectedCudaSources = sourcePairs
      .flatMap(({ defectSource, correctedSource }) => [defectSource, correctedSource])
      .sort();
    const implementationFiles = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.cu'))
      .sort();
    expect(implementationFiles).toEqual(expectedCudaSources);
    for (const source of expectedCudaSources) expect(example.build.inputs).toContain(source);
    expect(example.build.inputs).toContain('include/sanitizer_suite_contract.hpp');
  });

  it('pins the Baseline GPU Capability Tier and the three C++17 Toolkit Lanes', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX16');

    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.maximumProblemMemoryBytes).toBeGreaterThan(0);
    expect(example.compatibility.maximumProblemMemoryBytes).toBeLessThanOrEqual(8_000_000_000);
    expect(example.compatibility.lanes.map((lane: {
      id: string;
      toolkit: string;
      dialects: string[];
    }) => ({
      id: lane.id,
      toolkit: lane.toolkit,
      dialects: lane.dialects,
    }))).toEqual([
      { id: 'cuda-11.8', toolkit: '11.8.0', dialects: ['c++17'] },
      { id: 'cuda-12.9', toolkit: '12.9.2', dialects: ['c++17'] },
      { id: 'cuda-13.3', toolkit: '13.3.1', dialects: ['c++17'] },
    ]);
  });

  it('publishes one canonical defect and corrected range for each sanitizer tool', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX16');
    const expectedRanges = Object.fromEntries(
      tools.flatMap((tool) => [
        [`${tool}-defect`, canonicalRangeContract(tool, 'defect')],
        [`${tool}-corrected`, canonicalRangeContract(tool, 'corrected')],
      ]),
    );

    expect(example.ranges).toEqual(expectedRanges);
    for (const tool of tools) {
      const defect = await readCanonicalRange(projectRoot, 'EX16', `${tool}-defect`);
      const corrected = await readCanonicalRange(projectRoot, 'EX16', `${tool}-corrected`);
      expect(defect.code.trim(), `${tool} defect`).not.toBe('');
      expect(corrected.code.trim(), `${tool} corrected`).not.toBe('');
      expect(corrected.code, `${tool} variants must differ`).not.toBe(defect.code);
    }
  });

  it('runs a pure-host contract while the compile script executes neither GPU code nor sanitizers', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX16');
    const [header, hostTest, makefile, compileScript] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/sanitizer_suite_contract.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_utility_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostTarget = makeTarget(makefile, 'host-test', 'clean');
    const executableArtifacts = (example.build.artifacts as string[]).filter(
      (artifact) => !/\.(?:ii|o|ptx|cubin)$/.test(artifact),
    );
    const executableLines = compileScript
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#'))
      .join('\n');

    expect(`${header}\n${hostTest}`).not.toMatch(
      /#include\s*[<"]cuda|__host__|__device__|__global__|<<<|>>>/,
    );
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|compute-sanitizer|--tool\s+(?:memcheck|racecheck|initcheck|synccheck)/);
    expect(executableLines).not.toMatch(/(?:^|\s)compute-sanitizer(?:\s|$)/m);
    for (const artifact of executableArtifacts) {
      const basename = path.posix.basename(artifact);
      const escaped = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(executableLines, basename).not.toMatch(
        new RegExp(
          `(?:^|\\n)\\s*(?:"?(?:\\$\\{?BUILD_DIR\\}?|\\.?/?build)/)?${escaped}"?(?:\\s|$)`,
          'm',
        ),
      );
    }

    const { stdout } = await execFileAsync('make', ['host-test'], {
      cwd: exampleRoot,
      env: { ...process.env, BUILD_DIR: '.quality/host-test' },
    });
    expect(stdout).toContain('host-reference: pass');
  }, 15_000);

  it('keeps public evidence empty and commits no sanitizer logs or timing results', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX16');
    const files = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .sort();

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.recordedObservations).toEqual([]);
    expect(example.evidence.expectedObservations.length).toBeGreaterThanOrEqual(4);
    const expectations = example.evidence.expectedObservations.join('\n').toLowerCase();
    for (const tool of tools) expect(expectations).toContain(tool);
    await expect(loadCompileEvidence(projectRoot, 'EX16')).resolves.toEqual([]);

    expect(files.filter((file) => /(?:^|\/)(?:logs?|timings?)(?:\/|$)|\.(?:log|csv|tsv)$/i.test(file)))
      .toEqual([]);
    expect(files.filter((file) => file.startsWith('evidence/'))).toEqual(['evidence/README.md']);

    const claims = await Promise.all([
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
      ...sourcePairs.flatMap(({ defectSource, correctedSource }) => [defectSource, correctedSource])
        .map((relativePath) => readFile(path.join(exampleRoot, relativePath), 'utf8')),
    ]);
    expect(claims.join('\n')).not.toMatch(
      /Runtime-Verified|Community-Observed|cudaEvent|std::chrono|\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s)\b/i,
    );
  });
});
