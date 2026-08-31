// SPDX-License-Identifier: Apache-2.0
import { mkdtemp, mkdir, rm, symlink, truncate, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  contentViolations,
  pathViolations,
  reviewLockfile,
  scanArtifactBuffer,
  scanDirectory,
  scanZipArchive,
  walkFiles,
} from '../../scripts/lib/quality-policy.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

async function temporaryTree() {
  const root = await mkdtemp(path.join(tmpdir(), 'cuda-quality-'));
  temporaryDirectories.push(root);
  await mkdir(path.join(root, 'nested'));
  await writeFile(path.join(root, 'clean.txt'), 'public content');
  await writeFile(path.join(root, 'nested', 'page.html'), '<main>safe</main>');
  return root;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  return chunk;
}

function png(...chunks) {
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), ...chunks]);
}

function createZip(entries) {
  const localRecords = [];
  const centralRecords = [];
  let localOffset = 0;

  for (const { name, data = Buffer.alloc(0) } of entries) {
    const nameBuffer = Buffer.from(name);
    const content = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const local = Buffer.alloc(30 + nameBuffer.length + content.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    nameBuffer.copy(local, 30);
    content.copy(local, 30 + nameBuffer.length);
    localRecords.push(local);

    const central = Buffer.alloc(46 + nameBuffer.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(content.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(localOffset, 42);
    nameBuffer.copy(central, 46);
    centralRecords.push(central);
    localOffset += local.length;
  }

  const centralSize = centralRecords.reduce((size, record) => size + record.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localRecords, ...centralRecords, eocd]);
}

describe('quality policy primitives', () => {
  it('walks files deterministically and ignores declared directories', async () => {
    const root = await temporaryTree();
    await mkdir(path.join(root, 'ignored'));
    await writeFile(path.join(root, 'ignored', 'secret.txt'), 'not scanned');

    expect(await walkFiles(root, { ignoredNames: new Set(['ignored']) })).toEqual([
      path.join(root, 'clean.txt'),
      path.join(root, 'nested', 'page.html'),
    ]);
  });

  it('finds forbidden paths, private host coordinates, and credential shapes', () => {
    expect(
      pathViolations([
        'src/index.ts',
        [['back', 'log'].join(''), 'plan.md'].join('/'),
        ['src', ['.cla', 'ude'].join(''), 'settings.json'].join('/'),
        ['src', ['re', 'search'].join(''), 'notes.md'].join('/'),
        ['config', '.env.local'].join('/'),
        ['.github', 'instructions', 'course.instructions.md'].join('/'),
        ['.github', 'agents', 'review.agent.md'].join('/'),
        ['.github', 'skills', 'private', 'SKILL.md'].join('/'),
        ['.github', 'hooks', 'private.json'].join('/'),
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'backlog/plan.md' }),
        expect.objectContaining({ path: 'src/.claude/settings.json' }),
        expect.objectContaining({ path: 'src/research/notes.md' }),
        expect.objectContaining({ path: 'config/.env.local' }),
        expect.objectContaining({ path: '.github/instructions/course.instructions.md' }),
        expect.objectContaining({ path: '.github/agents/review.agent.md' }),
        expect.objectContaining({ path: '.github/skills/private/SKILL.md' }),
        expect.objectContaining({ path: '.github/hooks/private.json' }),
      ]),
    );
    expect(contentViolations(['/Users', 'person', 'project'].join('/'))).toContainEqual(
      expect.objectContaining({ rule: 'private host path' }),
    );
    expect(contentViolations('/home/runner/work/cuda-learning-site/cuda-learning-site/dist')).toEqual([]);
    expect(contentViolations(['ghp', 'abcdefghijklmnopqrstuvwxyz123456'].join('_'))).toContainEqual(
      expect.objectContaining({ rule: 'GitHub token' }),
    );
    expect(contentViolations(['github', 'pat', 'abcdefghijklmnopqrstuvwxyz123456'].join('_'))).toContainEqual(
      expect.objectContaining({ rule: 'GitHub fine-grained token' }),
    );
    expect(contentViolations(['npm', 'abcdefghijklmnopqrstuvwxyz1234567890'].join('_'))).toContainEqual(
      expect.objectContaining({ rule: 'npm token' }),
    );
  });

  it('accepts clean artifacts and rejects forbidden artifact content', async () => {
    const root = await temporaryTree();
    await expect(scanDirectory(root)).resolves.toEqual({ filesScanned: 2, violations: [] });

    await writeFile(path.join(root, 'nested', 'leak.txt'), ['Private', 'Maintainer', 'Material'].join(' '));
    const result = await scanDirectory(root);
    expect(result.violations).toContainEqual(expect.objectContaining({ rule: 'private governance phrase' }));
  });

  it('rejects symbolic links and files beyond the artifact scan boundary', async () => {
    const root = await temporaryTree();
    await symlink(path.join(root, 'clean.txt'), path.join(root, 'linked.txt'));
    await writeFile(path.join(root, 'oversized.bin'), '');
    await truncate(path.join(root, 'oversized.bin'), 50 * 1024 * 1024 + 1);

    const result = await scanDirectory(root);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'linked.txt', rule: expect.stringContaining('symbolic links') }),
        expect.objectContaining({ path: 'oversized.bin', rule: expect.stringContaining('50 MiB') }),
      ]),
    );
  });

  it('opens ZIP artifacts and scans their entry content', async () => {
    const root = await temporaryTree();
    const privateTrace = createZip([{ name: 'trace.txt', data: ['/Users', 'person', 'trace'].join('/') }]);
    await writeFile(path.join(root, 'trace.zip'), privateTrace);
    await writeFile(path.join(root, 'nested.zip'), createZip([{ name: 'inner.zip', data: privateTrace }]));

    const result = await scanDirectory(root);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'trace.zip!/trace.txt', rule: 'private host path' }),
        expect.objectContaining({ path: 'nested.zip!/inner.zip!/trace.txt', rule: 'private host path' }),
      ]),
    );
  });

  it('applies the artifact policy directly to downloaded ZIP buffers', () => {
    const clean = createZip([{ name: 'public/readme.txt', data: 'public content' }]);
    const privateTrace = createZip([{ name: 'trace.txt', data: ['/Users', 'person', 'trace'].join('/') }]);

    expect(scanZipArchive(clean, 'download.zip')).toEqual([]);
    expect(scanZipArchive(privateTrace, 'download.zip')).toContainEqual({
      path: 'download.zip!/trace.txt',
      rule: 'private host path',
      match: ['/Users', 'person', 'trace'].join('/'),
    });
    expect(scanArtifactBuffer(Buffer.from(['Bearer', 'abcdefghijklmnopqrstuv'].join(' ')), 'response.html'))
      .toContainEqual(expect.objectContaining({ path: 'response.html', rule: 'bearer credential' }));
  });

  it('rejects forbidden ZIP paths and malformed ZIP files', async () => {
    const root = await temporaryTree();
    await writeFile(
      path.join(root, 'paths.zip'),
      createZip([
        { name: `${['re', 'search'].join('')}/` },
        { name: `${['re', 'search'].join('')}/notes.txt`, data: 'content' },
      ]),
    );
    await writeFile(path.join(root, 'broken.zip'), 'not a zip');

    const result = await scanDirectory(root);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: expect.stringContaining('paths.zip!/research'), rule: expect.stringContaining('forbidden path') }),
        expect.objectContaining({ path: 'broken.zip', rule: expect.stringContaining('inspection failed') }),
      ]),
    );
  });

  it('accepts metadata-free PNGs and rejects metadata or malformed chunks', async () => {
    const root = await temporaryTree();
    await writeFile(path.join(root, 'clean.png'), png(pngChunk('IEND')));
    await writeFile(path.join(root, 'metadata.png'), png(pngChunk('tEXt', Buffer.from('author=private')), pngChunk('IEND')));
    await writeFile(path.join(root, 'bad-signature.png'), 'not a png');
    const malformed = png(pngChunk('IDAT'));
    malformed.writeUInt32BE(999, 8);
    await writeFile(path.join(root, 'bad-chunk.png'), malformed);

    const result = await scanDirectory(root);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'metadata.png', rule: expect.stringContaining('metadata chunk') }),
        expect.objectContaining({ path: 'bad-signature.png', rule: 'invalid PNG signature' }),
        expect.objectContaining({ path: 'bad-chunk.png', rule: 'invalid PNG chunk length' }),
      ]),
    );
    expect(result.violations.some(({ path: file }) => file === 'clean.png')).toBe(false);
  });
});

