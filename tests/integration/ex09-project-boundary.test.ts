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
const exampleRoot = path.join(projectRoot, 'examples/ex09-graph-capture');
const sourceCommit = 'fb0306db725ab960a61b50456c227545057de392';

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

describe('EX09 standalone project boundary', () => {
  it('declares a focused original C++17 project at immutable coordinates', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX09');

    expect(await validateCanonicalExample(projectRoot, 'EX09')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX09',
      title: 'CUDA Graph Capture',
      root: 'examples/ex09-graph-capture',
      sourceCommit,
      sourceUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex09-graph-capture`,
      downloadUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.purpose).toEqual(expect.any(String));
    expect(example.purpose).toMatch(/capture|graph/i);
    expect(example.purpose).toMatch(/three|replay/i);
    expect(example.purpose).toMatch(/correctness|result/i);
    expect(example.purpose).toMatch(/never|without|rather than.*performance/i);
    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: ['include/graph_capture_reference.hpp', 'src/graph_capture.cu'],
      hostTestInputs: [
        'include/graph_capture_reference.hpp',
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
        'build/graph_capture.ii',
        'build/graph_capture.o',
        'build/ex09-graph-capture',
      ],
    });

    const cudaSources = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.cu'));
    expect(cudaSources).toEqual(['src/graph_capture.cu']);
  });

  it('pins the source commit to the exact EX09 canonical build inputs', async () => {
    await expect(execFileAsync(
      'git',
      ['cat-file', '-e', `${sourceCommit}:examples/ex09-graph-capture/project.json`],
      { cwd: projectRoot },
    )).resolves.toBeDefined();

    for (const input of ['include/graph_capture_reference.hpp', 'src/graph_capture.cu']) {
      const [{ stdout: pinned }, current] = await Promise.all([
        execFileAsync(
          'git',
          ['show', `${sourceCommit}:examples/ex09-graph-capture/${input}`],
          { cwd: projectRoot },
        ),
        readFile(path.join(exampleRoot, input), 'utf8'),
      ]);
      expect(pinned, input).toBe(current);
    }
  });

  it('pins three C++17 lanes, the fixed DAG, and complete expected results', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX09');

    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 64,
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.lanes).toEqual(lanes);
    expect(example.correctness).toEqual({
      cpuReference: 'include/graph_capture_reference.hpp',
      nodes: ['accumulate-input', 'affine-transform'],
      edges: ['accumulate-input->affine-transform'],
      topologicalOrder: ['accumulate-input', 'affine-transform'],
      elementCount: 8,
      replayIterations: 3,
      maximumReplayIterations: 16,
      inputRule: 'input[index] = index + 1',
      initialState: 0,
      iterationRule: 'state[index] = 2 * (state[index] + input[index]) + 1',
      expectedResults: [21, 35, 49, 63, 77, 91, 105, 119],
    });
  });

  it('imports only the complete graph contract and captured replay ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX09');

    expect(example.ranges).toEqual({
      'graph-contract': {
        file: 'include/graph_capture_reference.hpp',
        startMarker: '// [ex09-graph-contract-start]',
        endMarker: '// [ex09-graph-contract-end]',
        language: 'cpp',
      },
      'captured-replay': {
        file: 'src/graph_capture.cu',
        startMarker: '// [ex09-captured-replay-start]',
        endMarker: '// [ex09-captured-replay-end]',
        language: 'cpp',
      },
    });

    const graphContract = await readCanonicalRange(projectRoot, 'EX09', 'graph-contract');
    expect(graphContract.code).toContain('inline bool validate_topological_contract(');
    expect(graphContract.code).toContain('inline bool replay_reference(');
    expect(graphContract.code).toContain('inline VerificationResult verify_exact(');

    const replay = await readCanonicalRange(projectRoot, 'EX09', 'captured-replay');
    expect(replay.code).toContain('cudaStreamBeginCapture');
    expect(replay.code).toContain('cudaStreamEndCapture');
    expect(replay.code).toContain('cudaGraphInstantiate');
    expect(replay.code).toContain('cudaGraphLaunch');
    expect(replay.code).toContain('cudaStreamSynchronize');
    const initializationCompletion = replay.code.indexOf('cudaDeviceSynchronize');
    const captureStart = replay.code.indexOf('cudaStreamBeginCapture');
    expect(initializationCompletion).toBeGreaterThanOrEqual(0);
    expect(captureStart).toBeGreaterThan(initializationCompletion);
  });

  it('runs a CUDA-free host DAG and result model with complete error coverage', async () => {
    const [header, hostTest, makefile, compileScript] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/graph_capture_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostTarget = makefile.slice(makefile.indexOf('host-test:'), makefile.indexOf('\nclean:'));

    expect(`${header}\n${hostTest}`).not.toMatch(
      /#include\s*[<"]cuda|__host__|__device__|__global__|<<<|>>>|cudaGraph_t|cudaStream_t/,
    );
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|ex09-graph-capture/);
    for (const message of [
      'cycles are rejected',
      'unknown edge endpoints are rejected',
      'self-edges are rejected',
      'duplicate edges are rejected',
      'an edge-reversing order is rejected',
      'invalid topological-order size is rejected',
      'invalid input size is rejected without mutation',
      'invalid sizes and iterations are rejected without mutation',
      'exact verification reports a deterministic mismatch',
      'complete host output matches exactly',
    ]) {
      expect(hostTest).toContain(message);
    }
    for (const target of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
      expect(compileScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
    }
    const executableLines = compileScript
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#'))
      .join('\n');
    expect(executableLines).not.toMatch(
      /(?:^|\n)\s*(?:"?(?:\$\{?BUILD_DIR\}?|\.?\/?build)\/)?ex09-graph-capture"?(?:\s|$)/m,
    );

    const buildRoot = await mkdtemp(path.join(tmpdir(), 'ex09-host-'));
    try {
      const { stdout } = await execFileAsync('make', ['host-test'], {
        cwd: exampleRoot,
        env: { ...process.env, BUILD_DIR: buildRoot },
      });
      expect(stdout).toContain('host-reference: pass');
    } finally {
      await rm(buildRoot, { recursive: true, force: true });
    }
  }, 15_000);

  it('keeps the host DAG and result model from claiming capture, replay, or performance', async () => {
    const [source, readme, evidenceReadme, englishPage, chinesePage] = await Promise.all([
      readFile(path.join(exampleRoot, 'src/graph_capture.cu'), 'utf8'),
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/examples/graph-capture.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/examples/graph-capture.mdx'), 'utf8'),
    ]);

    expect(readme).toContain('The host test cannot establish stream capture, CUDA graph instantiation or execution, executable-graph replay, or performance.');
    expect(evidenceReadme).toContain('The host test cannot establish capture, CUDA graph execution, replay, or performance.');
    expect(source).not.toMatch(/cudaEventElapsedTime|std::chrono|clock_gettime/);
    expect([source, readme, evidenceReadme, englishPage, chinesePage].join('\n')).not.toMatch(
      /Runtime-Verified|Community-Observed|\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s)\b|\b\d+(?:\.\d+)?x\s+speedup/i,
    );
  });

  it('publishes matching canonical imports with empty evidence and pending runtime', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX09');

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(3);
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX09')).resolves.toEqual([]);

    for (const localePrefix of ['', 'en/']) {
      const page = await readFile(
        path.join(projectRoot, `src/content/docs/${localePrefix}examples/graph-capture.mdx`),
        'utf8',
      );
      expect(page).toMatch(/^pairId: ex09$/m);
      expect(page).toMatch(/^unitId: EX09$/m);
      expect(page).toMatch(/^factCheckDate: '2026-08-29'$/m);
      expect(page).toContain(`/tree/${sourceCommit}/examples/ex09-graph-capture`);
      expect(page).toMatch(/import CanonicalCode from ['"].*CanonicalCode\.astro['"]/);
      expect(
        [...page.matchAll(/<CanonicalCode exampleId="EX09" range="([^"]+)" \/>/g)]
          .map((match) => match[1]),
      ).toEqual(['graph-contract', 'captured-replay']);
      expect(page).toMatch(/evidence:\s*\n  compilation: \[\]/);
      expect(page).toMatch(/runtime:\s*\n    - Pending Hardware Verification/);
      expect(page).toMatch(/recordedObservations: \[\]/);
    }
  });
});
