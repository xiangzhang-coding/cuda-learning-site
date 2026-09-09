// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, it } from 'vitest';
import { hashCanonicalBuildContract, loadCanonicalExample, loadCompileEvidence,
  readCanonicalRange, validateCanonicalExample } from '../../scripts/lib/canonical-examples.mjs';
import { scanFiles } from '../../scripts/lib/quality-policy.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const exampleRoot = path.join(root, 'examples/ex20-cusparse-spmv');

it('loads a standalone original EX20 with complete build inputs and three canonical ranges', async () => {
  const example = await loadCanonicalExample(root, 'EX20');
  expect(example).toMatchObject({
    id: 'EX20', root: 'examples/ex20-cusparse-spmv', license: 'Apache-2.0', provenance: 'original',
    build: { standard: 'c++17', stages: ['preprocess', 'compile', 'link', 'inspect'] },
    compatibility: { supportedEnvironment: 'Native Linux', minimumComputeCapability: '7.5',
      fixedDeviceMemoryBytes: 112, maximumProblemMemoryBytes: 8000000000 },
    evidence: { compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] },
  });
  const files = (await readdir(exampleRoot, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(exampleRoot, path.join(entry.parentPath, entry.name)))
    .filter((file) => !file.startsWith(`build${path.sep}`)).sort();
  expect(files).toEqual([
    'Makefile', 'README.md', 'evidence/README.md', 'include/cusparse_spmv_reference.hpp',
    'project.json', 'scripts/compile-check.sh', 'src/cusparse_spmv.cu', 'tests/host_reference_test.cpp',
  ]);
  // The CLI source/license gates list tracked files only; cover this uncommitted project too.
  const ownedFiles = [...files.map((file) => path.join(exampleRoot, file)),
    path.join(root, '.github/workflows/cuda-compile.yml'),
    path.join(root, 'tests/integration/ex20-cusparse-project.test.ts'),
    ...['build', 'ci', 'reference'].map((name) => path.join(root, `tests/unit/ex20-cusparse-${name}.test.ts`))];
  for (const file of ownedFiles) {
    const source = await readFile(file, 'utf8');
    if (file.endsWith('.json')) expect(JSON.parse(source)['SPDX-License-Identifier'], file).toBe('Apache-2.0');
    else expect(source, file).toContain('SPDX-License-Identifier: Apache-2.0');
  }
  expect((await scanFiles(root, ownedFiles)).violations).toEqual([]);
  expect([...new Set([...example.build.inputs, ...example.build.hostTestInputs, ...example.build.contractFiles])].sort())
    .toEqual(['Makefile', 'include/cusparse_spmv_reference.hpp', 'scripts/compile-check.sh',
      'src/cusparse_spmv.cu', 'tests/host_reference_test.cpp']);
  expect(Object.keys(example.ranges)).toEqual(['cpu-reference', 'descriptors-workspace', 'stream-lifecycle']);
  for (const name of Object.keys(example.ranges)) {
    const range = await readCanonicalRange(root, 'EX20', name);
    expect(range.code.trim()).not.toBe('');
    expect(range.language).toBe('cpp');
    expect(example.build.inputs).toContain(range.file);
  }
  expect(await validateCanonicalExample(root, 'EX20')).toEqual([]);
  expect(await hashCanonicalBuildContract(root, 'EX20')).toMatch(/^[a-f0-9]{64}$/);
  expect(await loadCompileEvidence(root, 'EX20')).toEqual([]);
});

