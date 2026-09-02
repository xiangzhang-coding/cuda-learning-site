// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PROFILER_FIXTURE_MANIFEST_FIELDS,
  validateProfilerReportFixture,
} from '../../scripts/lib/profiler-report-fixture-policy.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const fixtureRoot = path.join(projectRoot, 'public/assets/profiler-report-fixtures');

const fixtureProfiles = [
  ['lab06-nsight-systems.expected.json', {
    fixtureId: 'LAB06-NSYS-EXPECTED',
    labId: 'LAB06',
    exampleId: 'EX07',
    sourceCommit: 'fb0306db725ab960a61b50456c227545057de392',
    fixtureSha256: 'e4bf6785b011903e71874283b57832a1dce28c3c0d1e7df98bb26d1af42b44e3',
    fixtureBytesSha256: '01cdb8bdcd737345424cc49d92b221aa7a4908c23cba70dce3d0e8f5321abbab',
    reviewDate: '2026-08-31',
    tool: {
      name: 'Nsight Systems',
      cli: 'nsys',
      reportExtension: '.nsys-rep',
      selectedVersions: ['2022.4.2.1', '2025.1.3.140', '2026.1.3.425'],
    },
  }],
  ['lab08-nsight-compute.expected.json', {
    fixtureId: 'LAB08-NCU-EXPECTED',
    labId: 'LAB08',
    exampleId: 'EX07',
    sourceCommit: 'fb0306db725ab960a61b50456c227545057de392',
    fixtureSha256: '0ac043971a25c51ec928a37f313877faa005872f504d273b6a3e330b96e9e4dc',
    fixtureBytesSha256: '630c749665bdd26dfca11ca5d253b115d5d23c035869359773465e8f5b8895c6',
    reviewDate: '2026-08-31',
    tool: {
      name: 'Nsight Compute',
      cli: 'ncu',
      reportExtension: '.ncu-rep',
      selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
    },
  }],
  ['lab10-nsight-compute.expected.json', {
    fixtureId: 'LAB10-NCU-EXPECTED',
    labId: 'LAB10',
    exampleId: 'EX14',
    sourceCommit: '981939cc705faf721ac06d1b70f2c5c4a8111e92',
    fixtureSha256: '2cde6557100be26cc0878f67bd34c27f5b530f20ebbb8f35a06f270d5fe51eab',
    fixtureBytesSha256: '12fe158fffed5f2cfe37d097c690b31d4719a1696c4188902baab5d73927807f',
    reviewDate: '2026-09-02',
    tool: {
      name: 'Nsight Compute',
      cli: 'ncu',
      reportExtension: '.ncu-rep',
      selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
    },
  }],
];

const toolMutations = [
  ['a missing name', (copy) => { delete copy.tool.name; }, 'missing tool fields: name'],
  ['a missing CLI', (copy) => { delete copy.tool.cli; }, 'missing tool fields: cli'],
  ['a missing report extension', (copy) => { delete copy.tool.reportExtension; }, 'missing tool fields: reportExtension'],
  ['missing selected versions', (copy) => { delete copy.tool.selectedVersions; }, 'missing tool fields: selectedVersions'],
  ['an extra key', (copy) => { copy.tool.outputFormat = 'report'; }, 'unreviewed tool fields: outputFormat'],
  ['the wrong name', (copy) => { copy.tool.name = 'Nsight Graphics'; }, 'tool name is invalid for labId'],
  ['the wrong CLI', (copy) => { copy.tool.cli = 'profiler'; }, 'tool CLI is invalid for labId'],
  ['the wrong report extension', (copy) => { copy.tool.reportExtension = '.report'; }, 'tool report extension is invalid for labId'],
  ['reordered selected versions', (copy) => { copy.tool.selectedVersions.reverse(); }, 'tool selected versions are invalid for labId'],
  ['a wrong selected version', (copy) => { copy.tool.selectedVersions[1] = '0.0.0'; }, 'tool selected versions are invalid for labId'],
];

async function readFixture(name) {
  return JSON.parse(await readFile(path.join(fixtureRoot, name), 'utf8'));
}

async function readFixtureSource(name) {
  return readFile(path.join(fixtureRoot, name), 'utf8');
}

