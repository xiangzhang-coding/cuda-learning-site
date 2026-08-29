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

function ordinaryInspection() {
  return {
    inventories: {
      ptx: [{ index: 1, file: 'artifact_kernel.1.sm_75.ptx' }],
      elf: [{ index: 1, file: 'artifact_kernel.1.sm_75.cubin' }],
      linkedElf: [{ index: 1, file: 'ex10-ptx-fatbinary-inspection.1.sm_75.cubin' }],
    },
    artifactTestReport: {
      'artifact-test': 'pass',
      'target-native': 'sm_75',
      'target-virtual': 'compute_75',
      'same-fatbinary-native-and-ptx': 'true',
      'caller-ex10-device-scale': 'undefined',
      'device-link-ex10-device-scale': 'defined',
      'host-executable-executed': 'false',
      'gpu-executable-executed': 'false',
      'runtime-evidence': 'Runtime-Not-Applicable',
      'performance-measured': 'false',
    },
    symbols: {
      callerUndefined: 'STT_FUNC STB_GLOBAL STV_DEFAULT U ex10_device_scale',
      deviceLinkDefined: 'STT_FUNC STB_GLOBAL STV_DEFAULT ex10_device_scale',
    },
    exitStatuses: {
      clean: 0,
      preprocess: 0,
      'standalone-ptx': 0,
      cubin: 0,
      fatbin: 0,
      'relocatable-compile': 0,
      'device-link': 0,
      'host-link': 0,
      inspect: 0,
      'artifact-test': 0,
    },
  };
}

