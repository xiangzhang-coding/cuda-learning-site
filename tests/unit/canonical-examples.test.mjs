// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';
import os from 'node:os';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';

import { afterEach, describe, expect, it } from 'vitest';

import {
  loadCanonicalExample,
  readCanonicalRange,
  validateCanonicalExample,
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

describe('canonical Runnable Example resolver', () => {
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
});
