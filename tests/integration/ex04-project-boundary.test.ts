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
const exampleRoot = path.join(projectRoot, 'examples/ex04-error-handling-lifecycle');

function expectOrdered(text: string, tokens: readonly string[]) {
  let previous = -1;
  for (const token of tokens) {
    const offset = text.indexOf(token, previous + 1);
    expect(offset, token).toBeGreaterThan(previous);
    previous = offset;
  }
}

describe('EX04 standalone project boundary', () => {
  it('declares one shared C++17 source contract and immutable project URLs', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX04');

    expect(await validateCanonicalExample(projectRoot, 'EX04')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX04',
      root: 'examples/ex04-error-handling-lifecycle',
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: [
        'include/error_handling_reference.hpp',
        'src/error_handling_lifecycle.cu',
      ],
      hostTestInputs: [
        'include/error_handling_reference.hpp',
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
        'build/error_handling_lifecycle.ii',
        'build/error_handling_lifecycle.o',
        'build/ex04-error-handling-lifecycle',
      ],
    });

    const implementationFiles = (await readdir(exampleRoot, { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => /\.(?:cu|cpp|hpp)$/.test(file));
    expect(implementationFiles.filter((file) => file.endsWith('.cu'))).toEqual([
      'src/error_handling_lifecycle.cu',
    ]);
    expect(implementationFiles).toEqual(expect.arrayContaining([
      'include/error_handling_reference.hpp',
      'src/error_handling_lifecycle.cu',
      'tests/host_reference_test.cpp',
    ]));

    const sourceMatch = /^https:\/\/github\.com\/xiangzhang-coding\/cuda-learning-site\/tree\/([0-9a-f]{40})\/examples\/ex04-error-handling-lifecycle$/.exec(
      example.sourceUrl,
    );
    const downloadMatch = /^https:\/\/github\.com\/xiangzhang-coding\/cuda-learning-site\/archive\/([0-9a-f]{40})\.zip$/.exec(
      example.downloadUrl,
    );
    expect(sourceMatch).not.toBeNull();
    expect(downloadMatch?.[1]).toBe(sourceMatch?.[1]);
  });

  it('pins exactly three C++17 Lanes, container digests, and Baseline targets', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX04');

    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 140,
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
    for (const lane of example.compatibility.lanes) {
      expect(lane.image).toContain(`@${lane.manifestDigest}`);
      expect(lane.manifestDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(lane.amd64Digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it('validates canonical markers and imports only the declared ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX04');
    expect(example.ranges).toEqual({
      'error-lifecycle': {
        file: 'src/error_handling_lifecycle.cu',
        startMarker: '// [ex04-error-lifecycle-start]',
        endMarker: '// [ex04-error-lifecycle-end]',
        language: 'cpp',
      },
      'indexing-kernels': {
        file: 'src/error_handling_lifecycle.cu',
        startMarker: '// [ex04-indexing-kernels-start]',
        endMarker: '// [ex04-indexing-kernels-end]',
        language: 'cpp',
      },
      'host-verification': {
        file: 'include/error_handling_reference.hpp',
        startMarker: '// [ex04-host-verification-start]',
        endMarker: '// [ex04-host-verification-end]',
        language: 'cpp',
      },
    });
    for (const range of Object.keys(example.ranges)) {
      await expect(readCanonicalRange(projectRoot, 'EX04', range)).resolves.toMatchObject({
        exampleId: 'EX04',
        range,
        language: 'cpp',
      });
    }

    const imports = [
      { relativePath: 'foundations/asynchronous-errors.mdx', ranges: ['error-lifecycle'] },
      { relativePath: 'examples/error-handling-lifecycle.mdx', ranges: ['error-lifecycle', 'indexing-kernels', 'host-verification'] },
      { relativePath: 'labs/break-and-repair-indexing.mdx', ranges: ['indexing-kernels', 'host-verification'] },
    ] as const;
    for (const localePrefix of ['', 'en/']) {
      for (const { relativePath, ranges } of imports) {
        const source = await readFile(
          path.join(projectRoot, `src/content/docs/${localePrefix}${relativePath}`),
          'utf8',
        );
        expect(source).toMatch(/import CanonicalCode from ['"].*CanonicalCode\.astro['"]/);
        expect(
          [...source.matchAll(/<CanonicalCode exampleId="EX04" range="([^"]+)" \/>/g)]
            .map((match) => match[1]),
        ).toEqual(ranges);
      }
    }
  });

  it('classifies four isolated scenarios at focused observation stages', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX04');
    expect(example.correctness).toEqual({
      cpuReference: 'include/error_handling_reference.hpp',
      scenarios: ['launch-config', 'deferred-access', 'indexing-defect', 'repaired-indexing'],
      logicalExtent: [7, 5],
      layout: 'row-major',
      defectiveLayout: 'in-bounds column-major permutation',
      maximumElements: 35,
    });

    const source = await readFile(path.join(exampleRoot, 'src/error_handling_lifecycle.cu'), 'utf8');
    const launch = source.slice(source.indexOf('int run_launch_config()'), source.indexOf('int run_deferred_access()'));
    const deferred = source.slice(source.indexOf('int run_deferred_access()'), source.indexOf('int run_indexing('));
    expectOrdered(launch, [
      'launch_configuration_probe<<<',
      'cudaPeekAtLastError()',
      'cudaGetLastError()',
      'cudaPeekAtLastError()',
      'cudaDeviceSynchronize()',
    ]);
    expectOrdered(deferred, [
      'deferred_invalid_access<<<',
      'cudaPeekAtLastError()',
      'cudaDeviceSynchronize()',
    ]);
    expect(deferred.slice(deferred.indexOf('cudaDeviceSynchronize()'))).not.toMatch(
      /cudaFree|cudaDeviceReset|<<<.*>>>/s,
    );
    expect(source).toContain('const std::size_t in_bounds_but_wrong = x * height + y;');
    expect(source).toContain('const std::size_t row_major = y * width + x;');
    expect(source).toContain('Run one scenario per process.');
  });

  it('runs the pure host contract without executing the CUDA binary', async () => {
    const [makefile, compileScript, hostTest, header] = await Promise.all([
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'include/error_handling_reference.hpp'), 'utf8'),
    ]);
    const hostTarget = makefile.slice(makefile.indexOf('host-test:'), makefile.indexOf('\nclean:'));

    expect(hostTarget).toContain('$(BUILD_DIR)/host_reference_test');
    expect(hostTarget).not.toMatch(/\$\(NVCC\)|ex04-error-handling-lifecycle/);
    expect(`${hostTest}\n${header}`).not.toMatch(/#include\s*[<"]cuda|__host__|__device__|<<<|>>>/);
    expect(compileScript).not.toMatch(
      /(?:^|\n)\s*(?:\.\/)?build\/ex04-error-handling-lifecycle(?:\s|$)/,
    );

    const { stdout } = await execFileAsync('make', ['host-test'], {
      cwd: exampleRoot,
      env: { ...process.env, BUILD_DIR: '.quality/host-test' },
    });
    expect(stdout).toContain('host-reference: pass');
  }, 15_000);

  it('keeps compilation and observations empty while runtime remains pending', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX04');

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(4);
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX04')).resolves.toEqual([]);

    const claims = await Promise.all([
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
    ]);
    expect(claims.join('\n')).not.toMatch(/Runtime-Verified|milliseconds?|GB\/s|speedup|throughput/i);
  });
});
