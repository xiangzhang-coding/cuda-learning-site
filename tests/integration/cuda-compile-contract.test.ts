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
      'lane: ex04-cuda-11-8-cxx17',
      'lane: ex04-cuda-12-9-cxx17',
      'lane: ex04-cuda-13-3-cxx17',
      'lane: ex05-cuda-11-8-cxx17',
      'lane: ex05-cuda-12-9-cxx17',
      'lane: ex05-cuda-13-3-cxx17',
      'lane: ex06-cuda-11-8-cxx17',
      'lane: ex06-cuda-12-9-cxx17',
      'lane: ex06-cuda-13-3-cxx17',
      'lane: ex16-cuda-11-8-cxx17',
      'lane: ex16-cuda-12-9-cxx17',
      'lane: ex16-cuda-13-3-cxx17',
    ]) {
      expect(workflow).toContain(coordinate);
    }
  });

  it('records manifests, scans retained evidence, and gates all matrix jobs', async () => {
    const workflow = await readProjectFile('.github/workflows/cuda-compile.yml');
    const ex04Build = workflow.match(/^  ex04-build:\n[\s\S]*?(?=^  ex05-build:)/m)?.[0] ?? '';
    const ex05Build = workflow.match(/^  ex05-build:\n[\s\S]*?(?=^  ex06-build:)/m)?.[0] ?? '';
    const ex06Build = workflow.match(/^  ex06-build:\n[\s\S]*?(?=^  ex16-build:)/m)?.[0] ?? '';
    const ex16Build = workflow.match(/^  ex16-build:\n[\s\S]*?(?=^  cuda-compile-gate:)/m)?.[0] ?? '';

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
    expect(workflow).toContain('EX04_BUILD_RESULT: ${{ needs.ex04-build.result }}');
    expect(workflow).toContain('EX05_BUILD_RESULT: ${{ needs.ex05-build.result }}');
    expect(workflow).toContain('EX06_BUILD_RESULT: ${{ needs.ex06-build.result }}');
    expect(workflow).toContain('EX16_BUILD_RESULT: ${{ needs.ex16-build.result }}');
    expect(workflow).toContain(
      'needs: [cuda-compile, ex03-build, ex04-build, ex05-build, ex06-build, ex16-build]',
    );
    expect(workflow).toContain('if [ "$EX04_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX05_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX06_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX16_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('bash scripts/compile-check.sh c++17 ex03');
    expect(workflow).toContain('artifacts/cuda-ex03/${{ matrix.lane }}');

    expect(ex04Build).not.toBe('');
    expect(ex04Build.match(/^\s+- lane: ex04-cuda-\d+-\d+-cxx17$/gm)).toHaveLength(3);
    for (const [lane, image] of [
      ['ex04-cuda-11-8-cxx17', 'nvidia/cuda:11.8.0-devel-ubuntu22.04@sha256:94fd755736cb58979173d491504f0b573247b1745250249415b07fefc738e41f'],
      ['ex04-cuda-12-9-cxx17', 'nvidia/cuda:12.9.2-devel-ubuntu24.04@sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5'],
      ['ex04-cuda-13-3-cxx17', 'nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87'],
    ]) {
      expect(ex04Build).toContain(`- lane: ${lane}\n            image: ${image}`);
    }
    expect(ex04Build).toContain('docker pull --platform linux/amd64');
    expect(ex04Build).toContain('docker run --platform linux/amd64 --rm --network none');
    expect(ex04Build).toContain('--user "$(id -u):$(id -g)"');
    expect(ex04Build).toContain('bash scripts/compile-check.sh c++17 ex04');
    expect(ex04Build).toContain('path: artifacts/cuda-ex04/${{ matrix.lane }}');
    expect(ex04Build).toContain('retention-days: 7');
    const scanOffset = ex04Build.indexOf('node scripts/check-artifacts.mjs');
    const uploadOffset = ex04Build.indexOf('uses: actions/upload-artifact@');
    expect(scanOffset).toBeGreaterThan(-1);
    expect(uploadOffset).toBeGreaterThan(scanOffset);

    for (const [exampleId, build, root] of [
      ['ex05', ex05Build, 'coalesced-strided-access'],
      ['ex06', ex06Build, 'shared-memory-tile-bank-padding'],
    ] as const) {
      expect(build).not.toBe('');
      expect(build.match(new RegExp(`^\\s+- lane: ${exampleId}-cuda-\\d+-\\d+-cxx17$`, 'gm')))
        .toHaveLength(3);
      for (const [laneSuffix, image] of [
        ['cuda-11-8-cxx17', 'nvidia/cuda:11.8.0-devel-ubuntu22.04@sha256:94fd755736cb58979173d491504f0b573247b1745250249415b07fefc738e41f'],
        ['cuda-12-9-cxx17', 'nvidia/cuda:12.9.2-devel-ubuntu24.04@sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5'],
        ['cuda-13-3-cxx17', 'nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87'],
      ]) {
        expect(build).toContain(
          `- lane: ${exampleId}-${laneSuffix}\n            image: ${image}`,
        );
      }
      expect(build).toContain('docker pull --platform linux/amd64');
      expect(build).toContain('docker run --platform linux/amd64 --rm --network none');
      expect(build).toContain('--user "$(id -u):$(id -g)"');
      expect(build).toContain(
        `Compile ${exampleId.toUpperCase()} without granting Evidence Status`,
      );
      expect(build).toContain(`--workdir /workspace/examples/${exampleId}-${root}`);
      expect(build).toContain(`bash scripts/compile-check.sh c++17 ${exampleId}`);
      expect(build).toContain(`path: artifacts/cuda-${exampleId}/\${{ matrix.lane }}`);
      expect(build).not.toContain(`/examples/${exampleId}-${root}/evidence`);
      expect(build).toContain('retention-days: 7');
      const buildScanOffset = build.indexOf('node scripts/check-artifacts.mjs');
      const buildUploadOffset = build.indexOf('uses: actions/upload-artifact@');
      expect(buildScanOffset).toBeGreaterThan(-1);
      expect(buildUploadOffset).toBeGreaterThan(buildScanOffset);
    }

    expect(ex16Build).not.toBe('');
    expect([...ex16Build.matchAll(/^\s+- lane: (\S+)$/gm)].map((match) => match[1])).toEqual([
      'ex16-cuda-11-8-cxx17',
      'ex16-cuda-12-9-cxx17',
      'ex16-cuda-13-3-cxx17',
    ]);
    for (const [lane, image] of [
      ['ex16-cuda-11-8-cxx17', 'nvidia/cuda:11.8.0-devel-ubuntu22.04@sha256:94fd755736cb58979173d491504f0b573247b1745250249415b07fefc738e41f'],
      ['ex16-cuda-12-9-cxx17', 'nvidia/cuda:12.9.2-devel-ubuntu24.04@sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5'],
      ['ex16-cuda-13-3-cxx17', 'nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87'],
    ]) {
      expect(ex16Build).toContain(`- lane: ${lane}\n            image: ${image}`);
    }
    expect(ex16Build).toContain('docker run --platform linux/amd64 --rm --network none');
    expect(ex16Build).not.toContain('--gpus');
    expect(ex16Build).toContain(
      '--workdir /workspace/examples/ex16-sanitizer-defect-suite',
    );
    expect(ex16Build).toContain('bash scripts/compile-check.sh c++17 ex16');
    expect(ex16Build).toContain(
      'node scripts/check-artifacts.mjs "artifacts/cuda-ex16/${{ matrix.lane }}"',
    );
    expect(ex16Build).toContain('path: artifacts/cuda-ex16/${{ matrix.lane }}');
    expect(ex16Build).toContain('retention-days: 7');
    const ex16ScanOffset = ex16Build.indexOf('node scripts/check-artifacts.mjs');
    const ex16UploadOffset = ex16Build.indexOf('uses: actions/upload-artifact@');
    expect(ex16ScanOffset).toBeGreaterThan(-1);
    expect(ex16UploadOffset).toBeGreaterThan(ex16ScanOffset);
  });

  it('never executes the generated CUDA binary in the compile boundary', async () => {
    const [
      orchestrator,
      laneScript,
      ex03LaneScript,
      ex04LaneScript,
      ex05LaneScript,
      ex06LaneScript,
      ex16LaneScript,
    ] = await Promise.all([
      readProjectFile('scripts/run-cuda-compile.mjs'),
      readProjectFile('examples/ex02-vector-addition/scripts/compile-check.sh'),
      readProjectFile('examples/ex03-multidimensional-indexing/scripts/compile-check.sh'),
      readProjectFile('examples/ex04-error-handling-lifecycle/scripts/compile-check.sh'),
      readProjectFile('examples/ex05-coalesced-strided-access/scripts/compile-check.sh'),
      readProjectFile('examples/ex06-shared-memory-tile-bank-padding/scripts/compile-check.sh'),
      readProjectFile('examples/ex16-sanitizer-defect-suite/scripts/compile-check.sh'),
    ]);

    expect(orchestrator).not.toMatch(/exec(?:File)?Sync\([^\n]*ex02-vector-addition/);
    expect(orchestrator).toContain('Fatbin ptx code:');
    expect(orchestrator).toContain('\\.target\\s+sm_75');
    expect(orchestrator).toContain('-std=c\\+\\+23 flag is not supported with the configured host compiler');
    expect(laneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex02-vector-addition(?:\s|$)/m);
    expect(laneScript).toContain('make host-test');
    expect(ex03LaneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex03-multidimensional-indexing(?:\s|$)/m);
    expect(ex03LaneScript).toContain('make host-test');
    expect(ex04LaneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex04-error-handling-lifecycle(?:\s|$)/m);
    for (const target of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
      expect(ex04LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex05LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex06LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
    }
    expect(ex05LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex05-coalesced-strided-access(?:\s|$)/m,
    );
    expect(ex06LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex06-shared-memory-tile-bank-padding(?:\s|$)/m,
    );
    expect(ex16LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/(?:memcheck|racecheck|initcheck|synccheck)-(?:defect|corrected)(?:\s|$)/m,
    );
    expect(ex16LaneScript).not.toMatch(/(?:^|\s)compute-sanitizer(?:\s|$)/m);
    for (const target of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
      expect(ex16LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
    }
  });

  it('keeps ephemeral EX16 build-gate logs from granting compilation or runtime evidence', async () => {
    const [workflow, manifestSource] = await Promise.all([
      readProjectFile('.github/workflows/cuda-compile.yml'),
      readProjectFile('examples/ex16-sanitizer-defect-suite/project.json'),
    ]);
    const ex16Build = workflow.match(/^  ex16-build:\n[\s\S]*?(?=^  cuda-compile-gate:)/m)?.[0] ?? '';
    const manifest = JSON.parse(manifestSource) as {
      evidence: { compilation: unknown[]; runtime: string };
    };

    expect(ex16Build).toContain('Compile EX16 without granting Evidence Status');
    expect(ex16Build).not.toContain('compute-sanitizer');
    expect(ex16Build).not.toContain('Compile-Checked');
    expect(ex16Build).not.toContain('Runtime-Verified');
    expect(ex16Build).not.toContain('examples/ex16-sanitizer-defect-suite/evidence/');
    expect(manifest.evidence.compilation).toEqual([]);
    expect(manifest.evidence.runtime).toBe('Pending Hardware Verification');
  });

  it('keeps ephemeral EX04 build logs from granting public compilation evidence', async () => {
    const [workflow, manifestSource, evidenceReadme, englishPage, chinesePage] = await Promise.all([
      readProjectFile('.github/workflows/cuda-compile.yml'),
      readProjectFile('examples/ex04-error-handling-lifecycle/project.json'),
      readProjectFile('examples/ex04-error-handling-lifecycle/evidence/README.md'),
      readProjectFile('src/content/docs/en/examples/error-handling-lifecycle.mdx'),
      readProjectFile('src/content/docs/examples/error-handling-lifecycle.mdx'),
    ]);
    const manifest = JSON.parse(manifestSource) as { evidence: { compilation: unknown[] } };

    expect(workflow).toContain('Compile EX04 without granting Evidence Status');
    expect(workflow).not.toContain('examples/ex04-error-handling-lifecycle/evidence/');
    expect(manifest.evidence.compilation).toEqual([]);
    expect(evidenceReadme).toContain('no qualifying EX04 compilation record exists');
    for (const page of [englishPage, chinesePage]) {
      expect(page).toMatch(/evidence:\s*\n\s+compilation:\s*\[\]/);
    }
  });
});
