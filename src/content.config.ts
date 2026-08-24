// SPDX-License-Identifier: Apache-2.0
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

import {
  curriculumIdSchema,
  dateSchema,
  evidenceMetadataSchema,
  sourceReferenceSchema,
} from './content-metadata';

const publicationMetadata = z.object({
  pairId: z.string(),
  counterpart: z.string().regex(/^\/(?:en\/)?(?:[a-z0-9-]+\/)*$/),
  factCheckDate: dateSchema,
  license: z.literal('CC-BY-4.0'),
  provenance: z.literal('original'),
  structure: z.array(z.string()),
  resourceKind: z
    .enum(['learning-unit', 'exercise-set', 'solution-set', 'practice-bank', 'runnable-example'])
    .optional(),
  unitId: curriculumIdSchema.optional(),
  prerequisites: z.array(curriculumIdSchema).optional(),
  relatedUnits: z.array(curriculumIdSchema).optional(),
  exampleIds: z.array(z.string().regex(/^[A-Z0-9-]+$/)).optional(),
  canonicalExample: z.string().regex(/^EX\d{2}$/).optional(),
  canonicalRanges: z.array(z.string().regex(/^[a-z0-9-]+$/)).optional(),
  hardwareGate: z.string().optional(),
  evidence: evidenceMetadataSchema.optional(),
  sources: z.array(sourceReferenceSchema).optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: publicationMetadata }),
  }),
};
