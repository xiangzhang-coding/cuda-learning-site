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
const sourceCommit = '81d43aa7568514e37ef190da59c845b8072b7011';

const projects = [
  {
    id: 'EX11',
    root: 'examples/ex11-multi-stage-reduction',
    stem: 'multi_stage_reduction',
  },
  {
    id: 'EX12',
    root: 'examples/ex12-inclusive-exclusive-scan',
    stem: 'inclusive_exclusive_scan',
  },
  {
    id: 'EX13',
    root: 'examples/ex13-privatized-histogram',
    stem: 'privatized_histogram',
  },
] as const;

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

type Range = readonly [start: number, end: number];

function portable(relativePath: string) {
  return relativePath.split(path.sep).join('/');
}

async function listProjectFiles(root: string) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => portable(path.relative(root, path.join(entry.parentPath, entry.name))))
    .sort();
}

function expectedProjectFiles(stem: string) {
  return [
    'Makefile',
    'README.md',
    'evidence/README.md',
    `include/${stem}_reference.hpp`,
    'project.json',
    'scripts/compile-check.sh',
    `src/${stem}.cu`,
    'tests/host_reference_test.cpp',
  ].sort();
}

function makeTarget(makefile: string, target: string, nextTarget: string) {
  const start = makefile.indexOf(`${target}:`);
  const end = makefile.indexOf(`\n${nextTarget}:`, start);
  expect(start, target).toBeGreaterThanOrEqual(0);
  expect(end, nextTarget).toBeGreaterThan(start);
  return makefile.slice(start, end);
}

function executableLines(script: string) {
  return script
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .join('\n');
}

function maskCppNoise(source: string) {
  return source.replace(
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (match) => match.replace(/[^\n]/g, ' '),
  );
}

function matchingDelimiter(source: string, start: number, open: string, close: string) {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === open) depth += 1;
    if (source[index] === close) depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error(`Unmatched ${open} at offset ${start}`);
}

function skipWhitespace(source: string, start: number) {
  let cursor = start;
  while (/\s/.test(source[cursor] ?? '')) cursor += 1;
  return cursor;
}

function statementRange(source: string, start: number): Range {
  const bodyStart = skipWhitespace(source, start);
  if (source[bodyStart] === '{') {
    return [bodyStart, matchingDelimiter(source, bodyStart, '{', '}') + 1];
  }
  const end = source.indexOf(';', bodyStart);
  if (end < 0) throw new Error(`Unterminated statement at offset ${bodyStart}`);
  return [bodyStart, end + 1];
}

function controlBodyRanges(source: string, keyword: 'if' | 'for' | 'while') {
  const ranges: Range[] = [];
  const matcher = new RegExp(`\\b${keyword}${keyword === 'if' ? '(?:\\s+constexpr)?' : ''}\\s*\\(`, 'g');
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(source)) !== null) {
    const openParenthesis = source.indexOf('(', match.index);
    const closeParenthesis = matchingDelimiter(source, openParenthesis, '(', ')');
    const range = statementRange(source, closeParenthesis + 1);
    ranges.push(range);

    if (keyword === 'if') {
      const elseStart = skipWhitespace(source, range[1]);
      if (/^else\b/.test(source.slice(elseStart))) {
        const elseBodyStart = skipWhitespace(source, elseStart + 'else'.length);
        if (!/^if\b/.test(source.slice(elseBodyStart))) {
          ranges.push(statementRange(source, elseBodyStart));
        }
      }
    }
  }
  return ranges;
}

function kernelBodies(source: string) {
  const bodies: string[] = [];
  const matcher = /\b__global__\b/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(source)) !== null) {
    const bodyStart = source.indexOf('{', match.index);
    if (bodyStart < 0) break;
    const bodyEnd = matchingDelimiter(source, bodyStart, '{', '}');
    bodies.push(source.slice(bodyStart, bodyEnd + 1));
    matcher.lastIndex = bodyEnd + 1;
  }
  return bodies;
}

