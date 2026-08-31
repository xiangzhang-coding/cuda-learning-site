// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { scanDirectory } from './lib/quality-policy.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..');

class ReleaseSourceError extends Error {}

function rejectRelease(message) {
  throw new ReleaseSourceError(message);
}

function parseManifest(source, label) {
  try {
    return JSON.parse(source);
  } catch {
    rejectRelease(`Built ${label} is not valid JSON.`);
  }
}

async function main() {
  const argumentsSet = new Set(process.argv.slice(2));
  const requireMain = argumentsSet.delete('--require-main');
  if (argumentsSet.size > 0) rejectRelease('Unknown release-source option.');

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

  if (status) rejectRelease('Release upload requires a clean tracked and untracked source tree.');
  if (requireMain && branch !== 'main') rejectRelease('Production release requires main.');
  if (artifactScan.violations.length > 0) {
    const rules = [...new Set(artifactScan.violations.map(({ rule }) => rule))].join(', ');
    rejectRelease(`Built release output failed artifact policy: ${rules}`);
  }
  if (!/^[0-9a-f]{40}$/.test(head)) rejectRelease('Release source commit is invalid.');

  const sourceManifest = parseManifest(sourceManifestText, 'R2 source manifest');
  const currentSourceManifest = parseManifest(currentSourceManifestText, 'current source manifest');
  const release = parseManifest(releaseText, 'release metadata');
  const publication = parseManifest(publicationText, 'publication metadata');
  const { sourceCommit: releaseSourceCommit, ...embeddedReleaseManifest } = release;
  const { sourceCommit: publicationSourceCommit, ...embeddedPublicationManifest } = publication;

  if (releaseSourceCommit !== head) rejectRelease('Built release source does not match HEAD.');
  if (publicationSourceCommit !== head) rejectRelease('Built publication source does not match HEAD.');
  if (JSON.stringify(embeddedReleaseManifest) !== JSON.stringify(sourceManifest)) {
    rejectRelease('Built release metadata does not match the reviewed source manifest.');
  }
  if (JSON.stringify(embeddedPublicationManifest) !== JSON.stringify(currentSourceManifest)) {
    rejectRelease('Built publication metadata does not match the current source manifest.');
  }

  const branchScope = branch === 'main' ? 'main' : 'a non-main branch';
  console.log(
    `Release and publication source passed for ${branchScope} at ${head}; scanned ${artifactScan.filesScanned} output files.`,
  );
}

main().catch((error) => {
  console.error(error instanceof ReleaseSourceError ? error.message : 'Release source check failed before upload.');
  process.exitCode = 1;
});
