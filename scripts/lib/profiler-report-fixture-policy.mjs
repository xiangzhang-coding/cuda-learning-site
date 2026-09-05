// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';

export const PROFILER_FIXTURE_MANIFEST_FIELDS = Object.freeze([
  'gpuIdentity',
  'computeCapability',
  'gpuCountUsed',
  'driver',
  'toolkitLane',
  'cudaToolkit',
  'cuptiVersion',
  'profilerVersion',
  'nvcc',
  'hostCompiler',
  'operatingSystem',
  'sourceRepository',
  'binarySha256',
  'buildContract',
  'workload',
  'permissions',
  'deviceAccessState',
  'concurrentLoad',
  'clockPowerThermal',
  'exactCommands',
  'correctnessMethod',
  'correctnessCriteria',
  'measurementMethod',
  'rawLogs',
  'rawReports',
  'exitStatuses',
  'custody',
  'criteriaResult',
]);

const topLevelFields = [
  'SPDX-License-Identifier',
  'schemaVersion',
  'fixtureId',
  'labId',
  'unitId',
  'exampleId',
  'sourceCommit',
  'provenance',
  'fixtureType',
  'captureStatus',
  'tool',
  'captureCommand',
  'workload',
  'correctnessGate',
  'environmentManifest',
  'method',
  'sanitization',
  'expectedObservations',
  'recordedObservations',
  'claimBoundary',
];

const toolFields = [
  'name',
  'cli',
  'reportExtension',
  'selectedVersions',
];

const fixtureProfiles = new Map([
  ['LAB06', {
    subjectField: 'labId',
    exampleId: 'EX07',
    fixtureId: 'LAB06-NSYS-EXPECTED',
    fixtureSha256: 'e4bf6785b011903e71874283b57832a1dce28c3c0d1e7df98bb26d1af42b44e3',
    fixtureBytesSha256: '01cdb8bdcd737345424cc49d92b221aa7a4908c23cba70dce3d0e8f5321abbab',
    sourceCommit: 'fb0306db725ab960a61b50456c227545057de392',
    sanitizationReviewDate: '2026-08-31',
    tool: {
      name: 'Nsight Systems',
      cli: 'nsys',
      reportExtension: '.nsys-rep',
      selectedVersions: ['2022.4.2.1', '2025.1.3.140', '2026.1.3.425'],
    },
  }],
  ['LAB08', {
    subjectField: 'labId',
    exampleId: 'EX07',
    fixtureId: 'LAB08-NCU-EXPECTED',
    fixtureSha256: '0ac043971a25c51ec928a37f313877faa005872f504d273b6a3e330b96e9e4dc',
    fixtureBytesSha256: '630c749665bdd26dfca11ca5d253b115d5d23c035869359773465e8f5b8895c6',
    sourceCommit: 'fb0306db725ab960a61b50456c227545057de392',
    sanitizationReviewDate: '2026-08-31',
    tool: {
      name: 'Nsight Compute',
      cli: 'ncu',
      reportExtension: '.ncu-rep',
      selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
    },
  }],
  ['LAB10', {
    subjectField: 'labId',
    exampleId: 'EX14',
    fixtureId: 'LAB10-NCU-EXPECTED',
    fixtureSha256: '2cde6557100be26cc0878f67bd34c27f5b530f20ebbb8f35a06f270d5fe51eab',
    fixtureBytesSha256: '12fe158fffed5f2cfe37d097c690b31d4719a1696c4188902baab5d73927807f',
    sourceCommit: '981939cc705faf721ac06d1b70f2c5c4a8111e92',
    sanitizationReviewDate: '2026-09-02',
    tool: {
      name: 'Nsight Compute',
      cli: 'ncu',
      reportExtension: '.ncu-rep',
      selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
    },
  }],
  ['LAB11', {
    subjectField: 'labId',
    exampleId: 'EX17',
    fixtureId: 'LAB11-NCU-EXPECTED',
    fixtureSha256: 'e35f14cdf496e7b391e019c9a3ff113a73a692356ade5544bccc4978b98b60cd',
    fixtureBytesSha256: 'eb6864bf4a8874f68ce8168d1bb413afa7fb270d72b11f3a27a228bacbdf7f4f',
    sourceCommit: 'f018a694ec4f57a40e1374352e320ddd9c9511e0',
    sanitizationReviewDate: '2026-09-05',
    tool: {
      name: 'Nsight Compute',
      cli: 'ncu',
      reportExtension: '.ncu-rep',
      selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
    },
  }],
  ['Q12', {
    subjectField: 'unitId',
    exampleId: 'EX11',
    fixtureId: 'Q12-NCU-EXPECTED',
    fixtureSha256: '6857340f5a13500b0fd83d7cce5cb48d8eb1502fe2cfbd2c7ee2f983dcc00f9b',
    fixtureBytesSha256: 'd411ae2738ea5d2c4bd294e52449b1a5d98be5ae452258e297bcad498d4ddfd8',
    sourceCommit: '81d43aa7568514e37ef190da59c845b8072b7011',
    sanitizationReviewDate: '2026-09-02',
    tool: {
      name: 'Nsight Compute',
      cli: 'ncu',
      reportExtension: '.ncu-rep',
      selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
    },
  }],
  ['Q13', {
    subjectField: 'unitId',
    exampleId: 'EX15',
    fixtureId: 'Q13-NCU-EXPECTED',
    fixtureSha256: '3a51c4a4f28cf278fed985eb4db38d58d396e02e341806becec3dd921fcb932d',
    fixtureBytesSha256: 'c6e424586f7df7d13f2bdbe5b0ba4c0defaba7110c9349bd78043dfb018f0662',
    sourceCommit: 'd03ff3b27294f77b5f5a0a3b594bebf20a89cf70',
    sanitizationReviewDate: '2026-09-03',
    tool: {
      name: 'Nsight Compute',
      cli: 'ncu',
      reportExtension: '.ncu-rep',
      selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
    },
  }],
]);

