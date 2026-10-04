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
  .regex(/^(?:(?:O|F|M|A|Q|L|P|T|G|H)\d{2}(?:-[A-Z]+)?|W\d{2}|LAB\d{2}|EX\d{2}|VIS\d{2}|PB-R\d+(?:-\d{3})?)$/);
export const resourceKindSchema = z.enum([
  'learning-unit',
  'lab',
  'exercise-set',
  'solution-set',
  'practice-bank',
  'runnable-example',
  'visual-explainer',
  'emerging-feature-watch',
]);

// These are evidence targets admitted by the compile policy, not release discovery.
export const toolkitLaneSchema = z.enum(['cuda-11.8', 'cuda-12.9', 'cuda-13.3']);

export function watchBoundaryIssues(metadata: {
  unitId?: string;
  resourceKind?: string;
  prerequisites?: readonly string[];
  toolkitLanes?: readonly string[];
}): string[] {
  const issues: string[] = [];
  const watch = /^W\d{2}$/.test(metadata.unitId ?? '');
  if (watch !== (metadata.resourceKind === 'emerging-feature-watch')) {
    issues.push('W identifiers require the Emerging Feature Watch resource kind and vice versa.');
  }
  // Reject W edges for every resource: this also prevents transitive dependencies
  // from Stable Curriculum units through a Lab, example, or exercise.
  if (metadata.prerequisites?.some((id) => /^W\d{2}$/.test(id))) {
    issues.push('An Emerging Feature Watch entry cannot be a prerequisite.');
  }
  if (watch && metadata.toolkitLanes?.length) {
    issues.push('Emerging Feature Watch entries cannot claim a Toolkit Lane.');
  }
  return issues;
}

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