function probeInspection() {
  return {
    inventories: {
      elf: [{ index: 1, file: 'cxx23_probe.1.sm_75.cubin' }],
    },
    compilerOutput: [],
    artifactHash: {
      path: 'build/cxx23_probe.o',
      sha256: 'c'.repeat(64),
    },
    exitStatuses: {
      clean: 0,
      compile: 0,
      inspect: 0,
      'artifact-hash': 0,
    },
  };
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
    sourceCommit: example.sourceCommit,
    buildContractSha256: await hashCanonicalBuildContract(projectRoot, 'EX10'),
    verificationDate: '2026-08-29',
    workflowRun: example.evidence.retainedWorkflowRun,
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
      nm: 'GNU nm (GNU Binutils for Ubuntu) 2.38',
      dialect: 'c++17',
      target: example.compatibility.target,
    },
    commands: Object.values(example.build.commands).map((command) =>
      command.replace('{dialect}', 'c++17')),
    artifacts: artifactRecords(example.build.artifacts),
    inspection: ordinaryInspection(),
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
    sourceCommit: example.sourceCommit,
    buildContractSha256: await hashCanonicalBuildContract(projectRoot, 'EX10'),
    verificationDate: '2026-08-29',
    workflowRun: example.evidence.retainedWorkflowRun,
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
      nm: 'GNU nm (GNU Binutils for Ubuntu) 2.42',
      dialect: probe.dialect,
      target: example.compatibility.target,
    },
    commands: probe.commands,
    artifacts: artifactRecords(probe.artifacts),
    inspection: probeInspection(),
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

    const unrelatedBaseDigest = {
      ...record,
      container: {
        ...record.container,
        baseImage: {
          ...record.container.baseImage,
          actualRepoDigests: [`unrelated/cuda@${record.container.manifestDigest}`],
        },
      },
    };
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', unrelatedBaseDigest)).resolves.toContain(
      'base-image repository digests do not include the declared image digest',
    );

    const unrelatedArtifactHash = {
      ...record,
      inspection: {
        ...record.inspection,
        artifactHash: { ...record.inspection.artifactHash, sha256: 'f'.repeat(64) },
      },
    };
    await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', unrelatedArtifactHash)).resolves.toContain(
      'inspection evidence is incomplete or unexpected',
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

  it('accepts explicit current-run and current-commit overrides for CI recording', async () => {
    const record = {
      ...await ordinaryRecord(),
      sourceCommit: 'b'.repeat(40),
      workflowRun: 'https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/99999',
    };

    await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', record, {
      expectedSourceCommit: record.sourceCommit,
      expectedWorkflowRun: record.workflowRun,
    })).resolves.toEqual([]);
    const retainedErrors = await validateCompileEvidenceRecord(projectRoot, 'EX10', record);
    expect(retainedErrors).toContain('source commit does not match the expected commit');
    expect(retainedErrors).toContain('workflow run does not match the expected run');
  });

  it('rejects unrelated check, run, source, repository digest, and inspection data', async () => {
    const record = await ordinaryRecord();
    const mutations = [
      {
        record: { ...record, check: 'ex10-cuda-12-9-cxx17' },
        error: 'check does not match its declared Toolkit Lane, dialect, and kind',
      },
      {
        record: {
          ...record,
          workflowRun: 'https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/99999',
        },
        error: 'workflow run does not match the expected run',
      },
      {
        record: { ...record, sourceCommit: 'b'.repeat(40) },
        error: 'source commit does not match the expected commit',
      },
      {
        record: {
          ...record,
          container: {
            ...record.container,
            actualRepoDigests: [`unrelated/cuda@${record.container.manifestDigest}`],
          },
        },
        error: 'actual repository digests do not include the declared image digest',
      },
      {
        record: {
          ...record,
          inspection: {
            ...record.inspection,
            inventories: {
              ...record.inspection.inventories,
              ptx: [{ index: 1, file: 'unrelated.1.sm_75.ptx' }],
            },
          },
        },
        error: 'inspection evidence is incomplete or unexpected',
      },
      {
        record: {
          ...record,
          inspection: {
            ...record.inspection,
            symbols: {
              ...record.inspection.symbols,
              callerUndefined: 'STT_FUNC STB_GLOBAL STV_DEFAULT ex10_device_scale',
            },
          },
        },
        error: 'inspection evidence is incomplete or unexpected',
      },
    ];

    for (const mutation of mutations) {
      await expect(validateCompileEvidenceRecord(projectRoot, 'EX10', mutation.record))
        .resolves.toContain(mutation.error);
    }
  });

  it('keeps all committed EX02 evidence valid after the EX10 generalization', async () => {
    await expect(loadCompileEvidence(projectRoot, 'EX02')).resolves.toHaveLength(6);
  });

  it('declares the retained EX10 run and exact six-check matrix', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX10');
    expect(example.sourceCommit).toBe('8b4af3965147f2ead99e72a73f5fe2f92fa0114b');
    expect(example.evidence.retainedWorkflowRun).toBe(
      'https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/33271481405',
    );
    expect(example.evidence.compilation).toHaveLength(5);
    expect(example.evidence.dialectProbe).toBe('evidence/cuda-13-3-gcc14-cxx23-probe.json');
    expect(example.compatibility.checks).toEqual([
      { id: 'ex10-cuda-11-8-cxx17', toolkitLane: 'cuda-11.8', dialect: 'c++17', kind: 'ex10' },
      { id: 'ex10-cuda-12-9-cxx17', toolkitLane: 'cuda-12.9', dialect: 'c++17', kind: 'ex10' },
      { id: 'ex10-cuda-12-9-cxx20', toolkitLane: 'cuda-12.9', dialect: 'c++20', kind: 'ex10' },
      { id: 'ex10-cuda-13-3-cxx17', toolkitLane: 'cuda-13.3', dialect: 'c++17', kind: 'ex10' },
      { id: 'ex10-cuda-13-3-cxx20', toolkitLane: 'cuda-13.3', dialect: 'c++20', kind: 'ex10' },
      {
        id: 'ex10-cuda-13-3-gcc14-cxx23-probe',
        toolkitLane: 'cuda-13.3',
        dialect: 'c++23',
        kind: 'cxx23-probe',
      },
    ]);
  });
});
