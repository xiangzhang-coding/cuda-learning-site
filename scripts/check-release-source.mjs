// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { scanDirectory } from './lib/quality-policy.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..');
const argumentsSet = new Set(process.argv.slice(2));
const requireMain = argumentsSet.delete('--require-main');

if (argumentsSet.size > 0) throw new Error(`Unknown release-source option: ${[...argumentsSet][0]}`);

const [
  statusResult,
  headResult,
  branchResult,
  sourceManifestText,
  currentSourceManifestText,
  releaseText,
  publicationText,
  artifactScan,
] = await Promise.all([
  execFileAsync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: projectRoot }),
  execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot }),
  execFileAsync('git', ['branch', '--show-current'], { cwd: projectRoot }),
  readFile(path.join(projectRoot, 'src/r2-release-manifest.json'), 'utf8'),
  readFile(path.join(projectRoot, 'src/current-publication-manifest.json'), 'utf8'),
  readFile(path.join(projectRoot, 'dist/release.json'), 'utf8'),
  readFile(path.join(projectRoot, 'dist/publication.json'), 'utf8'),
  scanDirectory(path.join(projectRoot, 'dist')),
]);

const status = statusResult.stdout.trim();
const head = headResult.stdout.trim();
const branch = branchResult.stdout.trim();
const sourceManifest = JSON.parse(sourceManifestText);
const currentSourceManifest = JSON.parse(currentSourceManifestText);
const release = JSON.parse(releaseText);
const publication = JSON.parse(publicationText);
const { sourceCommit: releaseSourceCommit, ...embeddedReleaseManifest } = release;
const { sourceCommit: publicationSourceCommit, ...embeddedPublicationManifest } = publication;

if (status) throw new Error('Release upload requires a clean tracked and untracked source tree.');
if (requireMain && branch !== 'main') throw new Error(`Production release requires main, not ${branch || 'detached HEAD'}.`);
if (artifactScan.violations.length > 0) {
  const details = artifactScan.violations.map(({ path: file, rule }) => `${file}: ${rule}`).join('\n');
  throw new Error(`Built release output failed artifact policy:\n${details}`);
}
if (releaseSourceCommit !== head) {
  throw new Error(`Built release source ${releaseSourceCommit ?? 'missing'} does not match HEAD ${head}.`);
}
if (publicationSourceCommit !== head) {
  throw new Error(`Built publication source ${publicationSourceCommit ?? 'missing'} does not match HEAD ${head}.`);
}
if (JSON.stringify(embeddedReleaseManifest) !== JSON.stringify(sourceManifest)) {
  throw new Error('Built release metadata does not match the reviewed source manifest.');
}
if (JSON.stringify(embeddedPublicationManifest) !== JSON.stringify(currentSourceManifest)) {
  throw new Error('Built publication metadata does not match the current source manifest.');
}

console.log(
  `Release and publication source passed for ${branch || 'detached HEAD'} at ${head}; scanned ${artifactScan.filesScanned} output files.`,
);
