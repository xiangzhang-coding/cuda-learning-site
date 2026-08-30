// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
const exampleRoot = path.join(projectRoot, 'examples/ex14-tiled-transpose');
const initialSourceCommit = '0'.repeat(40);
const rangeNames = ['cpu-reference', 'tiled-transpose'] as const;

const lanes = [
  {
    id: 'cuda-11.8',
    toolkit: '11.8.0',
    operatingSystem: 'Ubuntu 22.04 x86-64',
    image: 'nvidia/cuda:11.8.0-devel-ubuntu22.04@sha256:94fd755736cb58979173d491504f0b573247b1745250249415b07fefc738e41f',
    manifestDigest: 'sha256:94fd755736cb58979173d491504f0b573247b1745250249415b07fefc738e41f',
    amd64Digest: 'sha256:60eda04ab6790aa76d73bf0df245b361eabc6d8f7b6f6cf9846c70f399b9a1eb',
    dialects: ['c++17'],
  },
  {
    id: 'cuda-12.9',
    toolkit: '12.9.2',
    operatingSystem: 'Ubuntu 24.04 x86-64',
    image: 'nvidia/cuda:12.9.2-devel-ubuntu24.04@sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5',
    manifestDigest: 'sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5',
    amd64Digest: 'sha256:420850a3fd665171b3f1fd08946c51d50468d732a46d6c42345ea04444755048',
    dialects: ['c++17'],
  },
  {
    id: 'cuda-13.3',
    toolkit: '13.3.1',
    operatingSystem: 'Ubuntu 24.04 x86-64',
    image: 'nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87',
    manifestDigest: 'sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87',
    amd64Digest: 'sha256:03c372fd9c65fe7739279f8c65473b315dc61efaaffab03e1e65bc7be7aee61e',
    dialects: ['c++17'],
  },
] as const;

const ownerSources = [
  'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#matrix-transpose-example-using-shared-memory',
  'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#supported-phases',
  'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html',
  'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html',
  'https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04',
  'https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04',
  'https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04',
] as const;

function portable(relativePath: string) {
  return relativePath.split(path.sep).join('/');
}

async function listProjectFiles() {
  const entries = await readdir(exampleRoot, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => portable(path.relative(exampleRoot, path.join(entry.parentPath, entry.name))))
    .sort();
}

function maskCppNoise(source: string) {
  return source.replace(
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (match) => match.replace(/[^\n]/g, ' '),
  );
}