function expectUnconditionalBarriers(source: string, label: string) {
  const code = maskCppNoise(source);
  const barrierOffsets = [...code.matchAll(/\b__syncthreads\s*\(\s*\)\s*;/g)]
    .map((match) => match.index);
  const conditionalRanges = controlBodyRanges(code, 'if');

  expect(barrierOffsets.length, `${label} barriers`).toBeGreaterThan(0);
  for (const offset of barrierOffsets) {
    expect(
      conditionalRanges.some(([start, end]) => offset >= start && offset < end),
      `${label} barrier at offset ${offset} is conditional`,
    ).toBe(false);
  }

  for (const body of kernelBodies(code).filter((candidate) => candidate.includes('__syncthreads'))) {
    const lastBarrier = body.lastIndexOf('__syncthreads');
    expect(body.slice(0, lastBarrier), `${label} returns before its final barrier`).not.toMatch(/\breturn\b/);
  }
}

function expectPartialBlockGuard(source: string, label: string) {
  const guardedKernel = kernelBodies(maskCppNoise(source)).some((body) =>
    /\b(?:blockIdx|threadIdx)\b/.test(body) &&
    /\bif\s*\([^)]*(?:<|>=)[^)]*\)/.test(body));
  expect(guardedKernel, `${label} partial-block guard`).toBe(true);
}

function launchOffsets(source: string) {
  return [...source.matchAll(/<<</g)].map((match) => match.index);
}

