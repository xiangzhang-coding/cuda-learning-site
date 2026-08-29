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
const exampleRoot = path.join(projectRoot, 'examples/ex07-streams-events-overlap');
const sourceCommit = '818ccfb0ce5dc9d33dc7cd3d23d315046950dc4f';

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

describe('EX07 standalone project boundary', () => {
  it('declares a focused original C++17 project at immutable coordinates', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX07');

    expect(await validateCanonicalExample(projectRoot, 'EX07')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX07',
      title: 'Streams, Events, and Overlap',
      purpose: 'Compare serial and chunked stream/event structures for the same transform while proving correctness only, never timing or overlap.',
      root: 'examples/ex07-streams-events-overlap',
      sourceCommit,
      sourceUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex07-streams-events-overlap`,
      downloadUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: [
        'include/streams_events_overlap_reference.hpp',
        'src/streams_events_overlap.cu',
      ],
      hostTestInputs: [
        'include/streams_events_overlap_reference.hpp',
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
        'build/streams_events_overlap.ii',
        'build/streams_events_overlap.o',
        'build/ex07-streams-events-overlap',
      ],
    });

    const cudaSources = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.cu'));
    expect(cudaSources).toEqual(['src/streams_events_overlap.cu']);
  });

  it('pins the temporary source commit to a tree containing EX07', async () => {
    await expect(execFileAsync(
      'git',
      ['cat-file', '-e', `${sourceCommit}:examples/ex07-streams-events-overlap/project.json`],
      { cwd: projectRoot },
    )).resolves.toBeDefined();
  });

  it('pins three C++17 lanes, complete chunk bounds, and exact memory limits', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX07');

    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 49176,
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.lanes).toEqual(lanes);
    expect(example.correctness).toEqual({
      cpuReference: 'include/streams_events_overlap_reference.hpp',
      elementCount: 4099,
      chunkElements: 1024,
      chunkCount: 5,
      lastChunkElements: 3,
      chunkStreamCount: 2,
      paths: ['serial', 'chunked'],
      transformRule: 'output[index] = input[index] * 3 + 7',
      pageLockedHostMemoryBytes: 49188,
      maximumDeviceMemoryBytes: 49176,
    });
  });

  it('imports only the complete chunk contract and stream pipeline ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX07');

    expect(example.ranges).toEqual({
      'chunk-contract': {
        file: 'include/streams_events_overlap_reference.hpp',
        startMarker: '// [ex07-chunk-contract-start]',
        endMarker: '// [ex07-chunk-contract-end]',
        language: 'cpp',
      },
      'stream-pipeline': {
        file: 'src/streams_events_overlap.cu',
        startMarker: '// [ex07-stream-pipeline-start]',
        endMarker: '// [ex07-stream-pipeline-end]',
        language: 'cpp',
      },
    });

    const chunkContract = await readCanonicalRange(projectRoot, 'EX07', 'chunk-contract');
    expect(chunkContract.code).toContain('inline constexpr bool try_chunk_count(');
    expect(chunkContract.code).toContain('inline bool build_chunk_partition(');
    expect(chunkContract.code).toContain('inline VerificationResult verify_exact(');

    const pipeline = await readCanonicalRange(projectRoot, 'EX07', 'stream-pipeline');
    expect(pipeline.code).toContain('enqueue_serial_path(');
    expect(pipeline.code).toContain('enqueue_chunked_pipeline(');
    expect(pipeline.code).toContain('cudaStreamWaitEvent');
    expect(pipeline.code).toContain('cudaEventRecord');
  });

  it('runs a CUDA-free host model with complete rejection and mismatch coverage', async () => {
    const [header, hostTest, makefile, compileScript] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/streams_events_overlap_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostTarget = makefile.slice(makefile.indexOf('host-test:'), makefile.indexOf('\nclean:'));

    expect(`${header}\n${hostTest}`).not.toMatch(
      /#include\s*[<"]cuda|__host__|__device__|__global__|<<<|>>>|cudaStream_t|cudaEvent_t/,
    );
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|ex07-streams-events-overlap/);
    for (const message of [
      'zero chunk size is rejected without mutation',
      'overflowing chunk offset is rejected without mutation',
      'overflowing byte extent is rejected without mutation',
      'undersized partition destination is rejected',
      'undersized transform destination is not mutated',
      'exact verifier reports the first deterministic mismatch',
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
      /(?:^|\n)\s*(?:"?(?:\$\{?BUILD_DIR\}?|\.?\/?build)\/)?ex07-streams-events-overlap"?(?:\s|$)/m,
    );

    const buildRoot = await mkdtemp(path.join(tmpdir(), 'ex07-host-'));
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

  it('separates overlap eligibility from observation and publishes no performance claim', async () => {
    const [source, readme, evidenceReadme, englishPage, chinesePage] = await Promise.all([
      readFile(path.join(exampleRoot, 'src/streams_events_overlap.cu'), 'utf8'),
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/examples/streams-events-overlap.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/examples/streams-events-overlap.mdx'), 'utf8'),
    ]);

    expect(source).toContain('capability deviceOverlap=');
    expect(source).toContain('asyncEngineCount=');
    expect(source).toContain('interpretation=capability-only');
    expect(source).toContain('cudaEventDisableTiming');
    expect(source).not.toMatch(/cudaEventElapsedTime|std::chrono|clock_gettime/);
    expect(readme).toContain('These fields do not report a timeline or establish that any operations ran concurrently.');
    expect(evidenceReadme).toContain('do not establish that operations overlapped');
    expect([source, readme, evidenceReadme, englishPage, chinesePage].join('\n')).not.toMatch(
      /Runtime-Verified|Community-Observed|\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s)\b|\b\d+(?:\.\d+)?x\s+speedup/i,
    );
  });

  it('publishes matching canonical imports with empty evidence and pending runtime', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX07');

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(3);
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX07')).resolves.toEqual([]);

    for (const localePrefix of ['', 'en/']) {
      const page = await readFile(
        path.join(projectRoot, `src/content/docs/${localePrefix}examples/streams-events-overlap.mdx`),
        'utf8',
      );
      expect(page).toMatch(/^pairId: ex07$/m);
      expect(page).toMatch(/^unitId: EX07$/m);
      expect(page).toMatch(/^factCheckDate: '2026-08-29'$/m);
      expect(page).toContain(`/tree/${sourceCommit}/examples/ex07-streams-events-overlap`);
      expect(page).toMatch(/import CanonicalCode from ['"].*CanonicalCode\.astro['"]/);
      expect(
        [...page.matchAll(/<CanonicalCode exampleId="EX07" range="([^"]+)" \/>/g)]
          .map((match) => match[1]),
      ).toEqual(['chunk-contract', 'stream-pipeline']);
      expect(page).toMatch(/evidence:\s*\n  compilation: \[\]/);
      expect(page).toMatch(/runtime:\s*\n    - Pending Hardware Verification/);
      expect(page).toMatch(/recordedObservations: \[\]/);
    }
  });
});
