// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  hashCanonicalBuildContract,
  loadCanonicalExample,
  validateCompileEvidenceRecord,
} from './lib/canonical-examples.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error('Arguments must use --name value pairs.');
    }
    values[key.slice(2)] = value;
  }
  return values;
}

function run(command, args, options = {}) {
  const { quiet = false, ...spawnOptions } = options;
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...spawnOptions,
  });
  if (!quiet && result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
  return result.stdout.trim();
}

function selectVersion(output, pattern, label) {
  const line = output.split(/\r?\n/).find((candidate) => pattern.test(candidate));
  if (!line) throw new Error(`Could not read ${label} from the declared container.`);
  return line;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseOsRelease(content) {
  const fields = {};
  for (const line of content.split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match) fields[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return {
    id: fields.ID,
    versionId: fields.VERSION_ID,
    prettyName: fields.PRETTY_NAME,
  };
}

function compactLines(content, label) {
  if (content.length > 8 * 1024) throw new Error(`${label} is too large for compact evidence.`);
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.some((line) => /[^\x20-\x7e]/.test(line))) {
    throw new Error(`${label} contains non-printable evidence.`);
  }
  return lines;
}

function parseInventory(content, type, label) {
  const entries = compactLines(content, label).map((line) => {
    const match = new RegExp(`^${type} file\\s+(\\d+):\\s+([A-Za-z0-9._+-]+)$`).exec(line);
    if (!match) throw new Error(`${label} contains an unexpected entry: ${line}`);
    return { index: Number(match[1]), file: match[2] };
  });
  if (entries.length === 0) throw new Error(`${label} is empty.`);
  return entries;
}

function parseFacts(content, label, numeric = false) {
  const facts = {};
  for (const line of compactLines(content, label)) {
    const match = /^([a-z0-9-]+)=([A-Za-z0-9+._-]+)$/.exec(line);
    if (!match || Object.hasOwn(facts, match?.[1])) {
      throw new Error(`${label} contains an unexpected or duplicate fact: ${line}`);
    }
    facts[match[1]] = numeric ? Number(match[2]) : match[2];
    if (numeric && (!Number.isSafeInteger(facts[match[1]]) || facts[match[1]] !== 0)) {
      throw new Error(`${label} contains a nonzero or invalid exit status: ${line}`);
    }
  }
  return facts;
}

function requireSymbolLine(content, expected, label) {
  const lines = compactLines(content, label).map((line) => line.replace(/\s+/g, ' '));
  if (lines.filter((line) => line === expected).length !== 1) {
    throw new Error(`${label} does not contain exactly one ${expected} entry.`);
  }
  return expected;
}

function parseArtifactHash(content, expectedPath, label) {
  const lines = compactLines(content, label);
  if (lines.length !== 1) throw new Error(`${label} must contain exactly one hash entry.`);
  const match = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(lines[0]);
  if (!match || match[2] !== expectedPath) throw new Error(`${label} does not identify ${expectedPath}.`);
  return { path: expectedPath, sha256: match[1] };
}

function declaredRepositoryDigest(lane) {
  const referenceWithoutDigest = lane.image.split('@')[0];
  const lastSlash = referenceWithoutDigest.lastIndexOf('/');
  const lastColon = referenceWithoutDigest.lastIndexOf(':');
  const repository = lastColon > lastSlash
    ? referenceWithoutDigest.slice(0, lastColon)
    : referenceWithoutDigest;
  return `${repository}@${lane.manifestDigest}`;
}

async function hashFile(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function describeArtifacts(exampleRoot, paths) {
  return Promise.all(paths.map(async (relativePath) => {
    const file = path.join(exampleRoot, relativePath);
    const details = await stat(file);
    return {
      path: relativePath,
      bytes: details.size,
      sha256: await hashFile(file),
    };
  }));
}

async function inspectOrdinaryArtifacts(resultRoot) {
  const [report, ptxList, elfList, linkedElfList, ptxDump, sassDump, callerSymbols,
    deviceLinkSymbols, exitStatuses] = await Promise.all([
    readFile(path.join(resultRoot, 'artifact-test-report.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-ptx-list.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-elf-list.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-linked-elf-list.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-ptx.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-sass.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'caller-symbols.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'device-link-symbols.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'exit-statuses.txt'), 'utf8'),
  ]);
  const artifactTestReport = parseFacts(report, 'EX10 artifact-test report');
  if (artifactTestReport['artifact-test'] !== 'pass' ||
      artifactTestReport['caller-ex10-device-scale'] !== 'undefined' ||
      artifactTestReport['device-link-ex10-device-scale'] !== 'defined' ||
      artifactTestReport['host-executable-executed'] !== 'false' ||
      artifactTestReport['gpu-executable-executed'] !== 'false' ||
      artifactTestReport['runtime-evidence'] !== 'Runtime-Not-Applicable') {
    throw new Error('EX10 artifact-test report does not preserve the execution boundary.');
  }
  const inventories = {
    ptx: parseInventory(ptxList, 'PTX', 'EX10 PTX inventory'),
    elf: parseInventory(elfList, 'ELF', 'EX10 ELF inventory'),
    linkedElf: parseInventory(linkedElfList, 'ELF', 'EX10 linked ELF inventory'),
  };
  if (!/\.target\s+sm_75/.test(ptxDump) || !/artifact_kernel/.test(sassDump)) {
    throw new Error('EX10 inspection outputs do not contain the declared sm_75 and compute_75 images.');
  }
  const callerUndefined = requireSymbolLine(
    callerSymbols,
    'STT_FUNC STB_GLOBAL STV_DEFAULT U ex10_device_scale',
    'EX10 caller.o symbols',
  );
  requireSymbolLine(
    callerSymbols,
    'STT_FUNC STB_GLOBAL STO_ENTRY ex10_caller_kernel',
    'EX10 caller.o symbols',
  );
  const deviceLinkDefined = requireSymbolLine(
    deviceLinkSymbols,
    'STT_FUNC STB_GLOBAL STV_DEFAULT ex10_device_scale',
    'EX10 device_link.o symbols',
  );
  return {
    inventories,
    artifactTestReport,
    symbols: { callerUndefined, deviceLinkDefined },
    exitStatuses: parseFacts(exitStatuses, 'EX10 exit statuses', true),
  };
}

const args = parseArguments(process.argv.slice(2));
for (const required of ['check', 'toolkit-lane', 'dialect', 'kind', 'image']) {
  if (!args[required]) throw new Error(`Missing --${required}`);
}
if (!/^[a-z0-9-]+$/.test(args.check)) throw new Error('Invalid check identifier.');
if (!['ex10', 'cxx23-probe'].includes(args.kind)) {
  throw new Error(`Unknown check kind: ${args.kind}`);
}

const example = await loadCanonicalExample(projectRoot, 'EX10');
const exampleRoot = path.join(projectRoot, example.root);
const declaredCheck = example.compatibility.checks.find((candidate) => candidate.id === args.check);
if (!declaredCheck) throw new Error(`Unknown EX10 check: ${args.check}`);
if (declaredCheck.toolkitLane !== args['toolkit-lane'] ||
    declaredCheck.dialect !== args.dialect || declaredCheck.kind !== args.kind) {
  throw new Error('Workflow check does not match the declared Toolkit Lane, dialect, and kind.');
}
const lane = example.compatibility.lanes.find((candidate) => candidate.id === declaredCheck.toolkitLane);
const probe = args.kind === 'cxx23-probe'
  ? example.compatibility.probes.find((candidate) =>
      candidate.toolkitLane === declaredCheck.toolkitLane && candidate.dialect === declaredCheck.dialect)
  : null;
if (!lane) throw new Error(`Unknown Toolkit Lane: ${args['toolkit-lane']}`);
if (args.image !== lane.image) throw new Error('Workflow image does not match the EX10 manifest.');
if (args.kind === 'ex10' && !lane.dialects.includes(args.dialect)) {
  throw new Error(`${args.dialect} is not declared for ${lane.id}`);
}
if (args.kind === 'cxx23-probe' && !probe) {
  throw new Error('The EX10 C++23 probe is declared only for the CUDA 13.3 GCC 14 environment.');
}

const resultRoot = path.join(projectRoot, 'artifacts/cuda-ex10', args.check);
await rm(resultRoot, { recursive: true, force: true });
await mkdir(resultRoot, { recursive: true });

run('docker', ['pull', '--platform', 'linux/amd64', lane.image]);
const baseInspection = JSON.parse(run('docker', ['image', 'inspect', lane.image], { quiet: true }))[0];
const baseRepoDigests = baseInspection.RepoDigests ?? [];
const expectedRepoDigest = declaredRepositoryDigest(lane);
if (!baseRepoDigests.includes(expectedRepoDigest)) {
  throw new Error(`Pulled image does not expose the declared repository digest ${expectedRepoDigest}.`);
}
const imageIndex = JSON.parse(run(
  'docker',
  ['buildx', 'imagetools', 'inspect', '--raw', lane.image],
  { quiet: true },
));
const actualAmd64Digest = imageIndex.manifests?.find(
  (manifest) => manifest.platform?.os === 'linux' && manifest.platform?.architecture === 'amd64',
)?.digest;
if (actualAmd64Digest !== lane.amd64Digest) {
  throw new Error(`Resolved amd64 digest ${actualAmd64Digest ?? 'missing'} does not match ${lane.amd64Digest}.`);
}

let runtimeImage = lane.image;
let runtimeInspection = baseInspection;
let hostCompilerExecutable = 'g++';
let hostCompilerPackage = null;
if (args.kind === 'cxx23-probe') {
  const dockerfile = path.join(exampleRoot, probe.image.dockerfile);
  const dockerfileSource = await readFile(dockerfile, 'utf8');
  if (!dockerfileSource.includes(`FROM ${lane.image}`)) {
    throw new Error('The C++23 probe Dockerfile must derive from the exact pinned CUDA 13.3.1 image.');
  }
  if (dockerfileSource.includes('--allow-unsupported-compiler')) {
    throw new Error('The C++23 probe may not bypass NVCC host compiler checks.');
  }
  run('docker', [
    'build',
    '--platform',
    'linux/amd64',
    '--file',
    `${example.root}/${probe.image.dockerfile}`,
    '--tag',
    probe.image.tag,
    example.root,
  ]);
  runtimeImage = probe.image.tag;
  runtimeInspection = JSON.parse(run(
    'docker',
    ['image', 'inspect', runtimeImage],
    { quiet: true },
  ))[0];
  hostCompilerExecutable = probe.hostCompilerExecutable;
}

const uid = typeof process.getuid === 'function' ? `${process.getuid()}:${process.getgid()}` : '1000:1000';
const isolatedRun = [
  'run',
  '--platform',
  'linux/amd64',
  '--rm',
  '--network',
  'none',
  '--user',
  uid,
  '--env',
  'HOME=/tmp',
];
const containerCommand = (image, ...command) => [
  ...isolatedRun,
  image,
  ...command,
];

if (probe) {
  const packageOutput = run('docker', containerCommand(
    runtimeImage,
    'dpkg-query',
    '--show',
    '--showformat=${Package}=${Version}',
    probe.hostCompilerPackage,
  ), { quiet: true });
  hostCompilerPackage = selectVersion(
    packageOutput,
    new RegExp(`^${escapeRegExp(probe.hostCompilerPackage)}=`),
    'host compiler package version',
  );
}

const osRelease = run('docker', containerCommand(runtimeImage, 'cat', '/etc/os-release'), { quiet: true });
const hostCompilerOutput = run(
  'docker',
  containerCommand(runtimeImage, hostCompilerExecutable, '--version'),
  { quiet: true },
);
const nvccOutput = run('docker', containerCommand(runtimeImage, 'nvcc', '--version'), { quiet: true });
const cuobjdumpOutput = run('docker', containerCommand(runtimeImage, 'cuobjdump', '--version'), { quiet: true });
const nmOutput = run('docker', containerCommand(runtimeImage, 'nm', '--version'), { quiet: true });
const hostCompiler = selectVersion(
  hostCompilerOutput,
  /^g\+\+(?:-14)? /,
  'host compiler version',
);
const nvcc = selectVersion(nvccOutput, /^Cuda compilation tools,/, 'NVCC version');
const cuobjdump = [
  selectVersion(cuobjdumpOutput, /^cuobjdump:/, 'cuobjdump identity'),
  selectVersion(cuobjdumpOutput, /^Cuda compilation tools,/, 'cuobjdump version'),
].join('; ');
const nm = selectVersion(nmOutput, /^GNU nm /, 'GNU nm version');
const dockerEngine = run('docker', ['version', '--format', '{{.Server.Version}}'], { quiet: true });
const dockerBuildx = run('docker', ['buildx', 'version'], { quiet: true });

run('docker', [
  ...isolatedRun,
  ...(probe ? ['--env', `HOST_CXX=${probe.hostCompilerExecutable}`] : []),
  '--volume',
  `${projectRoot}:/workspace`,
  '--workdir',
  `/workspace/${example.root}`,
  runtimeImage,
  'bash',
  'scripts/compile-check.sh',
  args.dialect,
  args.kind,
  `/workspace/artifacts/cuda-ex10/${args.check}`,
]);

let inspection;
if (args.kind === 'ex10') {
  inspection = await inspectOrdinaryArtifacts(resultRoot);
} else {
  const [probeElfList, exitStatuses, compilerOutput, artifactHash] = await Promise.all([
    readFile(path.join(resultRoot, 'cuobjdump-elf-list.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'exit-statuses.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'compile.log'), 'utf8'),
    readFile(path.join(resultRoot, 'artifact-sha256.txt'), 'utf8'),
  ]);
  inspection = {
    inventories: {
      elf: parseInventory(probeElfList, 'ELF', 'EX10 C++23 probe ELF inventory'),
    },
    compilerOutput: compactLines(compilerOutput, 'EX10 C++23 probe compiler output'),
    artifactHash: parseArtifactHash(
      artifactHash,
      'build/cxx23_probe.o',
      'EX10 C++23 probe artifact hash',
    ),
    exitStatuses: parseFacts(exitStatuses, 'EX10 C++23 probe exit statuses', true),
  };
}

const artifactPaths = args.kind === 'ex10' ? example.build.artifacts : probe.artifacts;
const sourceCommit = run('git', ['rev-parse', 'HEAD'], { quiet: true });
const workflowRun = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;
const record = {
  'SPDX-License-Identifier': 'Apache-2.0',
  schemaVersion: 1,
  result: 'pass',
  claim: args.kind === 'ex10' ? 'Compile-Checked' : probe.claim,
  subject: args.kind === 'ex10' ? 'EX10' : probe.subject,
  check: args.check,
  sourceCommit,
  buildContractSha256: await hashCanonicalBuildContract(projectRoot, 'EX10'),
  verificationDate: process.env.VERIFICATION_DATE || new Date().toISOString().slice(0, 10),
  workflowRun,
  runner: {
    operatingSystem: process.env.RUNNER_OS || process.platform,
    architecture: process.env.RUNNER_ARCH || process.arch,
    imageOS: process.env.ImageOS || null,
    imageVersion: process.env.ImageVersion || null,
    dockerEngine,
    dockerBuildx,
  },
  container: {
    declaredReference: lane.image,
    manifestDigest: lane.manifestDigest,
    expectedAmd64Digest: lane.amd64Digest,
    actualAmd64Digest,
    actualImageId: runtimeInspection.Id,
    actualRepoDigests: runtimeInspection.RepoDigests ?? [],
    operatingSystem: parseOsRelease(osRelease),
    ...(probe ? {
      baseImage: {
        actualImageId: baseInspection.Id,
        actualRepoDigests: baseInspection.RepoDigests ?? [],
      },
      derivedImage: {
        dockerfile: probe.image.dockerfile,
        buildCommand: probe.image.buildCommand,
        tag: probe.image.tag,
        hostCompilerPackage,
      },
    } : {}),
  },
  toolchain: {
    toolkit: lane.toolkit,
    hostCompiler,
    nvcc,
    cuobjdump,
    nm,
    dialect: args.dialect,
    target: example.compatibility.target,
  },
  commands: args.kind === 'ex10'
    ? Object.values(example.build.commands).map((command) => command.replace('{dialect}', args.dialect))
    : probe.commands,
  artifacts: await describeArtifacts(exampleRoot, artifactPaths),
  inspection,
  hostReferenceExecuted: false,
  hostExecutableExecuted: false,
  gpuExecutableExecuted: false,
  runtimeEvidence: 'Runtime-Not-Applicable',
};

const recordErrors = await validateCompileEvidenceRecord(projectRoot, 'EX10', record, {
  expectedSourceCommit: sourceCommit,
  expectedWorkflowRun: workflowRun,
});
if (recordErrors.length > 0) {
  console.error(JSON.stringify({
    subject: record.subject,
    container: record.container,
    hostCompiler: record.toolchain.hostCompiler,
  }, null, 2));
  throw new Error(`Generated EX10 evidence is invalid: ${recordErrors.join('; ')}`);
}
await writeFile(path.join(resultRoot, 'record.json'), `${JSON.stringify(record, null, 2)}\n`);
console.log(`EX10 compile evidence written to artifacts/cuda-ex10/${args.check}/record.json`);
