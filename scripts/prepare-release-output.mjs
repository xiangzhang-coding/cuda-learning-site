// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const legalRoot = path.join(distRoot, 'legal');
const environmentCommit = process.env.WORKERS_CI_COMMIT_SHA || process.env.GITHUB_SHA;
const sourceCommit = environmentCommit ?? (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot })).stdout.trim();
const [releaseManifest, publicationManifest] = await Promise.all(
  ['src/r1-release-manifest.json', 'src/current-publication-manifest.json'].map(async (relativePath) =>
    JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8')),
  ),
);

if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error(`Invalid release source commit: ${sourceCommit}`);
if (releaseManifest.releaseId !== 'R1' || releaseManifest.schemaVersion !== 2) {
  throw new Error('The source release manifest is not the reviewed R1 schema.');
}
if (
  publicationManifest.publicationId !== 'current' ||
  publicationManifest.schemaVersion !== 1 ||
  publicationManifest.releaseReview?.latestCompleted !== 'R1' ||
  publicationManifest.releaseReview?.next !== 'R2' ||
  publicationManifest.releaseReview?.status !== 'pending'
) {
  throw new Error('The source publication manifest is not the current incremental publication schema.');
}

await mkdir(legalRoot, { recursive: true });
await Promise.all(
  [
    ['LICENSE', 'Apache-2.0.txt'],
    ['LICENSE-CONTENT', 'CC-BY-4.0.txt'],
    ['NOTICE', 'PROJECT-NOTICE.txt'],
    ['CONTENT_LICENSES.md', 'CONTENT_LICENSES.md'],
    ['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md'],
    ['node_modules/astro/LICENSE', 'astro-7.2.4-MIT.txt'],
    ['node_modules/@astrojs/starlight/LICENSE', 'starlight-0.41.7-MIT.txt'],
    ['node_modules/pagefind/LICENSE/LICENSE', 'pagefind-1.5.2-MIT.txt'],
    ['node_modules/pagefind/LICENSE/LICENSE-vscode-ripgrep', 'pagefind-vscode-ripgrep-MIT.txt'],
  ].map(([source, target]) => copyFile(path.join(projectRoot, source), path.join(legalRoot, target))),
);

await Promise.all(
  [
    ['release.json', releaseManifest],
    ['publication.json', publicationManifest],
  ].map(([file, manifest]) =>
    writeFile(path.join(distRoot, file), `${JSON.stringify({ ...manifest, sourceCommit }, null, 2)}\n`, 'utf8'),
  ),
);
