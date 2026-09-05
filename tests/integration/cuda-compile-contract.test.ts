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
      'lane: ex01-cuda-11-8-cxx17-shared',
      'lane: ex01-cuda-11-8-cxx17-static',
      'lane: ex01-cuda-12-9-cxx17-shared',
      'lane: ex01-cuda-12-9-cxx17-static',
      'lane: ex01-cuda-13-3-cxx17-shared',
      'lane: ex01-cuda-13-3-cxx17-static',
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
      'lane: ex07-cuda-11-8-cxx17',
      'lane: ex07-cuda-12-9-cxx17',
      'lane: ex07-cuda-13-3-cxx17',
      'lane: ex08-cuda-11-8-cxx17',
      'lane: ex08-cuda-12-9-cxx17',
      'lane: ex08-cuda-13-3-cxx17',
      'lane: ex09-cuda-11-8-cxx17',
      'lane: ex09-cuda-12-9-cxx17',
      'lane: ex09-cuda-13-3-cxx17',
      'lane: ex11-cuda-11-8-cxx17',
      'lane: ex11-cuda-12-9-cxx17',
      'lane: ex11-cuda-13-3-cxx17',
      'lane: ex12-cuda-11-8-cxx17',
      'lane: ex12-cuda-12-9-cxx17',
      'lane: ex12-cuda-13-3-cxx17',
      'lane: ex13-cuda-11-8-cxx17',
      'lane: ex13-cuda-12-9-cxx17',
      'lane: ex13-cuda-13-3-cxx17',
      'lane: ex14-cuda-11-8-cxx17',
      'lane: ex14-cuda-12-9-cxx17',
      'lane: ex14-cuda-13-3-cxx17',
      'lane: ex15-cuda-11-8-cxx17',
      'lane: ex15-cuda-12-9-cxx17',
      'lane: ex15-cuda-13-3-cxx17',
      'lane: ex16-cuda-11-8-cxx17',
      'lane: ex16-cuda-12-9-cxx17',
      'lane: ex16-cuda-13-3-cxx17',
      'profile: cuda-11-8-bundled-cub-1-15-1',
      'profile: cuda-12-9-bundled-cub-2-8-2',
      'profile: cuda-13-3-bundled-cub-3-3-4',
      'profile: cuda-12-9-selected-cccl-3-4-2',
      'profile: cuda-13-3-selected-cccl-3-4-2',
    ]) {
      expect(workflow).toContain(coordinate);
    }
  });

  it('records manifests, scans retained evidence, and gates all matrix jobs', async () => {
    const workflow = await readProjectFile('.github/workflows/cuda-compile.yml');
    const ex01Build = workflow.match(/^  ex01-build:\n[\s\S]*?(?=^  ex03-build:)/m)?.[0] ?? '';
    const ex04Build = workflow.match(/^  ex04-build:\n[\s\S]*?(?=^  ex05-build:)/m)?.[0] ?? '';
    const ex05Build = workflow.match(/^  ex05-build:\n[\s\S]*?(?=^  ex06-build:)/m)?.[0] ?? '';
    const ex06Build = workflow.match(/^  ex06-build:\n[\s\S]*?(?=^  ex07-build:)/m)?.[0] ?? '';
    const ex07Build = workflow.match(/^  ex07-build:\n[\s\S]*?(?=^  ex08-build:)/m)?.[0] ?? '';
    const ex08Build = workflow.match(/^  ex08-build:\n[\s\S]*?(?=^  ex09-build:)/m)?.[0] ?? '';
    const ex09Build = workflow.match(/^  ex09-build:\n[\s\S]*?(?=^  ex11-build:)/m)?.[0] ?? '';
    const ex11Build = workflow.match(/^  ex11-build:\n[\s\S]*?(?=^  ex12-build:)/m)?.[0] ?? '';
    const ex12Build = workflow.match(/^  ex12-build:\n[\s\S]*?(?=^  ex13-build:)/m)?.[0] ?? '';
    const ex13Build = workflow.match(/^  ex13-build:\n[\s\S]*?(?=^  ex14-build:)/m)?.[0] ?? '';
    const ex14Build = workflow.match(/^  ex14-build:\n[\s\S]*?(?=^  ex15-build:)/m)?.[0] ?? '';
    const ex15Build = workflow.match(/^  ex15-build:\n[\s\S]*?(?=^  ex16-build:)/m)?.[0] ?? '';
    const ex16Build = workflow.match(/^  ex16-build:\n[\s\S]*?(?=^  ex17-build:)/m)?.[0] ?? '';

    expect(workflow).toContain('node scripts/run-cuda-compile.mjs');
    expect(workflow).toContain('node scripts/check-artifacts.mjs');
    expect(workflow).toContain('ImageVersion');
    expect(workflow).toContain('RUNNER_ARCH');
    expect(workflow).toContain("docker version --format '{{.Server.Version}}'");
    expect(workflow).toContain('docker buildx version');
    expect(workflow).toContain('path: artifacts/cuda/${{ matrix.lane }}');
    expect(workflow.match(/^\s+path: \.quality\/cccl-v3\.4\.2$/gm)).toHaveLength(1);
    expect(workflow).toContain('retention-days: 7');
    expect(workflow).toContain('include-hidden-files: false');
    expect(workflow).toMatch(/^  cuda-compile-gate:/m);
    expect(workflow).toContain('if: ${{ always() }}');
    expect(workflow).toContain('CUDA_EVIDENCE_RESULT: ${{ needs.cuda-compile.result }}');
    expect(workflow).toContain('EX01_BUILD_RESULT: ${{ needs.ex01-build.result }}');
    expect(workflow).toContain('EX03_BUILD_RESULT: ${{ needs.ex03-build.result }}');
    expect(workflow).toContain('EX04_BUILD_RESULT: ${{ needs.ex04-build.result }}');
    expect(workflow).toContain('EX05_BUILD_RESULT: ${{ needs.ex05-build.result }}');
    expect(workflow).toContain('EX06_BUILD_RESULT: ${{ needs.ex06-build.result }}');
    expect(workflow).toContain('EX07_BUILD_RESULT: ${{ needs.ex07-build.result }}');
    expect(workflow).toContain('EX08_BUILD_RESULT: ${{ needs.ex08-build.result }}');
    expect(workflow).toContain('EX09_BUILD_RESULT: ${{ needs.ex09-build.result }}');
    expect(workflow).toContain('EX11_BUILD_RESULT: ${{ needs.ex11-build.result }}');
    expect(workflow).toContain('EX12_BUILD_RESULT: ${{ needs.ex12-build.result }}');
    expect(workflow).toContain('EX13_BUILD_RESULT: ${{ needs.ex13-build.result }}');
    expect(workflow).toContain('EX14_BUILD_RESULT: ${{ needs.ex14-build.result }}');
    expect(workflow).toContain('EX15_BUILD_RESULT: ${{ needs.ex15-build.result }}');
    expect(workflow).toContain('EX16_BUILD_RESULT: ${{ needs.ex16-build.result }}');
    expect(workflow).toContain('EX17_BUILD_RESULT: ${{ needs.ex17-build.result }}');
    expect(workflow).toContain(
      'needs: [cuda-compile, ex01-build, ex03-build, ex04-build, ex05-build, ex06-build, ex07-build, ex08-build, ex09-build, ex10-compile, ex11-build, ex12-build, ex13-build, ex14-build, ex15-build, ex16-build, ex17-build]',
    );
    expect(workflow).toContain('EX10_COMPILE_RESULT: ${{ needs.ex10-compile.result }}');
    expect(workflow).toContain('if [ "$EX01_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX04_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX05_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX06_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX07_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX08_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX09_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX11_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX12_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX13_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX14_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX15_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX16_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('if [ "$EX17_BUILD_RESULT" != "success" ]; then exit 1; fi');
    expect(workflow).toContain('bash scripts/compile-check.sh c++17 ex03');
    expect(workflow).toContain('artifacts/cuda-ex03/${{ matrix.lane }}');

    expect(ex01Build).not.toBe('');
    expect([...ex01Build.matchAll(/^\s+- lane: (\S+)$/gm)].map((match) => match[1])).toEqual([
      'ex01-cuda-11-8-cxx17-shared',
      'ex01-cuda-11-8-cxx17-static',
      'ex01-cuda-12-9-cxx17-shared',
      'ex01-cuda-12-9-cxx17-static',
      'ex01-cuda-13-3-cxx17-shared',
      'ex01-cuda-13-3-cxx17-static',
    ]);
    expect(ex01Build.match(/^\s+cudart: shared$/gm)).toHaveLength(3);
    expect(ex01Build.match(/^\s+cudart: static$/gm)).toHaveLength(3);
    expect(ex01Build).toContain('Record EX01 runner and container-tool coordinates');
    expect(ex01Build).toContain('ImageVersion');
    expect(ex01Build).toContain("docker version --format '{{.Server.Version}}'");
    expect(ex01Build).toContain('docker buildx version');
    expect(ex01Build).toContain('Compile EX01 without granting Evidence Status');
    expect(ex01Build).toContain('bash scripts/compile-check.sh c++17 "${{ matrix.cudart }}"');
    expect(ex01Build).toContain('path: artifacts/cuda-ex01/${{ matrix.lane }}');
    expect(ex01Build).toContain('retention-days: 7');
    expect(ex01Build).not.toContain('Compile-Checked');
    expect(ex01Build).not.toContain('Runtime-Verified');

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

    expect([...workflow.matchAll(/^  (ex(?:11|12|13|14|15)-build):$/gm)].map((match) => match[1]))
      .toEqual(['ex11-build', 'ex12-build', 'ex13-build', 'ex14-build', 'ex15-build']);

    for (const [exampleId, build, root] of [
      ['ex05', ex05Build, 'coalesced-strided-access'],
      ['ex06', ex06Build, 'shared-memory-tile-bank-padding'],
      ['ex07', ex07Build, 'streams-events-overlap'],
      ['ex08', ex08Build, 'unified-memory-migration'],
      ['ex09', ex09Build, 'graph-capture'],
      ['ex11', ex11Build, 'multi-stage-reduction'],
      ['ex12', ex12Build, 'inclusive-exclusive-scan'],
      ['ex13', ex13Build, 'privatized-histogram'],
      ['ex14', ex14Build, 'tiled-transpose'],
      ['ex15', ex15Build, 'tiled-gemm'],
    ] as const) {
      expect(build).not.toBe('');
      expect([...build.matchAll(/^\s+- lane: (\S+)$/gm)].map((match) => match[1])).toEqual([
        `${exampleId}-cuda-11-8-cxx17`,
        `${exampleId}-cuda-12-9-cxx17`,
        `${exampleId}-cuda-13-3-cxx17`,
      ]);
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
      expect(build).not.toContain('--gpus');
      expect(build).toContain('--user "$(id -u):$(id -g)"');
      expect(build).toContain(
        `Compile ${exampleId.toUpperCase()} without granting Evidence Status`,
      );
      expect(build).toContain(`--workdir /workspace/examples/${exampleId}-${root}`);
      expect(build).toContain(`bash scripts/compile-check.sh c++17 ${exampleId}`);
      const artifactPath = `artifacts/cuda-${exampleId}/\${{ matrix.lane }}`;
      expect(build).toContain(`node scripts/check-artifacts.mjs "${artifactPath}"`);
      expect(build).toContain(`path: ${artifactPath}`);
      expect(build).not.toMatch(
        new RegExp(`(?:^|\\s)(?:\\.\\/)?build/${exampleId}-${root}(?:\\s|$)`, 'm'),
      );
      expect(build).not.toContain(`/examples/${exampleId}-${root}/evidence`);
      expect(build).not.toContain('Compile-Checked');
      expect(build).not.toContain('Runtime-Verified');
      expect(build).toContain('retention-days: 7');
      const buildScanOffset = build.indexOf('node scripts/check-artifacts.mjs');
      const buildUploadOffset = build.indexOf('uses: actions/upload-artifact@');
      expect(buildScanOffset).toBeGreaterThan(-1);
      expect(buildUploadOffset).toBeGreaterThan(buildScanOffset);
    }
    expect(ex15Build).toContain('fetch-depth: 0');
    expect(ex15Build).toContain('Verify EX15 build inputs match the pinned source tree');
    expect(ex15Build).toContain('git cat-file -e "${source_commit}^{commit}"');
    expect(ex15Build).toContain('git diff --exit-code "$source_commit" -- "$file"');

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

  it('build-gates all five EX17 CUB profiles without granting Evidence Status', async () => {
    const [workflow, ex17LaneScript, lab11RunnerBuild] = await Promise.all([
      readProjectFile('.github/workflows/cuda-compile.yml'),
      readProjectFile('examples/ex17-cub-device-reduction-scan/scripts/compile-check.sh'),
      readProjectFile('scripts/check-lab11-runner-build.sh'),
    ]);
    const ex17Build = workflow.match(/^  ex17-build:\n[\s\S]*?(?=^  cuda-compile-gate:)/m)?.[0] ?? '';
    const checkoutPin = '3d3c42e5aac5ba805825da76410c181273ba90b1';
    const ccclCommit = 'd36012203ef73ac7f966e848dd88482273e91e02';
    const profiles = [...ex17Build.matchAll(
      /^\s+- profile: (\S+)\n\s+dependency_mode: (\S+)\n\s+image: (\S+)$/gm,
    )].map((match) => ({
      id: match[1],
      dependencyMode: match[2],
      image: match[3],
    }));

    expect(ex17Build).not.toBe('');
    expect(profiles).toEqual([
      {
        id: 'cuda-11-8-bundled-cub-1-15-1',
        dependencyMode: 'bundled',
        image: 'nvidia/cuda:11.8.0-devel-ubuntu22.04@sha256:94fd755736cb58979173d491504f0b573247b1745250249415b07fefc738e41f',
      },
      {
        id: 'cuda-12-9-bundled-cub-2-8-2',
        dependencyMode: 'bundled',
        image: 'nvidia/cuda:12.9.2-devel-ubuntu24.04@sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5',
      },
      {
        id: 'cuda-13-3-bundled-cub-3-3-4',
        dependencyMode: 'bundled',
        image: 'nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87',
      },
      {
        id: 'cuda-12-9-selected-cccl-3-4-2',
        dependencyMode: 'selected',
        image: 'nvidia/cuda:12.9.2-devel-ubuntu24.04@sha256:16656a1ef115bca9e1f820c6349876f1486d2b3c9a0e615773799fe402960dc5',
      },
      {
        id: 'cuda-13-3-selected-cccl-3-4-2',
        dependencyMode: 'selected',
        image: 'nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87',
      },
    ]);

    expect(ex17Build.match(new RegExp(`uses: actions/checkout@${checkoutPin}`, 'g')))
      .toHaveLength(2);
    expect(ex17Build).toContain([
      '      - name: Check out canonical public source',
      `        uses: actions/checkout@${checkoutPin}`,
      '        with:',
      '          persist-credentials: false',
      '          ref: ${{ github.event.pull_request.head.sha || github.sha }}',
    ].join('\n'));
    expect(ex17Build).toContain([
      '      - name: Check out selected CCCL 3.4.2 source',
      "        if: ${{ matrix.dependency_mode == 'selected' }}",
      `        uses: actions/checkout@${checkoutPin}`,
      '        with:',
      '          repository: NVIDIA/cccl',
      `          ref: ${ccclCommit}`,
      '          path: .quality/cccl-v3.4.2',
      '          persist-credentials: false',
    ].join('\n'));
    expect(ex17Build).toContain([
      '          cccl_args=()',
      '          if [[ "${{ matrix.dependency_mode }}" == "selected" ]]; then',
      '            cccl_args+=(--env "CCCL_ROOT=/workspace/.quality/cccl-v3.4.2")',
      '          fi',
    ].join('\n'));
    expect(ex17Build.match(/CCCL_ROOT=\/workspace\/\.quality\/cccl-v3\.4\.2/g)).toHaveLength(2);
    expect(ex17Build).toContain('"${cccl_args[@]}"');

    expect(ex17Build).toContain('docker run --platform linux/amd64 --rm --network none');
    expect(ex17Build).not.toContain('--gpus');
    expect(ex17Build).toContain('bash scripts/compile-check.sh c++17 "${{ matrix.profile }}"');
    const ex17CompileOffset = ex17Build.indexOf('Compile EX17 without granting Evidence Status');
    const lab11CompileOffset = ex17Build.indexOf(
      'Compile LAB11 comparison runner without granting Evidence Status',
    );
    const scanOffset = ex17Build.indexOf('Scan EX17 and LAB11 build logs');
    expect(ex17CompileOffset).toBeGreaterThan(-1);
    expect(lab11CompileOffset).toBeGreaterThan(ex17CompileOffset);
    expect(scanOffset).toBeGreaterThan(lab11CompileOffset);
    expect(ex17Build.match(/bash scripts\/check-lab11-runner-build\.sh/g)).toHaveLength(1);
    expect(ex17Build).toContain([
      'bash scripts/check-lab11-runner-build.sh "${{ matrix.profile }}" \\',
      '            "/workspace/artifacts/cuda-ex17/${{ matrix.profile }}"',
    ].join('\n'));
    expect(ex17Build).toContain('--workdir /workspace');
    expect(ex17Build).toContain('Scan EX17 and LAB11 build logs');
    expect(ex17Build).toContain('Upload EX17 and LAB11 build-gate logs');
    expect(ex17Build).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex17-cub-device-reduction-scan(?:\s|$)/m,
    );
    for (const target of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
      expect(ex17LaneScript).toContain(`make -C "$example_root" ${target} `);
    }
    for (const [profileId, expectedCubVersion] of [
      ['cuda-11-8-bundled-cub-1-15-1', '101501'],
      ['cuda-12-9-bundled-cub-2-8-2', '200802'],
      ['cuda-13-3-bundled-cub-3-3-4', '300304'],
      ['cuda-12-9-selected-cccl-3-4-2', '300402'],
      ['cuda-13-3-selected-cccl-3-4-2', '300402'],
    ]) {
      expect(lab11RunnerBuild).toContain(profileId);
      expect(lab11RunnerBuild).toContain(`expected_cub_version="${expectedCubVersion}"`);
    }
    expect(lab11RunnerBuild).toContain('CCCL_ROOT is required by selected CCCL profiles');
    expect(lab11RunnerBuild).toContain('--preprocess "$runner_source"');
    expect(lab11RunnerBuild).toContain('--compile "$runner_source"');
    expect(lab11RunnerBuild).toContain('nvcc --std=c++17 "$object" --output-file "$binary"');
    expect(lab11RunnerBuild).toContain('cuobjdump --list-elf "$binary"');
    expect(lab11RunnerBuild).toContain('cuobjdump --dump-ptx "$binary"');
    expect(lab11RunnerBuild).toContain('lab11-runner-commands.log');
    expect(lab11RunnerBuild).not.toMatch(/^\s*(?:"\$binary"|\$binary)(?:\s|$)/m);
    expect(lab11RunnerBuild).not.toMatch(/cp[^\n]*\$binary/);
    const executableLines = ex17LaneScript
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#'))
      .join('\n');
    expect(executableLines).not.toMatch(
      /(?:^|\n)\s*(?:\.\/)?build\/ex17-cub-device-reduction-scan(?:\s|$)/m,
    );

    const artifactPath = 'artifacts/cuda-ex17/${{ matrix.profile }}';
    expect(ex17Build).toContain(`node scripts/check-artifacts.mjs "${artifactPath}"`);
    expect(ex17Build).toContain(`path: ${artifactPath}`);
    expect(ex17Build).toContain('retention-days: 7');
    const artifactScanOffset = ex17Build.indexOf('node scripts/check-artifacts.mjs');
    const uploadOffset = ex17Build.indexOf('uses: actions/upload-artifact@');
    expect(artifactScanOffset).toBeGreaterThan(-1);
    expect(uploadOffset).toBeGreaterThan(artifactScanOffset);
    expect(ex17Build).toContain('Compile EX17 without granting Evidence Status');
    expect(ex17Build).not.toContain('Compile-Checked');
    expect(ex17Build).not.toContain('Runtime-Verified');
    expect(ex17Build).not.toContain('examples/ex17-cub-device-reduction-scan/evidence/');
  });

  it('compile-gates the LAB10 runner in all three EX14 lanes without granting Evidence Status', async () => {
    const workflow = await readProjectFile('.github/workflows/cuda-compile.yml');
    const ex14Build = workflow.match(/^  ex14-build:\n[\s\S]*?(?=^  ex15-build:)/m)?.[0] ?? '';
    const canonicalCompileOffset = ex14Build.indexOf('Compile EX14 without granting Evidence Status');
    const runnerCompileOffset = ex14Build.indexOf(
      'Compile gate for LAB10 runner without granting Evidence Status',
    );
    const scanOffset = ex14Build.indexOf('Scan EX14 build logs');

    expect(ex14Build).not.toBe('');
    expect([...ex14Build.matchAll(/^\s+- lane: (ex14-\S+)$/gm)].map((match) => match[1])).toEqual([
      'ex14-cuda-11-8-cxx17',
      'ex14-cuda-12-9-cxx17',
      'ex14-cuda-13-3-cxx17',
    ]);
    expect(canonicalCompileOffset).toBeGreaterThan(-1);
    expect(runnerCompileOffset).toBeGreaterThan(canonicalCompileOffset);
    expect(scanOffset).toBeGreaterThan(runnerCompileOffset);
    expect(ex14Build.match(/bash scripts\/check-lab10-runner-build\.sh/g)).toHaveLength(1);
    expect(ex14Build).toContain(
      'bash scripts/check-lab10-runner-build.sh \\\n            "/workspace/artifacts/cuda-ex14/${{ matrix.lane }}"',
    );
    expect(ex14Build).toContain('--workdir /workspace');
    expect(ex14Build).not.toContain('--gpus');
    expect(ex14Build).toContain('path: artifacts/cuda-ex14/${{ matrix.lane }}');
    expect(ex14Build).not.toContain('Compile-Checked');
    expect(ex14Build).not.toContain('Runtime-Verified');
  });

  it('compile-gates the Q12 runner in all three EX11 lanes without granting Evidence Status', async () => {
    const workflow = await readProjectFile('.github/workflows/cuda-compile.yml');
    const ex11Build = workflow.match(/^  ex11-build:\n[\s\S]*?(?=^  ex12-build:)/m)?.[0] ?? '';
    const canonicalCompileOffset = ex11Build.indexOf('Compile EX11 without granting Evidence Status');
    const runnerCompileOffset = ex11Build.indexOf(
      'Compile gate for Q12 runner without granting Evidence Status',
    );
    const scanOffset = ex11Build.indexOf('Scan EX11 build logs');

    expect(ex11Build).not.toBe('');
    expect(canonicalCompileOffset).toBeGreaterThan(-1);
    expect(runnerCompileOffset).toBeGreaterThan(canonicalCompileOffset);
    expect(scanOffset).toBeGreaterThan(runnerCompileOffset);
    expect(ex11Build.match(/bash scripts\/check-q12-runner-build\.sh/g)).toHaveLength(1);
    expect(ex11Build).toContain(
      'bash scripts/check-q12-runner-build.sh \\\n            "/workspace/artifacts/cuda-ex11/${{ matrix.lane }}"',
    );
    expect(ex11Build).toContain('--workdir /workspace');
    expect(ex11Build).not.toContain('--gpus');
    expect(ex11Build).not.toContain('Compile-Checked');
    expect(ex11Build).not.toContain('Runtime-Verified');
  });

  it('compile-gates the Q13 runner in all three EX15 lanes without granting Evidence Status', async () => {
    const [workflow, runnerBuild] = await Promise.all([
      readProjectFile('.github/workflows/cuda-compile.yml'),
      readProjectFile('scripts/check-q13-runner-build.sh'),
    ]);
    const ex15Build = workflow.match(/^  ex15-build:\n[\s\S]*?(?=^  ex16-build:)/m)?.[0] ?? '';
    const canonicalCompileOffset = ex15Build.indexOf('Compile EX15 without granting Evidence Status');
    const runnerCompileOffset = ex15Build.indexOf(
      'Compile gate for Q13 runner without granting Evidence Status',
    );
    const scanOffset = ex15Build.indexOf('Scan EX15 build logs');

    expect(ex15Build).not.toBe('');
    expect(canonicalCompileOffset).toBeGreaterThan(-1);
    expect(runnerCompileOffset).toBeGreaterThan(canonicalCompileOffset);
    expect(scanOffset).toBeGreaterThan(runnerCompileOffset);
    expect(ex15Build.match(/bash scripts\/check-q13-runner-build\.sh/g)).toHaveLength(1);
    expect(ex15Build).toContain(
      'bash scripts/check-q13-runner-build.sh \\\n            "/workspace/artifacts/cuda-ex15/${{ matrix.lane }}"',
    );
    expect(ex15Build).toContain('--workdir /workspace');
    expect(ex15Build).not.toContain('--gpus');
    expect(ex15Build).not.toContain('Compile-Checked');
    expect(ex15Build).not.toContain('Runtime-Verified');
    expect(runnerBuild).toContain('public/assets/exercise-solutions/q13-gemm-candidates.cu');
    expect(runnerBuild).toContain('examples/ex15-tiled-gemm/include/tiled_gemm_reference.hpp');
    expect(runnerBuild).toContain('--generate-code=arch=compute_75,code=sm_75');
    expect(runnerBuild).toContain('--generate-code=arch=compute_75,code=compute_75');
    expect(runnerBuild).not.toMatch(/(?:^|\s)(?:\.\/)?q13-gemm-candidates(?:\s|$)/m);
  });

  it('never executes the generated CUDA binary in the compile boundary', async () => {
    const [
      orchestrator,
      laneScript,
      ex01LaneScript,
      ex03LaneScript,
      ex04LaneScript,
      ex05LaneScript,
      ex06LaneScript,
      ex07LaneScript,
      ex08LaneScript,
      ex09LaneScript,
      ex11LaneScript,
      ex12LaneScript,
      ex13LaneScript,
      ex14LaneScript,
      ex15LaneScript,
      ex16LaneScript,
    ] = await Promise.all([
      readProjectFile('scripts/run-cuda-compile.mjs'),
      readProjectFile('examples/ex02-vector-addition/scripts/compile-check.sh'),
      readProjectFile('examples/ex01-environment-report/scripts/compile-check.sh'),
      readProjectFile('examples/ex03-multidimensional-indexing/scripts/compile-check.sh'),
      readProjectFile('examples/ex04-error-handling-lifecycle/scripts/compile-check.sh'),
      readProjectFile('examples/ex05-coalesced-strided-access/scripts/compile-check.sh'),
      readProjectFile('examples/ex06-shared-memory-tile-bank-padding/scripts/compile-check.sh'),
      readProjectFile('examples/ex07-streams-events-overlap/scripts/compile-check.sh'),
      readProjectFile('examples/ex08-unified-memory-migration/scripts/compile-check.sh'),
      readProjectFile('examples/ex09-graph-capture/scripts/compile-check.sh'),
      readProjectFile('examples/ex11-multi-stage-reduction/scripts/compile-check.sh'),
      readProjectFile('examples/ex12-inclusive-exclusive-scan/scripts/compile-check.sh'),
      readProjectFile('examples/ex13-privatized-histogram/scripts/compile-check.sh'),
      readProjectFile('examples/ex14-tiled-transpose/scripts/compile-check.sh'),
      readProjectFile('examples/ex15-tiled-gemm/scripts/compile-check.sh'),
      readProjectFile('examples/ex16-sanitizer-defect-suite/scripts/compile-check.sh'),
    ]);

    expect(orchestrator).not.toMatch(/exec(?:File)?Sync\([^\n]*ex02-vector-addition/);
    expect(orchestrator).toContain('Fatbin ptx code:');
    expect(orchestrator).toContain('\\.target\\s+sm_75');
    expect(orchestrator).toContain('-std=c\\+\\+23 flag is not supported with the configured host compiler');
    expect(laneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex02-vector-addition(?:\s|$)/m);
    expect(laneScript).toContain('make host-test');
    expect(ex01LaneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex01-environment-report(?:\s|$)/m);
    expect(ex01LaneScript).toContain('make host-test');
    expect(ex03LaneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex03-multidimensional-indexing(?:\s|$)/m);
    expect(ex03LaneScript).toContain('make host-test');
    expect(ex04LaneScript).not.toMatch(/(?:^|\s)(?:\.\/)?build\/ex04-error-handling-lifecycle(?:\s|$)/m);
    for (const target of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
      expect(ex04LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex05LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex06LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex07LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex08LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex09LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex11LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex12LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex13LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex14LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
      expect(ex15LaneScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
    }
    expect(ex05LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex05-coalesced-strided-access(?:\s|$)/m,
    );
    expect(ex06LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex06-shared-memory-tile-bank-padding(?:\s|$)/m,
    );
    expect(ex07LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex07-streams-events-overlap(?:\s|$)/m,
    );
    expect(ex08LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex08-unified-memory-migration(?:\s|$)/m,
    );
    expect(ex09LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex09-graph-capture(?:\s|$)/m,
    );
    expect(ex11LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex11-multi-stage-reduction(?:\s|$)/m,
    );
    expect(ex12LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex12-inclusive-exclusive-scan(?:\s|$)/m,
    );
    expect(ex13LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex13-privatized-histogram(?:\s|$)/m,
    );
    expect(ex14LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex14-tiled-transpose(?:\s|$)/m,
    );
    expect(ex15LaneScript).not.toMatch(
      /(?:^|\s)(?:\.\/)?build\/ex15-tiled-gemm(?:\s|$)/m,
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
