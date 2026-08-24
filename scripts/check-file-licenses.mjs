// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..');
const softwareSpdx = 'SPDX-License-Identifier: Apache-2.0';
const formatExemptions = new Set([
  '.node-version',
  'LICENSE',
  'LICENSE-CONTENT',
  'NOTICE',
  'package-lock.json',
  'package.json',
]);

const { stdout } = await execFileAsync('git', ['ls-files', '-z'], { cwd: projectRoot, encoding: 'utf8' });
const trackedFiles = stdout.split('\0').filter(Boolean).sort();
const trackedSet = new Set(trackedFiles);
const errors = [];

for (const relativePath of trackedFiles) {
  const assetPath = relativePath.startsWith('public/favicon.svg') || /^(?:(?:src|public)\/assets|third_party)\//.test(relativePath);
  if (assetPath) {
    if (relativePath.endsWith('.license.json')) {
      const target = relativePath.slice(0, -'.license.json'.length);
      if (!trackedSet.has(target)) errors.push(`${relativePath}: license sidecar has no tracked asset`);
      continue;
    }

    const sidecarPath = `${relativePath}.license.json`;
    if (!trackedSet.has(sidecarPath)) {
      errors.push(`${relativePath}: asset requires ${sidecarPath}`);
      continue;
    }
    const sidecar = JSON.parse(await readFile(path.join(projectRoot, sidecarPath), 'utf8'));
    if (!['adapted', 'original', 'upstream'].includes(sidecar.provenance)) errors.push(`${sidecarPath}: invalid provenance`);
    if (sidecar.provenance === 'original' && sidecar.license !== 'CC-BY-4.0') errors.push(`${sidecarPath}: original visual assets require CC-BY-4.0`);
    if (!sidecar.license || !sidecar.attribution) errors.push(`${sidecarPath}: license and attribution are required`);
    if (sidecar.provenance !== 'original') {
      for (const field of ['notices', 'release', 'source', 'upstreamFile']) {
        if (!sidecar[field]) errors.push(`${sidecarPath}: upstream/adapted assets require ${field}`);
      }
    }
    if (sidecar.provenance === 'adapted' && !sidecar.modifications) errors.push(`${sidecarPath}: adapted assets require modifications`);
    continue;
  }

  const content = await readFile(path.join(projectRoot, relativePath), 'utf8');

  if (/^src\/content\/docs\/.*\.(?:md|mdx)$/.test(relativePath)) {
    const frontmatterEnd = content.startsWith('---\n') ? content.indexOf('\n---', 4) : -1;
    const frontmatter = frontmatterEnd === -1 ? '' : content.slice(4, frontmatterEnd);
    if (!/^license: CC-BY-4\.0$/m.test(frontmatter)) errors.push(`${relativePath}: missing CC-BY-4.0 frontmatter`);
    if (!/^provenance: original$/m.test(frontmatter)) errors.push(`${relativePath}: missing original provenance`);
    continue;
  }

  if (formatExemptions.has(relativePath)) continue;
  const jsonSpdx = relativePath.endsWith('.json') &&
    /"SPDX-License-Identifier"\s*:\s*"Apache-2\.0"/.test(content);
  if (!content.includes(softwareSpdx) && !jsonSpdx) {
    errors.push(`${relativePath}: missing Apache-2.0 SPDX declaration`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`File-level license policy passed for ${trackedFiles.length} tracked files.`);
}
