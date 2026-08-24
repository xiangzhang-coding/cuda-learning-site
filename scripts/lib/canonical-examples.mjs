// SPDX-License-Identifier: Apache-2.0
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const manifestName = 'project.json';

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Path escapes the canonical example root: ${relativePath}`);
  }
  return resolved;
}

async function findManifest(projectRoot, exampleId) {
  const examplesRoot = path.join(projectRoot, 'examples');
  const entries = await readdir(examplesRoot, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(examplesRoot, entry.name, manifestName);
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.id === exampleId) matches.push({ manifest, manifestPath });
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  if (matches.length === 0) throw new Error(`Unknown canonical example: ${exampleId}`);
  if (matches.length > 1) throw new Error(`Duplicate canonical example id: ${exampleId}`);
  return matches[0];
}

export async function loadCanonicalExample(projectRoot, exampleId) {
  const { manifest, manifestPath } = await findManifest(projectRoot, exampleId);
  const expectedRoot = path.relative(projectRoot, path.dirname(manifestPath)).split(path.sep).join('/');
  if (manifest.root !== expectedRoot) {
    throw new Error(`${exampleId} declares root ${manifest.root}, expected ${expectedRoot}`);
  }
  return manifest;
}

export async function readCanonicalRange(projectRoot, exampleId, rangeName) {
  const example = await loadCanonicalExample(projectRoot, exampleId);
  const range = example.ranges?.[rangeName];
  if (!range) throw new Error(`Unknown canonical range ${rangeName} for ${exampleId}`);
  if (!example.build.inputs.includes(range.file)) {
    throw new Error(`Canonical range ${rangeName} is not part of ${exampleId} build inputs`);
  }

  const exampleRoot = path.join(projectRoot, example.root);
  const sourcePath = resolveInside(exampleRoot, range.file);
  const source = await readFile(sourcePath, 'utf8');
  const lines = source.split(/\r?\n/);
  const startIndexes = lines.flatMap((line, index) =>
    line.trim() === range.startMarker ? [index] : [],
  );
  const endIndexes = lines.flatMap((line, index) =>
    line.trim() === range.endMarker ? [index] : [],
  );

  if (startIndexes.length !== 1 || endIndexes.length !== 1) {
    throw new Error(`Canonical range ${rangeName} must have exactly one start and end marker`);
  }
  const startIndex = startIndexes[0];
  const endIndex = endIndexes[0];
  if (endIndex <= startIndex + 1) throw new Error(`Canonical range ${rangeName} is empty or reversed`);

  return {
    exampleId,
    range: rangeName,
    file: range.file,
    language: range.language,
    startLine: startIndex + 2,
    endLine: endIndex,
    code: lines.slice(startIndex + 1, endIndex).join('\n'),
  };
}

export async function validateCanonicalExample(projectRoot, exampleId) {
  const errors = [];
  let example;
  try {
    example = await loadCanonicalExample(projectRoot, exampleId);
  } catch (error) {
    return [error.message];
  }

  if (example['SPDX-License-Identifier'] !== 'Apache-2.0') {
    errors.push(`${exampleId} project manifest must declare Apache-2.0`);
  }
  if (example.license !== 'Apache-2.0' || example.provenance !== 'original') {
    errors.push(`${exampleId} must be original Apache-2.0 source`);
  }
  if (!Array.isArray(example.build?.inputs) || example.build.inputs.length === 0) {
    errors.push(`${exampleId} must declare build inputs`);
  }

  const exampleRoot = path.join(projectRoot, example.root);
  for (const input of example.build?.inputs ?? []) {
    try {
      await access(resolveInside(exampleRoot, input));
    } catch {
      errors.push(`${exampleId} build input is missing: ${input}`);
    }
  }

  for (const rangeName of Object.keys(example.ranges ?? {})) {
    try {
      await readCanonicalRange(projectRoot, exampleId, rangeName);
    } catch (error) {
      errors.push(error.message);
    }
  }

  return errors;
}
