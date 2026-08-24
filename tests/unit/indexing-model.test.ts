// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  INDEXING_LIMITS,
  INDEXING_STATIC_CONFIGURATIONS,
  calculateIndexing,
  createIndexingConfiguration,
  normalizeIndexingDimensions,
  parseIndexingInteger,
  resetIndexingConfiguration,
  validateIndexingConfiguration,
  type IndexingConfiguration,
} from '../../src/visuals/indexing-model';

function configuration(overrides: Partial<IndexingConfiguration> = {}): IndexingConfiguration {
  return { ...createIndexingConfiguration(3), ...overrides };
}

describe('VIS02 indexing model', () => {
  it.each([
    ['0', 0, 8, 0],
    ['8', 0, 8, 8],
    ['32', 1, 64, 32],
  ])('parses whole-number input %s inside the declared range', (value, minimum, maximum, expected) => {
    expect(parseIndexingInteger(value, minimum, maximum)).toBe(expected);
  });

  it.each(['', ' ', '-1', '1.5', '1e2', '01', 'NaN', 'Infinity', '9007199254740992'])(
    'rejects ambiguous or unsafe integer input %j',
    (value) => {
      expect(parseIndexingInteger(value, 0, INDEXING_LIMITS.gridAxis)).toBeNull();
    },
  );

  it('normalizes inactive dimensions to size one and coordinate zero', () => {
    const threeDimensional = configuration({
      gridDim: { x: 2, y: 3, z: 4 },
      blockDim: { x: 5, y: 6, z: 7 },
      extent: { x: 8, y: 9, z: 10 },
      blockIdx: { x: 1, y: 2, z: 3 },
      threadIdx: { x: 4, y: 5, z: 6 },
    });

    expect(normalizeIndexingDimensions(threeDimensional, 1)).toEqual({
      dimensions: 1,
      gridDim: { x: 2, y: 1, z: 1 },
      blockDim: { x: 5, y: 1, z: 1 },
      extent: { x: 8, y: 1, z: 1 },
      blockIdx: { x: 1, y: 0, z: 0 },
      threadIdx: { x: 4, y: 0, z: 0 },
    });
  });

  it('calculates a known 1D thread, warp, lane, and bounds result', () => {
    const config: IndexingConfiguration = {
      dimensions: 1,
      gridDim: { x: 3, y: 1, z: 1 },
      blockDim: { x: 64, y: 1, z: 1 },
      extent: { x: 160, y: 1, z: 1 },
      blockIdx: { x: 1, y: 0, z: 0 },
      threadIdx: { x: 32, y: 0, z: 0 },
    };

    expect(calculateIndexing(config)).toEqual({
      global: { x: 96, y: 0, z: 0 },
      localThread: 32,
      warp: 1,
      lane: 0,
      linearBlock: 1,
      dataLinear: 96,
      axisBounds: { x: true, y: true, z: true },
      inBounds: true,
    });
  });

  it('calculates x-fastest 2D coordinates and row-major data indexing', () => {
    const config: IndexingConfiguration = {
      dimensions: 2,
      gridDim: { x: 3, y: 2, z: 1 },
      blockDim: { x: 4, y: 3, z: 1 },
      extent: { x: 10, y: 5, z: 1 },
      blockIdx: { x: 2, y: 1, z: 0 },
      threadIdx: { x: 1, y: 1, z: 0 },
    };

    expect(calculateIndexing(config)).toMatchObject({
      global: { x: 9, y: 4, z: 0 },
      localThread: 5,
      linearBlock: 5,
      dataLinear: 49,
      inBounds: true,
    });
  });

  it('calculates x-fastest 3D coordinates independently from block linearization', () => {
    const config = createIndexingConfiguration(3);

    expect(calculateIndexing(config)).toEqual({
      global: { x: 6, y: 2, z: 2 },
      localThread: 2,
      warp: 0,
      lane: 2,
      linearBlock: 7,
      dataLinear: 62,
      axisBounds: { x: true, y: true, z: true },
      inBounds: true,
    });
  });

  it.each([
    ['x', { x: 7, y: 2, z: 2 }, { x: false, y: true, z: true }],
    ['y', { x: 6, y: 3, z: 2 }, { x: true, y: false, z: true }],
    ['z', { x: 6, y: 2, z: 3 }, { x: true, y: true, z: false }],
  ] as const)('marks the first %s-axis overflow without flattening away the boundary', (_axis, global, axisBounds) => {
    const base = createIndexingConfiguration(3);
    const blockIdx = {
      x: Math.floor(global.x / base.blockDim.x),
      y: Math.floor(global.y / base.blockDim.y),
      z: Math.floor(global.z / base.blockDim.z),
    };
    const threadIdx = {
      x: global.x % base.blockDim.x,
      y: global.y % base.blockDim.y,
      z: global.z % base.blockDim.z,
    };
    const result = calculateIndexing({ ...base, blockIdx, threadIdx });

    expect(result.global).toEqual(global);
    expect(result.axisBounds).toEqual(axisBounds);
    expect(result.inBounds).toBe(false);
  });

  it.each([
    ['zero size', configuration({ gridDim: { x: 0, y: 2, z: 2 } })],
    ['fractional size', configuration({ blockDim: { x: 4.5, y: 2, z: 2 } })],
    ['negative coordinate', configuration({ blockIdx: { x: -1, y: 1, z: 1 } })],
    ['block coordinate at boundary', configuration({ blockIdx: { x: 2, y: 2, z: 1 } })],
    ['thread coordinate at boundary', configuration({ threadIdx: { x: 4, y: 0, z: 0 } })],
    ['too many block threads', configuration({ blockDim: { x: 64, y: 64, z: 1 } })],
    [
      'unsafe launch product',
      configuration({
        gridDim: {
          x: INDEXING_LIMITS.gridAxis,
          y: INDEXING_LIMITS.gridAxis,
          z: INDEXING_LIMITS.gridAxis,
        },
      }),
    ],
  ])('rejects %s before calculating or rendering', (_name, config) => {
    const validation = validateIndexingConfiguration(config);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(() => calculateIndexing(config)).toThrow(RangeError);
  });

  it('resets to one deterministic initial configuration', () => {
    expect(resetIndexingConfiguration()).toEqual(createIndexingConfiguration(1));
    expect(resetIndexingConfiguration(2)).toEqual(createIndexingConfiguration(2));
    expect(resetIndexingConfiguration(3)).toEqual(createIndexingConfiguration(3));
  });

  it('derives all annotated static examples from valid model configurations', () => {
    expect(INDEXING_STATIC_CONFIGURATIONS.map(({ id }) => id)).toEqual(['1d', '2d', '3d']);
    for (const { config } of INDEXING_STATIC_CONFIGURATIONS) {
      expect(validateIndexingConfiguration(config)).toEqual({ valid: true, errors: [] });
      const first = calculateIndexing(config);
      expect(calculateIndexing(structuredClone(config))).toEqual(first);
    }
  });
});
