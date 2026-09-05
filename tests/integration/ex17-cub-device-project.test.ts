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
const exampleRoot = path.join(projectRoot, 'examples/ex17-cub-device-reduction-scan');
const sourcePath = path.join(exampleRoot, 'src/cub_device_reduction_scan.cu');

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

const checks = [
  {
    id: 'cuda-11-8-bundled-cub-1-15-1',
    toolkitLane: 'cuda-11.8',
    dependencyMode: 'bundled',
    componentVersion: '1.15.1',
    expectedCubVersion: 101501,
    packageCoordinate: 'cuda-cccl-11-8=11.8.89-1',
  },
  {
    id: 'cuda-12-9-bundled-cub-2-8-2',
    toolkitLane: 'cuda-12.9',
    dependencyMode: 'bundled',
    componentVersion: '2.8.2',
    expectedCubVersion: 200802,
    packageCoordinate: 'cuda-cccl-12-9=12.9.27-1',
  },
  {
    id: 'cuda-13-3-bundled-cub-3-3-4',
    toolkitLane: 'cuda-13.3',
    dependencyMode: 'bundled',
    componentVersion: '3.3.4',
    expectedCubVersion: 300304,
    packageCoordinate: 'cccl-13-3=13.3.3.4.1-1',
  },
  {
    id: 'cuda-12-9-selected-cccl-3-4-2',
    toolkitLane: 'cuda-12.9',
    dependencyMode: 'selected',
    componentVersion: '3.4.2',
    expectedCubVersion: 300402,
    sourceCoordinate: 'https://github.com/NVIDIA/cccl/tree/d36012203ef73ac7f966e848dd88482273e91e02',
  },
  {
    id: 'cuda-13-3-selected-cccl-3-4-2',
    toolkitLane: 'cuda-13.3',
    dependencyMode: 'selected',
    componentVersion: '3.4.2',
    expectedCubVersion: 300402,
    sourceCoordinate: 'https://github.com/NVIDIA/cccl/tree/d36012203ef73ac7f966e848dd88482273e91e02',
  },
] as const;

function portable(relativePath: string) {
  return relativePath.split(path.sep).join('/');
}

async function listFiles(root: string) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => portable(path.relative(root, path.join(entry.parentPath, entry.name))))
    .sort();
}

function count(source: string, expression: RegExp) {
  return [...source.matchAll(new RegExp(expression.source, expression.flags.includes('g')
    ? expression.flags
    : `${expression.flags}g`))].length;
}

function expectLegacyCalls(
  source: string,
  primitive: string,
  executionStorage: string,
) {
  const escapedPrimitive = primitive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedStorage = executionStorage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const call = new RegExp(`\\b${escapedPrimitive}\\s*\\(`, 'g');
  const query = new RegExp(
    `${escapedPrimitive}\\s*\\(\\s*nullptr\\s*,[\\s\\S]{0,500}?\\bstream\\s*\\)`,
  );
  const execute = new RegExp(
    `${escapedPrimitive}\\s*\\(\\s*${escapedStorage}\\s*,[\\s\\S]{0,500}?\\bstream\\s*\\)`,
  );

  expect(count(source, call), primitive).toBe(2);
  expect(source, `${primitive} query`).toMatch(query);
  expect(source, `${primitive} execution`).toMatch(execute);
  expect(source.indexOf(`${primitive}(`), `${primitive} query precedes execution`)
    .toBeLessThan(source.lastIndexOf(`${primitive}(`));
}

