// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const reviewDate = '2026-08-29';

const unitContracts = [
  { id: 'M09', slug: 'pinned-memory-transfer-overlap', prerequisites: ['M07', 'M08'] },
  { id: 'M10', slug: 'unified-memory-page-migration', prerequisites: ['M01', 'M02'] },
  { id: 'M11', slug: 'stream-ordered-allocation-memory-pools', prerequisites: ['M07', 'M08'] },
  { id: 'M12', slug: 'cooperative-groups', prerequisites: ['M05', 'M06'] },
  { id: 'M13', slug: 'asynchronous-copy-pipelines', prerequisites: ['M03', 'M05', 'M08'] },
  { id: 'M14', slug: 'cuda-graphs', prerequisites: ['M07', 'M08'] },
] as const;

const sourceContracts = [
  { id: 'M09', path: 'memory/pinned-memory-transfer-overlap.mdx', count: 12 },
  { id: 'M10', path: 'memory/unified-memory-page-migration.mdx', count: 10 },
  { id: 'M11', path: 'memory/stream-ordered-allocation-memory-pools.mdx', count: 6 },
  { id: 'M12', path: 'memory/cooperative-groups.mdx', count: 7 },
  { id: 'M13', path: 'memory/asynchronous-copy-pipelines.mdx', count: 4 },
  { id: 'M14', path: 'memory/cuda-graphs.mdx', count: 6 },
  { id: 'EX07', path: 'examples/streams-events-overlap.mdx', count: 10 },
  { id: 'EX08', path: 'examples/unified-memory-migration.mdx', count: 10 },
  { id: 'EX09', path: 'examples/graph-capture.mdx', count: 9 },
  { id: 'VIS08', path: 'visuals/page-migration.mdx', count: 4 },
] as const;

const representationContracts = [
  { id: 'M11', slug: 'stream-ordered-allocation-memory-pools', kind: 'allocation' },
  { id: 'M12', slug: 'cooperative-groups', kind: 'group' },
  { id: 'M13', slug: 'asynchronous-copy-pipelines', kind: 'pipeline' },
  { id: 'M14', slug: 'cuda-graphs', kind: 'graph' },
] as const;

