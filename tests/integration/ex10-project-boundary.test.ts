// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import {
  loadCanonicalExample,
  loadCompileEvidence,
  readCanonicalRange,
  validateCanonicalExample,
} from '../../scripts/lib/canonical-examples.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');
const exampleRoot = path.join(projectRoot, 'examples/ex10-ptx-fatbinary-inspection');
const sourceCommit = '16256cbeded889cb1a45f2461585317ed3fe0296';
const rangeNames = [
  'artifact-kernel',
  'device-link-contract',
  'artifact-pipeline',
  'cxx23-probe',
] as const;

describe('EX10 PTX and fatbinary inspection boundary', () => {
  it('declares the complete artifact pipeline and four canonical ranges in order', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX10');

    expect(await validateCanonicalExample(projectRoot, 'EX10')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX10',
      root: 'examples/ex10-ptx-fatbinary-inspection',
      sourceCommit,
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build.stages).toEqual([
      'preprocess',
      'standalone-ptx',
      'cubin',
      'fatbin',
      'relocatable-compile',
      'device-link',
      'host-link',
      'inspect',
      'artifact-test',
    ]);
    expect(Object.keys(example.ranges)).toEqual(rangeNames);
    for (const range of Object.values(example.ranges) as { file: string }[]) {
      expect(example.build.inputs).toContain(range.file);
    }
    expect(example.sourceUrl).toContain(`/tree/${sourceCommit}/`);
    expect(example.downloadUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
    );
  });

  it('publishes the kernel, device-link, pipeline, and C++23 probe ranges', async () => {
    const ranges = await Promise.all(rangeNames.map((name) => readCanonicalRange(projectRoot, 'EX10', name)));

    expect(ranges.map(({ range }) => range)).toEqual(rangeNames);
    expect(ranges[0].code).toContain('extern "C" __global__ void artifact_kernel');
    expect(ranges[1].code).toContain('ex10_device_scale(input[index])');
    expect(ranges[2].code).toContain('$(NVCC) $(NVCC_FLAGS) -dc $< -o $@');
    expect(ranges[2].code).toContain('--device-link');
    expect(ranges[2].code).toContain('--no-device-link');
    expect(ranges[3].code).toContain('if consteval');
    expect(ranges[3].code).toContain('__cplusplus < 202302L');
  });

  it('dry-runs all nine stages without adding an executable run step', async () => {
    const { stdout } = await execFileAsync('make', [
      '--dry-run',
      'artifact-test',
      'DIALECT=c++17',
      'BUILD_DIR=.quality/ex10-dry-run',
    ], { cwd: exampleRoot });
    const stages = [
      '--preprocess',
      '--ptx',
      '--cubin',
      '--fatbin',
      '-dc src/device_math.cu',
      '-dc src/caller.cu',
      '--device-link',
      '--no-device-link',
      'cuobjdump --list-ptx',
      'bash scripts/artifact-test.sh',
    ];

    let previous = -1;
    for (const stage of stages) {
      const current = stdout.indexOf(stage);
      expect(current, stage).toBeGreaterThan(previous);
      previous = current;
    }
    expect(stdout.match(/ -dc src\/(?:device_math|caller)\.cu/g)).toHaveLength(2);
    expect(stdout).not.toMatch(/(?:^|\n)\.quality\/ex10-dry-run\/ex10-ptx-fatbinary-inspection(?:\s|$)/);
  });

  it('hashes and inspects every artifact class while preserving the no-execution boundary', async () => {
    const [example, makefile, compileScript, artifactTest] = await Promise.all([
      loadCanonicalExample(projectRoot, 'EX10'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/artifact-test.sh'), 'utf8'),
    ]);

    for (const artifact of [
      'build/artifact_kernel.ii',
      'build/artifact_kernel.ptx',
      'build/artifact_kernel.cubin',
      'build/artifact_kernel.fatbin',
      'build/device_math.o',
      'build/caller.o',
      'build/device_link.o',
      'build/ex10-ptx-fatbinary-inspection',
      'build/cuobjdump-ptx-list.txt',
      'build/cuobjdump-sass.txt',
      'build/cuobjdump-elf.txt',
      'build/symbol-link-ledger.txt',
      'build/artifact-test-report.txt',
    ]) {
      expect(example.build.artifacts).toContain(artifact);
    }
    for (const option of [
      '--list-ptx',
      '--list-elf',
      '--dump-ptx',
      '--dump-sass',
      '--dump-elf',
      '--dump-elf-symbols',
    ]) {
      expect(makefile).toContain(option);
    }
    expect(makefile).toContain('$(BUILD_DIR)/cuobjdump-ptx-list.txt: $(BUILD_DIR)/artifact_kernel.fatbin');
    expect(makefile).toContain('sha256sum $(PRIMARY_ARTIFACT_NAMES)');
    expect(artifactTest).toContain('sha256sum --check artifact-sha256.txt');
    expect(artifactTest).toContain('host-executable-executed=false');
    expect(artifactTest).toContain('runtime-evidence=Runtime-Not-Applicable');
    expect(`${compileScript}\n${artifactTest}`).not.toMatch(
      /(?:^|\n)\s*(?:"?\$\{?final_artifact\}?"?|(?:\.\/)?build\/ex10-ptx-fatbinary-inspection)(?:\s|$)/,
    );
  });

  it('pins five ordinary checks and one GCC 14 C++23 probe without GPU access', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX10');
    const [dockerfile, recorder, workflow] = await Promise.all([
      readFile(path.join(exampleRoot, 'probes/cuda-13.3-gcc14.Dockerfile'), 'utf8'),
      readFile(path.join(projectRoot, 'scripts/run-ex10-compile.mjs'), 'utf8'),
      readFile(path.join(projectRoot, '.github/workflows/cuda-compile.yml'), 'utf8'),
    ]);
    const ex10Job = workflow.slice(
      workflow.indexOf('  ex10-compile:'),
      workflow.indexOf('  ex10-compile-gate:'),
    );

    expect(example.compatibility.target).toEqual(['sm_75', 'compute_75']);
    expect(example.compatibility.lanes.map((lane: { toolkit: string; dialects: string[] }) => ({
      toolkit: lane.toolkit,
      dialects: lane.dialects,
    }))).toEqual([
      { toolkit: '11.8.0', dialects: ['c++17'] },
      { toolkit: '12.9.2', dialects: ['c++17', 'c++20'] },
      { toolkit: '13.3.1', dialects: ['c++17', 'c++20'] },
    ]);
    expect(example.compatibility.lanes.every((lane: { image: string }) =>
      /@sha256:[0-9a-f]{64}$/.test(lane.image))).toBe(true);

    const probe = example.compatibility.probes[0];
    expect(probe).toMatchObject({
      toolkitLane: 'cuda-13.3',
      dialect: 'c++23',
      hostCompilerExecutable: '/usr/bin/g++-14',
      hostCompilerPackage: 'g++-14',
      allowedResults: ['pass'],
      runtime: 'Runtime-Not-Applicable',
    });
    expect(dockerfile).toContain(`FROM ${example.compatibility.lanes[2].image}`);
    expect(dockerfile).toContain('apt-get install --no-install-recommends --yes g++-14');
    expect(`${dockerfile}\n${compileScriptCommands(recorder)}`).not.toContain('--allow-unsupported-compiler');
    expect(recorder).toMatch(/'--network',\s*\n\s*'none'/);
    expect(recorder).toMatch(/'--user',\s*\n\s*uid/);
    expect(recorder).not.toContain("'--gpus'");
    expect(compileScriptCommands(recorder)).not.toContain('ex10-ptx-fatbinary-inspection');
    expect(ex10Job.match(/kind: ex10/g)).toHaveLength(5);
    expect(ex10Job.match(/kind: cxx23-probe/g)).toHaveLength(1);
    expect(ex10Job).toContain('node scripts/run-ex10-compile.mjs');
    expect(workflow).toContain('EX10_COMPILE_RESULT: ${{ needs.ex10-compile.result }}');
    expect(workflow).toContain('needs: [ex10-compile]');
  });

  it('retains five ordinary records and one separate probe with Runtime-Not-Applicable', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX10');
    const evidenceFiles = await readdir(path.join(exampleRoot, 'evidence'));
    const records = await loadCompileEvidence(projectRoot, 'EX10');

    expect(example.evidence).toMatchObject({
      compilation: [
        { status: 'Compile-Checked', record: 'evidence/cuda-11-8-cxx17.json' },
        { status: 'Compile-Checked', record: 'evidence/cuda-12-9-cxx17.json' },
        { status: 'Compile-Checked', record: 'evidence/cuda-12-9-cxx20.json' },
        { status: 'Compile-Checked', record: 'evidence/cuda-13-3-cxx17.json' },
        { status: 'Compile-Checked', record: 'evidence/cuda-13-3-cxx20.json' },
      ],
      dialectProbe: 'evidence/cuda-13-3-gcc14-cxx23-probe.json',
      runtime: 'Runtime-Not-Applicable',
      hostExecutableExecuted: false,
      gpuExecutableExecuted: false,
      recordedObservations: [],
    });
    expect(evidenceFiles.sort()).toEqual([
      'README.md',
      'cuda-11-8-cxx17.json',
      'cuda-12-9-cxx17.json',
      'cuda-12-9-cxx20.json',
      'cuda-13-3-cxx17.json',
      'cuda-13-3-cxx20.json',
      'cuda-13-3-gcc14-cxx23-probe.json',
    ]);
    expect(records).toHaveLength(6);
    expect(records.filter(({ subject }: { subject: string }) => subject === 'EX10').map(
      ({ toolchain }: { toolchain: { toolkit: string; dialect: string } }) =>
        `${toolchain.toolkit}/${toolchain.dialect}`,
    ).sort()).toEqual([
      '11.8.0/c++17',
      '12.9.2/c++17',
      '12.9.2/c++20',
      '13.3.1/c++17',
      '13.3.1/c++20',
    ]);
    expect(records.find(({ claim }: { claim: string }) => claim === 'C++23-Dialect-Probe')).toMatchObject({
      result: 'pass',
      subject: 'EX10-CUDA-13.3-CXX23-GCC14-PROBE',
      sourceCommit,
      buildContractSha256: '44ba3c47536e8287664ca0ddfced81e496e351dd703870a406094625de9a45f7',
      workflowRun: 'https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/33266515216',
      toolchain: {
        toolkit: '13.3.1',
        hostCompiler: 'g++-14 (Ubuntu 14.2.0-4ubuntu2~24.04.1) 14.2.0',
        nvcc: 'Cuda compilation tools, release 13.3, V13.3.73',
        dialect: 'c++23',
      },
    });
    expect(records.every(({ hostExecutableExecuted, gpuExecutableExecuted, runtimeEvidence }: {
      hostExecutableExecuted: boolean;
      gpuExecutableExecuted: boolean;
      runtimeEvidence: string;
    }) => !hostExecutableExecuted && !gpuExecutableExecuted && runtimeEvidence === 'Runtime-Not-Applicable')).toBe(true);
    expect(records.flatMap(({ commands }: { commands: string[] }) => commands)).not.toContain(
      expect.stringContaining('--allow-unsupported-compiler'),
    );
  });

  it('renders EX10 retained rows while preserving the EX02 evidence table contract', async () => {
    const [ex02Html, ex10Html] = await Promise.all([
      readFile(path.join(projectRoot, 'dist/en/examples/vector-addition/index.html'), 'utf8'),
      readFile(path.join(projectRoot, 'dist/en/examples/ptx-fatbinary-inspection/index.html'), 'utf8'),
    ]);
    const ex02 = parseHTML(ex02Html).document;
    const ex10 = parseHTML(ex10Html).document;
    const ex02Rows = [...ex02.querySelectorAll('[data-example-evidence="EX02"] tbody tr')];
    const ex10Rows = [...ex10.querySelectorAll('[data-example-evidence="EX10"] tbody tr')];

    expect(ex02Rows).toHaveLength(6);
    expect(ex02Rows.slice(0, 5).every((row) => row.textContent.includes('EX02 build') &&
      row.textContent.includes('Compile-Checked'))).toBe(true);
    expect(ex02Rows[5].textContent).toContain('Separate C++23 probe');
    expect(ex02Rows[5].textContent).toContain('Probe recorded: unsupported in this environment');

    expect(ex10Rows).toHaveLength(6);
    expect(ex10Rows.every((row) => row.getAttribute('data-result') === 'pass')).toBe(true);
    expect(ex10Rows.slice(0, 5).every((row) => row.textContent.includes('EX10 build') &&
      row.textContent.includes('Compile-Checked'))).toBe(true);
    expect(ex10Rows[5].textContent).toContain('Separate C++23 probe');
    expect(ex10Rows[5].textContent).toContain('Probe passed');
  });

  it('publishes an aligned bilingual artifact matrix with exact owner sources', async () => {
    const pages = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/examples/ptx-fatbinary-inspection.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/examples/ptx-fatbinary-inspection.mdx'), 'utf8'),
    ]);
    const requiredSources = [
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-binary-utilities/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-binary-utilities/index.html',
      'https://docs.nvidia.com/cuda/cuda-binary-utilities/index.html',
      'https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#host-compiler-support-policy',
      'https://packages.ubuntu.com/noble-updates/g++-14',
      'https://gitlab.com/nvidia/container-images/cuda',
    ];

    for (const page of pages) {
      expect(page).toContain('pairId: ex10');
      expect(page).toContain("factCheckDate: '2026-08-29'");
      expect(page).toMatch(/prerequisites:\n  - M15\n  - M16/);
      expect(page).toMatch(/relatedUnits:\n  - M17\n  - M18\n  - M19\n  - VIS09/);
      expect(page).toContain('content: Runtime-Not-Applicable');
      expect(page).toContain('content: none');
      expect(page).toContain('| device link |');
      expect(page).toContain('| host link |');
      expect(page).toContain('`--gpus`');
      expect(page).toContain(`tree/${sourceCommit}/examples/ex10-ptx-fatbinary-inspection`);
      expect(page).toContain(`/archive/${sourceCommit}.zip`);
      expect(page.match(/^  - title:/gm)).toHaveLength(15);
      for (const source of requiredSources) expect(page).toContain(source);

      const importedRanges = [...page.matchAll(/<CanonicalCode exampleId="EX10" range="([^"]+)" \/>/g)]
        .map((match) => match[1]);
      expect(importedRanges).toEqual(rangeNames);
    }
  });
});

function compileScriptCommands(source: string) {
  return source
    .split('\n')
    .filter((line) => /(?:nvcc|docker)\b/.test(line))
    .join('\n');
}
