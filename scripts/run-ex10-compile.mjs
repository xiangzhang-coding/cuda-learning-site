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

async function assertOrdinaryArtifacts(resultRoot) {
  const [report, ptxList, elfList, linkedElfList, ptxDump, sassDump, ledger] = await Promise.all([
    readFile(path.join(resultRoot, 'artifact-test-report.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-ptx-list.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-elf-list.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-linked-elf-list.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-ptx.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'cuobjdump-sass.txt'), 'utf8'),
    readFile(path.join(resultRoot, 'symbol-link-ledger.txt'), 'utf8'),
  ]);
  if (!/artifact-test=pass/.test(report) ||
      !/host-executable-executed=false/.test(report) ||
      !/gpu-executable-executed=false/.test(report) ||
      !/runtime-evidence=Runtime-Not-Applicable/.test(report)) {
    throw new Error('EX10 artifact-test report does not preserve the execution boundary.');
  }
  if (!/sm_75/.test(ptxList) || !/sm_75/.test(elfList) || !/sm_75/.test(linkedElfList) ||
      !/\.target\s+sm_75/.test(ptxDump) || !/artifact_kernel/.test(sassDump)) {
    throw new Error('EX10 inspection outputs do not contain the declared sm_75 and compute_75 images.');
  }
  if (!/ex10_device_scale/.test(ledger) || !/ex10_caller_kernel/.test(ledger)) {
    throw new Error('EX10 symbol/link ledger does not show the cross-translation-unit device contract.');
  }
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
const lane = example.compatibility.lanes.find((candidate) => candidate.id === args['toolkit-lane']);
const probe = example.compatibility.probes.find((candidate) =>
  candidate.toolkitLane === args['toolkit-lane'] && candidate.dialect === args.dialect,
);
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

if (args.kind === 'ex10') {
  await assertOrdinaryArtifacts(resultRoot);
} else {
  const probeElfList = await readFile(path.join(resultRoot, 'cuobjdump-elf-list.txt'), 'utf8');
  if (!/sm_75/.test(probeElfList)) throw new Error('The C++23 probe object has no sm_75 image.');
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
  hostReferenceExecuted: false,
  hostExecutableExecuted: false,
  gpuExecutableExecuted: false,
  runtimeEvidence: 'Runtime-Not-Applicable',
};

const recordErrors = await validateCompileEvidenceRecord(projectRoot, 'EX10', record);
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
