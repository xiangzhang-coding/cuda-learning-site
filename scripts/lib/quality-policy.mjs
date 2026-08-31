// SPDX-License-Identifier: Apache-2.0
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

const forbiddenPathParts = [
  ['CON', 'TEXT.md'].join(''),
  ['DE', 'SIGN.md'].join(''),
  ['back', 'log'].join(''),
  ['refer', 'ence'].join(''),
  ['.ser', 'ena'].join(''),
  ['docs', 'adr'].join('/'),
  ['docs', 'agents'].join('/'),
  ['.cla', 'ude'].join(''),
  ['.open', 'code'].join(''),
  ['.cur', 'sor'].join(''),
  ['.age', 'nts'].join(''),
  ['re', 'search'].join(''),
  ['se', 'crets'].join(''),
  ['creden', 'tials'].join(''),
  ['AG', 'ENTS.md'].join(''),
  ['CLA', 'UDE.md'].join(''),
  ['opencode', '.json'].join(''),
  ['copilot', '-instructions.md'].join(''),
  ['.github', 'instructions'].join('/'),
  ['.github', 'agents'].join('/'),
  ['.github', 'prompts'].join('/'),
  ['.github', 'chatmodes'].join('/'),
  ['.github', 'skills'].join('/'),
  ['.github', 'hooks'].join('/'),
];

const contentRules = [
  {
    rule: 'private host path',
    pattern: new RegExp(
      ['(?:/Users/', '[A-Za-z0-9._-]+', '|/home/(?!runner/work/cuda-learning-site(?:/|$))', '[A-Za-z0-9._-]+', ')(?:/[^\\s"\'<>]+)+'].join(''),
      'g',
    ),
  },
  {
    rule: 'private governance phrase',
    pattern: new RegExp(['Private', 'Maintainer', 'Material'].join('\\s+'), 'gi'),
  },
  {
    rule: 'private library phrase',
    pattern: new RegExp(['Private', 'Reference', 'Library'].join('\\s+'), 'gi'),
  },
  {
    rule: 'private contract phrase',
    pattern: new RegExp(['R0', 'Implementation', 'Contract'].join('\\s+'), 'gi'),
  },
  { rule: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,255}\b/g },
  { rule: 'GitHub fine-grained token', pattern: /\bgithub_pat_[A-Za-z0-9_]{20,255}\b/g },
  { rule: 'npm token', pattern: /\bnpm_[A-Za-z0-9]{20,255}\b/g },
  { rule: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,255}\b/g },
  { rule: 'Google API key', pattern: /\bAIza[A-Za-z0-9_-]{35}\b/g },
  { rule: 'AWS access key', pattern: /\bAKIA[A-Z0-9]{16}\b/g },
  { rule: 'private key', pattern: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/g },
  { rule: 'bearer credential', pattern: /\bBearer\s+[A-Za-z0-9._~-]{20,}\b/gi },
];

const allowedLicenses = new Set([
  '0BSD',
  'Apache-2.0',
  'Apache-2.0 AND LGPL-3.0-or-later',
  'Apache-2.0 AND LGPL-3.0-or-later AND MIT',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'ISC',
  'LGPL-3.0-or-later',
  'MIT',
  'MIT OR Apache-2.0',
  'MPL-2.0',
  'Python-2.0',
]);

const allowedInstallScripts = new Set([
  'esbuild@0.28.2',
  'fsevents@2.3.2',
  'vite/node_modules/fsevents@2.3.3',
  'workerd@1.20260820.1',
  'wrangler/node_modules/esbuild@0.28.1',
  'wrangler/node_modules/fsevents@2.3.3',
]);

function normalized(relativePath) {
  return relativePath.split(path.sep).join('/').replace(/^\.\//, '');
}

function sameRecord(left = {}, right = {}) {
  const sort = (record) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
  return JSON.stringify(sort(left)) === JSON.stringify(sort(right));
}

export async function walkFiles(root, { ignoredNames = new Set() } = {}) {
  const entries = (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  const files = [];

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) continue;
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(target, { ignoredNames })));
    else files.push(target);
  }

  return files;
}

