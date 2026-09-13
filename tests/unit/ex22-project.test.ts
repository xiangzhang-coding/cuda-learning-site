// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { validateCanonicalExample, readCanonicalRange } from '../../scripts/lib/canonical-examples.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const example = path.join(root, 'examples/ex22-adjacent-energy');
const read = (file: string) => readFileSync(path.join(example, file), 'utf8');
const project = JSON.parse(read('project.json'));

describe('EX22 canonical original operator', () => {
  it('keeps its extension target independent from ordinary lanes and runtime evidence', async () => {
    expect(await validateCanonicalExample(root, 'EX22')).toEqual([]);
    expect(project.compatibility.lanes).toEqual([]);
    expect(project.compatibility.extensionProfile).toMatchObject({ torch: '2.11.0+cu128', packagedCuda: '12.8',
      toolkit: '12.8.1', nvcc: '12.8.93', compiler: 'GCC 13.3.0', python: '3.12.14', archList: '8.0+PTX' });
    expect(project.evidence).toMatchObject({ compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] });
    for (const [field, value] of Object.entries(JSON.parse(read('environment-manifest.json')))) {
      if (['SPDX-License-Identifier', 'schemaVersion', 'subject', 'measurement'].includes(field)) continue;
      expect(value === null || (Array.isArray(value) && value.length === 0), field).toBe(true);
    }
  });

  it('parses all Python sources and shell without importing torch or executing CUDA', () => {
    const files = [...new Set<string>([...project.build.inputs, ...project.build.hostTestInputs])].filter((file) => file.endsWith('.py'));
    execFileSync('python3', ['-I', '-c', 'import ast,sys; [ast.parse(s) for s in sys.argv[1:]]', ...files.map(read)]);
    execFileSync('bash', ['-n', path.join(example, 'scripts/check-wheel.sh')]);
  });

  it('publishes identical ordered imports from the immutable project on each consumer pair', async () => {
    for (const [slug, expected] of [['examples/adjacent-energy', Object.keys(project.ranges)],
      ['labs/build-custom-operator', ['build', 'checks']]] as const) {
      for (const locale of ['', 'en/']) {
        const raw = readFileSync(path.join(root, 'src/content/docs', `${locale}${slug}.mdx`), 'utf8');
        const metadata = parseFrontmatter(raw).frontmatter;
        expect(metadata.canonicalRanges).toEqual(expected);
        expect([...raw.matchAll(/<CanonicalCode exampleId="EX22" range="([^"]+)" \/>/g)].map((match) => match[1]))
          .toEqual(expected);
        for (const name of expected) expect((await readCanonicalRange(root, 'EX22', name)).code.length).toBeGreaterThan(50);
      }
    }
  });

  it('protects launch, installation and mathematical-check boundaries in the executable gate', () => {
    const cuda = read('csrc/kernel.cu');
    expect(cuda).toContain('if (count == 0) return y;');
    expect(cuda).toContain('getCurrentCUDAStream(x.get_device())');
    expect(cuda).toContain('C10_CUDA_KERNEL_LAUNCH_CHECK');
    expect(cuda).not.toMatch(/cudaDeviceSynchronize|cudaStreamCreate/);
    const checks = read('verify.py');
    for (const api of ['opcheck', 'gradcheck', 'gradgradcheck', 'fullgraph=True', 'dynamic=True', 'stream.synchronize()']) expect(checks).toContain(api);
    expect(checks).toContain('raise RuntimeError("CUDA requested but unavailable');
    const build = read('scripts/check-wheel.sh');
    expect(build).toContain('--no-build-isolation --no-deps');
    expect(build).toContain('python -I verify.py --device cpu');
    expect(read('cuda_learning_ops/__init__.py').indexOf('from . import _C'))
      .toBeLessThan(read('cuda_learning_ops/__init__.py').indexOf('from . import _registration'));
  });
});
