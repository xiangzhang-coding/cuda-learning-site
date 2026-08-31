// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const docsRoot = path.resolve(import.meta.dirname, '../../src/content/docs');
const reviewDate = '2026-08-31';

const labs = [
  {
    id: 'LAB06',
    pairId: 'lab06',
    slug: 'build-overlapped-pipeline',
    prerequisites: ['M09', 'Q07'],
    tools: [/Nsight Systems/i, /(?:^|[^a-z])nsys(?:[^a-z]|$)/i, /\.nsys-rep/i],
    fixture: '/assets/profiler-report-fixtures/lab06-nsight-systems.expected.json',
  },
  {
    id: 'LAB08',
    pairId: 'lab08',
    slug: 'profile-full-application-before-kernel',
    prerequisites: ['Q07', 'Q08'],
    tools: [/Nsight Systems/i, /Nsight Compute/i, /(?:^|[^a-z])nsys(?:[^a-z]|$)/i, /(?:^|[^a-z])ncu(?:[^a-z]|$)/i, /\.nsys-rep/i, /\.ncu-rep/i],
    fixture: '/assets/profiler-report-fixtures/lab08-nsight-compute.expected.json',
  },
] as const;

function frontmatter(source: string) {
  return /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
}

function yamlList(metadata: string, field: string) {
  const match = new RegExp(`^${field}:\\n((?:  - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function evidenceList(metadata: string, field: string) {
  const match = new RegExp(`^  ${field}:\\n((?:    - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

async function readLab(locale: '' | 'en/', slug: string) {
  return readFile(path.join(docsRoot, `${locale}labs/${slug}.mdx`), 'utf8');
}

describe('LAB06 and LAB08 profiler evidence contracts', () => {
  it.each(labs)('publishes an aligned pending-hardware $id Lab', async (lab) => {
    const [zh, en] = await Promise.all([readLab('', lab.slug), readLab('en/', lab.slug)]);
    for (const source of [zh, en]) {
      const metadata = frontmatter(source);
      expect(metadata).toContain(`pairId: ${lab.pairId}`);
      expect(metadata).toContain(`unitId: ${lab.id}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(yamlList(metadata, 'prerequisites')).toEqual(lab.prerequisites);
      expect(yamlList(metadata, 'toolkitLanes')).toEqual(['cuda-11.8', 'cuda-12.9', 'cuda-13.3']);
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(['chunk-contract', 'stream-pipeline']);
      expect(metadata).toContain('canonicalExample: EX07');
      expect(metadata).toContain("minimumComputeCapability: '7.5'");
      expect(metadata).toContain('maximumProblemMemoryBytes: 49176');
      expect(metadata).toContain('gpuCount: 1');
      expect(metadata).toMatch(/compilation: \[\][\s\S]*runtime:\n    - Pending Hardware Verification/);
      expect(evidenceList(metadata, 'expectedObservations').length).toBeGreaterThanOrEqual(3);
      expect(metadata).toContain('recordedObservations: []');
      expect(source).toContain(lab.fixture);
      expect(source).toContain('4,099');
      expect(source).toContain('49,176');
      expect(source).toMatch(/correctness[\s\S]{0,300}(?:before|first)|正确性[\s\S]{0,300}(?:先于|首先)/i);
      expect(source).toMatch(/Environment Manifest|环境清单/i);
      expect(source).toMatch(/expected observations, not recorded results|预期观察，不是已记录结果/i);
      expect(source).toMatch(/saniti[sz]|消毒/i);
      for (const pattern of lab.tools) expect(source).toMatch(pattern);
    }
    expect(yamlList(frontmatter(zh), 'structure')).toEqual(yamlList(frontmatter(en), 'structure'));
  });

  it('pins Lane component coordinates while requiring observed CLI output', async () => {
    for (const lab of labs) {
      const source = await readLab('en/', lab.slug);
      for (const coordinate of ['2022.4.2.1', '2025.1.3.140', '2026.1.3.425']) {
        expect(source).toContain(coordinate);
      }
      expect(source).toMatch(/nsys --version/);
      expect(source).toMatch(/CUPTI/);
      expect(source).toMatch(/actual|observed/i);
    }
    const lab08 = await readLab('en/', 'profile-full-application-before-kernel');
    for (const coordinate of ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5']) {
      expect(lab08).toContain(coordinate);
    }
    expect(lab08).toMatch(/ncu --version/);
    expect(lab08).toMatch(/performance-counter access/i);
    expect(lab08).toMatch(/selected kernel[\s\S]{0,300}(?:question|section|metric)/i);
    expect(lab08).toMatch(/separate[\s\S]{0,160}(?:nsys|Nsight Systems)[\s\S]{0,160}(?:ncu|Nsight Compute)/i);
  });

  it('publishes no profiler conclusion without a qualifying run', async () => {
    for (const lab of labs) {
      const source = await readLab('en/', lab.slug);
      expect(source).toMatch(/recordedObservations`? remains empty|recorded observations remain empty/i);
      expect(source).toMatch(/no (?:recorded )?(?:timeline|metric|timing|bottleneck|speedup)|publishes no/i);
      expect(source).toMatch(/Pending Hardware Verification/);
      expect(source).not.toMatch(/Runtime-Verified["'`]?\s*(?:status|runtime)?\s*(?:is|:)?\s*(?:granted|true|yes)/i);
    }
  });
});
