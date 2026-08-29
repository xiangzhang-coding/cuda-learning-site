// SPDX-License-Identifier: Apache-2.0
import { z } from 'astro/zod';

import {
  COMPILATION_EVIDENCE_STATUSES,
  RUNTIME_EVIDENCE_STATUSES,
  evidenceStatusIssues,
  parseIsoDate,
} from './content-contract';

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => Boolean(parseIsoDate(value)), 'Date must be a real calendar date.');
export const curriculumIdSchema = z
  .string()
  .regex(/^(?:(?:O|F|M|Q)\d{2}(?:-[A-Z]+)?|LAB\d{2}|EX\d{2}|VIS\d{2}|PB-R0(?:-\d{3})?)$/);
export const resourceKindSchema = z.enum([
  'learning-unit',
  'lab',
  'exercise-set',
  'solution-set',
  'practice-bank',
  'runnable-example',
  'visual-explainer',
]);

export const compilationEvidenceStatusSchema = z.enum(COMPILATION_EVIDENCE_STATUSES);
export const runtimeEvidenceStatusSchema = z.enum(RUNTIME_EVIDENCE_STATUSES);

export const evidenceMetadataSchema = z
  .object({
    compilation: z.array(compilationEvidenceStatusSchema),
    runtime: z.array(runtimeEvidenceStatusSchema),
    expectedObservations: z.array(z.string().min(1)),
    recordedObservations: z.array(z.string().min(1)),
  })
  .superRefine(({ compilation, runtime, recordedObservations }, context) => {
    for (const message of evidenceStatusIssues(compilation, runtime)) {
      context.addIssue({ code: 'custom', message });
    }
    if (
      runtime.some((status) => status === 'Community-Observed' || status === 'Runtime-Verified') &&
      recordedObservations.length === 0
    ) {
      context.addIssue({ code: 'custom', message: 'Observed runtime statuses require a recorded observation.' });
    }
    if (
      recordedObservations.length > 0 &&
      !runtime.some((status) => status === 'Community-Observed' || status === 'Runtime-Verified')
    ) {
      context.addIssue({ code: 'custom', message: 'Recorded observations require qualifying runtime evidence.' });
    }
  });

export const sourceReferenceSchema = z.object({
  title: z.string().min(1),
  url: z.url().refine((value) => value.startsWith('https://'), 'Source URLs must use HTTPS.'),
  version: z.string().min(1),
  platform: z.string().min(1),
  accessDate: dateSchema,
});
