// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  curriculumIdSchema,
  dateSchema,
  evidenceMetadataSchema,
  resourceKindSchema,
  sourceReferenceSchema,
} from '../../src/content-metadata';

const noEvidence = {
  compilation: [],
  runtime: [],
  expectedObservations: [],
  recordedObservations: [],
};

describe('content evidence metadata', () => {
  it.each([
    noEvidence,
    { ...noEvidence, compilation: ['Compile-Checked'], runtime: ['Pending Hardware Verification'] },
    { ...noEvidence, compilation: ['Compile-Checked'], runtime: ['Runtime-Verified'], recordedObservations: ['criteria met'] },
    { ...noEvidence, compilation: ['Compile-Checked'], runtime: ['Runtime-Not-Applicable'] },
    { ...noEvidence, runtime: ['Community-Observed', 'Pending Hardware Verification'], recordedObservations: ['community log'] },
  ])('accepts independent legal evidence axes', (metadata) => {
    expect(evidenceMetadataSchema.safeParse(metadata).success).toBe(true);
  });

  it.each([
    { ...noEvidence, compilation: ['Built'] },
    { ...noEvidence, runtime: ['Verified'] },
    { ...noEvidence, runtime: ['Runtime-Not-Applicable', 'Community-Observed'] },
    { ...noEvidence, runtime: ['Runtime-Verified', 'Pending Hardware Verification'] },
    { ...noEvidence, runtime: ['Runtime-Verified'] },
    { ...noEvidence, runtime: ['Community-Observed', 'Pending Hardware Verification'] },
    { ...noEvidence, recordedObservations: ['unqualified result'] },
    { ...noEvidence, compilation: ['Compile-Checked', 'Compile-Checked'] },
    { ...noEvidence, runtime: ['Pending Hardware Verification', 'Pending Hardware Verification'] },
    { ...noEvidence, expectedObservations: [''] },
  ])('rejects uncontrolled or contradictory evidence claims', (metadata) => {
    expect(evidenceMetadataSchema.safeParse(metadata).success).toBe(false);
  });

  it('requires exact source coordinates', () => {
    const source = {
      title: 'CUDA Toolkit release notes',
      url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/',
      version: '13.3.1',
      platform: 'Linux x86_64',
      accessDate: '2026-08-24',
    };

    expect(sourceReferenceSchema.safeParse(source).success).toBe(true);
    expect(sourceReferenceSchema.safeParse({ ...source, url: 'not-a-url' }).success).toBe(false);
    expect(sourceReferenceSchema.safeParse({ ...source, url: 'http://docs.nvidia.com/example' }).success).toBe(false);
    expect(sourceReferenceSchema.safeParse({ ...source, title: '' }).success).toBe(false);
    expect(sourceReferenceSchema.safeParse({ ...source, accessDate: '2026/08/24' }).success).toBe(false);
    expect(sourceReferenceSchema.safeParse({ ...source, accessDate: '2026-02-30' }).success).toBe(false);
  });

  it.each(['2024-02-29', '2026-08-25'])('accepts real ISO calendar date %s', (date) => {
    expect(dateSchema.safeParse(date).success).toBe(true);
  });

  it.each(['2023-02-29', '2026-13-01', '2026-00-10', '2026-04-31'])('rejects impossible date %s', (date) => {
    expect(dateSchema.safeParse(date).success).toBe(false);
  });
});

describe('Visual Explainer metadata', () => {
  it.each(['VIS01', 'VIS02', 'VIS03', 'VIS07', 'VIS08', 'VIS09', 'VIS10', 'VIS11', 'VIS13', 'VIS14', 'VIS19', 'VIS20', 'VIS21', 'VIS22'])('accepts the controlled visual identifier %s', (identifier) => {
    expect(curriculumIdSchema.safeParse(identifier).success).toBe(true);
  });

  it.each(['VIS1', 'VIS001', 'vis01', 'VIS01-EXERCISES'])('rejects malformed visual identifier %s', (identifier) => {
    expect(curriculumIdSchema.safeParse(identifier).success).toBe(false);
  });

  it('accepts Visual Explainer as a publication resource kind', () => {
    expect(resourceKindSchema.safeParse('visual-explainer').success).toBe(true);
    expect(resourceKindSchema.safeParse('visual-demo').success).toBe(false);
  });
});

describe('Learning Unit and Lab metadata', () => {
  it.each([
    'F01', 'F01-EXERCISES', 'F01-SOLUTIONS',
    'M01', 'M05', 'M08', 'M01-EXERCISES', 'M01-SOLUTIONS', 'M08-EXERCISES', 'M08-SOLUTIONS',
    ...['M09', 'M10', 'M11', 'M12', 'M13', 'M14'].flatMap((unitId) => [
      unitId,
      `${unitId}-EXERCISES`,
      `${unitId}-SOLUTIONS`,
    ]),
    ...['M15', 'M16', 'M17', 'M18', 'M19'].flatMap((unitId) => [
      unitId,
      `${unitId}-EXERCISES`,
      `${unitId}-SOLUTIONS`,
    ]),
    ...['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A14'].flatMap((unitId) => [
      unitId,
      `${unitId}-EXERCISES`,
      `${unitId}-SOLUTIONS`,
    ]),
    'Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q01-EXERCISES', 'Q01-SOLUTIONS',
    'Q02-EXERCISES', 'Q02-SOLUTIONS',
    ...['Q06', 'Q07', 'Q08', 'Q09', 'Q10'].flatMap((unitId) => [
      unitId,
      `${unitId}-EXERCISES`,
      `${unitId}-SOLUTIONS`,
    ]),
    'EX07', 'EX08', 'EX09', 'EX10', 'EX11', 'EX12', 'EX13', 'EX14',
    'LAB02', 'LAB06', 'LAB08', 'LAB09',
    'PB-R0-005', 'PB-R3', 'PB-R3-001', 'PB-R3-002', 'PB-R3-003', 'PB-R3-004', 'PB-R3-005', 'PB-R3-006',
  ])(
    'accepts the controlled curriculum identifier %s',
    (identifier) => {
      expect(curriculumIdSchema.safeParse(identifier).success).toBe(true);
    },
  );

  it.each(['F1', 'F001', 'f01', 'M1', 'M001', 'm01', 'A1', 'A001', 'a01', 'Q1', 'Q001', 'q01', 'Q01-exercises', 'LAB2', 'LAB02-EXERCISES'])(
    'rejects the malformed curriculum identifier %s',
    (identifier) => {
      expect(curriculumIdSchema.safeParse(identifier).success).toBe(false);
    },
  );

  it('accepts Lab as a publication resource kind', () => {
    expect(resourceKindSchema.safeParse('lab').success).toBe(true);
    expect(resourceKindSchema.safeParse('demo').success).toBe(false);
  });
});
