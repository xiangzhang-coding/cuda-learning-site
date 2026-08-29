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
const exampleRoot = path.join(projectRoot, 'examples/ex08-unified-memory-migration');
const sourceCommit = '6f7c2339f5eb9997298cf8590755a6a7debbdaf9';

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

describe('EX08 standalone project boundary', () => {
  it('declares a focused original C++17 project at immutable coordinates', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX08');

    expect(await validateCanonicalExample(projectRoot, 'EX08')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX08',
      title: 'Unified Memory Migration',
      purpose: 'Execute a phased managed-memory workload and report capabilities while correctness remains independent of migration observation.',
      root: 'examples/ex08-unified-memory-migration',
      sourceCommit,
      sourceUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex08-unified-memory-migration`,
      downloadUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: [
        'include/unified_memory_migration_reference.hpp',
        'src/unified_memory_migration.cu',
      ],
      hostTestInputs: [
        'include/unified_memory_migration_reference.hpp',
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
        'build/unified_memory_migration.ii',
        'build/unified_memory_migration.o',
        'build/ex08-unified-memory-migration',
      ],
    });

    const cudaSources = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.cu'));
    expect(cudaSources).toEqual(['src/unified_memory_migration.cu']);
  });

  it('pins the temporary source commit to a tree containing EX08', async () => {
    await expect(execFileAsync(
      'git',
      ['cat-file', '-e', `${sourceCommit}:examples/ex08-unified-memory-migration/project.json`],
      { cwd: projectRoot },
    )).resolves.toBeDefined();
  });

  it('pins three C++17 lanes, the phased model, and exact memory bounds', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX08');

    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 65536,
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.lanes).toEqual(lanes);
    expect(example.correctness).toEqual({
      cpuReference: 'include/unified_memory_migration_reference.hpp',
      pageBytes: 4096,
      pageCount: 16,
      elementCount: 16384,
      accessCount: 48,
      phases: [
        { id: 'host-initialize', origin: 'host' },
        { id: 'device-transform', origin: 'device' },
        { id: 'host-verify', origin: 'host' },
      ],
      transformRule: 'output[index] = input[index] XOR 0x5a5a5a5a',
      softwareTransitionCount: 32,
      softwareMovedPagesProxy: 32,
      softwareMovedBytesProxy: 131072,
    });
  });

  it('imports only the complete access-sequence and managed-workload ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX08');

    expect(example.ranges).toEqual({
      'access-sequence': {
        file: 'include/unified_memory_migration_reference.hpp',
        startMarker: '// [ex08-access-sequence-start]',
        endMarker: '// [ex08-access-sequence-end]',
        language: 'cpp',
      },
      'managed-workload': {
        file: 'src/unified_memory_migration.cu',
        startMarker: '// [ex08-managed-workload-start]',
        endMarker: '// [ex08-managed-workload-end]',
        language: 'cpp',
      },
    });

    const sequence = await readCanonicalRange(projectRoot, 'EX08', 'access-sequence');
    expect(sequence.code).toContain('inline bool write_declared_access_sequence(');
    expect(sequence.code).toContain('inline bool derive_transition_ledger(');
    expect(sequence.code).toContain('inline VerificationResult verify_exact(');

    const workload = await readCanonicalRange(projectRoot, 'EX08', 'managed-workload');
    expect(workload.code).toContain('cudaMallocManaged');
    expect(workload.code).toContain('cudaMemAdvise');
    expect(workload.code).toContain('cudaMemPrefetchAsync');
    expect(workload.code).toContain('cudaStreamSynchronize');
  });

  it('runs a CUDA-free host model with complete rejection and mismatch coverage', async () => {
    const [header, hostTest, makefile, compileScript] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/unified_memory_migration_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostTarget = makefile.slice(makefile.indexOf('host-test:'), makefile.indexOf('\nclean:'));

    expect(`${header}\n${hostTest}`).not.toMatch(
      /#include\s*[<"]cuda|__host__|__device__|__global__|<<<|>>>|cudaStream_t|cudaError_t/,
    );
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|ex08-unified-memory-migration/);
    for (const message of [
      'out-of-range page is rejected without summary mutation',
      'invalid access origin is rejected without summary mutation',
      'overflowing moved-byte proxy is rejected',
      'undersized transition ledger is rejected',
      'rejected ledger derivation does not mutate entries',
      'undersized oracle destination is not mutated',
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
      /(?:^|\n)\s*(?:"?(?:\$\{?BUILD_DIR\}?|\.?\/?build)\/)?ex08-unified-memory-migration"?(?:\s|$)/m,
    );

    const buildRoot = await mkdtemp(path.join(tmpdir(), 'ex08-host-'));
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

  it('keeps the declared software-coherent model separate from actual migration', async () => {
    const [source, readme, evidenceReadme, englishPage, chinesePage] = await Promise.all([
      readFile(path.join(exampleRoot, 'src/unified_memory_migration.cu'), 'utf8'),
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/examples/unified-memory-migration.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/examples/unified-memory-migration.mdx'), 'utf8'),
    ]);

    expect(source).toContain('interpretation=capability-only');
    expect(source).toContain('interpretation=software-only');
    expect(readme).toContain('deliberately software-coherent teaching model');
    expect(readme).toContain('does not inspect CUDA, operating-system page tables, physical page size, hardware coherence, residency, faults, or data movement');
    expect(evidenceReadme).toContain('do not show where data resided, whether a fault happened, or whether movement occurred');
    expect(source).not.toMatch(/cudaEventElapsedTime|std::chrono|clock_gettime/);
    expect([source, readme, evidenceReadme, englishPage, chinesePage].join('\n')).not.toMatch(
      /Runtime-Verified|Community-Observed|\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s)\b|\b\d+(?:\.\d+)?x\s+speedup/i,
    );
  });

  it('publishes matching canonical imports with empty evidence and pending runtime', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX08');

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(3);
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX08')).resolves.toEqual([]);

    for (const localePrefix of ['', 'en/']) {
      const page = await readFile(
        path.join(projectRoot, `src/content/docs/${localePrefix}examples/unified-memory-migration.mdx`),
        'utf8',
      );
      expect(page).toMatch(/^pairId: ex08$/m);
      expect(page).toMatch(/^unitId: EX08$/m);
      expect(page).toMatch(/^factCheckDate: '2026-08-29'$/m);
      expect(page).toContain(`/tree/${sourceCommit}/examples/ex08-unified-memory-migration`);
      expect(page).toMatch(/import CanonicalCode from ['"].*CanonicalCode\.astro['"]/);
      expect(
        [...page.matchAll(/<CanonicalCode exampleId="EX08" range="([^"]+)" \/>/g)]
          .map((match) => match[1]),
      ).toEqual(['access-sequence', 'managed-workload']);
      expect(page).toMatch(/evidence:\s*\n  compilation: \[\]/);
      expect(page).toMatch(/runtime:\s*\n    - Pending Hardware Verification/);
      expect(page).toMatch(/recordedObservations: \[\]/);
      expect(page).toContain('cost proxy only, independent of runtime residency, faults, or migration');
    }
  });
});
