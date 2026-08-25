// SPDX-License-Identifier: Apache-2.0
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

import {
  curriculumIdSchema,
  dateSchema,
  evidenceMetadataSchema,
  resourceKindSchema,
  sourceReferenceSchema,
} from './content-metadata';

export const publicationMetadata = z
  .object({
    pairId: z.string().min(1),
    counterpart: z.string().regex(/^\/(?:en\/)?(?:[a-z0-9-]+\/)*$/),
    factCheckDate: dateSchema,
    license: z.literal('CC-BY-4.0'),
    provenance: z.literal('original'),
    structure: z.array(z.string().min(1)).min(1),
    resourceKind: resourceKindSchema.optional(),
    unitId: curriculumIdSchema.optional(),
    prerequisites: z.array(curriculumIdSchema).optional(),
    relatedUnits: z.array(curriculumIdSchema).optional(),
    exampleIds: z.array(z.string().regex(/^[A-Z0-9-]+$/)).optional(),
    canonicalExample: z.string().regex(/^EX\d{2}$/).optional(),
    canonicalRanges: z.array(z.string().regex(/^[a-z0-9-]+$/)).optional(),
    hardwareGate: z.string().min(1).optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    difficulty: z.enum(['introductory', 'intermediate', 'advanced']).optional(),
    toolkitLanes: z.array(z.string().regex(/^cuda-\d+\.\d+$/)).optional(),
    minimumComputeCapability: z.string().regex(/^\d+\.\d+$/).optional(),
    maximumProblemMemoryBytes: z.number().int().nonnegative().optional(),
    gpuCount: z.number().int().positive().optional(),
    permissions: z.array(z.string().min(1)).optional(),
    evidence: evidenceMetadataSchema.optional(),
    sources: z.array(sourceReferenceSchema).optional(),
  })
  .superRefine((metadata, context) => {
    for (const field of ['structure', 'prerequisites', 'relatedUnits', 'exampleIds', 'canonicalRanges'] as const) {
      const values = metadata[field];
      if (values && new Set(values).size !== values.length) {
        context.addIssue({ code: 'custom', path: [field], message: `${field} values must not be duplicated.` });
      }
    }
    if (metadata.unitId && metadata.prerequisites?.includes(metadata.unitId)) {
      context.addIssue({ code: 'custom', path: ['prerequisites'], message: 'A resource cannot require itself.' });
    }

    if (metadata.resourceKind !== 'lab') return;

    for (const field of [
      'unitId',
      'hardwareGate',
      'estimatedMinutes',
      'difficulty',
      'toolkitLanes',
      'minimumComputeCapability',
      'maximumProblemMemoryBytes',
      'gpuCount',
      'permissions',
      'evidence',
      'sources',
    ] as const) {
      const value = metadata[field];
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        context.addIssue({ code: 'custom', path: [field], message: `Lab metadata requires ${field}.` });
      }
    }
  });

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: publicationMetadata }),
  }),
};
