// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';
import os from 'node:os';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';

import { afterEach, describe, expect, it } from 'vitest';

import {
  hashCanonicalBuildContract,
  loadCompileEvidence,
  loadCanonicalExample,
  readCanonicalRange,
  validateCanonicalExample,
  validateCompileEvidenceRecord,
} from '../../scripts/lib/canonical-examples.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const temporaryRoots = [];

async function createFixture(manifest, source) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'canonical-example-'));
  temporaryRoots.push(root);
  const exampleRoot = path.join(root, 'examples/fixture');
  await mkdir(path.join(exampleRoot, 'src'), { recursive: true });
  await writeFile(path.join(exampleRoot, 'project.json'), JSON.stringify(manifest));
  if (source !== undefined) await writeFile(path.join(exampleRoot, 'src/example.cu'), source);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function passingEx02Record(root = projectRoot) {
  const example = await loadCanonicalExample(root, 'EX02');
  const lane = example.compatibility.lanes[0];
  const dialect = 'c++17';
  return {
    'SPDX-License-Identifier': 'Apache-2.0',
    schemaVersion: 1,
    result: 'pass',
    claim: 'Compile-Checked',
    subject: 'EX02',
    check: 'cuda-11-8-cxx17',
    sourceCommit: 'a'.repeat(40),
    buildContractSha256: await hashCanonicalBuildContract(root, 'EX02'),
    verificationDate: '2026-08-24',
    workflowRun: 'https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/12345',
    runner: {
      operatingSystem: 'Linux',
      architecture: 'X64',
      imageOS: 'ubuntu24',
      imageVersion: '20260816.277.1',
      dockerEngine: '29.0.0',
      dockerBuildx: 'github.com/docker/buildx v0.30.0',
    },
    container: {
      declaredReference: lane.image,
      manifestDigest: lane.manifestDigest,
      expectedAmd64Digest: lane.amd64Digest,
      actualAmd64Digest: lane.amd64Digest,
      actualImageId: `sha256:${'b'.repeat(64)}`,
      actualRepoDigests: [`nvidia/cuda@${lane.manifestDigest}`],
      operatingSystem: {
        id: 'ubuntu',
        versionId: '22.04',
        prettyName: 'Ubuntu 22.04 LTS',
      },
    },
    toolchain: {
      toolkit: lane.toolkit,
      hostCompiler: 'g++ (Ubuntu 11.4.0) 11.4.0',
      nvcc: 'Cuda compilation tools, release 11.8, V11.8.89',
      cuobjdump: 'cuobjdump 11.8.86',
      dialect,
      target: example.compatibility.target,
    },
    commands: Object.values(example.build.commands).map((command) => command.replace('{dialect}', dialect)),
    artifacts: example.build.artifacts.map((artifactPath) => ({
      path: artifactPath,
      bytes: 1,
      sha256: 'c'.repeat(64),
    })),
    hostReferenceExecuted: true,
    gpuExecutableExecuted: false,
    runtimeEvidence: 'Pending Hardware Verification',
  };
}

