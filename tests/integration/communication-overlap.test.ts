// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import current from '../../src/current-publication-manifest.json';

describe('G06 communication/computation overlap publication', () => {
  it.each(['LAB18', 'G06-EXERCISES', 'G06-SOLUTIONS'])('%s closes both locale paths with aligned facts and evidence', async id => {
    const pair = await Promise.all((['zh-CN', 'en'] as const).map(async locale => {
      const destination = PUBLISHED_DESTINATIONS[id];
      const text = await readFile(`src/content/docs${destination.href[locale].slice(0, -1)}.md`, 'utf8');
      const { frontmatter: data } = parseFrontmatter(text);
      expect(data).toMatchObject({ unitId: id, prerequisites: destination.prerequisites, factCheckDate: '2026-09-20', license: 'CC-BY-4.0', provenance: 'original' });
      for (const edge of destination.prerequisites) expect(text).toContain(`](${PUBLISHED_DESTINATIONS[edge].href[locale]})`);
      expect(text).toContain(`href="${data.counterpart}"`);
      if (id === 'LAB18') {
        expect(data).toMatchObject({ gpuCount: 2, toolkitLanes: ['cuda-13.3'], evidence: { compilation: [], runtime: ['Pending Hardware Verification'], recordedObservations: [] } });
        for (const phrase of ['--trace=cuda', '--sample=none', '--cpuctxsw=none', 'cudaProfilerStart', 'cudaProfilerStop', 'SHA-256', 'p95', '1048576', '65536', '2.31.2-1+cuda13.3', '2026.5']) expect(text).toContain(phrase);
      } else if (id.endsWith('EXERCISES')) {
        expect(text.match(/<details>/g)).toHaveLength(4);
        expect(text).toContain(`](${PUBLISHED_DESTINATIONS['G06-SOLUTIONS'].href[locale]})`);
      }
      return data;
    }));
    for (const field of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence', 'permissions', 'hardwareGate']) expect(pair[0][field]).toEqual(pair[1][field]);
    expect(current.evidence.pendingHardwareVerification).toContain('LAB18');
    expect(current.evidence.noCompileCheckedClaim).toContain('LAB18');
    expect(current.evidence.runtimeVerified).toEqual([]);
    expect(current.scope.visualExplainers).toContain('VIS15');
  });
  it('ships an attributed original fixture without private captured data', async () => {
    const raw = await readFile('public/assets/overlap-fixtures/lab18-timeline.json', 'utf8');
    const fixture = JSON.parse(raw);
    const sidecar = JSON.parse(await readFile('public/assets/overlap-fixtures/lab18-timeline.json.license.json', 'utf8'));
    expect(sidecar).toMatchObject({ license: 'CC-BY-4.0', provenance: 'original' });
    expect(sidecar.attribution).toContain('CUDA Learning Site');
    expect(fixture.sanitization.containsCapturedData).toBe(false);
    expect(raw).not.toMatch(/\/Users\/|\/home\/|GPU-[0-9a-f-]{8}|(?:password|token|secret)\s*[:=]/i);
    for (const value of Object.values(fixture.environmentManifest)) expect(value === null || (Array.isArray(value) && value.length === 0)).toBe(true);
    const source = await readFile('public/assets/exercise-solutions/g06-pipeline.cu', 'utf8');
    expect(source).toContain('SPDX-License-Identifier: Apache-2.0');
    const workflow = await readFile('.github/workflows/nccl-example.yml', 'utf8');
    expect(workflow).toContain('g06-pipeline.cu -lnccl');
  });
  it('keeps synthetic timeline arithmetic separate from measured evidence', async () => {
    const fixture = JSON.parse(await readFile('public/assets/overlap-fixtures/lab18-timeline.json', 'utf8'));
    expect(fixture).toMatchObject({ provenance: 'original', fixtureType: 'synthetic-teaching-timeline', unit: 'dimensionless ticks', captureStatus: 'not-captured', recordedObservations: [], runtime: 'Pending Hardware Verification' });
    const [overlap, serial, host] = fixture.cases;
    expect(overlap.classification).toBe('synthetic-local-overlap');
    for (const rank of [0, 1]) {
      const bars = overlap.intervals.filter((x: { rank: number }) => x.rank === rank);
      const a = bars.find((x: { operation: string }) => x.operation === 'A0');
      const p = bars.find((x: { operation: string }) => x.operation === 'P1');
      expect(Math.min(a.end, p.end) - Math.max(a.start, p.start)).toBe(3);
    }
    expect(serial.classification).toBe('synthetic-serialized');
    for (const rank of [0, 1]) {
      const bars = serial.intervals.filter((x: { rank: number }) => x.rank === rank);
      expect(bars[1].start).toBeGreaterThanOrEqual(bars[0].end);
    }
    expect(host).toMatchObject({ classification: 'inconclusive', scope: 'host-api-only' });
    expect(fixture.environmentManifest).toMatchObject({ referenceEnvironment: null, rawReports: [], correctness: [], observations: [] });
  });
  it('publishes a complete G06 pair with the agreed prerequisites and visual reuse', async () => {
    const data = [];
    for (const locale of ['zh-CN', 'en'] as const) {
      const destination = PUBLISHED_DESTINATIONS.G06;
      expect(destination).toBeDefined();
      const route = destination.href[locale];
      const text = await readFile(`src/content/docs${route.slice(0, -1)}.md`, 'utf8');
      const { frontmatter } = parseFrontmatter(text);
      expect(frontmatter).toMatchObject({ unitId: 'G06', prerequisites: ['G05', 'Q05', 'Q07'], factCheckDate: '2026-09-20', license: 'CC-BY-4.0', provenance: 'original' });
      for (const id of ['G05', 'Q05', 'Q07', 'VIS16', 'VIS14', 'LAB18', 'G06-EXERCISES']) expect(text).toContain(`](${PUBLISHED_DESTINATIONS[id].href[locale]})`);
      expect(text).toContain(`href="${frontmatter.counterpart}"`);
      data.push(frontmatter);
    }
    for (const field of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence']) expect(data[0][field]).toEqual(data[1][field]);
  });
});
