// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..');
const argumentsSet = new Set(process.argv.slice(2));
const requireMain = argumentsSet.delete('--require-main');

if (argumentsSet.size > 0) throw new Error(`Unknown release-source option: ${[...argumentsSet][0]}`);

const [statusResult, headResult, branchResult, sourceManifestText, releaseText] = await Promise.all([
  execFileAsync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: projectRoot }),
  execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot }),
  execFileAsync('git', ['branch', '--show-current'], { cwd: projectRoot }),
  readFile(path.join(projectRoot, 'src/r1-release-manifest.json'), 'utf8'),
  readFile(path.join(projectRoot, 'dist/release.json'), 'utf8'),
]);

const status = statusResult.stdout.trim();
const head = headResult.stdout.trim();
const branch = branchResult.stdout.trim();
const sourceManifest = JSON.parse(sourceManifestText);
const release = JSON.parse(releaseText);
const { sourceCommit, ...embeddedManifest } = release;

if (status) throw new Error('Release upload requires a clean tracked and untracked source tree.');
if (requireMain && branch !== 'main') throw new Error(`Production release requires main, not ${branch || 'detached HEAD'}.`);
if (release.sourceCommit !== head) {
  throw new Error(`Built release source ${sourceCommit ?? 'missing'} does not match HEAD ${head}.`);
}
if (JSON.stringify(embeddedManifest) !== JSON.stringify(sourceManifest)) {
  throw new Error('Built release metadata does not match the reviewed source manifest.');
}

console.log(`Release source passed for ${branch || 'detached HEAD'} at ${head}.`);
