// SPDX-License-Identifier: Apache-2.0

export type DimensionCount = 1 | 2 | 3;
export type Axis = 'x' | 'y' | 'z';

export type Dim3 = Readonly<{
  x: number;
  y: number;
  z: number;
}>;

export type IndexingConfiguration = Readonly<{
  dimensions: DimensionCount;
  gridDim: Dim3;
  blockDim: Dim3;
  extent: Dim3;
  blockIdx: Dim3;
  threadIdx: Dim3;
}>;

export type IndexingResult = Readonly<{
  global: Dim3;
  localThread: number;
  warp: number;
  lane: number;
  linearBlock: number;
  dataLinear: number;
  axisBounds: Readonly<Record<Axis, boolean>>;
  inBounds: boolean;
}>;

export const INDEXING_LIMITS = {
  gridAxis: 1_000_000,
  blockAxis: 1_024,
  extentAxis: 1_000_000,
  threadsPerBlock: 1_024,
  renderedThreadButtons: 32,
} as const;

const AXES: readonly Axis[] = ['x', 'y', 'z'];

function isDimensionCount(value: number): value is DimensionCount {
  return value === 1 || value === 2 || value === 3;
}

function activeAxes(dimensions: DimensionCount): readonly Axis[] {
  return AXES.slice(0, dimensions);
}

