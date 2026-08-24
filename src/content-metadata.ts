// SPDX-License-Identifier: Apache-2.0
import { z } from 'astro/zod';

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const curriculumIdSchema = z.string().regex(/^(?:O\d{2}(?:-[A-Z]+)?|EX\d{2}|PB-R0(?:-\d{3})?)$/);

export const compilationEvidenceStatusSchema = z.enum(['Compile-Checked']);
export const runtimeEvidenceStatusSchema = z.enum([
  'Community-Observed',
  'Runtime-Verified',
  'Pending Hardware Verification',
  'Runtime-Not-Applicable',
]);

export const evidenceMetadataSchema = z
  .object({
    compilation: z.array(compilationEvidenceStatusSchema),
    runtime: z.array(runtimeEvidenceStatusSchema),
    expectedObservations: z.array(z.string()),
    recordedObservations: z.array(z.string()),
  })
  .superRefine(({ compilation, runtime, recordedObservations }, context) => {
    if (new Set(compilation).size !== compilation.length || new Set(runtime).size !== runtime.length) {
      context.addIssue({ code: 'custom', message: 'Evidence Status values must not be duplicated.' });
    }
    if (runtime.includes('Runtime-Not-Applicable') && runtime.length !== 1) {
      context.addIssue({ code: 'custom', message: 'Runtime-Not-Applicable cannot coexist with runtime observations.' });
    }
    if (runtime.includes('Runtime-Verified') && runtime.includes('Pending Hardware Verification')) {
      context.addIssue({ code: 'custom', message: 'Runtime-Verified cannot remain Pending Hardware Verification.' });
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
  title: z.string(),
  url: z.url(),
  version: z.string(),
  platform: z.string(),
  accessDate: dateSchema,
});
