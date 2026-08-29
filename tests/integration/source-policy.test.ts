// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { scanDirectory, scanFiles, walkFiles } from '../../scripts/lib/quality-policy.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const ignoredDirectories = new Set([
  '.git',
  '.astro',
  '.quality',
  'artifacts',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);

const issue19UnitSlugs = [
  'pinned-memory-transfer-overlap',
  'unified-memory-page-migration',
  'stream-ordered-allocation-memory-pools',
  'cooperative-groups',
  'asynchronous-copy-pipelines',
  'cuda-graphs',
] as const;

const issue19ContentFiles = ['', 'en/'].flatMap((localePrefix) => [
  ...issue19UnitSlugs.flatMap((slug) => [
    `${localePrefix}memory/${slug}.mdx`,
    `${localePrefix}memory/${slug}/exercises.md`,
    `${localePrefix}memory/${slug}/solutions.md`,
  ]),
  `${localePrefix}examples/streams-events-overlap.mdx`,
  `${localePrefix}examples/unified-memory-migration.mdx`,
  `${localePrefix}examples/graph-capture.mdx`,
  `${localePrefix}visuals/page-migration.mdx`,
]);

const issue19SoftwareFiles = [
  'src/components/AdvancedMemoryRepresentation.astro',
  'src/components/PageMigrationExplorer.astro',
  'src/current-publication-manifest.json',
  'src/styles/advanced-memory-visuals.css',
  'src/visuals/page-migration-copy.ts',
  'src/visuals/page-migration-model.ts',
  'tests/e2e/page-migration-visual.spec.ts',
  'tests/integration/page-migration-visual.test.ts',
  'tests/integration/data-movement-managed-memory-pools-groups-pipelines-graphs-units.test.ts',
  'tests/integration/ex07-project-boundary.test.ts',
  'tests/integration/ex08-project-boundary.test.ts',
  'tests/integration/ex09-project-boundary.test.ts',
  'tests/unit/page-migration-model.test.ts',
] as const;

const issue19Projects = [
  {
    id: 'EX07',
    root: 'examples/ex07-streams-events-overlap',
    implementationFiles: ['include/streams_events_overlap_reference.hpp', 'src/streams_events_overlap.cu'],
  },
  {
    id: 'EX08',
    root: 'examples/ex08-unified-memory-migration',
    implementationFiles: ['include/unified_memory_migration_reference.hpp', 'src/unified_memory_migration.cu'],
  },
  {
    id: 'EX09',
    root: 'examples/ex09-graph-capture',
    implementationFiles: ['include/graph_capture_reference.hpp', 'src/graph_capture.cu'],
  },
] as const;

const issue20UnitSlugs = [
  'nvcc-compilation-flow',
  'ptx-cubin-fatbinary',
  'compiler-architecture-targets',
  'separate-compilation-device-linking',
  'cpp-dialect-boundaries',
] as const;

const issue20ContentFiles = ['', 'en/'].flatMap((localePrefix) => [
  ...issue20UnitSlugs.flatMap((slug) => [
    `${localePrefix}toolchain/${slug}.mdx`,
    `${localePrefix}toolchain/${slug}/exercises.md`,
    `${localePrefix}toolchain/${slug}/solutions.md`,
  ]),
  `${localePrefix}examples/ptx-fatbinary-inspection.mdx`,
  `${localePrefix}visuals/artifact-pipeline.mdx`,
  `${localePrefix}about.md`,
  `${localePrefix}index.mdx`,
  `${localePrefix}practice.mdx`,
  `${localePrefix}start/using-the-learning-site.md`,
  `${localePrefix}visuals/index.mdx`,
]);

