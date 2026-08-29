// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
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

export async function hashCanonicalBuildContract(projectRoot, exampleId) {
  const example = await loadCanonicalExample(projectRoot, exampleId);
  const exampleRoot = path.join(projectRoot, example.root);
  const files = [...new Set([
    ...example.build.inputs,
    ...example.build.hostTestInputs,
    ...example.build.contractFiles,
    ...(example.build.additionalContractInputs ?? []),
  ])].sort();
  const hash = createHash('sha256');
  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(await readFile(resolveInside(exampleRoot, relativePath)));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function sameValues(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export async function validateCompileEvidenceRecord(projectRoot, exampleId, record) {
  const example = await loadCanonicalExample(projectRoot, exampleId);
  const errors = [];
  const isExample = record?.subject === exampleId;
  const declaredProbe = (example.compatibility.probes ?? []).find(
    (candidate) => candidate.subject === record?.subject,
  );
  const isLegacyProbe = record?.subject === 'CUDA-13.3-CXX23-PROBE';
  const isProbe = Boolean(declaredProbe) || isLegacyProbe;
  const lane = declaredProbe
    ? example.compatibility.lanes.find((candidate) => candidate.id === declaredProbe.toolkitLane)
    : example.compatibility.lanes.find(
        (candidate) => candidate.toolkit === record?.toolchain?.toolkit,
      );
  const expectedCommands = isExample && lane
    ? Object.values(example.build.commands).map((command) =>
        command.replace('{dialect}', record.toolchain.dialect),
      )
    : declaredProbe?.commands ?? [
        'nvcc --help',
        'nvcc --std=c++23 --generate-code=arch=compute_75,code=sm_75 --generate-code=arch=compute_75,code=compute_75 --compile probes/cxx23.cu -o build/cxx23_probe.o',
      ];
  const expectedArtifacts = isExample
    ? example.build.artifacts
    : declaredProbe?.artifacts ?? (record?.result === 'pass' ? ['build/cxx23_probe.o'] : []);

  if (record?.['SPDX-License-Identifier'] !== 'Apache-2.0' || record?.schemaVersion !== 1) {
    errors.push('record schema and SPDX declaration are invalid');
  }
  const validResult = isExample
    ? record?.result === 'pass'
    : Boolean(declaredProbe
      ? declaredProbe.allowedResults.includes(record?.result)
      : isLegacyProbe && ['pass', 'unsupported'].includes(record?.result));
  if (!validResult) errors.push('record subject or result is invalid');
  if (isExample && record?.claim !== 'Compile-Checked') errors.push(`${exampleId} record has an invalid claim`);
  if (isProbe && record?.claim !== (declaredProbe?.claim ?? 'C++23-Dialect-Probe')) {
    errors.push('C++23 probe record has an invalid claim');
  }
  if (isProbe && record?.result === 'unsupported' && !record?.probeDiagnostic) {
    errors.push('unsupported C++23 probe requires a diagnostic');
  }
  if (!/^[0-9a-f]{40}$/.test(record?.sourceCommit ?? '')) errors.push('source commit is not a full Git SHA');
  if (record?.buildContractSha256 !== await hashCanonicalBuildContract(projectRoot, exampleId)) {
    errors.push('build contract hash does not match the canonical project');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record?.verificationDate ?? '')) errors.push('verification date is invalid');
  if (!/^https:\/\/github\.com\/xiangzhang-coding\/cuda-learning-site\/actions\/runs\/\d+$/.test(record?.workflowRun ?? '')) {
    errors.push('workflow run URL is invalid');
  }
  if (record?.runner?.architecture !== 'X64' || !record?.runner?.imageOS || !record?.runner?.imageVersion) {
    errors.push('runner coordinates are incomplete');
  }
  if (!record?.runner?.dockerEngine || !record?.runner?.dockerBuildx) {
    errors.push('Docker and Buildx versions are incomplete');
  }
  if (!lane) {
    errors.push('Toolkit Lane is not declared');
  } else {
    const expectedOsVersion = /Ubuntu ([0-9.]+)/.exec(lane.operatingSystem)?.[1];
    if (record?.container?.declaredReference !== lane.image ||
        record?.container?.manifestDigest !== lane.manifestDigest ||
        record?.container?.expectedAmd64Digest !== lane.amd64Digest ||
        record?.container?.actualAmd64Digest !== lane.amd64Digest) {
      errors.push('container coordinates do not match the declared Toolkit Lane');
    }
    const actualImageIdIsValid = /^sha256:[0-9a-f]{64}$/.test(record?.container?.actualImageId ?? '');
    const actualRepoDigests = record?.container?.actualRepoDigests;
    const derivedImage = record?.container?.derivedImage;
    const baseImage = record?.container?.baseImage;
    const packagePrefix = declaredProbe ? `${declaredProbe.hostCompilerPackage}=` : null;
    const ordinaryIdentityIsComplete = actualImageIdIsValid &&
      Array.isArray(actualRepoDigests) && actualRepoDigests.length > 0;
    const derivedIdentityIsComplete = actualImageIdIsValid &&
      Array.isArray(actualRepoDigests) &&
      /^sha256:[0-9a-f]{64}$/.test(baseImage?.actualImageId ?? '') &&
      Array.isArray(baseImage?.actualRepoDigests) &&
      derivedImage?.dockerfile === declaredProbe?.image?.dockerfile &&
      derivedImage?.buildCommand === declaredProbe?.image?.buildCommand &&
      derivedImage?.tag === declaredProbe?.image?.tag &&
      packagePrefix !== null &&
      typeof derivedImage?.hostCompilerPackage === 'string' &&
      derivedImage.hostCompilerPackage.startsWith(packagePrefix) &&
      derivedImage.hostCompilerPackage.length > packagePrefix.length &&
      !/\s/.test(derivedImage.hostCompilerPackage);
    if (declaredProbe?.image ? !derivedIdentityIsComplete : !ordinaryIdentityIsComplete) {
      errors.push('actual container identity is incomplete');
    }
    if (record?.container?.operatingSystem?.id !== 'ubuntu' ||
        record?.container?.operatingSystem?.versionId !== expectedOsVersion) {
      errors.push('actual container operating system does not match the Lane');
    }
    if (isExample && !lane.dialects.includes(record?.toolchain?.dialect)) {
      errors.push(`${exampleId} dialect is not declared for the Lane`);
    }
    const declaredProbeMatches = declaredProbe &&
      lane.id === declaredProbe.toolkitLane &&
      record?.toolchain?.toolkit === lane.toolkit &&
      record?.toolchain?.dialect === declaredProbe.dialect;
    const legacyProbeMatches = isLegacyProbe && lane.cxx23Probe &&
      record?.toolchain?.dialect === 'c++23';
    if (isProbe && !(declaredProbeMatches || legacyProbeMatches)) {
      errors.push('C++23 probe is not declared for the Lane');
    }
  }
  if (!record?.toolchain?.hostCompiler || !record?.toolchain?.nvcc || !record?.toolchain?.cuobjdump ||
      (exampleId === 'EX10' && !record?.toolchain?.nm)) {
    errors.push('toolchain coordinates are incomplete');
  }
  if ([record?.toolchain?.hostCompiler, record?.toolchain?.nvcc, record?.toolchain?.cuobjdump, record?.toolchain?.nm]
      .some((coordinate) => coordinate?.includes('\n'))) {
    errors.push('toolchain coordinates must be sanitized version lines');
  }
  const probeCompilerMajor = /g\+\+-(\d+)$/.exec(declaredProbe?.hostCompilerExecutable ?? '')?.[1];
  if (probeCompilerMajor && !new RegExp(`\\b${probeCompilerMajor}\\.`).test(record?.toolchain?.hostCompiler ?? '')) {
    errors.push('C++23 probe host compiler does not match the declared compiler');
  }
  if (!sameValues(record?.toolchain?.target, example.compatibility.target)) errors.push('compiler target is invalid');
  if (!sameValues(record?.commands, expectedCommands)) errors.push('compile commands do not match the build contract');
  if (record?.commands?.some((command) => command.includes('--allow-unsupported-compiler'))) {
    errors.push('unsupported host compiler bypass is forbidden');
  }
  if (!sameValues(record?.artifacts?.map(({ path: artifactPath }) => artifactPath), expectedArtifacts) ||
      record?.artifacts?.some(({ bytes, sha256 }) =>
        !Number.isSafeInteger(bytes) || bytes <= 0 || !/^[0-9a-f]{64}$/.test(sha256))) {
    errors.push('artifact records are incomplete or unexpected');
  }
  const expectedHostReferenceExecution = isExample && Boolean(example.build.commands.hostTest);
  const expectedHostExecutableExecution = isExample
    ? example.evidence.hostExecutableExecuted
    : declaredProbe?.hostExecutableExecuted;
  const hostExecutableBoundaryIsValid = expectedHostExecutableExecution === undefined ||
    record?.hostExecutableExecuted === expectedHostExecutableExecution;
  if (record?.gpuExecutableExecuted !== false ||
      record?.hostReferenceExecuted !== expectedHostReferenceExecution ||
      !hostExecutableBoundaryIsValid) {
    errors.push('execution boundary is invalid');
  }
  const expectedRuntime = isExample
    ? example.evidence.runtime
    : declaredProbe?.runtime ?? 'Runtime-Not-Applicable';
  if (record?.runtimeEvidence !== expectedRuntime) errors.push('runtime evidence boundary is invalid');
  return errors;
}

export async function loadCompileEvidence(projectRoot, exampleId) {
  const example = await loadCanonicalExample(projectRoot, exampleId);
  const evidenceRoot = path.join(projectRoot, example.root, 'evidence');
  const files = (await readdir(evidenceRoot)).filter((file) => file.endsWith('.json')).sort();
  const compilationEntries = example.evidence?.compilation ?? [];
  const compilationFiles = compilationEntries.map(({ record }) => path.basename(record));
  const probeFile = example.evidence?.dialectProbe
    ? path.basename(example.evidence.dialectProbe)
    : null;
  const declaredFiles = [...compilationFiles, ...(probeFile ? [probeFile] : [])].sort();
  if (!sameValues(files, declaredFiles)) {
    throw new Error(`${exampleId} evidence files do not match its project manifest`);
  }
  if (compilationEntries.some(({ status }) => status !== 'Compile-Checked')) {
    throw new Error(`${exampleId} compilation evidence has an invalid status`);
  }

  const records = [];
  for (const file of files) {
    const record = JSON.parse(await readFile(path.join(evidenceRoot, file), 'utf8'));
    const errors = await validateCompileEvidenceRecord(projectRoot, exampleId, record);
    if (errors.length > 0) throw new Error(`${file}: ${errors.join('; ')}`);
    if (compilationFiles.includes(file) && record.subject !== exampleId) {
      throw new Error(`${file}: compilation evidence must describe ${exampleId}`);
    }
    if (file === probeFile && record.subject === exampleId) {
      throw new Error(`${file}: dialect probe must remain separate from ordinary compilation evidence`);
    }
    records.push(record);
  }
  if (records.length > 0) {
    const sourceCommits = new Set(records.map((record) => record.sourceCommit));
    const checks = new Set(records.map((record) => record.check));
    if (sourceCommits.size !== 1) throw new Error(`${exampleId} evidence records reference different source commits`);
    if (checks.size !== records.length) throw new Error(`${exampleId} evidence records duplicate a check`);
    const [sourceCommit] = sourceCommits;
    if (example.sourceCommit && example.sourceCommit !== sourceCommit) {
      throw new Error(`${exampleId} source commit does not match its evidence records`);
    }
    if (!example.sourceUrl.includes(sourceCommit)) {
      throw new Error(`${exampleId} source URL does not resolve to its evidence commit`);
    }
    if (!example.downloadUrl?.includes(sourceCommit)) {
      throw new Error(`${exampleId} download URL does not resolve to its evidence commit`);
    }

    const ordinaryRecords = records.filter((record) => record.subject === exampleId);
    const expectedCoordinates = example.compatibility.lanes.flatMap((lane) =>
      lane.dialects.map((dialect) => `${lane.toolkit}\0${dialect}`),
    ).sort();
    const actualCoordinates = ordinaryRecords.map((record) =>
      `${record.toolchain.toolkit}\0${record.toolchain.dialect}`,
    ).sort();
    if (compilationEntries.length > 0 && !sameValues(actualCoordinates, expectedCoordinates)) {
      throw new Error(`${exampleId} compilation evidence does not match its declared Lane dialects`);
    }
  }
  return records;
}
