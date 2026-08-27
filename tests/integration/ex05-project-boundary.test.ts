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
const exampleRoot = path.join(projectRoot, 'examples/ex05-coalesced-strided-access');
const sourceCommit = 'd85a86640b6ec0452542d6e9cbfd5827bb3c87a6';

describe('EX05 standalone project boundary', () => {
  it('declares one shared C++17 implementation and immutable project coordinates', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX05');

    expect(await validateCanonicalExample(projectRoot, 'EX05')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX05',
      root: 'examples/ex05-coalesced-strided-access',
      sourceCommit,
      sourceUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex05-coalesced-strided-access`,
      downloadUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
      license: 'Apache-2.0',
      provenance: 'original',
    });
    await expect(execFileAsync(
      'git',
      ['cat-file', '-e', `${sourceCommit}:examples/ex05-coalesced-strided-access/project.json`],
      { cwd: projectRoot },
    )).resolves.toBeDefined();
    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: [
        'include/coalesced_strided_access_reference.hpp',
        'src/coalesced_strided_access.cu',
      ],
      hostTestInputs: [
        'include/coalesced_strided_access_reference.hpp',
        'tests/host_reference_test.cpp',
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
      artifacts: [
        'build/coalesced_strided_access.ii',
        'build/coalesced_strided_access.o',
        'build/ex05-coalesced-strided-access',
      ],
    });

    const implementationFiles = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => /\.(?:cu|cpp|hpp)$/.test(file));
    expect(implementationFiles.filter((file) => file.endsWith('.cu'))).toEqual([
      'src/coalesced_strided_access.cu',
    ]);
  });

  it('pins the three required access scenarios and safe allocation bounds', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX05');

    expect(example.correctness).toEqual({
      cpuReference: 'include/coalesced_strided_access_reference.hpp',
      logicalCount: 256,
      outputRule: 'output[logicalIndex] = input[offset + logicalIndex * stride]',
      scenarios: [
        { id: 'contiguous', stride: 1, offset: 0, requiredInputElements: 256 },
        { id: 'misaligned', stride: 1, offset: 1, requiredInputElements: 257 },
        { id: 'strided', stride: 2, offset: 0, requiredInputElements: 511 },
      ],
      maximumInputElements: 511,
      maximumOutputElements: 256,
    });
    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 3068,
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.lanes.map(({ id, toolkit, dialects }: {
      id: string;
      toolkit: string;
      dialects: string[];
    }) => ({
      id,
      toolkit,
      dialects,
    }))).toEqual([
      { id: 'cuda-11.8', toolkit: '11.8.0', dialects: ['c++17'] },
      { id: 'cuda-12.9', toolkit: '12.9.2', dialects: ['c++17'] },
      { id: 'cuda-13.3', toolkit: '13.3.1', dialects: ['c++17'] },
    ]);
    for (const lane of example.compatibility.lanes) {
      expect(lane.image).toContain(`@${lane.manifestDigest}`);
      expect(lane.manifestDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(lane.amd64Digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it('imports exactly the access-kernel and scenario-loop ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX05');
    expect(example.ranges).toEqual({
      'access-kernel': {
        file: 'src/coalesced_strided_access.cu',
        startMarker: '// [ex05-access-kernel-start]',
        endMarker: '// [ex05-access-kernel-end]',
        language: 'cpp',
      },
      'scenario-loop': {
        file: 'src/coalesced_strided_access.cu',
        startMarker: '// [ex05-scenario-loop-start]',
        endMarker: '// [ex05-scenario-loop-end]',
        language: 'cpp',
      },
    });

    const kernel = await readCanonicalRange(projectRoot, 'EX05', 'access-kernel');
    expect(kernel.code).toContain('output[logical_index] = input[offset + logical_index * stride];');
    const loop = await readCanonicalRange(projectRoot, 'EX05', 'scenario-loop');
    expect(loop.code).toContain('for (const ex05::AccessScenario& scenario : ex05::kScenarios)');
    expect(loop.code).toContain('gather_access<<<grid_size, kBlockSize>>>(');
    expect(loop.code).toContain('ex05::gather_reference(');
    expect(loop.code).toContain('scenario=" << scenario.id << " result="');
  });

  it('runs a CUDA-free host test for source indices and all three outputs', async () => {
    const [header, hostTest, makefile, compileScript] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/coalesced_strided_access_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostTarget = makefile.slice(makefile.indexOf('host-test:'), makefile.indexOf('\nclean:'));

    expect(`${header}\n${hostTest}`).not.toMatch(/#include\s*[<"]cuda|__host__|__device__|<<<|>>>/);
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|ex05-coalesced-strided-access/);
    expect(compileScript).not.toMatch(
      /(?:^|\n)\s*(?:\.\/)?build\/ex05-coalesced-strided-access(?:\s|$)/,
    );

    const { stdout } = await execFileAsync('make', ['host-test'], {
      cwd: exampleRoot,
      env: { ...process.env, BUILD_DIR: '.quality/host-test' },
    });
    expect(stdout).toContain('host-reference: pass');
  }, 15_000);

  it('publishes a matched page pair without runtime or performance claims', async () => {
    for (const localePrefix of ['', 'en/']) {
      const page = await readFile(
        path.join(projectRoot, `src/content/docs/${localePrefix}examples/coalesced-strided-access.mdx`),
        'utf8',
      );
      expect(page).toMatch(/^pairId: ex05$/m);
      expect(page).toMatch(/^unitId: EX05$/m);
      expect(page).toMatch(/prerequisites:\s*\n  - M02/);
      expect(page).toMatch(/relatedUnits:\s*\n  - VIS04/);
      expect(page).toMatch(/^factCheckDate: '2026-08-27'$/m);
      expect(page).toContain(`/tree/${sourceCommit}/examples/ex05-coalesced-strided-access`);
      expect(
        [...page.matchAll(/<CanonicalCode exampleId="EX05" range="([^"]+)" \/>/g)]
          .map((match) => match[1]),
      ).toEqual(['access-kernel', 'scenario-loop']);
      expect(page).toMatch(/evidence:\s*\n  compilation: \[\]/);
      expect(page).toMatch(/recordedObservations: \[\]/);
    }

    const claims = await Promise.all([
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'src/coalesced_strided_access.cu'), 'utf8'),
    ]);
    expect(claims.join('\n')).not.toMatch(
      /Runtime-Verified|cudaEvent|chrono|\b\d+(?:\.\d+)?\s*(?:milliseconds?|ms|GB\/s)\b|\b\d+(?:\.\d+)?x\s+speedup/i,
    );
  });

  it('keeps compilation and recorded observations empty while runtime is pending', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX05');

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(3);
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX05')).resolves.toEqual([]);
  });
});