async function readRoute(route: string) {
  const pathname = new URL(route, 'https://issue-19.invalid').pathname;
  const html = await readFile(path.join(projectRoot, 'dist', pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

async function readSource(relativePath: string, english = false) {
  return readFile(path.join(docsRoot, english ? 'en' : '', relativePath), 'utf8');
}

function mainText(document: Document) {
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function frontmatter(source: string) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function sourceCoordinates(source: string) {
  return [...frontmatter(source).matchAll(
    /^\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm,
  )].map(([, url, version, platform, accessDate]) => ({ url, version, platform, accessDate }));
}

function expectText(text: string, values: readonly string[]) {
  const normalized = text.toLowerCase();
  for (const value of values) expect(normalized, value).toContain(value.toLowerCase());
}

describe('issue #19 semantic contracts', () => {
  it('separates transfer-overlap capability and eligibility from observation', async () => {
    for (const route of ['/memory/pinned-memory-transfer-overlap/', '/en/memory/pinned-memory-transfer-overlap/']) {
      const text = mainText(await readRoute(route));
      expect(text).toMatch(/Overlap eligibility (?:is not|不是) observation/);
      expectText(text, [
        'cudaMallocHost',
        'cudaHostRegister',
        'cudaMemcpyAsync',
        'copy/compute capability',
        'device timeline',
      ]);
    }
  });

  it('keeps managed-memory accessibility, residency, and migration cost conditional', async () => {
    for (const route of ['/memory/unified-memory-page-migration/', '/en/memory/unified-memory-page-migration/']) {
      const text = mainText(await readRoute(route));
      expectText(text, [
        'cudaMallocManaged',
        'accessibility',
        'residency',
        'access episode = useful memory access',
        'possible fault/coherence work',
        'possible data movement',
        'cudaMemPrefetchAsync',
        'migration candidate',
      ]);
      expect(text).toMatch(/M02(?:['’]s| 的)? (?:segment count|32-byte segment model).*(?:predict|预测)/i);
    }
  });

  it('bounds every stream-ordered allocation use between allocation completion and free', async () => {
    for (const route of ['/memory/stream-ordered-allocation-memory-pools/', '/en/memory/stream-ordered-allocation-memory-pools/']) {
      const text = mainText(await readRoute(route));
      expectText(text, [
        'cudaDevAttrMemoryPoolsSupported',
        'allocation operation completes -> permitted ordered uses -> free operation begins',
        'cudaMallocAsync',
        'cudaFreeAsync',
        'cudaMemPoolAttrReleaseThreshold',
      ]);
      expect(text).toMatch(/All uses must precede free|所有 uses 必须位于 free 前/);
      expect(text).toMatch(/free must be reachable from every last-use completion|free 必须 reachable from 每个 last-use completion/);
      expect(text).toMatch(/Ordinary and stream-ordered lifetimes|Ordinary 与 stream-ordered lifetime 对比/);
    }
  });

  it('makes Cooperative Groups membership, scope, participants, and arguments explicit', async () => {
    for (const route of ['/memory/cooperative-groups/', '/en/memory/cooperative-groups/']) {
      const text = mainText(await readRoute(route));
      expectText(text, [
        'handle',
        'membership',
        'scope',
        'participants',
        'this_thread_block',
        'tiled_partition',
        'coalesced_threads',
        'cudaDevAttrCooperativeLaunch',
        'cudaLaunchCooperativeKernel',
      ]);
      expect(text).toMatch(/same corresponding argument values|group 全部 threads 必须向对应 arguments 传递相同 values/);
    }
  });

  it('preserves a portable synchronous pipeline before the CC 8.0 hardware path', async () => {
    for (const route of ['/memory/asynchronous-copy-pipelines/', '/en/memory/asynchronous-copy-pipelines/']) {
      const text = mainText(await readRoute(route));
      expectText(text, [
        'portable synchronous baseline',
        'global load -> shared store -> barrier -> use -> barrier before reuse',
        'CC 7.0+',
        'CC 8.0+',
        'producer_acquire',
        'producer_commit',
        'consumer_wait',
        'consumer_release',
        'pipeline.quit',
      ]);
      expect(text).toMatch(/do(?:es)? not independently prove which instruction was emitted|不能单独证明 emitted instruction/);
    }
  });

  it('keeps explicit graph construction distinct from capture and preserves dependency lifetimes', async () => {
    for (const route of ['/memory/cuda-graphs/', '/en/memory/cuda-graphs/']) {
      const text = mainText(await readRoute(route));
      expectText(text, [
        'Explicit Graph API',
        'stream capture',
        'cudaStreamBeginCapture',
        'cudaStreamEndCapture',
        'origin stream',
        'cudaGraphInstantiate',
        'cudaGraphLaunch',
        'Resource lifetimes',
      ]);
      expect(text).toMatch(/equivalent DAGs|等价 DAG/);
      expect(text).toMatch(/Two nodes with no path between them are unordered|两个 nodes 之间若没有 path，则 graph 不 ordering 它们/);
      expect(text).toMatch(/Ordinary repeated launches as the baseline|以 ordinary repeated launches 作为 baseline/);
    }
  });
});

describe('issue #19 evidence and source boundaries', () => {
  it('keeps all six Learning Units and VIS08 CUDA-evidence neutral', async () => {
    for (const unit of unitContracts) {
      for (const english of [false, true]) {
        const source = await readSource(`memory/${unit.slug}.mdx`, english);
        expect(frontmatter(source), `${unit.id} source evidence`).toMatch(
          /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
        );
        const route = `/${english ? 'en/' : ''}memory/${unit.slug}/`;
        const document = await readRoute(route);
        expect(metadata(document, 'cuda:unit-id')).toBe(unit.id);
        expect(metadata(document, 'cuda:prerequisites')).toBe(unit.prerequisites.join(','));
        expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
        expect(metadata(document, 'cuda:evidence-runtime')).toBe('none');
        expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
      }
    }

    for (const route of ['/visuals/page-migration/', '/en/visuals/page-migration/']) {
      const document = await readRoute(route);
      for (const name of [
        'cuda:evidence-compilation',
        'cuda:evidence-runtime',
        'cuda:expected-observations',
        'cuda:recorded-observations',
      ]) {
        expect(metadata(document, name), `${route}: ${name}`).toBe('none');
      }
    }
  });

  it('keeps EX07-EX09 runtime pending with exactly three expectations and no observations', async () => {
    const examples = [
      { id: 'EX07', slug: 'streams-events-overlap' },
      { id: 'EX08', slug: 'unified-memory-migration' },
      { id: 'EX09', slug: 'graph-capture' },
    ] as const;

    for (const example of examples) {
      const manifest = JSON.parse(
        await readFile(path.join(projectRoot, `examples/${example.id.toLowerCase()}-${example.slug}/project.json`), 'utf8'),
      ) as {
        evidence: {
          compilation: string[];
          runtime: string;
          expectedObservations: string[];
          recordedObservations: string[];
        };
      };
      expect(manifest.evidence).toMatchObject({
        compilation: [],
        runtime: 'Pending Hardware Verification',
        recordedObservations: [],
      });
      expect(manifest.evidence.expectedObservations).toHaveLength(3);

      for (const route of [`/examples/${example.slug}/`, `/en/examples/${example.slug}/`]) {
        const document = await readRoute(route);
        expect(metadata(document, 'cuda:unit-id')).toBe(example.id);
        expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
        expect(metadata(document, 'cuda:evidence-runtime')).toBe('Pending Hardware Verification');
        expect(metadata(document, 'cuda:expected-observations')).toBe('3 declared expectations');
        expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
      }
    }
  });

  it('keeps every owner-source coordinate aligned across locales at the 2026-08-29 review', async () => {
    for (const contract of sourceContracts) {
      const [chinese, english] = await Promise.all([
        readSource(contract.path),
        readSource(contract.path, true),
      ]);
      const chineseCoordinates = sourceCoordinates(chinese);
      const englishCoordinates = sourceCoordinates(english);

      expect(chineseCoordinates, contract.id).toHaveLength(contract.count);
      expect(chineseCoordinates, contract.id).toEqual(englishCoordinates);
      expect(chineseCoordinates.map(({ accessDate }) => accessDate), contract.id).toEqual(
        Array.from({ length: contract.count }, () => reviewDate),
      );
      expect(chineseCoordinates.every(({ url }) => url.startsWith('https://'))).toBe(true);

      for (const route of [
        `/${contract.path.replace(/\.(?:md|mdx)$/, '/')}`,
        `/en/${contract.path.replace(/\.(?:md|mdx)$/, '/')}`,
      ]) {
        const document = await readRoute(route);
        expect(metadata(document, 'cuda:source-count'), contract.id).toBe(String(contract.count));
        for (const { url } of chineseCoordinates) {
          expect(document.querySelector(`main a[href="${url}"]`), `${route}: ${url}`).not.toBeNull();
        }
      }
    }
  });

  it('publishes only static, ID-free embedded representations and a complete VIS08 fallback', async () => {
    for (const contract of representationContracts) {
      for (const route of [`/memory/${contract.slug}/`, `/en/memory/${contract.slug}/`]) {
        const document = await readRoute(route);
        const representation = document.querySelector(
          `[data-static-fallback][data-representation-kind="${contract.kind}"][data-conceptual-only]`,
        );
        expect(metadata(document, 'cuda:unit-id')).toBe(contract.id);
        expect(representation).not.toBeNull();
        expect(representation?.hasAttribute('data-visual-id')).toBe(false);
        expect(representation?.querySelector('[data-visual-id]')).toBeNull();
      }
    }

    for (const route of ['/visuals/page-migration/', '/en/visuals/page-migration/']) {
      const document = await readRoute(route);
      const visual = document.querySelector('cuda-page-migration[data-visual-id="VIS08"]');
      expect(visual?.querySelectorAll('[data-static-scenario]')).toHaveLength(3);
      expect(visual?.querySelectorAll('[data-static-access-row]')).toHaveLength(12);
      expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
    }
  });

  it('contains no fabricated duration, bandwidth, or speedup value in issue #19 pages or projects', async () => {
    const fabricatedPerformance = /\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s)\b|\b\d+(?:\.\d+)?x\s+(?:speedup|faster)\b/i;
    const issuePaths = [
      ...unitContracts.flatMap(({ slug }) => [
        `memory/${slug}.mdx`,
        `memory/${slug}/exercises.md`,
        `memory/${slug}/solutions.md`,
      ]),
      'examples/streams-events-overlap.mdx',
      'examples/unified-memory-migration.mdx',
      'examples/graph-capture.mdx',
      'visuals/page-migration.mdx',
    ];

    for (const relativePath of issuePaths) {
      for (const english of [false, true]) {
        expect(await readSource(relativePath, english), `${english ? 'en/' : ''}${relativePath}`).not.toMatch(
          fabricatedPerformance,
        );
      }
    }

    for (const sourcePath of [
      'examples/ex07-streams-events-overlap/src/streams_events_overlap.cu',
      'examples/ex08-unified-memory-migration/src/unified_memory_migration.cu',
      'examples/ex09-graph-capture/src/graph_capture.cu',
    ]) {
      const source = await readFile(path.join(projectRoot, sourcePath), 'utf8');
      expect(source, sourcePath).not.toMatch(/cudaEventElapsedTime|std::chrono|clock_gettime|GB\/s|speedup/i);
    }
  });
});