export function pathViolations(relativePaths) {
  const violations = [];
  for (const candidate of relativePaths) {
    const cleanPath = normalized(candidate);
    const lowerPath = cleanPath.toLowerCase();
    const segments = lowerPath.split('/');
    if (segments.some((segment) => segment === '.env' || segment.startsWith('.env.'))) {
      violations.push({ path: cleanPath, rule: 'forbidden environment file' });
    }
    for (const forbidden of forbiddenPathParts) {
      const forbiddenLower = forbidden.toLowerCase();
      const matches = forbiddenLower.includes('/')
        ? lowerPath === forbiddenLower || lowerPath.startsWith(`${forbiddenLower}/`) || lowerPath.includes(`/${forbiddenLower}/`)
        : segments.includes(forbiddenLower);
      if (matches) {
        violations.push({ path: cleanPath, rule: `forbidden path: ${forbidden}` });
      }
    }
  }
  return violations;
}

export function contentViolations(content) {
  const violations = [];
  for (const { rule, pattern } of contentRules) {
    pattern.lastIndex = 0;
    const match = pattern.exec(content);
    if (match) violations.push({ rule, match: match[0].slice(0, 120) });
  }
  return violations;
}

function pngMetadataViolations(buffer, relativePath) {
  const violations = [];
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) return [{ path: relativePath, rule: 'invalid PNG signature' }];

  const forbiddenChunks = new Set(['eXIf', 'iTXt', 'tEXt', 'zTXt']);
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    if (offset + 12 + length > buffer.length) return [{ path: relativePath, rule: 'invalid PNG chunk length' }];
    if (forbiddenChunks.has(type)) violations.push({ path: relativePath, rule: `PNG metadata chunk ${type} is not retained` });
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return violations;
}

export function zipEntries(buffer) {
  const eocdSignature = 0x06054b50;
  const centralSignature = 0x02014b50;
  const localSignature = 0x04034b50;
  const searchStart = Math.max(0, buffer.length - 65_557);
  let eocdOffset = -1;

  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('end-of-central-directory record is missing');
  if (buffer.readUInt16LE(eocdOffset + 4) !== 0 || buffer.readUInt16LE(eocdOffset + 6) !== 0) {
    throw new Error('multi-disk ZIP archives are unsupported');
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (entryCount > 10_000) throw new Error('ZIP archive exceeds 10,000 entry scan boundary');

  const entries = [];
  let offset = centralOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== centralSignature) {
      throw new Error('invalid central-directory entry');
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const nameEnd = offset + 46 + nameLength;
    if (nameEnd > buffer.length) throw new Error('invalid ZIP entry name length');
    const name = buffer.subarray(offset + 46, nameEnd).toString('utf8');

    if (flags & 1) throw new Error('encrypted ZIP entries are unsupported');
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new Error('ZIP64 entries are unsupported');
    }
    if (uncompressedSize > 50 * 1024 * 1024) throw new Error('ZIP entry exceeds 50 MiB scan boundary');
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > 200 * 1024 * 1024) throw new Error('ZIP archive exceeds 200 MiB uncompressed scan boundary');
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== localSignature) {
      throw new Error('invalid local file header');
    }

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) throw new Error('compressed data exceeds archive boundary');
    const compressed = buffer.subarray(dataStart, dataEnd);
    let content;
    if (method === 0) content = Buffer.from(compressed);
    else if (method === 8) content = inflateRawSync(compressed, { maxOutputLength: 50 * 1024 * 1024 + 1 });
    else throw new Error(`ZIP compression method ${method} is unsupported`);
    if (content.length !== uncompressedSize) throw new Error('ZIP entry size does not match central directory');

    entries.push({ name, content });
    offset = nameEnd + extraLength + commentLength;
  }
  return entries;
}

function zipViolations(buffer, relativePath, depth = 0) {
  const violations = [];
  if (depth >= 3) return [{ path: relativePath, rule: 'nested ZIP depth exceeds three levels' }];
  try {
    const entries = zipEntries(buffer);
    for (const violation of pathViolations(entries.map(({ name }) => name))) {
      violations.push({ path: `${relativePath}!/${violation.path}`, rule: violation.rule });
    }
    for (const entry of entries) {
      const normalizedEntry = normalized(entry.name);
      if (normalizedEntry.startsWith('/') || normalizedEntry.split('/').includes('..')) {
        violations.push({ path: `${relativePath}!/${normalizedEntry}`, rule: 'unsafe ZIP entry path' });
        continue;
      }
      if (entry.name.endsWith('/')) continue;
      for (const violation of contentViolations(entry.content.toString('utf8'))) {
        violations.push({ path: `${relativePath}!/${normalizedEntry}`, ...violation });
      }
      if (path.extname(entry.name).toLowerCase() === '.png') {
        violations.push(...pngMetadataViolations(entry.content, `${relativePath}!/${normalizedEntry}`));
      }
      if (path.extname(entry.name).toLowerCase() === '.zip') {
        violations.push(...zipViolations(entry.content, `${relativePath}!/${normalizedEntry}`, depth + 1));
      }
    }
  } catch (error) {
    violations.push({ path: relativePath, rule: `ZIP archive inspection failed: ${error.message}` });
  }
  return violations;
}

