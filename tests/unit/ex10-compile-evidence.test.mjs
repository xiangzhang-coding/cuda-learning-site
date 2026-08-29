// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  hashCanonicalBuildContract,
  loadCanonicalExample,
  loadCompileEvidence,
  validateCompileEvidenceRecord,
} from '../../scripts/lib/canonical-examples.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');

function runner() {
  return {
    operatingSystem: 'Linux',
    architecture: 'X64',
    imageOS: 'ubuntu24',
    imageVersion: '20260823.1',
    dockerEngine: '29.4.0',
    dockerBuildx: 'github.com/docker/buildx v0.29.1',
  };
}

function artifactRecords(paths) {
  return paths.map((artifactPath) => ({
    path: artifactPath,
    bytes: 1,
    sha256: 'c'.repeat(64),
  }));
}

async function ordinaryRecord() {
  const example = await loadCanonicalExample(projectRoot, 'EX10');
  const lane = example.compatibility.lanes[0];
  return {
    'SPDX-License-Identifier': 'Apache-2.0',
    schemaVersion: 1,
    result: 'pass',
    claim: 'Compile-Checked',
    subject: 'EX10',
    check: 'ex10-cuda-11-8-cxx17',
    sourceCommit: 'a'.repeat(40),
    buildContractSha256: await hashCanonicalBuildContract(projectRoot, 'EX10'),
    verificationDate: '2026-08-29',
    workflowRun: 'https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/12345',
    runner: runner(),
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
        prettyName: 'Ubuntu 22.04.5 LTS',
      },
    },
    toolchain: {
      toolkit: lane.toolkit,
      hostCompiler: 'g++ (Ubuntu 11.4.0) 11.4.0',
      nvcc: 'Cuda compilation tools, release 11.8, V11.8.89',
      cuobjdump: 'cuobjdump: NVIDIA (R) fat binary listing tool; Cuda compilation tools, release 11.8, V11.8.86',
      dialect: 'c++17',
      target: example.compatibility.target,
    },
    commands: Object.values(example.build.commands).map((command) =>
      command.replace('{dialect}', 'c++17')),
    artifacts: artifactRecords(example.build.artifacts),
    hostReferenceExecuted: false,
    hostExecutableExecuted: false,
    gpuExecutableExecuted: false,
    runtimeEvidence: 'Runtime-Not-Applicable',
  };
}

async function probeRecord() {
  const example = await loadCanonicalExample(projectRoot, 'EX10');
  const lane = example.compatibility.lanes[2];
  const probe = example.compatibility.probes[0];
  return {
    'SPDX-License-Identifier': 'Apache-2.0',
    schemaVersion: 1,
    result: 'pass',
    claim: probe.claim,
    subject: probe.subject,
    check: 'ex10-cuda-13-3-gcc14-cxx23-probe',
    sourceCommit: 'a'.repeat(40),
    buildContractSha256: await hashCanonicalBuildContract(projectRoot, 'EX10'),
    verificationDate: '2026-08-29',
    workflowRun: 'https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/12345',
    runner: runner(),
    container: {
      declaredReference: lane.image,
      manifestDigest: lane.manifestDigest,
      expectedAmd64Digest: lane.amd64Digest,
      actualAmd64Digest: lane.amd64Digest,
      actualImageId: `sha256:${'d'.repeat(64)}`,
      actualRepoDigests: [],
      operatingSystem: {
        id: 'ubuntu',
        versionId: '24.04',
        prettyName: 'Ubuntu 24.04.4 LTS',
      },
      baseImage: {
        actualImageId: `sha256:${'e'.repeat(64)}`,
        actualRepoDigests: [`nvidia/cuda@${lane.manifestDigest}`],
      },
      derivedImage: {
        dockerfile: probe.image.dockerfile,
        buildCommand: probe.image.buildCommand,
        tag: probe.image.tag,
        hostCompilerPackage: 'g++-14=14.2.0-4ubuntu2~24.04.1',
      },
    },
    toolchain: {
      toolkit: lane.toolkit,
      hostCompiler: 'g++-14 (Ubuntu 14.2.0-4ubuntu2~24.04.1) 14.2.0',
      nvcc: 'Cuda compilation tools, release 13.3, V13.3.73',
      cuobjdump: 'cuobjdump: NVIDIA (R) fat binary listing tool; Cuda compilation tools, release 13.3, V13.3.73',
      dialect: probe.dialect,
      target: example.compatibility.target,
    },
    commands: probe.commands,
    artifacts: artifactRecords(probe.artifacts),
    hostReferenceExecuted: false,
    hostExecutableExecuted: false,
    gpuExecutableExecuted: false,
    runtimeEvidence: 'Runtime-Not-Applicable',
  };
}

describe('EX10 compile evidence validation', () => {
  it('accepts an ordinary Runtime-Not-Applicable record without host execution', async () => {
    const record = await ordinaryRecord();

    await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', record)).resolves.toEqual([]);
  });

  it('rejects runtime and executable claims outside the EX10 boundary', async () => {
    const record = await ordinaryRecord();
    const errors = await validateCompileEvidenceRecord(projectRoot, 'EX10', {
      ...record,
      hostExecutableExecuted: true,
      runtimeEvidence: 'Runtime-Verified',
    });

    expect(errors).toContain('execution boundary is invalid');
    expect(errors).toContain('runtime evidence boundary is invalid');
  });

  it('accepts only the declared GCC 14 derived-image C++23 probe', async () => {
    const record = await probeRecord();
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', record)).resolves.toEqual([]);

    const wrongCompiler = {
      ...record,
      toolchain: { ...record.toolchain, hostCompiler: 'g++ (Ubuntu 13.3.0) 13.3.0' },
    };
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', wrongCompiler)).resolves.toContain(
      'C++23 probe host compiler does not match the declared compiler',
    );

    const missingPackage = {
      ...record,
      container: {
        ...record.container,
        derivedImage: { ...record.container.derivedImage, hostCompilerPackage: '' },
      },
    };
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', missingPackage)).resolves.toContain(
      'actual container identity is incomplete',
    );
  });

  it('rejects any probe command that bypasses NVCC host compiler support checks', async () => {
    const record = await probeRecord();
    const errors = await validateCompileEvidenceRecord(projectRoot, 'EX10', {
      ...record,
      commands: [...record.commands, 'nvcc --allow-unsupported-compiler probes/cxx23.cu'],
    });

    expect(errors).toContain('compile commands do not match the build contract');
    expect(errors).toContain('unsupported host compiler bypass is forbidden');
  });

  it('keeps all committed EX02 evidence valid after the EX10 generalization', async () => {
    await expect(loadCompileEvidence(projectRoot, 'EX02')).resolves.toHaveLength(6);
  });
});