const issue20SoftwareFiles = [
  '.github/workflows/cuda-compile.yml',
  'astro.config.mjs',
  'scripts/lib/canonical-examples.mjs',
  'scripts/run-ex10-compile.mjs',
  'src/components/ArtifactPipelineExplorer.astro',
  'src/components/ExampleEvidence.astro',
  'src/current-publication-manifest.json',
  'src/resource-indexes/resource-index-data.ts',
  'src/resource-indexes/resource-index-model.ts',
  'src/styles/compilation-visuals.css',
  'src/visuals/artifact-pipeline-copy.ts',
  'src/visuals/artifact-pipeline-model.ts',
  'tests/e2e/accessibility.spec.ts',
  'tests/e2e/artifact-pipeline-visual.spec.ts',
  'tests/e2e/correctness-sanitizer-timing.spec.ts',
  'tests/e2e/orientation.spec.ts',
  'tests/e2e/resource-indexes.spec.ts',
  'tests/e2e/themes.spec.ts',
  'tests/e2e/visual.spec.ts',
  'tests/integration/artifact-pipeline-visual.test.ts',
  'tests/integration/deployment-contract.test.ts',
  'tests/integration/evidence-environment-contract.test.ts',
  'tests/integration/ex10-project-boundary.test.ts',
  'tests/integration/nvcc-ptx-targets-linking-dialects-units.test.ts',
  'tests/integration/publication-pairs.test.ts',
  'tests/integration/r1-release-review.test.ts',
  'tests/integration/resource-indexes.test.ts',
  'tests/integration/source-policy.test.ts',
  'tests/integration/visual-explainers.test.ts',
  'tests/release/release-smoke.spec.ts',
  'tests/unit/artifact-pipeline-model.test.ts',
  'tests/unit/content-metadata.test.ts',
  'tests/unit/ex10-compile-evidence.test.mjs',
  'tests/unit/resource-index-model.test.ts',
] as const;

const issue20Project = {
  id: 'EX10',
  root: 'examples/ex10-ptx-fatbinary-inspection',
  files: [
    'Makefile',
    'README.md',
    'evidence/README.md',
    'evidence/cuda-11-8-cxx17.json',
    'evidence/cuda-12-9-cxx17.json',
    'evidence/cuda-12-9-cxx20.json',
    'evidence/cuda-13-3-cxx17.json',
    'evidence/cuda-13-3-cxx20.json',
    'evidence/cuda-13-3-gcc14-cxx23-probe.json',
    'probes/cuda-13.3-gcc14.Dockerfile',
    'probes/cxx23.cu',
    'project.json',
    'scripts/artifact-test.sh',
    'scripts/compile-check.sh',
    'src/artifact_kernel.cu',
    'src/caller.cu',
    'src/device_math.cu',
  ],
} as const;

