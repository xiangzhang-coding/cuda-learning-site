// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.{test,spec}.{js,mjs,ts}',
      'tests/integration/**/*.{test,spec}.{js,mjs,ts}',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'scripts/lib/**/*.mjs',
        'src/content-contract.ts',
        'src/resource-indexes/resource-index-model.ts',
        'src/visuals/*-model.ts',
      ],
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: {
        branches: 80,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