describe('canonical Runnable Example resolver', () => {
  it('loads EX01 as one C++17 query project with no borrowed evidence', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX01');

    expect(example).toMatchObject({
      id: 'EX01',
      root: 'examples/ex01-environment-report',
      build: {
        standard: 'c++17',
        stages: ['preprocess', 'compile', 'link'],
      },
      compatibility: { target: [] },
      evidence: {
        compilation: [],
        runtime: 'Pending Hardware Verification',
        recordedObservations: [],
      },
    });
    expect(example.compatibility.lanes.map((lane) => lane.toolkit)).toEqual(['11.8.0', '12.9.2', '13.3.1']);
    await expect(validateCanonicalExample(projectRoot, 'EX01')).resolves.toEqual([]);
    await expect(loadCompileEvidence(projectRoot, 'EX01')).resolves.toEqual([]);
    await expect(hashCanonicalBuildContract(projectRoot, 'EX01')).resolves.toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns EX01 observation ranges without exposing a kernel implementation', async () => {
    const model = await readCanonicalRange(projectRoot, 'EX01', 'observation-model');
    const versions = await readCanonicalRange(projectRoot, 'EX01', 'version-query');
    const inventory = await readCanonicalRange(projectRoot, 'EX01', 'device-inventory');

    expect(model.code).toContain('struct Observation');
    expect(versions.code).toContain('cudaDriverGetVersion');
    expect(versions.code).toContain('cudaRuntimeGetVersion');
    expect(inventory.code).toContain('cudaGetDeviceCount');
    expect(inventory.code).toContain('cudaDevAttrComputeCapabilityMajor');
    expect([model.code, versions.code, inventory.code].join('\n')).not.toMatch(/__global__|<<</);
  });

  it('loads EX02 as one C++17 project shared by every Toolkit Lane', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX02');

    expect(example.id).toBe('EX02');
    expect(example.root).toBe('examples/ex02-vector-addition');
    expect(example.build.standard).toBe('c++17');
    expect(example.build.inputs).toEqual([
      'include/vector_add_reference.hpp',
      'src/vector_add.cu',
    ]);
    expect(example.compatibility.lanes.map((lane) => lane.toolkit)).toEqual([
      '11.8.0',
      '12.9.2',
      '13.3.1',
    ]);
  });

  it('returns only named marker ranges from declared build inputs', async () => {
    const kernel = await readCanonicalRange(projectRoot, 'EX02', 'kernel');
    const cpuReference = await readCanonicalRange(projectRoot, 'EX02', 'cpu-reference');

    expect(kernel.file).toBe('src/vector_add.cu');
    expect(kernel.language).toBe('cpp');
    expect(kernel.code).toContain('__global__ void vector_add');
    expect(kernel.code).toContain('output[index] = left[index] + right[index];');
    expect(kernel.code).not.toMatch(/\[ex02-[a-z-]+-(?:start|end)\]/);

    expect(cpuReference.file).toBe('include/vector_add_reference.hpp');
    expect(cpuReference.code).toContain('vector_add_cpu');
    expect(cpuReference.code).toContain('nearly_equal');
  });

  it('rejects undeclared ranges and validates the complete EX02 contract', async () => {
    await expect(readCanonicalRange(projectRoot, 'EX02', 'not-declared')).rejects.toThrow(
      'Unknown canonical range',
    );
    await expect(validateCanonicalExample(projectRoot, 'EX02')).resolves.toEqual([]);
  });

  it('reports invalid ownership, missing inputs, and malformed marker ranges', async () => {
    const fixtureRoot = await createFixture({
      id: 'EX99',
      root: 'examples/fixture',
      license: 'MIT',
      provenance: 'adapted',
      build: { inputs: ['src/example.cu', 'src/missing.cu'] },
      ranges: {
        broken: {
          file: 'src/example.cu',
          startMarker: '// [start]',
          endMarker: '// [end]',
          language: 'cpp',
        },
      },
    }, '// [start]\n');

    await expect(validateCanonicalExample(fixtureRoot, 'EX99')).resolves.toEqual([
      'EX99 project manifest must declare Apache-2.0',
      'EX99 must be original Apache-2.0 source',
      'EX99 build input is missing: src/missing.cu',
      'Canonical range broken must have exactly one start and end marker',
    ]);
  });

  it('fails closed for missing ids, incorrect roots, and empty build contracts', async () => {
    const fixtureRoot = await createFixture({
      'SPDX-License-Identifier': 'Apache-2.0',
      id: 'EX99',
      root: 'examples/fixture',
      license: 'Apache-2.0',
      provenance: 'original',
      build: { inputs: [] },
      ranges: {},
    });

    await expect(loadCanonicalExample(fixtureRoot, 'EX98')).rejects.toThrow('Unknown canonical example');
    await expect(validateCanonicalExample(fixtureRoot, 'EX99')).resolves.toEqual([
      'EX99 must declare build inputs',
    ]);

    const manifestPath = path.join(fixtureRoot, 'examples/fixture/project.json');
    const wrongRoot = {
      'SPDX-License-Identifier': 'Apache-2.0',
      id: 'EX99',
      root: 'examples/not-fixture',
      license: 'Apache-2.0',
      provenance: 'original',
      build: { inputs: [] },
      ranges: {},
    };
    await writeFile(manifestPath, JSON.stringify(wrongRoot));
    await expect(loadCanonicalExample(fixtureRoot, 'EX99')).rejects.toThrow('declares root');
  });

  it('accepts only complete evidence for the current canonical build contract', async () => {
    const record = await passingEx02Record();
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX02', record)).resolves.toEqual([]);

    const example = await loadCanonicalExample(projectRoot, 'EX02');
    const probeLane = example.compatibility.lanes[2];
    const unsupportedProbe = {
      ...record,
      result: 'unsupported',
      claim: 'C++23-Dialect-Probe',
      subject: 'CUDA-13.3-CXX23-PROBE',
      check: 'cuda-13-3-cxx23-probe',
      container: {
        ...record.container,
        declaredReference: probeLane.image,
        manifestDigest: probeLane.manifestDigest,
        expectedAmd64Digest: probeLane.amd64Digest,
        actualAmd64Digest: probeLane.amd64Digest,
        actualRepoDigests: [`nvidia/cuda@${probeLane.manifestDigest}`],
        operatingSystem: { id: 'ubuntu', versionId: '24.04', prettyName: 'Ubuntu 24.04.4 LTS' },
      },
      toolchain: {
        ...record.toolchain,
        toolkit: probeLane.toolkit,
        hostCompiler: 'g++ (Ubuntu 13.3.0) 13.3.0',
        nvcc: 'Cuda compilation tools, release 13.3, V13.3.73',
        cuobjdump: 'cuobjdump 13.3.73',
        dialect: 'c++23',
      },
      commands: [
        'nvcc --help',
        'nvcc --std=c++23 --generate-code=arch=compute_75,code=sm_75 --generate-code=arch=compute_75,code=compute_75 --compile probes/cxx23.cu -o build/cxx23_probe.o',
      ],
      artifacts: [],
      hostReferenceExecuted: false,
      runtimeEvidence: 'Runtime-Not-Applicable',
      probeDiagnostic: "nvcc fatal   : Value 'c++23' is not defined for option 'std'",
    };
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX02', unsupportedProbe)).resolves.toEqual([]);
    const { probeDiagnostic: _, ...missingDiagnostic } = unsupportedProbe;
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX02', missingDiagnostic)).resolves.toContain(
      'unsupported C++23 probe requires a diagnostic',
    );

    const invalid = {
      ...record,
      'SPDX-License-Identifier': 'MIT',
      schemaVersion: 2,
      result: 'failed',
      claim: 'Built',
      sourceCommit: 'short',
      buildContractSha256: 'd'.repeat(64),
      verificationDate: '2026/08/24',
      workflowRun: 'https://example.com/run/1',
      runner: { ...record.runner, architecture: 'ARM64', imageOS: '', dockerEngine: '' },
      container: {
        ...record.container,
        declaredReference: 'nvidia/cuda:latest',
        actualAmd64Digest: 'sha256:wrong',
        actualImageId: 'missing',
        actualRepoDigests: [],
        operatingSystem: { id: 'debian', versionId: '12' },
      },
      toolchain: {
        ...record.toolchain,
        hostCompiler: '',
        dialect: 'c++23',
        target: ['sm_90'],
      },
      commands: [],
      artifacts: [{ path: 'unexpected', bytes: 0, sha256: 'bad' }],
      hostReferenceExecuted: false,
      gpuExecutableExecuted: true,
      runtimeEvidence: 'Runtime-Verified',
    };
    const errors = await validateCompileEvidenceRecord(projectRoot, 'EX02', invalid);
    expect(errors).toContain('record schema and SPDX declaration are invalid');
    expect(errors).toContain('build contract hash does not match the canonical project');
    expect(errors).toContain('container coordinates do not match the declared Toolkit Lane');
    expect(errors).toContain('compile commands do not match the build contract');
    expect(errors).toContain('execution boundary is invalid');
  });

  it('loads committed records and rejects one after its build contract drifts', async () => {
    const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'canonical-evidence-'));
    temporaryRoots.push(fixtureRoot);
    const sourceRoot = path.join(projectRoot, 'examples/ex02-vector-addition');
    const fixtureExampleRoot = path.join(fixtureRoot, 'examples/ex02-vector-addition');
    await mkdir(path.dirname(fixtureExampleRoot), { recursive: true });
    await cp(sourceRoot, fixtureExampleRoot, { recursive: true });
    await expect(loadCompileEvidence(fixtureRoot, 'EX02')).resolves.toHaveLength(6);
    await writeFile(
      path.join(fixtureExampleRoot, 'include/vector_add_reference.hpp'),
      '// SPDX-License-Identifier: Apache-2.0\nchanged\n',
    );
    await expect(loadCompileEvidence(fixtureRoot, 'EX02')).rejects.toThrow(
      'build contract hash does not match',
    );
  });
});
