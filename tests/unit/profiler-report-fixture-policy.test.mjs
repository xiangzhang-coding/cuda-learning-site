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

async function readFixture(name) {
  return JSON.parse(await readFile(path.join(fixtureRoot, name), 'utf8'));
}

describe('profiler report fixture policy', () => {
  it.each([
    ['lab06-nsight-systems.expected.json', 'LAB06', 'Nsight Systems', '.nsys-rep'],
    ['lab08-nsight-compute.expected.json', 'LAB08', 'Nsight Compute', '.ncu-rep'],
  ])('accepts the sanitized original expected-only fixture %s', async (name, labId, toolName, extension) => {
    const fixture = await readFixture(name);
    expect(validateProfilerReportFixture(fixture)).toEqual({ valid: true, errors: [] });
    expect(fixture).toMatchObject({
      'SPDX-License-Identifier': 'CC-BY-4.0',
      schemaVersion: 1,
      labId,
      exampleId: 'EX07',
      sourceCommit: 'fb0306db725ab960a61b50456c227545057de392',
      provenance: 'original',
      fixtureType: 'expected-only-profiler-report-plan',
      captureStatus: 'pending-hardware-verification',
      tool: { name: toolName, reportExtension: extension },
      sanitization: { status: 'passed', reviewDate: '2026-08-31' },
      recordedObservations: [],
    });
    expect(Object.keys(fixture.environmentManifest).sort()).toEqual([...PROFILER_FIXTURE_MANIFEST_FIELDS].sort());
    expect(fixture.expectedObservations.length).toBeGreaterThan(0);
    expect(fixture.claimBoundary).toMatch(/no recorded|没有已记录/i);
  });

  it('rejects fabricated observations, incomplete custody, private fields, and mismatched report types', async () => {
    const fixture = await readFixture('lab06-nsight-systems.expected.json');
    for (const mutate of [
      (copy) => { copy.recordedObservations = ['42 ms']; },
      (copy) => { delete copy.environmentManifest.driver; },
      (copy) => { copy.environmentManifest.hostname = 'private-host'; },
      (copy) => { copy.tool.reportExtension = '.ncu-rep'; },
      (copy) => { copy.sanitization.status = 'pending'; },
      (copy) => { copy.sourceCommit = 'main'; },
      (copy) => { copy.captureCommand = ['', 'Users', 'private', 'project', 'run'].join('/'); },
    ]) {
      const invalid = structuredClone(fixture);
      mutate(invalid);
      const result = validateProfilerReportFixture(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('rejects non-object and unknown top-level input', () => {
    expect(validateProfilerReportFixture(null).valid).toBe(false);
    expect(validateProfilerReportFixture([]).valid).toBe(false);
    expect(validateProfilerReportFixture({ unexpected: true }).valid).toBe(false);
  });
});
