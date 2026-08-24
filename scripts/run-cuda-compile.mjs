// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { loadCanonicalExample } from './lib/canonical-examples.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error('Arguments must use --name value pairs.');
    values[key.slice(2)] = value;
  }
  return values;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
  return result.stdout.trim();
}

function parseOsRelease(content) {
  const fields = {};
  for (const line of content.split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (!match) continue;
    fields[match[1]] = match[2].replace(/^"|"$/g, '');
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

async function hashBuildContract(exampleRoot, relativePaths) {
  const files = [...new Set(relativePaths)].sort();
  const hash = createHash('sha256');
  for (const relativePath of files) {
    const file = path.join(exampleRoot, relativePath);
    hash.update(relativePath);
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function describeArtifacts(exampleRoot, paths) {
  return Promise.all(
    paths.map(async (relativePath) => {
      const file = path.join(exampleRoot, relativePath);
      const details = await stat(file);
      return {
        path: relativePath,
        bytes: details.size,
        sha256: await hashFile(file),
      };
    }),
  );
}

const args = parseArguments(process.argv.slice(2));
for (const required of ['check', 'toolkit-lane', 'dialect', 'kind', 'image']) {
  if (!args[required]) throw new Error(`Missing --${required}`);
}
if (!/^[a-z0-9-]+$/.test(args.check)) throw new Error('Invalid check identifier.');

const example = await loadCanonicalExample(projectRoot, 'EX02');
const lane = example.compatibility.lanes.find((candidate) => candidate.id === args['toolkit-lane']);
if (!lane) throw new Error(`Unknown Toolkit Lane: ${args['toolkit-lane']}`);
if (args.image !== lane.image) throw new Error('Workflow image does not match the canonical project manifest.');
if (args.kind === 'ex02' && !lane.dialects.includes(args.dialect)) {
  throw new Error(`${args.dialect} is not declared for ${lane.id}`);
}
if (args.kind === 'cxx23-probe' && !(lane.cxx23Probe && args.dialect === 'c++23')) {
  throw new Error('The C++23 probe is declared only for the CUDA 13.3 Lane.');
}
if (!['ex02', 'cxx23-probe'].includes(args.kind)) throw new Error(`Unknown check kind: ${args.kind}`);

const resultRoot = path.join(projectRoot, '.quality/cuda', args.check);
const exampleRoot = path.join(projectRoot, example.root);
await rm(resultRoot, { recursive: true, force: true });
await mkdir(resultRoot, { recursive: true });

run('docker', ['pull', '--platform', 'linux/amd64', lane.image]);
const imageInspection = JSON.parse(run('docker', ['image', 'inspect', lane.image]))[0];
const imageIndex = JSON.parse(run('docker', ['buildx', 'imagetools', 'inspect', '--raw', lane.image]));
const actualAmd64Digest = imageIndex.manifests?.find(
  (manifest) => manifest.platform?.os === 'linux' && manifest.platform?.architecture === 'amd64',
)?.digest;
if (actualAmd64Digest !== lane.amd64Digest) {
  throw new Error(`Resolved amd64 digest ${actualAmd64Digest ?? 'missing'} does not match ${lane.amd64Digest}.`);
}
const baseDockerArgs = ['run', '--platform', 'linux/amd64', '--rm', '--network', 'none'];
const osRelease = run('docker', [...baseDockerArgs, lane.image, 'cat', '/etc/os-release']);
const hostCompiler = run('docker', [...baseDockerArgs, lane.image, 'g++', '--version']);
const nvcc = run('docker', [...baseDockerArgs, lane.image, 'nvcc', '--version']);
const cuobjdump = run('docker', [...baseDockerArgs, lane.image, 'cuobjdump', '--version']);

const uid = typeof process.getuid === 'function' ? `${process.getuid()}:${process.getgid()}` : '1000:1000';
run('docker', [
  ...baseDockerArgs,
  '--user',
  uid,
  '--env',
  'HOME=/tmp',
  '--volume',
  `${projectRoot}:/workspace`,
  '--workdir',
  `/workspace/${example.root}`,
  lane.image,
  'bash',
  'scripts/compile-check.sh',
  args.dialect,
  args.kind,
  `/workspace/.quality/cuda/${args.check}`,
]);

const artifactPaths = args.kind === 'ex02' ? example.build.artifacts : ['build/cxx23_probe.o'];
const sourceCommit = process.env.GITHUB_SHA || run('git', ['rev-parse', 'HEAD']);
const workflowRun = process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;
const commandValues = args.kind === 'ex02'
  ? Object.values(example.build.commands).map((command) => command.replace('{dialect}', args.dialect))
  : [
      'nvcc --help',
      'nvcc --std=c++23 --generate-code=arch=compute_75,code=sm_75 --generate-code=arch=compute_75,code=compute_75 --compile probes/cxx23.cu -o build/cxx23_probe.o',
    ];

const record = {
  'SPDX-License-Identifier': 'Apache-2.0',
  schemaVersion: 1,
  result: 'pass',
  claim: args.kind === 'ex02' ? 'Compile-Checked' : 'C++23-Dialect-Probe',
  subject: args.kind === 'ex02' ? 'EX02' : 'CUDA-13.3-CXX23-PROBE',
  check: args.check,
  sourceCommit,
  sourceTreeSha256: await hashBuildContract(exampleRoot, [
    ...example.build.inputs,
    ...example.build.hostTestInputs,
    ...example.build.contractFiles,
    'probes/cxx23.cu',
  ]),
  verificationDate: process.env.VERIFICATION_DATE || new Date().toISOString().slice(0, 10),
  workflowRun,
  runner: {
    operatingSystem: process.env.RUNNER_OS || process.platform,
    architecture: process.env.RUNNER_ARCH || process.arch,
    imageOS: process.env.ImageOS || null,
    imageVersion: process.env.ImageVersion || null,
  },
  container: {
    declaredReference: lane.image,
    manifestDigest: lane.manifestDigest,
    expectedAmd64Digest: lane.amd64Digest,
    actualAmd64Digest,
    actualImageId: imageInspection.Id,
    actualRepoDigests: imageInspection.RepoDigests ?? [],
    operatingSystem: parseOsRelease(osRelease),
  },
  toolchain: {
    toolkit: lane.toolkit,
    hostCompiler,
    nvcc,
    cuobjdump,
    dialect: args.dialect,
    target: example.compatibility.target,
  },
  commands: commandValues,
  artifacts: await describeArtifacts(exampleRoot, artifactPaths),
  hostReferenceExecuted: args.kind === 'ex02',
  gpuExecutableExecuted: false,
  runtimeEvidence: args.kind === 'ex02' ? 'Pending Hardware Verification' : 'Runtime-Not-Applicable',
};

await writeFile(path.join(resultRoot, 'record.json'), `${JSON.stringify(record, null, 2)}\n`);
console.log(`CUDA compile evidence written to .quality/cuda/${args.check}/record.json`);