describe.each(projects)('$id standalone project boundary', ({ id, root, stem }) => {
  const exampleRoot = path.join(projectRoot, root);
  const headerPath = `include/${stem}_reference.hpp`;
  const sourcePath = `src/${stem}.cu`;
  const executable = path.posix.basename(root);

  it('declares exactly one standalone eight-file C++17 project tree', async () => {
    const example = await loadCanonicalExample(projectRoot, id);

    expect(await validateCanonicalExample(projectRoot, id)).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id,
      root,
      sourceCommit,
      sourceUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/${root}`,
      downloadUrl: `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`,
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.build).toEqual({
      standard: 'c++17',
      inputs: [headerPath, sourcePath],
      hostTestInputs: [headerPath, 'tests/host_reference_test.cpp'],
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
        `build/${stem}.ii`,
        `build/${stem}.o`,
        `build/${executable}`,
      ],
    });
    expect(await listProjectFiles(exampleRoot)).toEqual(expectedProjectFiles(stem));
  });

  it('keeps every required build input byte-identical to the pinned publication commit', async () => {
    const example = await loadCanonicalExample(projectRoot, id);
    await execFileAsync('git', ['cat-file', '-e', `${sourceCommit}:${root}/project.json`], { cwd: projectRoot });

    const pinnedFiles = new Set([
      ...example.build.inputs,
      ...example.build.hostTestInputs,
      ...example.build.contractFiles,
    ]);
    for (const relativePath of pinnedFiles) {
      const [{ stdout: pinned }, current] = await Promise.all([
        execFileAsync('git', ['show', `${sourceCommit}:${root}/${relativePath}`], { cwd: projectRoot }),
        readFile(path.join(exampleRoot, relativePath), 'utf8'),
      ]);
      expect(current, `${id}:${relativePath}`).toBe(pinned);
    }
  });

  it('pins the Native Linux Baseline tier and exactly three C++17 Toolkit Lanes', async () => {
    const example = await loadCanonicalExample(projectRoot, id);

    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      target: ['sm_75', 'compute_75'],
    });
    expect(example.compatibility.maximumProblemMemoryBytes).toBeGreaterThan(0);
    expect(example.compatibility.maximumProblemMemoryBytes).toBeLessThanOrEqual(8_000_000_000);
    expect(example.compatibility.lanes).toEqual(lanes);
  });

  it('publishes complete canonical ranges rather than placeholder pseudocode', async () => {
    const example = await loadCanonicalExample(projectRoot, id);
    const ranges = Object.entries(example.ranges ?? {}) as [
      string,
      { file: string; startMarker: string; endMarker: string; language: string },
    ][];

    expect(ranges).toHaveLength(2);
    expect(ranges.map(([, range]) => range.file).sort()).toEqual([headerPath, sourcePath].sort());
    for (const [name, range] of ranges) {
      expect(range).toEqual({
        file: range.file,
        startMarker: `// [${id.toLowerCase()}-${name}-start]`,
        endMarker: `// [${id.toLowerCase()}-${name}-end]`,
        language: 'cpp',
      });
      const canonical = await readCanonicalRange(projectRoot, id, name);
      expect(canonical.code.trim(), name).not.toBe('');
      expect(canonical.code, name).toMatch(/[;{}]/);
      expect(canonical.code, name).not.toMatch(
        /\b(?:TODO|TBD|FIXME|not[_ -]implemented)\b|placeholder (?:code|implementation)|pseudocode only|your code here/i,
      );
    }
  });

  it('runs the declared CUDA-free host oracle and its algorithm invariants', async () => {
    const example = await loadCanonicalExample(projectRoot, id);
    const [header, hostTest, makefile, compileScript] = await Promise.all([
      readFile(path.join(exampleRoot, headerPath), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'Makefile'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    const hostContract = `${header}\n${hostTest}`;
    const hostTarget = makeTarget(makefile, 'host-test', 'clean');

    expect(example.correctness.cpuReference).toBe(headerPath);
    expect(hostContract).not.toMatch(
      /#include\s*[<"]cuda|__host__|__device__|__global__|__shared__|<<<|>>>|cuda(?:Error|Stream|Event)_t/,
    );
    expect(hostTarget).toContain('$(BUILD_DIR)/host_reference_test');
    expect(hostTarget).toMatch(/\$\(CXX\)[^\n]*-{1,2}std=\$\(DIALECT\)/);
    expect(hostTarget).not.toMatch(new RegExp(`\\$\\(NVCC\\)|${executable}`));
    for (const target of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
      expect(compileScript).toContain(`make ${target} DIALECT="$dialect" BUILD_DIR=build`);
    }
    const escapedExecutable = executable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(executableLines(compileScript)).not.toMatch(new RegExp(
      `(?:^|\\n)\\s*(?:"?(?:\\$\\{?BUILD_DIR\\}?|\\.?/?build)/)?${escapedExecutable}"?(?:\\s|$)`,
      'm',
    ));

    if (id === 'EX11') {
      expect(example.correctness.elementCount).toBe(4099);
      expect(hostContract).toMatch(/\bfloat\b/);
      expect(hostContract).toMatch(
        /\b(?:double|long double)\s+\w*(?:sum|total|accumul|reduce|reference)\w*\s*(?:\(|=|\{)|std::accumulate\s*\([\s\S]{0,200},\s*0(?:\.0*)?(?![fF])/i,
      );
      expect(hostContract).toMatch(/std::(?:abs|fabs)\s*\(/);
      expect(hostContract).toMatch(/(?:absolute|abs[_ -]?(?:tol|error))/i);
      expect(hostContract).toMatch(/(?:relative|rel[_ -]?(?:tol|error))/i);
      expect(hostTest).toMatch(/stage[\s\S]{0,80}(?:size|count)/i);
      expect(hostTest).toMatch(/partial[_ -]?block/i);
    } else if (id === 'EX12') {
      expect(example.correctness.elementCount).toBe(4099);
      expect(hostContract).toMatch(/\b(?:std::)?(?:u?int(?:8|16|32|64)_t|unsigned\s+int|int)\b/);
      expect(hostContract).toMatch(/\bbounded\b/i);
      expect(hostContract).toMatch(/\binclusive\b/i);
      expect(hostContract).toMatch(/\bexclusive\b/i);
      expect(hostTest).toMatch(/\bexact(?:ly)?\b/i);
      expect(hostTest).toMatch(/\brecurrence\b/i);
      expect(hostTest).toMatch(/(?:last[\s_-]*total|total[\s_-]*last)/i);
    } else {
      expect(example.correctness.binCount).toBe(16);
      expect((example.correctness.fixtures ?? []).map((fixture: string | { id: string }) =>
        typeof fixture === 'string' ? fixture : fixture.id)).toEqual([
        'uniform',
        'skewed',
        'boundary',
      ]);
      for (const fixture of ['uniform', 'skewed', 'boundary']) {
        expect(hostTest).toMatch(new RegExp(`\\b${fixture}\\b`, 'i'));
      }
      expect(hostContract).toMatch(/\b(?:16|kBinCount)\b/);
      expect(hostTest).toMatch(/(?:exact[\s\S]{0,80}counts?|counts?[\s\S]{0,80}exact)/i);
      expect(hostTest).toMatch(/(?:sum(?:[_ -]of)?[_ -]?bins|bins?[\s\S]{0,50}(?:sum|total))/i);
    }

    const buildRoot = await mkdtemp(path.join(tmpdir(), `${id.toLowerCase()}-host-`));
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

  it('exposes the required guarded GPU structure without timing or performance claims', async () => {
    const [source, readme, evidenceReadme] = await Promise.all([
      readFile(path.join(exampleRoot, sourcePath), 'utf8'),
      readFile(path.join(exampleRoot, 'README.md'), 'utf8'),
      readFile(path.join(exampleRoot, 'evidence/README.md'), 'utf8'),
    ]);
    const code = maskCppNoise(source);
    const launches = launchOffsets(code);

    expectPartialBlockGuard(source, id);
    expectUnconditionalBarriers(source, id);

    if (id === 'EX11') {
      const repeatedLaunch = [
        ...controlBodyRanges(code, 'for'),
        ...controlBodyRanges(code, 'while'),
      ].some(([start, end]) => launches.some((offset) => offset >= start && offset < end));
      expect(source).toMatch(/\bstage(?:d|s)?\b/i);
      expect(launches.length >= 2 || repeatedLaunch, 'EX11 multi-stage launch structure').toBe(true);
    } else if (id === 'EX12') {
      expect(launches.length, 'EX12 multi-stage launch structure').toBeGreaterThanOrEqual(2);
      expect(source).toMatch(/(?:block|partial)[_ -]?sums?/i);
      expect(source).toMatch(/\boffsets?\b/i);
    } else {
      const globalKernel = /__global__\s+void\s+\w*(?:global\w*histogram|histogram\w*global)\w*\s*\(/i;
      const privatizedKernel = /__global__\s+void\s+\w*(?:privat\w*histogram|histogram\w*privat)\w*\s*\(/i;
      const globalLaunch = /\w*(?:global\w*histogram|histogram\w*global)\w*\s*<<</i;
      const privatizedLaunch = /\w*(?:privat\w*histogram|histogram\w*privat)\w*\s*<<</i;
      expect(source).toMatch(globalKernel);
      expect(source).toMatch(privatizedKernel);
      expect(source).toMatch(globalLaunch);
      expect(source).toMatch(privatizedLaunch);
      expect(source).toMatch(/\b__shared__\b/);
      expect(source).toMatch(/\batomicAdd\s*\(/);
    }

    expect(source).not.toMatch(/cudaEvent|std::chrono|clock_gettime/i);
    expect(`${source}\n${readme}\n${evidenceReadme}`).not.toMatch(
      /Runtime-Verified|Community-Observed|\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s)\b|\b\d+(?:\.\d+)?x\s+(?:speedup|faster)|throughput\s*=\s*\d/i,
    );
  });

  it('keeps compilation evidence empty with exactly three unrecorded expected observations', async () => {
    const example = await loadCanonicalExample(projectRoot, id);

    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(3);
    expect(example.evidence.expectedObservations.every(
      (observation: unknown) => typeof observation === 'string' && observation.trim() !== '',
    )).toBe(true);
    expect(example.evidence.recordedObservations).toEqual([]);
    await expect(loadCompileEvidence(projectRoot, id)).resolves.toEqual([]);
  });
});