function kernelBody(source: string, name: string) {
  const masked = maskCppNoise(source);
  const declaration = new RegExp(`\\b__global__\\s+void\\s+${name}\\s*\\(`).exec(masked);
  expect(declaration, `${name} declaration`).not.toBeNull();
  const bodyStart = masked.indexOf('{', declaration!.index);
  expect(bodyStart, `${name} body`).toBeGreaterThanOrEqual(0);

  let depth = 0;
  for (let index = bodyStart; index < masked.length; index += 1) {
    if (masked[index] === '{') depth += 1;
    if (masked[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(bodyStart, index + 1);
  }
  throw new Error(`Unmatched kernel body for ${name}`);
}

function makeTarget(makefile: string, target: string, nextTarget: string) {
  const start = makefile.indexOf(`${target}:`);
  const end = makefile.indexOf(`\n${nextTarget}:`, start);
  expect(start, target).toBeGreaterThanOrEqual(0);
  expect(end, nextTarget).toBeGreaterThan(start);
  return makefile.slice(start, end);
}

function executableLines(script: string) {
  return script
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .join('\n');
}

describe('EX14 standalone tiled-transpose boundary', () => {
  it('declares exactly the standalone original C++17 project and initial publication coordinates', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX14');
    const sourceCommit = example.sourceCommit as string;
    const isInitialCoordinate = sourceCommit === initialSourceCommit;
    const isPinnedCoordinate = /^[0-9a-f]{40}$/.test(sourceCommit) && !isInitialCoordinate;

    expect(await validateCanonicalExample(projectRoot, 'EX14')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX14',
      title: 'Tiled Transpose',
      root: 'examples/ex14-tiled-transpose',
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(isInitialCoordinate || isPinnedCoordinate).toBe(true);
    expect(example.sourceUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex14-tiled-transpose`,
    );
    expect(example.downloadUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
    );
    expect(await listProjectFiles()).toEqual([
      'Makefile',
      'README.md',
      'evidence/README.md',
      'include/tiled_transpose_reference.hpp',
      'project.json',
      'scripts/compile-check.sh',
      'src/tiled_transpose.cu',
      'tests/host_reference_test.cpp',
    ]);

    if (isInitialCoordinate) {
      const manifest = await readFile(path.join(exampleRoot, 'project.json'), 'utf8');
      expect(manifest.match(new RegExp(initialSourceCommit, 'g'))).toHaveLength(3);
    }
  });

  it('pins the exact build, matrix, Baseline tier, and three EX13 image contracts', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX14');

    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: ['include/tiled_transpose_reference.hpp', 'src/tiled_transpose.cu'],
      hostTestInputs: [
        'include/tiled_transpose_reference.hpp',
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
        'build/tiled_transpose.ii',
        'build/tiled_transpose.o',
        'build/ex14-tiled-transpose',
      ],
    });
    expect(example.correctness).toMatchObject({
      cpuReference: 'include/tiled_transpose_reference.hpp',
      logicalTile: [32, 32],
      blockDimensions: [32, 8],
      blockRows: 8,
      sharedTile: [32, 33],
      sharedBytesPerBlock: 4224,
      mapping: 'output[col * rows + row] = input[row * columns + col]',
    });
    expect(example.correctness.fixtures).toEqual([
      { id: '5x7', rows: 5, columns: 7, outputRows: 7, outputColumns: 5 },
      { id: '33x35', rows: 33, columns: 35, outputRows: 35, outputColumns: 33 },
      { id: '64x32', rows: 64, columns: 32, outputRows: 32, outputColumns: 64 },
    ]);
    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 20608,
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.maximumProblemMemoryBytes).toBeLessThan(8_000_000_000);
    expect(example.compatibility.lanes).toEqual(lanes);
  });

  it('publishes the CPU reference and tiled-transpose ranges in declared order', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX14');

    expect(Object.keys(example.ranges)).toEqual(rangeNames);
    expect(example.ranges).toEqual({
      'cpu-reference': {
        file: 'include/tiled_transpose_reference.hpp',
        startMarker: '// [ex14-cpu-reference-start]',
        endMarker: '// [ex14-cpu-reference-end]',
        language: 'cpp',
      },
      'tiled-transpose': {
        file: 'src/tiled_transpose.cu',
        startMarker: '// [ex14-tiled-transpose-start]',
        endMarker: '// [ex14-tiled-transpose-end]',
        language: 'cpp',
      },
    });
    const ranges = await Promise.all(
      rangeNames.map((name) => readCanonicalRange(projectRoot, 'EX14', name)),
    );
    expect(ranges.map(({ range }) => range)).toEqual(rangeNames);
    expect(ranges.every(({ code }) => code.trim() !== '')).toBe(true);
  });

  it('implements guarded 32x8 tile loops, padded storage, exact mapping, and one unconditional barrier', async () => {
    const source = await readFile(path.join(exampleRoot, 'src/tiled_transpose.cu'), 'utf8');
    const kernel = kernelBody(source, 'tiled_transpose');
    const barrierOffset = kernel.indexOf('__syncthreads');
    const inputOffset = kernel.indexOf('input[input_row * columns + input_column]');
    const outputOffset = kernel.indexOf('output[output_row * rows + output_column]');

    expect(source).toMatch(/constexpr\s+unsigned\s+int\s+TILE_DIM\s*=\s*32U?\s*;/);
    expect(source).toMatch(/constexpr\s+unsigned\s+int\s+BLOCK_ROWS\s*=\s*8U?\s*;/);
    expect(kernel).toMatch(/__shared__\s+float\s+tile\s*\[\s*32\s*]\s*\[\s*33\s*]\s*;/);
    expect(kernel.match(/offset\s*\+=\s*BLOCK_ROWS/g)).toHaveLength(2);
    expect(kernel).toMatch(
      /if\s*\(\s*input_row\s*<\s*rows\s*&&\s*input_column\s*<\s*columns\s*\)[\s\S]{0,180}input\s*\[\s*input_row\s*\*\s*columns\s*\+\s*input_column\s*]/,
    );
    expect(kernel).toMatch(
      /if\s*\(\s*output_row\s*<\s*columns\s*&&\s*output_column\s*<\s*rows\s*\)[\s\S]{0,180}output\s*\[\s*output_row\s*\*\s*rows\s*\+\s*output_column\s*]/,
    );
    expect(kernel).toMatch(
      /output\s*\[\s*output_row\s*\*\s*rows\s*\+\s*output_column\s*]\s*=\s*tile\s*\[\s*threadIdx\.x\s*]\s*\[\s*threadIdx\.y\s*\+\s*offset\s*]/,
    );
    expect(kernel.match(/\b__syncthreads\s*\(\s*\)\s*;/g)).toHaveLength(1);
    expect(inputOffset).toBeGreaterThanOrEqual(0);
    expect(barrierOffset).toBeGreaterThan(inputOffset);
    expect(outputOffset).toBeGreaterThan(barrierOffset);
    expect(kernel.slice(0, barrierOffset)).not.toMatch(/\breturn\b/);
  });

  it('runs the pure C++17 host reference with dimension, failure, and mismatch coverage', async () => {
    const [header, hostTest, makefile, compileScript, source] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/tiled_transpose_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
      readFile(path.join(exampleRoot, 'src/tiled_transpose.cu'), 'utf8'),
    ]);
    const hostContract = `${header}\n${hostTest}`;
    const hostTarget = makeTarget(makefile, 'host-test', 'clean');

    expect(hostContract).not.toMatch(
      /#include\s*[<"]cuda|__host__|__device__|__global__|__shared__|<<<|>>>|cuda(?:Error|Stream|Event)_t/,
    );
    expect(header).toMatch(
      /output\s*\[\s*column\s*\*\s*input_shape\.rows\s*\+\s*row\s*]\s*=\s*input\s*\[\s*row\s*\*\s*input_shape\.columns\s*\+\s*column\s*]/,
    );
    for (const fixture of ['5x7', '33x35', '64x32']) expect(hostTest).toContain(fixture);
    for (const contract of [
      'output dimensions are input columns by input rows',
      'every row-major transpose mapping matches exactly',
      'an invalid input size is rejected without output mutation',
      'an invalid output size is rejected without output mutation',
      'invalid output dimensions are rejected without output mutation',
      'a null input is rejected without output mutation',
      'zero dimensions are rejected without output mutation',
      'overflowing dimensions are rejected without output mutation',
      'an in-place request is rejected without mutation',
      'exact comparison reports the first mismatch and output coordinates',
    ]) {
      expect(hostTest).toContain(contract);
    }
    expect(hostTarget).toMatch(/\$\(CXX\)[^\n]*-{1,2}std=\$\(DIALECT\)/);
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|ex14-tiled-transpose/);

    for (const call of [
      'cudaMalloc',
      'cudaMemcpyHostToDevice',
      'tiled_transpose<<<grid, block>>>',
      'cudaGetLastError',
      'cudaDeviceSynchronize',
      'cudaMemcpyDeviceToHost',
      'cudaFree',
      'ex14::verify_exact',
    ]) {
      expect(source).toContain(call);
    }
    expect(source).toContain('for (const ex14::Fixture& fixture : ex14::kFixtures)');
    expect(source.match(/std::cout/g)).toHaveLength(1);
    expect(source).toContain('"correctness=" << (all_match ? "PASS" : "FAIL")');

    const buildRoot = await mkdtemp(path.join(tmpdir(), 'ex14-host-'));
    try {
      const { stdout } = await execFileAsync('make', [
        'host-test',
        'DIALECT=c++17',
        `BUILD_DIR=${buildRoot}`,
      ], { cwd: exampleRoot });
      expect(stdout).toContain('host-reference: pass');
    } finally {
      await rm(buildRoot, { recursive: true, force: true });
    }

    expect(compileScript).toContain('Usage: compile-check.sh <dialect> <ex14> <result-dir>');
  }, 20_000);

  it('runs every compile stage plus host-test without executing the CUDA binary', async () => {
    const [example, compileScript] = await Promise.all([
      loadCanonicalExample(projectRoot, 'EX14'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);

    let previousStage = -1;
    for (const target of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
      const command = `make ${target} DIALECT="$dialect" BUILD_DIR=build`;
      const offset = compileScript.indexOf(command);
      expect(offset, target).toBeGreaterThan(previousStage);
      previousStage = offset;
    }
    expect(executableLines(compileScript)).not.toMatch(
      /(?:^|\n)\s*(?:"?(?:\$\{?BUILD_DIR\}?|\.?\/?build)\/)?ex14-tiled-transpose"?(?:\s|$)/m,
    );
    expect(Object.values(example.build.commands)).not.toContain(
      expect.stringMatching(/ex14-tiled-transpose(?:\s|$)/),
    );
  });

  it('keeps project and bilingual metadata aligned with empty evidence and exact owner coordinates', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX14');
    const pages = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/examples/tiled-transpose.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/examples/tiled-transpose.mdx'), 'utf8'),
    ]);
    const sourceCommit = example.sourceCommit as string;

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(3);
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX14')).resolves.toEqual([]);

    for (const [index, page] of pages.entries()) {
      expect(page).toMatch(/^pairId: ex14$/m);
      expect(page).toMatch(/^unitId: EX14$/m);
      expect(page).toMatch(/^factCheckDate: '2026-08-30'$/m);
      expect(page).toMatch(/prerequisites:\s*\n  - A05/);
      expect(page).toMatch(/canonicalRanges:\s*\n  - cpu-reference\n  - tiled-transpose/);
      expect(page).toMatch(/evidence:\s*\n  compilation: \[\]/);
      expect(page).toMatch(/runtime:\s*\n    - Pending Hardware Verification/);
      expect(page).toMatch(/recordedObservations: \[\]/);
      expect(page).toContain(
        `/tree/${sourceCommit}/examples/ex14-tiled-transpose`,
      );
      expect(page).toContain(`/archive/${sourceCommit}.zip`);
      expect(page.match(/^  - title:/gm)).toHaveLength(7);
      for (const observation of example.evidence.expectedObservations as string[]) {
        expect(page).toContain(observation);
      }
      for (const source of ownerSources) expect(page).toContain(source);
      for (const lane of lanes) {
        expect(page).toContain(lane.image);
        expect(page).toContain(lane.manifestDigest);
        expect(page).toContain(lane.amd64Digest);
      }
      expect(
        [...page.matchAll(/<CanonicalCode exampleId="EX14" range="([^"]+)" \/>/g)]
          .map((match) => match[1]),
      ).toEqual(rangeNames);
      expect(page).toMatch(/(?:No NVIDIA owner source|没有复制 NVIDIA owner source)/);
      if (sourceCommit === initialSourceCommit) {
        expect(page.match(new RegExp(initialSourceCommit, 'g'))).toHaveLength(2);
      }

      const expectedCounterpart = index === 0
        ? 'href="/en/examples/tiled-transpose/"'
        : 'href="/examples/tiled-transpose/"';
      expect(page).toContain(expectedCounterpart);
    }
  });

  it('publishes no measured performance or observed-runtime claim', async () => {
    const projectFiles = await listProjectFiles();
    const claims = await Promise.all([
      ...projectFiles.map((relativePath) => readFile(path.join(exampleRoot, relativePath), 'utf8')),
      readFile(path.join(projectRoot, 'src/content/docs/examples/tiled-transpose.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/examples/tiled-transpose.mdx'), 'utf8'),
    ]);

    expect(claims.join('\n')).not.toMatch(
      /Runtime-Verified|Community-Observed|cudaEvent(?:Create|Record|ElapsedTime)|std::chrono|clock_gettime|\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s)\b|\b\d+(?:\.\d+)?x\s+(?:speedup|faster)|(?:throughput|bandwidth)\s*[=:]\s*\d/i,
    );
  });
});