const forbiddenKeys = new Set([
  'hostname',
  'username',
  'userName',
  'homeDirectory',
  'ipAddress',
  'macAddress',
  'gpuUuid',
  'deviceUuid',
  'environmentVariables',
  'processArguments',
  'credential',
  'token',
]);

const privateTextPatterns = [
  /\/(?:Users|home)\/[^/\s]+\//,
  /(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+/i,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function canonicalFixtureSha256(fixture) {
  return createHash('sha256').update(canonicalJson(fixture)).digest('hex');
}

function walk(value, path, errors) {
  if (typeof value === 'string') {
    if (privateTextPatterns.some((pattern) => pattern.test(value))) {
      errors.push(`${path}: contains a private or credential-like coordinate`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, errors));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) errors.push(`${path}.${key}: forbidden public fixture field`);
    walk(child, `${path}.${key}`, errors);
  }
}

export function validateProfilerReportFixture(fixture, fixtureSource) {
  const errors = [];
  if (!isRecord(fixture)) return { valid: false, errors: ['fixture must be an object'] };

  const subjectFields = ['labId', 'unitId'].filter((field) => field in fixture);
  const subjectField = subjectFields.length === 1 ? subjectFields[0] : undefined;
  const subjectId = subjectField === undefined ? undefined : fixture[subjectField];
  const profile = fixtureProfiles.get(subjectId);

  const unknown = Object.keys(fixture).filter((key) => !topLevelFields.includes(key));
  const missing = topLevelFields.filter((key) => !['labId', 'unitId'].includes(key) && !(key in fixture));
  if (unknown.length > 0) errors.push(`unknown top-level fields: ${unknown.join(', ')}`);
  if (missing.length > 0) errors.push(`missing top-level fields: ${missing.join(', ')}`);
  if (subjectFields.length !== 1) errors.push('fixture must declare exactly one of labId or unitId');
  if (fixture['SPDX-License-Identifier'] !== 'CC-BY-4.0') errors.push('fixture license must be CC-BY-4.0');
  if (fixture.schemaVersion !== 1) errors.push('fixture schemaVersion must be 1');
  if (profile === undefined) errors.push(`${subjectField ?? 'subject ID'} is invalid`);
  if (profile !== undefined && subjectField !== profile.subjectField) {
    errors.push(`fixture subject field must be ${profile.subjectField}`);
  }
  if (profile !== undefined && fixture.fixtureId !== profile.fixtureId) errors.push('fixtureId is invalid');
  if (profile !== undefined && fixture.exampleId !== profile.exampleId) errors.push(`exampleId is invalid for ${profile.subjectField}`);
  if (profile !== undefined && fixture.sourceCommit !== profile.sourceCommit) errors.push(`sourceCommit is invalid for ${profile.subjectField}`);
  if (fixture.provenance !== 'original') errors.push('fixture provenance must be original');
  if (fixture.fixtureType !== 'expected-only-profiler-report-plan') errors.push('fixtureType must remain expected-only');
  if (fixture.captureStatus !== 'pending-hardware-verification') errors.push('captureStatus must remain pending');

  if (!isRecord(fixture.tool)) errors.push('tool must be an object');
  else {
    const presentToolFields = Object.keys(fixture.tool);
    const missingToolFields = toolFields.filter((key) => !presentToolFields.includes(key));
    const extraToolFields = presentToolFields.filter((key) => !toolFields.includes(key));
    if (missingToolFields.length > 0) errors.push(`missing tool fields: ${missingToolFields.join(', ')}`);
    if (extraToolFields.length > 0) errors.push(`unreviewed tool fields: ${extraToolFields.join(', ')}`);

    if (profile !== undefined) {
      if (fixture.tool.name !== profile.tool.name) errors.push(`tool name is invalid for ${profile.subjectField}`);
      if (fixture.tool.cli !== profile.tool.cli) errors.push(`tool CLI is invalid for ${profile.subjectField}`);
      if (fixture.tool.reportExtension !== profile.tool.reportExtension) {
        errors.push(`tool report extension is invalid for ${profile.subjectField}`);
      }
      if (!Array.isArray(fixture.tool.selectedVersions)
        || fixture.tool.selectedVersions.length !== profile.tool.selectedVersions.length
        || profile.tool.selectedVersions.some((version, index) => fixture.tool.selectedVersions[index] !== version)) {
        errors.push(`tool selected versions are invalid for ${profile.subjectField}`);
      }
    }
  }

  if (!isRecord(fixture.environmentManifest)) errors.push('environmentManifest must be an object');
  else {
    const manifestKeys = Object.keys(fixture.environmentManifest);
    const missingManifest = PROFILER_FIXTURE_MANIFEST_FIELDS.filter((key) => !manifestKeys.includes(key));
    const extraManifest = manifestKeys.filter((key) => !PROFILER_FIXTURE_MANIFEST_FIELDS.includes(key));
    if (missingManifest.length > 0) errors.push(`missing manifest fields: ${missingManifest.join(', ')}`);
    if (extraManifest.length > 0) errors.push(`unreviewed manifest fields: ${extraManifest.join(', ')}`);
    const filledManifest = manifestKeys.filter((key) => fixture.environmentManifest[key] !== 'unfilled');
    if (filledManifest.length > 0) errors.push(`expected-only manifest fields must remain unfilled: ${filledManifest.join(', ')}`);
  }

  if (!isRecord(fixture.sanitization)
    || fixture.sanitization.status !== 'passed'
    || profile === undefined
    || fixture.sanitization.reviewDate !== profile.sanitizationReviewDate) {
    errors.push('sanitization review is incomplete');
  }
  if (!Array.isArray(fixture.expectedObservations) || fixture.expectedObservations.length === 0) {
    errors.push('expected observations are required');
  }
  if (!Array.isArray(fixture.recordedObservations) || fixture.recordedObservations.length !== 0) {
    errors.push('expected-only fixtures cannot contain recorded observations');
  }
  if (typeof fixture.claimBoundary !== 'string' || !/no recorded|没有已记录/i.test(fixture.claimBoundary)) {
    errors.push('claim boundary must deny recorded observations');
  }

  walk(fixture, 'fixture', errors);
  if (profile !== undefined && canonicalFixtureSha256(fixture) !== profile.fixtureSha256) {
    errors.push('fixture content does not match the reviewed expected-only profile');
  }
  if (profile !== undefined) {
    if (typeof fixtureSource !== 'string') {
      errors.push('reviewed fixture source text is required');
    } else if (createHash('sha256').update(fixtureSource).digest('hex') !== profile.fixtureBytesSha256) {
      errors.push('fixture bytes do not match the reviewed expected-only file');
    }
  }
  return { valid: errors.length === 0, errors };
}