describe('EX17 standalone CUB device reduction and scan project', () => {
  it('declares the isolated original eight-file project and three canonical ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX17');
    const expectedFiles = [
      'Makefile',
      'README.md',
      'evidence/README.md',
      'include/cub_device_reduction_scan_reference.hpp',
      'project.json',
      'scripts/compile-check.sh',
      'src/cub_device_reduction_scan.cu',
      'tests/host_reference_test.cpp',
    ].sort();

    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX17',
      root: 'examples/ex17-cub-device-reduction-scan',
      sourceCommit: 'f018a694ec4f57a40e1374352e320ddd9c9511e0',
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build.standard).toBe('c++17');
    expect(await listFiles(exampleRoot)).toEqual(expectedFiles);
    expect(Object.keys(example.ranges)).toEqual([
      'cpu-reference',
      'device-reduce',
      'device-scan',
    ]);

    for (const name of Object.keys(example.ranges)) {
      const range = await readCanonicalRange(projectRoot, 'EX17', name);
      expect(range.code.trim(), name).not.toBe('');
      expect(range.code, name).not.toMatch(/\b(?:TODO|TBD|FIXME|pseudocode)\b/i);
      expect(example.ranges[name]).toMatchObject({
        startMarker: `// [ex17-${name}-start]`,
        endMarker: `// [ex17-${name}-end]`,
        language: 'cpp',
      });
    }
  });

  it('declares exact Toolkit images and five dependency/version checks with empty evidence', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX17');
    const ccclCoordinate =
      'https://github.com/NVIDIA/cccl/tree/d36012203ef73ac7f966e848dd88482273e91e02';

    expect(example.compatibility.lanes).toEqual(lanes);
    expect(example.compatibility.versionGate).toEqual({
      header: 'cub/version.cuh',
      macro: 'CUB_VERSION',
      makeVariable: 'EXPECTED_CUB_VERSION',
      compileDefinition: 'EX17_EXPECTED_CUB_VERSION',
    });
    expect(example.compatibility.checks).toHaveLength(5);
    expect(example.compatibility.checks.map((check: Record<string, unknown>) => ({
      id: check.id,
      toolkitLane: check.toolkitLane,
      dependencyMode: check.dependencyMode,
      componentVersion: check.componentVersion,
      expectedCubVersion: check.expectedCubVersion,
      ...('packageCoordinate' in check
        ? { packageCoordinate: check.packageCoordinate }
        : { sourceCoordinate: check.sourceCoordinate }),
    }))).toEqual(checks);

    for (const check of example.compatibility.checks) {
      expect(check).toMatchObject({
        dialect: 'c++17',
        kind: 'ex17',
        component: 'CUB',
        allowedResults: ['pass'],
      });
      if (check.dependencyMode === 'bundled') {
        const bundledRoot = check.toolkitLane === 'cuda-13.3'
          ? '/usr/local/cuda/include/cccl'
          : '/usr/local/cuda/include';
        expect(check.packageCoordinate).toMatch(/^[a-z0-9-]+=\d[\d.-]+$/);
        expect(check.includeRoots).toEqual([bundledRoot]);
        expect(check).not.toHaveProperty('sourceCoordinate');
      } else {
        expect(check.sourceCoordinate).toBe(ccclCoordinate);
        expect(check.includeRoots).toEqual([
          '${CCCL_ROOT}/cub',
          '${CCCL_ROOT}/thrust',
          '${CCCL_ROOT}/libcudacxx/include',
        ]);
        expect(check).not.toHaveProperty('packageCoordinate');
      }
    }

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.compilation.some(
      ({ status }: { status?: string }) => status === 'Compile-Checked',
    )).toBe(false);
    expect(example.evidence).not.toHaveProperty('retainedWorkflowRun');
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(validateCanonicalExample(projectRoot, 'EX17')).resolves.toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX17')).resolves.toEqual([]);
  });

  it('gates exact CUB headers and all three legacy query/allocate/execute forms', async () => {
    const [source, makefile, script] = await Promise.all([
      readFile(sourcePath, 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);

    expect(source.match(/^#include <cub\/[^>]+>$/gm)).toEqual([
      '#include <cub/device/device_reduce.cuh>',
      '#include <cub/device/device_scan.cuh>',
      '#include <cub/version.cuh>',
    ]);
    expect(source).toMatch(/static_assert\s*\(\s*CUB_VERSION\s*==\s*EX17_EXPECTED_CUB_VERSION/);
    expect(makefile).toContain('-DEX17_EXPECTED_CUB_VERSION=$(EXPECTED_CUB_VERSION)');

    expectLegacyCalls(source, 'cub::DeviceReduce::Sum', 'storage.data');
    expectLegacyCalls(
      source,
      'cub::DeviceScan::InclusiveSum',
      'storage.inclusive.data',
    );
    expectLegacyCalls(
      source,
      'cub::DeviceScan::ExclusiveSum',
      'storage.exclusive.data',
    );
    expect(count(source, /CUDA_CHECK\s*\(\s*cub::(?:DeviceReduce|DeviceScan)::/g)).toBe(6);
    expect(count(source, /cudaMalloc\s*\(\s*&storage(?:\.(?:inclusive|exclusive))?\.data/g))
      .toBe(3);

    expect(makefile).toContain('-I$(CCCL_ROOT)/cub');
    expect(makefile).toContain('-I$(CCCL_ROOT)/thrust');
    expect(makefile).toContain('-I$(CCCL_ROOT)/libcudacxx/include');
    expect(makefile).toContain('-I$(BUNDLED_INCLUDE_ROOT)');
    expect(script).toContain('bundled_include_root="/usr/local/cuda/include/cccl"');
    expect(script).toContain('"BUNDLED_INCLUDE_ROOT=$bundled_include_root"');
    expect(script).toMatch(/\$# -lt 2 \|\| \$# -gt 3/);
    for (const check of checks) {
      expect(script).toContain(check.id);
      expect(script).toContain(String(check.expectedCubVersion));
    }
    expect(script).toContain('CCCL_ROOT is required by selected CCCL profiles');
  });

  it('uses one checked nondefault stream completion boundary before host validation', async () => {
    const source = await readFile(sourcePath, 'utf8');

    expect(source).toContain(
      'CUDA_CHECK(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking));',
    );
    expect(count(source, /cudaMemcpyAsync\s*\(/g)).toBe(5);
    expect(count(source, /CUDA_CHECK\s*\(\s*cudaMemcpyAsync\s*\(/g)).toBe(5);
    expect(count(source, /cudaStreamSynchronize\s*\(/g)).toBe(1);
    expect(source).toContain('CUDA_CHECK(cudaStreamSynchronize(stream));');
    expect(source).not.toMatch(/cudaDeviceSynchronize|cudaEvent|std::chrono|clock_gettime/i);

    const runtimeCall =
      /\bcuda(?:StreamCreateWithFlags|Malloc|MemcpyAsync|StreamSynchronize|Free|StreamDestroy)\s*\(/g;
    const checkedRuntimeCall =
      /CUDA_CHECK\s*\(\s*cuda(?:StreamCreateWithFlags|Malloc|MemcpyAsync|StreamSynchronize|Free|StreamDestroy)\s*\(/g;
    expect(count(source, checkedRuntimeCall)).toBe(count(source, runtimeCall));

    const completion = source.indexOf('CUDA_CHECK(cudaStreamSynchronize(stream));');
    const reductionValidation = source.indexOf('ex17::compare_reduction_sum', completion);
    const scanValidation = source.indexOf('ex17::compare_exact', completion);
    const main = source.indexOf('int main()');
    expect(completion).toBeGreaterThanOrEqual(0);
    expect(reductionValidation).toBeGreaterThan(completion);
    expect(scanValidation).toBeGreaterThan(completion);
    expect(source.slice(main, completion)).not.toMatch(
      /ex17::compare_reduction_sum|ex17::compare_exact|scan_invariants_hold\s*\(/,
    );
  });

  it('runs the CUDA-free host references and publishes no measured timing claim', async () => {
    const [header, hostTest, source, readme, evidenceReadme, script] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/cub_device_reduction_scan_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(sourcePath, 'utf8'),
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostContract = `${header}\n${hostTest}`;
    const claims = `${source}\n${readme}\n${evidenceReadme}`;

    expect(hostContract).not.toMatch(
      /#include\s*<(?:cuda|cub)|__host__|__device__|__global__|<<<|>>>|cuda(?:Error|Stream|Event)_t/,
    );
    expect(hostTest).toMatch(/4099U/);
    expect(hostTest).toMatch(/absolute-tolerance boundary/);
    expect(hostTest).toMatch(/relative-tolerance boundary/);
    expect(hostTest).toMatch(/independent inclusive CPU reference/);
    expect(hostTest).toMatch(/independent exclusive CPU reference/);
    expect(hostTest).toMatch(/recurrence invariants/);
    expect(hostTest).toMatch(/last-total invariants/);
    expect(claims).not.toMatch(
      /Runtime-Verified|Community-Observed|\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s)\b|\b\d+(?:\.\d+)?x\s+(?:speedup|faster)|throughput\s*=\s*\d/i,
    );

    const executableLines = script
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#'))
      .join('\n');
    expect(executableLines).not.toMatch(
      /(?:^|\n)\s*(?:\.\/)?build\/ex17-cub-device-reduction-scan(?:\s|$)/m,
    );

    const buildRoot = await mkdtemp(path.join(tmpdir(), 'ex17-host-'));
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
  }, 20_000);
});
