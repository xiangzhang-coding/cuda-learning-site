// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { loadCanonicalExample, readCanonicalRange, validateCanonicalExample } from '../../scripts/lib/canonical-examples.mjs';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import current from '../../src/current-publication-manifest.json';

describe('EX25 target-specific source and independent Lab evidence', () => {
  it('binds every build input to the canonical source revision and publishes the exact target matrix', async () => {
    expect(await validateCanonicalExample(process.cwd(), 'EX25')).toEqual([]);
    const project = await loadCanonicalExample(process.cwd(), 'EX25');
    for (const file of [...project.build.inputs, ...project.build.hostTestInputs, ...project.build.contractFiles]) {
      const currentSource = await readFile(`${project.root}/${file}`, 'utf8');
      const pinned = execFileSync('git', ['show', `${project.sourceCommit}:${project.root}/${file}`], { encoding: 'utf8' });
      expect(currentSource, file).toBe(pinned);
    }
    expect(project.compatibility.lanes.map((lane: { targets: string[] }) => lane.targets)).toEqual([
      ['portable'], ['portable'], ['portable', '90', '100f', '103f', '110f', '120f', '121f'],
    ]);
    expect(project.compatibility.runtimeProfile).toMatchObject({ hostArchitecture: 'x86-64',
      specializedComputeCapabilities: ['9.0', '10.0', '10.3', '12.0'], compileTargetOnlyComputeCapabilities: ['11.0', '12.1'] });
    expect(project.evidence).toMatchObject({ compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] });
    const workflow = await readFile('.github/workflows/cuda-compile.yml', 'utf8');
    for (const lane of project.compatibility.lanes) {
      expect(workflow).toContain(`lane: ${lane.id}`);
      expect(workflow).toContain(lane.image);
      expect(workflow).toContain(`targets: '${lane.targets.join(' ')}'`);
    }
  });

  it.each(['EX25', 'LAB19', 'LAB20'])('%s has aligned complete pairs with independent expected and recorded results', async id => {
    const destination = PUBLISHED_DESTINATIONS[id];
    const pair = await Promise.all((['zh-CN', 'en'] as const).map(async locale => {
      const route = destination.href[locale];
      const { frontmatter: data } = parseFrontmatter(await readFile(`src/content/docs${route.slice(0, -1)}.${id === 'EX25' ? 'mdx' : 'md'}`, 'utf8'));
      const document = parseHTML(await readFile(`dist${route}index.html`, 'utf8')).document;
      expect(data).toMatchObject({ prerequisites: destination.prerequisites, factCheckDate: '2026-10-04', maximumProblemMemoryBytes: 524352,
        evidence: { compilation: [], runtime: ['Pending Hardware Verification'], recordedObservations: [] } });
      expect(data.evidence.expectedObservations).toHaveLength(1);
      expect(document.querySelectorAll('main h2')).toHaveLength(data.structure.length);
      expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(data.counterpart);
      for (const edge of data.prerequisites) expect(document.querySelector(`main a[href="${PUBLISHED_DESTINATIONS[edge].href[locale]}"]`)).not.toBeNull();
      if (id === 'EX25') {
        for (const name of data.canonicalRanges) {
          const range = await readCanonicalRange(process.cwd(), 'EX25', name);
          expect(document.querySelector('main')?.textContent).toContain(range.code.split('\n')[0]);
        }
      } else {
        expect(data.permissions.length).toBeGreaterThan(0);
        const catalog = RESOURCE_INDEX_RECORDS.find(record => record.planningId === id)!;
        expect(catalog.evidence).toEqual({ compilation: [], runtime: data.evidence.runtime });
        expect(document.querySelector('main')?.textContent).toContain('recorded_observations: []');
        expect(document.querySelector('main')?.textContent).toContain('counter_permission: null');
      }
      return { data, code: [...document.querySelectorAll('main pre')].map(node => node.textContent) };
    }));
    for (const key of ['structure', 'sources', 'evidence', 'prerequisites', 'relatedUnits', 'hardwareGate']) expect(pair[0].data[key]).toEqual(pair[1].data[key]);
    expect(pair[0].code).toEqual(pair[1].code);
    expect(current.evidence.compileChecked).not.toContain(id);
    expect(current.evidence.pendingHardwareVerification).toContain(id);
  });
});