describe('lockfile review', () => {
  const manifest = {
    dependencies: { astro: '7.2.4' },
    devDependencies: { vitest: '4.1.11' },
  };

  function validLockfile() {
    return {
      lockfileVersion: 3,
      packages: {
        '': {
          dependencies: manifest.dependencies,
          devDependencies: manifest.devDependencies,
        },
        'node_modules/astro': {
          version: '7.2.4',
          resolved: 'https://registry.npmjs.org/astro/-/astro-7.2.4.tgz',
          integrity: 'sha512-example',
          license: 'MIT',
        },
      },
    };
  }

  it('accepts an exact registry lockfile', () => {
    expect(reviewLockfile(validLockfile(), manifest)).toEqual({
      errors: [],
      summary: expect.objectContaining({ packageRecords: 1, bundledPackages: 0 }),
    });
  });

  it.each([
    ['unsupported lock format', (lockfile) => (lockfile.lockfileVersion = 2), 'lockfileVersion'],
    ['missing root record', (lockfile) => delete lockfile.packages[''], 'root package record'],
    ['production dependency drift', (lockfile) => (lockfile.packages[''].dependencies = {}), 'production dependencies'],
    ['development dependency drift', (lockfile) => (lockfile.packages[''].devDependencies = {}), 'development dependencies'],
    ['mutable source', (lockfile) => (lockfile.packages['node_modules/astro'].resolved = 'git+https://example.test/repo.git'), 'registry source'],
    ['missing version', (lockfile) => delete lockfile.packages['node_modules/astro'].version, 'version is missing'],
    ['missing integrity', (lockfile) => delete lockfile.packages['node_modules/astro'].integrity, 'integrity'],
    ['unreviewed license', (lockfile) => (lockfile.packages['node_modules/astro'].license = 'UNKNOWN'), 'license'],
    ['bundled package', (lockfile) => (lockfile.packages['node_modules/astro'].inBundle = true), 'bundled'],
    ['local link', (lockfile) => (lockfile.packages['node_modules/astro'].link = true), 'local link'],
    ['unreviewed install script', (lockfile) => (lockfile.packages['node_modules/astro'].hasInstallScript = true), 'install script'],
  ])('rejects %s', (_name, mutate, expectedMessage) => {
    const lockfile = validLockfile();
    mutate(lockfile);
    expect(reviewLockfile(lockfile, manifest).errors.join('\n')).toContain(expectedMessage);
  });
});