export function scanZipArchive(buffer, relativePath = 'archive.zip') {
  return zipViolations(buffer, relativePath).map(({ path: file, rule }) => {
    const entryBoundary = file.indexOf('!/');
    return {
      path: entryBoundary < 0 ? file : `${file.slice(0, entryBoundary + 2)}<redacted-entry>`,
      rule,
    };
  });
}

export function scanArtifactBuffer(buffer, relativePath) {
  const violations = contentViolations(buffer.toString('utf8')).map(({ rule }) => ({
    path: relativePath,
    rule,
  }));
  const extension = path.extname(relativePath).toLowerCase();
  if (extension === '.png') violations.push(...pngMetadataViolations(buffer, relativePath));
  if (extension === '.zip') violations.push(...scanZipArchive(buffer, relativePath));
  return violations;
}

export async function scanFiles(root, files) {
  const relativePaths = files.map((file) => path.relative(root, file));
  const violations = pathViolations(relativePaths);

  for (const file of files) {
    const relativePath = normalized(path.relative(root, file));
    const metadata = await lstat(file);
    if (metadata.isSymbolicLink()) {
      violations.push({ path: relativePath, rule: 'symbolic links are not accepted in retained artifacts' });
      continue;
    }
    if (metadata.size > 50 * 1024 * 1024) {
      violations.push({ path: relativePath, rule: 'artifact file exceeds 50 MiB scan boundary' });
      continue;
    }
    violations.push(...scanArtifactBuffer(await readFile(file), relativePath));
  }

  return { filesScanned: files.length, violations };
}

export async function scanDirectory(root, { ignoredNames = new Set() } = {}) {
  return scanFiles(root, await walkFiles(root, { ignoredNames }));
}

export function reviewLockfile(lockfile, manifest) {
  const errors = [];
  const packageEntries = Object.entries(lockfile.packages ?? {}).filter(([packagePath]) => packagePath !== '');
  const installScripts = [];
  const licenseExpressions = new Set();
  let bundledPackages = 0;

  if (lockfile.lockfileVersion !== 3) errors.push(`lockfileVersion must be 3, received ${lockfile.lockfileVersion}`);
  const root = lockfile.packages?.[''];
  if (!root) errors.push('lockfile root package record is missing');
  else {
    if (!sameRecord(root.dependencies, manifest.dependencies)) errors.push('lockfile production dependencies differ from package.json');
    if (!sameRecord(root.devDependencies, manifest.devDependencies)) errors.push('lockfile development dependencies differ from package.json');
  }

  for (const [packagePath, record] of packageEntries) {
    const packageName = packagePath.replace(/^node_modules\//, '');
    const coordinate = `${packageName}@${record.version ?? 'missing'}`;

    if (!record.version) errors.push(`${packageName}: version is missing`);
    if (!record.resolved?.startsWith('https://registry.npmjs.org/')) errors.push(`${coordinate}: registry source is not pinned to registry.npmjs.org`);
    if (!/^sha(?:1|512)-/.test(record.integrity ?? '')) errors.push(`${coordinate}: integrity is missing or unsupported`);
    if (!allowedLicenses.has(record.license)) errors.push(`${coordinate}: license ${record.license ?? 'missing'} is not reviewed`);
    else licenseExpressions.add(record.license);
    if (record.inBundle) {
      bundledPackages += 1;
      errors.push(`${coordinate}: bundled package content requires a separate review`);
    }
    if (record.link) errors.push(`${coordinate}: local link dependencies are forbidden`);
    if (record.hasInstallScript) {
      installScripts.push(coordinate);
      if (!allowedInstallScripts.has(coordinate)) errors.push(`${coordinate}: install script is not reviewed`);
    }
  }

  return {
    errors,
    summary: {
      packageRecords: packageEntries.length,
      bundledPackages,
      installScripts: installScripts.sort(),
      licenseExpressions: [...licenseExpressions].sort(),
    },
  };
}
