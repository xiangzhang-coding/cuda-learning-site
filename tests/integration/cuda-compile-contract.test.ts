// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readProjectFile(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

describe('CUDA compile evidence workflow', () => {
  it('pins the three official NVIDIA development images and every required dialect check', async () => {
    const workflow = await readProjectFile('.github/workflows/cuda-compile.yml');

    expect(workflow).toContain('name: CUDA Compile Evidence');
    expect(workflow).toContain('runs-on: ubuntu-24.04');
    expect(workflow).toContain('fail-fast: false');
    expect(workflow).toMatch(/permissions:\s*\n\s+contents: read/);
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('ref: ${{ github.event.pull_request.head.sha || github.sha }}');

    const actionPins = [...workflow.matchAll(/uses:\s+actions\/[^@\s]+@([0-9a-f]{40})/g)].map((match) => match[1]);
    expect(new Set(actionPins)).toEqual(new Set([
      '3d3c42e5aac5ba805825da76410c181273ba90b1',
      '820762786026740c76f36085b0efc47a31fe5020',
      '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
    ]));
    expect(workflow).not.toMatch(/uses:\s+[^\s]+@(?![0-9a-f]{40}(?:\s|$))/);

    for (const coordinate of [
      '11.8.0-devel-ubuntu22.04@sha256:94fd755736cb58979173d491504f0b573247b1745250249415b07fefc738e41f',
      '12.9.2-devel-ubuntu24.04@sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5',
      '13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87',
      'lane: cuda-11-8-cxx17',
      'lane: cuda-12-9-cxx17',
      'lane: cuda-12-9-cxx20',
      'lane: cuda-13-3-cxx17',
      'lane: cuda-13-3-cxx20',
      'lane: cuda-13-3-cxx23-probe',
      'lane: ex03-cuda-11-8-cxx17',
      'lane: ex03-cuda-12-9-cxx17',
      'lane: ex03-cuda-13-3-cxx17',
    ]) {
      expect(workflow).toContain(coordinate);
    }
  });

  it('records manifests, scans retained evidence, and gates all matrix jobs', async () => {
    const workflow = await readProjectFile('.github/workflows/cuda-compile.yml');

    expect(workflow).toContain('node scripts/run-cuda-compile.mjs');
    expect(workflow).toContain('node scripts/check-artifacts.mjs');
    expect(workflow).toContain('ImageVersion');
    expect(workflow).toContain('RUNNER_ARCH');
    expect(workflow).toContain("docker version --format '{{.Server.Version}}'");
    expect(workflow).toContain('docker buildx version');
    expect(workflow).toContain('path: artifacts/cuda/${{ matrix.lane }}');
    expect(workflow).not.toContain('path: .quality/');
    expect(workflow).toContain('retention-days: 7');
    expect(workflow).toContain('include-hidden-files: false');
    expect(workflow).toMatch(/^  cuda-compile-gate:/m);
    expect(workflow).toContain('if: ${{ always() }}');
    expect(workflow).toContain('CUDA_EVIDENCE_RESULT: ${{ needs.cuda-compile.result }}');
    expect(workflow).toContain('EX03_BUILD_RESULT: ${{ needs.ex03-build.result }}');
    expect(workflow).toContain('bash scripts/compile-check.sh c++17 ex03');
    expect(workflow).toContain('artifacts/cuda-ex03/${{ matrix.lane }}');
  });

  it('never executes the generated CUDA binary in the compile boundary', async () => {
    const [orchestrator, laneScript, ex03LaneScript] = await Promise.all([
      readProjectFile('scripts/run-cuda-compile.mjs'),
      readProjectFile('examples/ex02-vector-addition/scripts/compile-check.sh'),
      readProjectFile('examples/ex03-multidimensional-indexing/scripts/compile-check.sh'),
    ]);

    expect(orchestrator).not.toMatch(/exec(?:File)?Sync\([^\n]*ex02-vector-addition/);
    expect(orchestrator).toContain('Fatbin ptx code:');
    expect(orchestrator).toContain('\\.target\\s+sm_75');
    expect(orchestrator).toContain('-std=c\\+\\+23 flag is not supported with the configured host compiler');
    expect(laneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex02-vector-addition(?:\s|$)/m);
    expect(laneScript).toContain('make host-test');
    expect(ex03LaneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex03-multidimensional-indexing(?:\s|$)/m);
    expect(ex03LaneScript).toContain('make host-test');
  });
});
