// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import current from '../../src/current-publication-manifest.json';

const units = [
  { id: 'P11', slug: 'frameworks/profile-led-optimization', prerequisites: ['P07', 'P09', 'Q06'] },
  { id: 'P12', slug: 'frameworks/sdpa-dispatch-verification', prerequisites: ['A11', 'L11', 'P06', 'P07'] },
];

describe('issue #45 optimization and dispatch publication contract', () => {
  it.each(units)('publishes $id with aligned stages, code, sources, hints and separate solutions', async ({ id, slug, prerequisites }) => {
    for (const suffix of ['', '/exercises', '/solutions']) {
      const name = `${slug}${suffix}`;
      const raws = await Promise.all(['', 'en/'].map((locale) =>
        readFile(`src/content/docs/${locale}${name}.${suffix ? 'md' : 'mdx'}`, 'utf8')));
      const fronts = raws.map((raw) => parseFrontmatter(raw).frontmatter);
      const required = suffix === '/exercises' ? [id] : suffix ? [`${id}-EXERCISES`] : prerequisites;
      for (const [index, front] of fronts.entries()) {
        expect(front.prerequisites).toEqual(required);
        expect(front.factCheckDate).toBe('2026-09-13');
        expect(front.evidence).toEqual({ compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] });
        expect(front.structure).toHaveLength((raws[index].match(/^## /gm) ?? []).length);
        expect(front.sources ?? []).toEqual(fronts[0].sources ?? []);
        expect(front.structure).toEqual(fronts[0].structure);
        expect(raws[index].match(/```[\s\S]*?```/g)).toEqual(raws[0].match(/```[\s\S]*?```/g));
        const route = `${index ? 'en/' : ''}${name}`;
        const document = parseHTML(await readFile(`dist/${route}/index.html`, 'utf8')).document;
        expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href'))
          .toBe(`/${index ? '' : 'en/'}${name}/`);
        if (suffix === '/exercises') {
          expect(document.querySelectorAll('main details')).toHaveLength(4);
          expect(document.querySelectorAll('main details[open]')).toHaveLength(0);
          expect(document.querySelector(`main a[href="/${index ? 'en/' : ''}${slug}/solutions/"]`)).not.toBeNull();
        }
      }
    }
    expect(PUBLISHED_DESTINATIONS[id].prerequisites).toEqual(prerequisites);
  });

  it('keeps LAB14, source review, visual reuse and runtime observations independent', async () => {
    const raw = await readFile('src/content/docs/en/labs/profile-custom-operator.mdx', 'utf8');
    const { frontmatter: lab } = parseFrontmatter(raw);
    expect(lab.prerequisites).toEqual(['P11']);
    expect(lab.extensionProfile).toBe('ex22-torch211-cu128-cp312');
    expect(lab.toolkitLanes).toEqual([]);
    expect(lab.evidence).toMatchObject({ compilation: [], runtime: ['Pending Hardware Verification'], recordedObservations: [] });
    expect(lab.structure).toHaveLength((raw.match(/^## /gm) ?? []).length);
    for (const text of ['12.8.90', '9.19.0.56', '12.8.93', '13.3.0', '20 calls', '100 calls',
      'wait=1', 'warmup=1', 'active=2', 'repeat=1', '--mode operator', '--mode sdpa', 'report.json',
      'Gradients', 'wheel hashes', 'permission', 'Recorded observations: **none**']) expect(raw).toContain(text);
    const p12 = await readFile('src/content/docs/en/frameworks/sdpa-dispatch-verification.mdx', 'utf8');
    expect(p12).toContain('/en/visuals/attention-memory-traffic/');
    expect(p12).not.toContain('import Attention');
    for (const text of ['set_priority=False', 'beta', 'rounded inputs', 'TORCH_CUDNN_SDPA_DEPRIORITIZED',
      '1e-12', 'SM121', 'ineligible', 'nondeterministic', '1280 B']) expect(p12).toContain(text);
    expect(current.evidence.pendingHardwareVerification).toContain('LAB14');
    expect(current.evidence.performanceObservations).toEqual([]);
    expect(current.scope.visualExplainers).toHaveLength(19);
  });
});