describe('profiler report fixture policy', () => {
  it.each(fixtureProfiles)('accepts the sanitized original expected-only fixture %s', async (
    name,
    { fixtureId, labId, exampleId, sourceCommit, fixtureSha256, fixtureBytesSha256, reviewDate, tool },
  ) => {
    const [fixture, fixtureSource] = await Promise.all([readFixture(name), readFixtureSource(name)]);
    expect(validateProfilerReportFixture(fixture, fixtureSource)).toEqual({ valid: true, errors: [] });
    expect(fixture).toMatchObject({
      'SPDX-License-Identifier': 'CC-BY-4.0',
      schemaVersion: 1,
      fixtureId,
      labId,
      exampleId,
      sourceCommit,
      provenance: 'original',
      fixtureType: 'expected-only-profiler-report-plan',
      captureStatus: 'pending-hardware-verification',
      tool,
      sanitization: { status: 'passed', reviewDate },
      recordedObservations: [],
    });
    expect(fixture.tool).toEqual(tool);
    expect(fixtureSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(fixtureBytesSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(fixture.environmentManifest).sort()).toEqual([...PROFILER_FIXTURE_MANIFEST_FIELDS].sort());
    expect(Object.values(fixture.environmentManifest)).toEqual(
      Array(PROFILER_FIXTURE_MANIFEST_FIELDS.length).fill('unfilled'),
    );
    expect(fixture.expectedObservations.length).toBeGreaterThan(0);
    expect(fixture.claimBoundary).toMatch(/no recorded|没有已记录/i);
  });

  it.each(fixtureProfiles)('rejects incomplete or altered tool coordinates in %s', async (name) => {
    const fixture = await readFixture(name);
    for (const [description, mutate, expectedError] of toolMutations) {
      const invalid = structuredClone(fixture);
      mutate(invalid);
      const result = validateProfilerReportFixture(invalid, JSON.stringify(invalid));
      expect(result.valid, description).toBe(false);
      expect(result.errors, description).toContain(expectedError);
    }
  });

  it.each(fixtureProfiles)('rejects a valid-looking alternate fixture ID in %s', async (
    name,
    { labId },
  ) => {
    const fixture = await readFixture(name);
    fixture.fixtureId = `${labId}-ANYTHING`;
    expect(validateProfilerReportFixture(fixture, JSON.stringify(fixture))).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(['fixtureId is invalid']),
    });
  });

  it('rejects fabricated observations, incomplete custody, and private fields', async () => {
    const fixture = await readFixture('lab06-nsight-systems.expected.json');
    for (const mutate of [
      (copy) => { copy.recordedObservations = ['42 ms']; },
      (copy) => { delete copy.environmentManifest.driver; },
      (copy) => { copy.environmentManifest.driver = 'observed'; },
      (copy) => { copy.environmentManifest.hostname = 'private-host'; },
      (copy) => { copy.sanitization.status = 'pending'; },
      (copy) => { copy.sourceCommit = 'main'; },
      (copy) => { copy.captureCommand = ['', 'Users', 'private', 'project', 'run'].join('/'); },
    ]) {
      const invalid = structuredClone(fixture);
      mutate(invalid);
      const result = validateProfilerReportFixture(invalid, JSON.stringify(invalid));
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('rejects LAB10 coordinates that do not match its reviewed profile', async () => {
    const fixture = await readFixture('lab10-nsight-compute.expected.json');
    for (const mutate of [
      (copy) => { copy.fixtureId = 'LAB10-ANYTHING'; },
      (copy) => { copy.labId = 'LAB08'; },
      (copy) => { copy.exampleId = 'EX07'; },
      (copy) => { copy.sourceCommit = 'fb0306db725ab960a61b50456c227545057de392'; },
      (copy) => { copy.sanitization.reviewDate = '2026-08-31'; },
    ]) {
      const invalid = structuredClone(fixture);
      mutate(invalid);
      const result = validateProfilerReportFixture(invalid, JSON.stringify(invalid));
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it.each([
    ['an observed timing field', (fixture) => { fixture.method.observedTimingMs = 1; }],
    ['a workload winner field', (fixture) => { fixture.workload.winner = 'padded-bank-layout'; }],
  ])('rejects nested unreviewed fixture content: %s', async (_description, mutate) => {
    const fixture = await readFixture('lab10-nsight-compute.expected.json');
    mutate(fixture);
    expect(validateProfilerReportFixture(fixture, JSON.stringify(fixture)).errors).toContain(
      'fixture content does not match the reviewed expected-only profile',
    );
  });

  it('rejects duplicate raw JSON members even when JSON.parse yields the reviewed object', async () => {
    const fixtureSource = await readFixtureSource('lab10-nsight-compute.expected.json');
    const duplicateSource = fixtureSource.replace(
      '  "method": {',
      '  "method": { "observedTimingMs": 1 },\n  "method": {',
    );
    const fixture = JSON.parse(duplicateSource);
    expect(validateProfilerReportFixture(fixture, duplicateSource).errors).toContain(
      'fixture bytes do not match the reviewed expected-only file',
    );
  });

  it('rejects non-object and unknown top-level input', () => {
    expect(validateProfilerReportFixture(null).valid).toBe(false);
    expect(validateProfilerReportFixture([]).valid).toBe(false);
    expect(validateProfilerReportFixture({ unexpected: true }).valid).toBe(false);
  });
});
