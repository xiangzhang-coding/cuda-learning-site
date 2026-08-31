// SPDX-License-Identifier: Apache-2.0

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

export function validateProfilerReportFixture(fixture) {
  const errors = [];
  if (!isRecord(fixture)) return { valid: false, errors: ['fixture must be an object'] };

  const unknown = Object.keys(fixture).filter((key) => !topLevelFields.includes(key));
  const missing = topLevelFields.filter((key) => !(key in fixture));
  if (unknown.length > 0) errors.push(`unknown top-level fields: ${unknown.join(', ')}`);
  if (missing.length > 0) errors.push(`missing top-level fields: ${missing.join(', ')}`);
  if (fixture['SPDX-License-Identifier'] !== 'CC-BY-4.0') errors.push('fixture license must be CC-BY-4.0');
  if (fixture.schemaVersion !== 1) errors.push('fixture schemaVersion must be 1');
  if (!/^LAB(?:06|08)-[A-Z0-9-]+$/.test(fixture.fixtureId ?? '')) errors.push('fixtureId is invalid');
  if (!['LAB06', 'LAB08'].includes(fixture.labId)) errors.push('labId is invalid');
  if (fixture.exampleId !== 'EX07') errors.push('exampleId must be EX07');
  if (!/^[0-9a-f]{40}$/.test(fixture.sourceCommit ?? '')) errors.push('sourceCommit must be a full Git SHA');
  if (fixture.provenance !== 'original') errors.push('fixture provenance must be original');
  if (fixture.fixtureType !== 'expected-only-profiler-report-plan') errors.push('fixtureType must remain expected-only');
  if (fixture.captureStatus !== 'pending-hardware-verification') errors.push('captureStatus must remain pending');

  if (!isRecord(fixture.tool)) errors.push('tool must be an object');
  else {
    const expectedExtension = fixture.tool.name === 'Nsight Systems'
      ? '.nsys-rep'
      : fixture.tool.name === 'Nsight Compute'
        ? '.ncu-rep'
        : null;
    if (expectedExtension === null) errors.push('tool name is not reviewed');
    if (fixture.tool.reportExtension !== expectedExtension) errors.push('tool report extension does not match');
    if (!Array.isArray(fixture.tool.selectedVersions) || fixture.tool.selectedVersions.length !== 3) {
      errors.push('tool must declare three selected Lane versions');
    }
  }

  if (!isRecord(fixture.environmentManifest)) errors.push('environmentManifest must be an object');
  else {
    const manifestKeys = Object.keys(fixture.environmentManifest);
    const missingManifest = PROFILER_FIXTURE_MANIFEST_FIELDS.filter((key) => !manifestKeys.includes(key));
    const extraManifest = manifestKeys.filter((key) => !PROFILER_FIXTURE_MANIFEST_FIELDS.includes(key));
    if (missingManifest.length > 0) errors.push(`missing manifest fields: ${missingManifest.join(', ')}`);
    if (extraManifest.length > 0) errors.push(`unreviewed manifest fields: ${extraManifest.join(', ')}`);
  }

  if (!isRecord(fixture.sanitization)
    || fixture.sanitization.status !== 'passed'
    || fixture.sanitization.reviewDate !== '2026-08-31') {
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
  return { valid: errors.length === 0, errors };
}