function isWholeNumberInRange(value: number, minimum: number, maximum: number) {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

function safeProduct(values: readonly number[]) {
  const product = values.reduce((result, value) => result * value, 1);
  return Number.isSafeInteger(product) ? product : null;
}

export function parseIndexingInteger(value: string, minimum: number, maximum: number): number | null {
  if (!/^(?:0|[1-9]\d*)$/.test(value)) return null;
  const parsed = Number(value);
  return isWholeNumberInRange(parsed, minimum, maximum) ? parsed : null;
}

export function createIndexingConfiguration(dimensions: DimensionCount = 1): IndexingConfiguration {
  if (dimensions === 1) {
    return {
      dimensions,
      gridDim: { x: 3, y: 1, z: 1 },
      blockDim: { x: 4, y: 1, z: 1 },
      extent: { x: 10, y: 1, z: 1 },
      blockIdx: { x: 2, y: 0, z: 0 },
      threadIdx: { x: 1, y: 0, z: 0 },
    };
  }
  if (dimensions === 2) {
    return {
      dimensions,
      gridDim: { x: 3, y: 2, z: 1 },
      blockDim: { x: 4, y: 3, z: 1 },
      extent: { x: 10, y: 5, z: 1 },
      blockIdx: { x: 2, y: 1, z: 0 },
      threadIdx: { x: 1, y: 1, z: 0 },
    };
  }
  return {
    dimensions,
    gridDim: { x: 2, y: 2, z: 2 },
    blockDim: { x: 4, y: 2, z: 2 },
    extent: { x: 7, y: 3, z: 3 },
    blockIdx: { x: 1, y: 1, z: 1 },
    threadIdx: { x: 2, y: 0, z: 0 },
  };
}

export function resetIndexingConfiguration(dimensions: DimensionCount = 1): IndexingConfiguration {
  return createIndexingConfiguration(dimensions);
}

export function normalizeIndexingDimensions(
  config: IndexingConfiguration,
  dimensions: DimensionCount,
): IndexingConfiguration {
  const normalized = (value: Dim3, inactiveValue: number): Dim3 => ({
    x: value.x,
    y: dimensions >= 2 ? value.y : inactiveValue,
    z: dimensions >= 3 ? value.z : inactiveValue,
  });

  return {
    dimensions,
    gridDim: normalized(config.gridDim, 1),
    blockDim: normalized(config.blockDim, 1),
    extent: normalized(config.extent, 1),
    blockIdx: normalized(config.blockIdx, 0),
    threadIdx: normalized(config.threadIdx, 0),
  };
}

export function validateIndexingConfiguration(config: IndexingConfiguration): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!isDimensionCount(config.dimensions)) return { valid: false, errors: ['dimensions'] };

  const enabledAxes = new Set(activeAxes(config.dimensions));
  for (const axis of AXES) {
    const active = enabledAxes.has(axis);
    const expectedInactiveSize = active || config.gridDim[axis] === 1;
    const expectedInactiveBlock = active || config.blockDim[axis] === 1;
    const expectedInactiveExtent = active || config.extent[axis] === 1;
    const expectedInactiveBlockIndex = active || config.blockIdx[axis] === 0;
    const expectedInactiveThreadIndex = active || config.threadIdx[axis] === 0;

    if (!expectedInactiveSize || !isWholeNumberInRange(config.gridDim[axis], 1, INDEXING_LIMITS.gridAxis)) {
      errors.push(`gridDim.${axis}`);
    }
    if (!expectedInactiveBlock || !isWholeNumberInRange(config.blockDim[axis], 1, INDEXING_LIMITS.blockAxis)) {
      errors.push(`blockDim.${axis}`);
    }
    if (!expectedInactiveExtent || !isWholeNumberInRange(config.extent[axis], 1, INDEXING_LIMITS.extentAxis)) {
      errors.push(`extent.${axis}`);
    }
    if (
      !expectedInactiveBlockIndex ||
      !isWholeNumberInRange(config.blockIdx[axis], 0, Math.max(0, config.gridDim[axis] - 1))
    ) {
      errors.push(`blockIdx.${axis}`);
    }
    if (
      !expectedInactiveThreadIndex ||
      !isWholeNumberInRange(config.threadIdx[axis], 0, Math.max(0, config.blockDim[axis] - 1))
    ) {
      errors.push(`threadIdx.${axis}`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  const gridBlocks = safeProduct(AXES.map((axis) => config.gridDim[axis]));
  const blockThreads = safeProduct(AXES.map((axis) => config.blockDim[axis]));
  const extentElements = safeProduct(AXES.map((axis) => config.extent[axis]));
  if (gridBlocks === null) errors.push('grid-product');
  if (blockThreads === null || blockThreads > INDEXING_LIMITS.threadsPerBlock) errors.push('block-product');
  if (extentElements === null) errors.push('extent-product');
  if (gridBlocks !== null && blockThreads !== null && safeProduct([gridBlocks, blockThreads]) === null) {
    errors.push('launch-product');
  }

  if (errors.length === 0) {
    const global = Object.fromEntries(
      AXES.map((axis) => [axis, config.blockIdx[axis] * config.blockDim[axis] + config.threadIdx[axis]]),
    ) as Record<Axis, number>;
    const dataLinear =
      global.x + config.extent.x * (global.y + config.extent.y * global.z);
    if (!AXES.every((axis) => Number.isSafeInteger(global[axis])) || !Number.isSafeInteger(dataLinear)) {
      errors.push('selected-index-product');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function calculateIndexing(config: IndexingConfiguration): IndexingResult {
  const validation = validateIndexingConfiguration(config);
  if (!validation.valid) throw new RangeError(`Invalid indexing configuration: ${validation.errors.join(', ')}`);

  const global = {
    x: config.blockIdx.x * config.blockDim.x + config.threadIdx.x,
    y: config.blockIdx.y * config.blockDim.y + config.threadIdx.y,
    z: config.blockIdx.z * config.blockDim.z + config.threadIdx.z,
  };
  const localThread =
    config.threadIdx.x +
    config.blockDim.x * (config.threadIdx.y + config.blockDim.y * config.threadIdx.z);
  const linearBlock =
    config.blockIdx.x + config.gridDim.x * (config.blockIdx.y + config.gridDim.y * config.blockIdx.z);
  const dataLinear = global.x + config.extent.x * (global.y + config.extent.y * global.z);
  const axisBounds = {
    x: global.x < config.extent.x,
    y: global.y < config.extent.y,
    z: global.z < config.extent.z,
  };

  return {
    global,
    localThread,
    warp: Math.floor(localThread / 32),
    lane: localThread % 32,
    linearBlock,
    dataLinear,
    axisBounds,
    inBounds: activeAxes(config.dimensions).every((axis) => axisBounds[axis]),
  };
}

export const INDEXING_STATIC_CONFIGURATIONS = [
  {
    id: '1d',
    config: {
      ...createIndexingConfiguration(1),
      threadIdx: { x: 3, y: 0, z: 0 },
    },
  },
  { id: '2d', config: createIndexingConfiguration(2) },
  { id: '3d', config: createIndexingConfiguration(3) },
] as const satisfies readonly { id: string; config: IndexingConfiguration }[];
