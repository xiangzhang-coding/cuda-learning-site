// SPDX-License-Identifier: Apache-2.0
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const publicationMetadata = z.object({
  pairId: z.string(),
  counterpart: z.string().regex(/^\/(?:en\/)?(?:[a-z0-9-]+\/)*$/),
  factCheckDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  license: z.literal('CC-BY-4.0'),
  provenance: z.literal('original'),
  structure: z.array(z.string()),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: publicationMetadata }),
  }),
};
