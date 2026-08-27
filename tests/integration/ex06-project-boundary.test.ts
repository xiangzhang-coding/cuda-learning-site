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
const exampleRoot = path.join(projectRoot, 'examples/ex06-shared-memory-tile-bank-padding');
const sourceCommit = 'd85a86640b6ec0452542d6e9cbfd5827bb3c87a6';

describe('EX06 standalone project boundary', () => {
  it('declares one templated C++17 CUDA implementation and immutable project coordinates', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX06');

    expect(await validateCanonicalExample(projectRoot, 'EX06')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX06',
      root: 'examples/ex06-shared-memory-tile-bank-padding',
      sourceCommit,
      sourceUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex06-shared-memory-tile-bank-padding`,
      downloadUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
      license: 'Apache-2.0',
      provenance: 'original',
    });
    await expect(execFileAsync(
      'git',
      ['cat-file', '-e', `${sourceCommit}:examples/ex06-shared-memory-tile-bank-padding/project.json`],
      { cwd: projectRoot },
    )).resolves.toBeDefined();
    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: [
        'include/shared_memory_tile_bank_padding_reference.hpp',
        'src/shared_memory_tile_bank_padding.cu',
      ],
      hostTestInputs: [
        'include/shared_memory_tile_bank_padding_reference.hpp',
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
        'build/shared_memory_tile_bank_padding.ii',
        'build/shared_memory_tile_bank_padding.o',
        'build/ex06-shared-memory-tile-bank-padding',
      ],
    });

    const implementationFiles = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => /\.(?:cu|cpp|hpp)$/.test(file));
    expect(implementationFiles.filter((file) => file.endsWith('.cu'))).toEqual([
      'src/shared_memory_tile_bank_padding.cu',
    ]);
  });

  it('pins one warp, both tile layouts, and a conservative memory bound', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX06');

    expect(example.correctness).toEqual({
      cpuReference: 'include/shared_memory_tile_bank_padding_reference.hpp',
      tileExtent: [32, 32],
      threadsPerBlock: 32,
      blocks: 1,
      readColumn: 5,
      bankCount: 32,
      bankWordBytes: 4,
      layouts: [
        { id: 'unpadded', padding: 0, sharedExtent: [32, 32] },
        { id: 'padded', padding: 1, sharedExtent: [32, 33] },
      ],
      inputElements: 1024,
      outputElementsPerVariant: 32,
    });
    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 8576,
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
  });

  it('imports exactly the shared-layouts and tiled-kernels ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX06');
    expect(example.ranges).toEqual({
      'shared-layouts': {
        file: 'src/shared_memory_tile_bank_padding.cu',
        startMarker: '// [ex06-shared-layouts-start]',
        endMarker: '// [ex06-shared-layouts-end]',
        language: 'cpp',
      },
      'tiled-kernels': {
        file: 'src/shared_memory_tile_bank_padding.cu',
        startMarker: '// [ex06-tiled-kernels-start]',
        endMarker: '// [ex06-tiled-kernels-end]',
        language: 'cpp',
      },
    });

    const layouts = await readCanonicalRange(projectRoot, 'EX06', 'shared-layouts');
    expect(layouts.code).toContain('float values[32][32];');
    expect(layouts.code).toContain('float values[32][33];');

    const kernels = await readCanonicalRange(projectRoot, 'EX06', 'tiled-kernels');
    expect(kernels.code).toContain('template <unsigned int Padding>');
    expect(kernels.code).toContain('__shared__ SharedTile<Padding> tile;');
    expect(kernels.code).toContain('linear += kWarpSize');
    expect(kernels.code).toContain('__syncthreads();');
    expect(kernels.code).toContain('output[lane] = tile.values[lane][column];');
  });

  it('launches unpadded and padded variants from the same template without timing', async () => {
    const source = await readFile(
      path.join(exampleRoot, 'src/shared_memory_tile_bank_padding.cu'),
      'utf8',
    );

    expect(source).toContain('tiled_column_access<0U><<<1U, kWarpSize>>>(');
    expect(source).toContain('tiled_column_access<1U><<<1U, kWarpSize>>>(');
    expect(source).toContain('variant=unpadded result=');
    expect(source).toContain('variant=padded result=');
    expect(source).not.toMatch(/cudaEvent|chrono|milliseconds?|GB\/s|speedup|throughput/i);
  });

  it('runs the CUDA-free tile, bank, and paired-output host model', async () => {
    const [header, hostTest, makefile, compileScript] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/shared_memory_tile_bank_padding_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostTarget = makefile.slice(makefile.indexOf('host-test:'), makefile.indexOf('\nclean:'));

    expect(`${header}\n${hostTest}`).not.toMatch(/#include\s*[<"]cuda|__host__|__device__|<<<|>>>/);
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|ex06-shared-memory-tile-bank-padding/);
    expect(compileScript).not.toMatch(
      /(?:^|\n)\s*(?:\.\/)?build\/ex06-shared-memory-tile-bank-padding(?:\s|$)/,
    );

    const { stdout } = await execFileAsync('make', ['host-test'], {
      cwd: exampleRoot,
      env: { ...process.env, BUILD_DIR: '.quality/host-test' },
    });
    expect(stdout).toContain('host-reference: pass');
  }, 15_000);

  it('publishes ordered M03/M04 prerequisites and the exact canonical ranges', async () => {
    for (const localePrefix of ['', 'en/']) {
      const page = await readFile(
        path.join(projectRoot, `src/content/docs/${localePrefix}examples/shared-memory-tile-bank-padding.mdx`),
        'utf8',
      );
      expect(page).toMatch(/^pairId: ex06$/m);
      expect(page).toMatch(/^unitId: EX06$/m);
      expect(page).toMatch(/prerequisites:\s*\n  - M03\n  - M04/);
      expect(page).toMatch(/relatedUnits:\s*\n  - VIS05/);
      expect(page).toMatch(/^factCheckDate: '2026-08-27'$/m);
      expect(page).toContain(`/tree/${sourceCommit}/examples/ex06-shared-memory-tile-bank-padding`);
      expect(
        [...page.matchAll(/<CanonicalCode exampleId="EX06" range="([^"]+)" \/>/g)]
          .map((match) => match[1]),
      ).toEqual(['shared-layouts', 'tiled-kernels']);
      expect(page).toMatch(/evidence:\s*\n  compilation: \[\]/);
      expect(page).toMatch(/recordedObservations: \[\]/);
    }
  });

  it('keeps build logs from becoming evidence and leaves runtime pending', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX06');
    const claims = await Promise.all([
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
    ]);

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(3);
    expect(example.evidence.recordedObservations).toEqual([]);
    expect(claims.join('\n')).not.toMatch(
      /Runtime-Verified|\b\d+(?:\.\d+)?\s*(?:milliseconds?|ms|GB\/s)\b|\b\d+(?:\.\d+)?x\s+speedup/i,
    );
    await expect(loadCompileEvidence(projectRoot, 'EX06')).resolves.toEqual([]);
  });
});
