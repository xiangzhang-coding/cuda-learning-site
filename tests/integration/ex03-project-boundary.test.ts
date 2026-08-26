// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
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
const exampleRoot = path.join(projectRoot, 'examples/ex03-multidimensional-indexing');

describe('EX03 standalone project boundary', () => {
  it('declares the manifest, build, correctness, and immutable source contracts', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX03');

    expect(await validateCanonicalExample(projectRoot, 'EX03')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX03',
      root: 'examples/ex03-multidimensional-indexing',
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build).toMatchObject({
      standard: 'c++17',
      inputs: [
        'include/multidimensional_indexing_reference.hpp',
        'src/multidimensional_indexing.cu',
      ],
      hostTestInputs: [
        'include/multidimensional_indexing_reference.hpp',
        'tests/host_reference_test.cpp',
      ],
      contractFiles: ['Makefile', 'scripts/compile-check.sh'],
      stages: ['preprocess', 'compile', 'link', 'inspect'],
      artifacts: [
        'build/multidimensional_indexing.ii',
        'build/multidimensional_indexing.o',
        'build/ex03-multidimensional-indexing',
      ],
    });
    expect(example.correctness).toMatchObject({
      cpuReference: 'include/multidimensional_indexing_reference.hpp',
      logicalDimensions: [1, 2, 3],
      degenerateDimensions: true,
      layout: 'row-major',
      maximumElements: 262144,
    });
    expect(Object.keys(example.ranges)).toEqual([
      'indexing-kernel',
      'lifecycle',
      'host-reference',
    ]);

    const sourceMatch = /^https:\/\/github\.com\/xiangzhang-coding\/cuda-learning-site\/tree\/([0-9a-f]{40})\/examples\/ex03-multidimensional-indexing$/.exec(
      example.sourceUrl,
    );
    const downloadMatch = /^https:\/\/github\.com\/xiangzhang-coding\/cuda-learning-site\/archive\/([0-9a-f]{40})\.zip$/.exec(
      example.downloadUrl,
    );
    expect(sourceMatch).not.toBeNull();
    expect(downloadMatch?.[1]).toBe(sourceMatch?.[1]);
  });

  it('declares exactly three C++17 Toolkit Lanes at the Baseline GPU Capability Tier', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX03');

    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.lanes).toEqual([
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
    ]);
  });

  it('keeps compilation evidence empty and runtime Pending Hardware Verification', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX03');

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX03')).resolves.toEqual([]);
  });

  it('builds and runs only the pure host-side row-major test locally', async () => {
    const { stdout } = await execFileAsync('make', ['host-test'], {
      cwd: exampleRoot,
      env: { ...process.env, BUILD_DIR: '.quality/host-test' },
    });

    expect(stdout).toContain('host-reference: pass');
  }, 15_000);

  it('computes each launch axis and bounds it before row-major flattening', async () => {
    const kernel = await readCanonicalRange(projectRoot, 'EX03', 'indexing-kernel');

    for (const axis of ['x', 'y', 'z']) {
      expect(kernel.code).toContain(`blockIdx.${axis}`);
      expect(kernel.code).toContain(`blockDim.${axis}`);
      expect(kernel.code).toContain(`threadIdx.${axis}`);
    }

    const source = await readFile(path.join(exampleRoot, 'src/multidimensional_indexing.cu'), 'utf8');
    expect(source).toContain('extent.y > 1U ? kBlockExtent : 1U');
    expect(source).toContain('extent.z > 1U ? kBlockExtent : 1U');

    const flattening = '(z * extent_y + y) * extent_x + x';
    const flatteningOffset = kernel.code.indexOf(flattening);
    expect(flatteningOffset).toBeGreaterThan(-1);
    for (const bound of [
      'if (x >= extent_x) return;',
      'if (y >= extent_y) return;',
      'if (z >= extent_z) return;',
    ]) {
      const boundOffset = kernel.code.indexOf(bound);
      expect(boundOffset).toBeGreaterThan(-1);
      expect(boundOffset).toBeLessThan(flatteningOffset);
    }
  });

  it('orders allocation, transfers, launch checks, comparison, and cleanup', async () => {
    const lifecycle = await readCanonicalRange(projectRoot, 'EX03', 'lifecycle');
    const orderedSteps = [
      'initialize_input(host_input);',
      'ex03::multidimensional_reference(',
      'CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_input), bytes));',
      'CUDA_CHECK(cudaMalloc(reinterpret_cast<void**>(&device_output), bytes));',
      'CUDA_CHECK(cudaMemcpy(device_input, host_input.data(), bytes, cudaMemcpyHostToDevice));',
      'multidimensional_index<<<grid, block>>>(',
      'CUDA_CHECK(cudaGetLastError());',
      'CUDA_CHECK(cudaDeviceSynchronize());',
      'CUDA_CHECK(cudaMemcpy(host_actual.data(), device_output, bytes, cudaMemcpyDeviceToHost));',
      'compare_results(host_expected, host_actual)',
      'CUDA_CHECK(cudaFree(device_output));',
      'CUDA_CHECK(cudaFree(device_input));',
    ];

    let previousOffset = -1;
    for (const step of orderedSteps) {
      const offset = lifecycle.code.indexOf(step, previousOffset + 1);
      expect(offset).toBeGreaterThan(previousOffset);
      previousOffset = offset;
    }
  });

  it('does not execute the CUDA program or publish runtime or measurement claims', async () => {
    const relativeFiles = [
      'project.json',
      'Makefile',
      'scripts/compile-check.sh',
      'README.md',
      'evidence/README.md',
      'include/multidimensional_indexing_reference.hpp',
      'src/multidimensional_indexing.cu',
      'tests/host_reference_test.cpp',
    ];
    const contents = await Promise.all(
      relativeFiles.map((relativeFile) => readFile(path.join(exampleRoot, relativeFile), 'utf8')),
    );
    const [manifest, makefile, compileScript, readme, evidenceReadme, header, source, hostTest] =
      contents;

    expect(source).not.toContain('cudaEvent');
    expect(header).not.toMatch(/#include\s*[<"]cuda|__host__|__device__/);
    expect(compileScript).not.toMatch(
      /(?:^|\n)\s*(?:\.\/)?build\/ex03-multidimensional-indexing(?:\s|$)/,
    );
    expect(`${readme}\n${evidenceReadme}`).not.toMatch(
      /Compile-Checked|Runtime-Verified|GB\/s|speedup|throughput|milliseconds?/i,
    );
    expect([manifest, makefile, compileScript, readme, evidenceReadme, header, source, hostTest]
      .join('\n')).not.toContain('LAB03');
  });
});