it('publishes the exact two CSR fixtures and a common mutable-descriptor FP32 contract without preprocessing', async () => {
  const example = await loadCanonicalExample(root, 'EX20');
  expect(example.correctness).toMatchObject({
    cpuReference: 'include/cusparse_spmv_reference.hpp', referenceType: 'double', precision: 'FP32',
    format: 'CSR', rows: 4, columns: 5, nnz: 7, indexBase: 0, indexType: 'CUSPARSE_INDEX_32I',
    rowOffsets: [0, 2, 2, 4, 7], columnIndices: [0, 3, 1, 4, 0, 2, 4],
    operation: 'CUSPARSE_OPERATION_NON_TRANSPOSE', algorithm: 'CUSPARSE_SPMV_CSR_ALG2',
    pointerMode: 'CUSPARSE_POINTER_MODE_HOST', absoluteTolerance: 0.0001, relativeTolerance: 0.00002,
    fixtures: [
      { id: 'A', values: [2, -1, 3, 4, -2, 5, 1], x: [1, 2, -1, 3, 2], initialY: [4, -2, 1, 3],
        alpha: 1, beta: 0, literalOutput: [-1, 0, 14, -5] },
      { id: 'B', values: [-1, 2, 0.5, -3, 4, -2, 1], x: [2, -1, 3, 0.5, -2], initialY: [1, -4, 2, 0],
        alpha: 2, beta: -0.5, literalOutput: [-2.5, 2, 10, 0] },
    ],
  });
  const descriptors = await readCanonicalRange(root, 'EX20', 'descriptors-workspace');
  const lifecycle = await readCanonicalRange(root, 'EX20', 'stream-lifecycle');
  expect(descriptors.code).toContain('cusparseCreateCsr(');
  expect(descriptors.code).toContain('cusparseCreateDnVec(');
  expect(descriptors.code).toContain('cusparseSpMV_bufferSize(');
  for (const contract of ['CUSPARSE_OPERATION_NON_TRANSPOSE', 'CUSPARSE_SPMV_CSR_ALG2', 'CUDA_R_32F']) {
    expect(descriptors.code).toContain(contract);
    expect(lifecycle.code).toContain(contract);
  }
  const source = await readFile(path.join(exampleRoot, 'src/cusparse_spmv.cu'), 'utf8');
  expect(source).not.toMatch(/cusparseSpMV_preprocess\s*\(|cusparseCreateConst|cusparseConst\w+Descr_t/);
});

it('keeps bundled cuSPARSE identity separate from Toolkit and reuses EX19 digest-pinned lanes', async () => {
  const example = await loadCanonicalExample(root, 'EX20');
  const ex19 = await loadCanonicalExample(root, 'EX19');
  expect(example.compatibility.lanes).toEqual(ex19.compatibility.lanes);
  expect(example.compatibility.checks.map((check: Record<string, unknown>) => [
    check.toolkitLane, check.dialect, check.kind, check.component, check.componentVersion,
    check.expectedCusparseVersion, check.archiveSha256,
  ])).toEqual([
    ['cuda-11.8', 'c++17', 'ex20', 'cuSPARSE', '11.7.5.86', '11.7.5.86', '9250fe539d4bd6a378581dc0b528e8cfc418b57f28545bf39d70cae762075df7'],
    ['cuda-12.9', 'c++17', 'ex20', 'cuSPARSE', '12.5.10.65', '12.5.10.65', 'a83415dcd3e1183afe363d4740f9f0309cfe560c6c08016c2a61468304f4b848'],
    ['cuda-13.3', 'c++17', 'ex20', 'cuSPARSE', '12.8.2.51', '12.8.2.51', '291ed8fe182ef19774363ea8194a760098fd24ffd39dae06145f06b5f237d2e2'],
  ]);
  for (const check of example.compatibility.checks) {
    const lane = example.compatibility.lanes.find((lane: { id: string }) => lane.id === check.toolkitLane);
    expect(check.sourceCoordinate).toBe(`https://developer.download.nvidia.com/compute/cuda/redist/redistrib_${lane.toolkit}.json`);
    for (const stage of example.build.stages) {
      expect(example.build.commands[stage]).toBe(`make ${stage} DIALECT={dialect} BUILD_DIR=build EXPECTED_CUSPARSE_VERSION={expectedCusparseVersion}`);
    }
  }
  expect(example.compatibility.versionGate.macros).toEqual([
    'CUSPARSE_VER_MAJOR', 'CUSPARSE_VER_MINOR', 'CUSPARSE_VER_PATCH', 'CUSPARSE_VER_BUILD',
  ]);
  expect(example.compatibility.versionGate.runtime).toContain('major/minor/patch');
  expect(example.compatibility.versionGate.runtime).toContain('not exposed');
});