describe('source, license, and privacy policy', () => {
  it('records file-level licenses and original provenance for public content', async () => {
    const contentFiles = (await walkFiles(path.join(projectRoot, 'src/content/docs'))).filter((file: string) =>
      /\.(md|mdx)$/.test(file),
    );

    expect(contentFiles.length).toBeGreaterThanOrEqual(38);
    expect(contentFiles.length % 2).toBe(0);
    for (const file of contentFiles) {
      const content = await readFile(file, 'utf8');
      expect(content, file).toMatch(/^license: CC-BY-4\.0$/m);
      expect(content, file).toMatch(/^provenance: original$/m);
    }

    await expect(readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8')).resolves.toContain(
      'No adapted content or assets',
    );
    await expect(readFile(path.join(projectRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8')).resolves.toMatch(
      /`@astrojs\/starlight` \| 0\.41\.7/,
    );
  });

  it('covers the exact issue #19 content, software, tests, and original project sources', async () => {
    expect(issue19ContentFiles).toHaveLength(44);
    expect(new Set(issue19ContentFiles).size).toBe(issue19ContentFiles.length);
    for (const relativePath of issue19ContentFiles) {
      const content = await readFile(path.join(projectRoot, 'src/content/docs', relativePath), 'utf8');
      expect(content, relativePath).toMatch(/^license: CC-BY-4\.0$/m);
      expect(content, relativePath).toMatch(/^provenance: original$/m);
    }

    for (const relativePath of issue19SoftwareFiles) {
      const content = await readFile(path.join(projectRoot, relativePath), 'utf8');
      if (relativePath.endsWith('.json')) {
        expect(JSON.parse(content), relativePath).toMatchObject({
          'SPDX-License-Identifier': 'Apache-2.0',
        });
      } else {
        expect(content, relativePath).toContain('SPDX-License-Identifier: Apache-2.0');
      }
    }

    for (const project of issue19Projects) {
      const projectRootPath = path.join(projectRoot, project.root);
      const sourceFiles = (await walkFiles(projectRootPath))
        .map((file: string) => path.relative(projectRootPath, file).split(path.sep).join('/'))
        .filter((file: string) => !file.startsWith('build/') && !file.startsWith('.quality/'))
        .sort();
      const expectedFiles = [
        'Makefile',
        'README.md',
        'evidence/README.md',
        ...project.implementationFiles,
        'project.json',
        'scripts/compile-check.sh',
        'tests/host_reference_test.cpp',
      ].sort();
      expect(sourceFiles, project.id).toEqual(expectedFiles);

      for (const relativePath of sourceFiles) {
        const content = await readFile(path.join(projectRootPath, relativePath), 'utf8');
        if (relativePath === 'project.json') {
          const manifest = JSON.parse(content) as Record<string, unknown>;
          expect(manifest, project.id).toMatchObject({
            'SPDX-License-Identifier': 'Apache-2.0',
            id: project.id,
            license: 'Apache-2.0',
            provenance: 'original',
          });
        } else {
          expect(content, `${project.id} ${relativePath}`).toContain('SPDX-License-Identifier: Apache-2.0');
        }
      }
    }
  });

  it('covers every issue #20 publication, software change, test, workflow, and EX10 source', async () => {
    expect(issue20ContentFiles).toHaveLength(44);
    expect(new Set(issue20ContentFiles).size).toBe(issue20ContentFiles.length);
    const scopedFiles: string[] = [];

    for (const relativePath of issue20ContentFiles) {
      const file = path.join(projectRoot, 'src/content/docs', relativePath);
      const content = await readFile(file, 'utf8');
      scopedFiles.push(file);
      expect(content, relativePath).toMatch(/^license: CC-BY-4\.0$/m);
      expect(content, relativePath).toMatch(/^provenance: original$/m);
      expect(content, relativePath).not.toMatch(/^provenance: (?!original$).+/m);
    }

    for (const relativePath of issue20SoftwareFiles) {
      const file = path.join(projectRoot, relativePath);
      const content = await readFile(file, 'utf8');
      scopedFiles.push(file);
      if (relativePath.endsWith('.json')) {
        expect(JSON.parse(content), relativePath).toMatchObject({
          'SPDX-License-Identifier': 'Apache-2.0',
        });
      } else {
        expect(content, relativePath).toContain('SPDX-License-Identifier: Apache-2.0');
      }
    }

    const exampleRoot = path.join(projectRoot, issue20Project.root);
    const sourceFiles = (await walkFiles(exampleRoot))
      .map((file: string) => path.relative(exampleRoot, file).split(path.sep).join('/'))
      .filter((file: string) => !file.startsWith('build/') && !file.startsWith('.quality/'))
      .sort();
    expect(sourceFiles, issue20Project.id).toEqual([...issue20Project.files].sort());

    for (const relativePath of sourceFiles) {
      const file = path.join(exampleRoot, relativePath);
      const content = await readFile(file, 'utf8');
      scopedFiles.push(file);
      if (relativePath === 'project.json') {
        expect(JSON.parse(content), issue20Project.id).toMatchObject({
          'SPDX-License-Identifier': 'Apache-2.0',
          id: issue20Project.id,
          license: 'Apache-2.0',
          provenance: 'original',
        });
      } else if (relativePath.endsWith('.json')) {
        expect(JSON.parse(content), `${issue20Project.id} ${relativePath}`).toMatchObject({
          'SPDX-License-Identifier': 'Apache-2.0',
        });
      } else {
        expect(content, `${issue20Project.id} ${relativePath}`).toContain('SPDX-License-Identifier: Apache-2.0');
      }
    }

    await expect(readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8')).resolves.toContain(
      'No adapted content or assets',
    );
    expect((await scanFiles(projectRoot, scopedFiles)).violations).toEqual([]);
  });

  it('pins the CUDA container source and Astro Markdown processor owner interfaces', async () => {
    const containerCommit = 'https://gitlab.com/nvidia/container-images/cuda/-/commit/44b139413eb3dfcb3fc30d0868479deedce72255';
    const markdownProcessorSources = [
      'https://registry.npmjs.org/%40astrojs%2Fmarkdown-remark/7.2.4',
      'https://github.com/withastro/astro/releases/tag/%40astrojs%2Fmarkdown-remark%407.2.4',
      'https://github.com/withastro/astro/blob/%40astrojs%2Fmarkdown-remark%407.2.4/packages/markdown/remark/src/processor.ts',
    ];
    const [maintenance, ...publicPages] = await Promise.all([
      readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/sources-and-versions.mdx'), 'utf8'),
    ]);
    const ex10Pages = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/examples/ptx-fatbinary-inspection.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/examples/ptx-fatbinary-inspection.mdx'), 'utf8'),
    ]);

    expect(maintenance).toContain(containerCommit);
    expect(maintenance).toContain('`@astrojs/markdown-remark` 7.2.4 `unified({ rehypePlugins })`');
    for (const page of publicPages) {
      expect(page).toContain(containerCommit);
      expect(page).toContain('`markdown.processor: unified({ rehypePlugins })`');
      for (const source of markdownProcessorSources) expect(page).toContain(source);
    }
    for (const page of ex10Pages) {
      expect(page.split(containerCommit)).toHaveLength(3);
      expect(page).toContain('title "CUDA 13.3.1"; committed 2026-07-28');
    }
    for (const source of markdownProcessorSources) expect(maintenance).toContain(source);
    expect([maintenance, ...publicPages, ...ex10Pages].join('\n')).not.toMatch(/master\s+branch/);
  });

  it('keeps Visual Explainers original, owner-sourced, and explicitly non-evidentiary', async () => {
    for (const relativePath of [
      'visuals/kernel-journey.mdx',
      'en/visuals/kernel-journey.mdx',
      'visuals/indexing.mdx',
      'en/visuals/indexing.mdx',
      'visuals/warp-divergence.mdx',
      'en/visuals/warp-divergence.mdx',
      'visuals/stream-event-dependencies.mdx',
      'en/visuals/stream-event-dependencies.mdx',
      'visuals/page-migration.mdx',
      'en/visuals/page-migration.mdx',
      'visuals/artifact-pipeline.mdx',
      'en/visuals/artifact-pipeline.mdx',
    ]) {
      const content = await readFile(path.join(projectRoot, 'src/content/docs', relativePath), 'utf8');
      expect(content, relativePath).toMatch(/^resourceKind: visual-explainer$/m);
      expect(content, relativePath).toMatch(/https:\/\/docs\.nvidia\.com\/cuda\/cuda-programming-guide\//);
      expect(content, relativePath).toContain('Compile-Checked');
      expect(content, relativePath).toContain('Community-Observed');
      expect(content, relativePath).toContain('Runtime-Verified');
      expect(content, relativePath).toMatch(/original|原创/);
      expect(content, relativePath).toMatch(/not copied|no .* (?:copied|mirrored)|没有复制|没有镜像|未复制/i);
    }
  });

  it('keeps forbidden private paths and phrases out of source and built output', async () => {
    const sourceResult = await scanDirectory(projectRoot, { ignoredNames: ignoredDirectories });
    const builtResult = await scanDirectory(path.join(projectRoot, 'dist'));

    expect(sourceResult.violations).toEqual([]);
    expect(builtResult.violations).toEqual([]);
  });
});
