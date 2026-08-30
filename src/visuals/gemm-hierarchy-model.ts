// SPDX-License-Identifier: Apache-2.0

export const GEMM_HIERARCHY_LEVELS = [
  'matrix',
  'tile',
  'threadblock',
  'warp',
  'instruction',
] as const;
export const GEMM_HIERARCHY_MATRIX_SHAPES = ['128x128x32', '256x128x64'] as const;
export const GEMM_HIERARCHY_TILE_SHAPES = ['64x64x16', '128x64x16'] as const;

export type GemmHierarchyLevel = (typeof GEMM_HIERARCHY_LEVELS)[number];
export type GemmHierarchyMatrixShape = (typeof GEMM_HIERARCHY_MATRIX_SHAPES)[number];
export type GemmHierarchyTileShape = (typeof GEMM_HIERARCHY_TILE_SHAPES)[number];

export type GemmShape = Readonly<{ m: number; n: number; k: number }>;

export const GEMM_HIERARCHY_MODEL_CONTRACT = {
  modelId: 'bounded-gemm-tiling-hierarchy',
  selectionBoundary: 'two-reviewed-matrix-shapes-two-reviewed-tile-shapes-five-hierarchy-levels',
  shapeNotation: 'M-N-K-work-shape',
  tileOwnershipRule: 'one-thread-block-per-output-tile-with-a-declared-k-slice-loop',
  instructionMeaning: 'source-level-scalar-multiply-accumulate-slot-not-emitted-device-instruction',
  executesCuda: false,
  queriesDevice: false,
  observesInstructionEmission: false,
  compilationEvidence: 'none',
  runtimeEvidence: 'none',
  performanceEvidence: 'none',
  evidenceStatusEffect: 'none',
} as const;

export type GemmHierarchyState = Readonly<{
  matrixShape: GemmHierarchyMatrixShape;
  tileShape: GemmHierarchyTileShape;
  level: GemmHierarchyLevel;
}>;

export type GemmHierarchyPanel = Readonly<{
  level: GemmHierarchyLevel;
  shape: GemmShape;
}>;

export type GemmHierarchyView = Readonly<{
  matrixShape: GemmHierarchyMatrixShape;
  tileShape: GemmHierarchyTileShape;
  level: GemmHierarchyLevel;
  matrix: GemmShape;
  tile: GemmShape;
  threadblock: GemmShape;
  warp: GemmShape;
  instruction: GemmShape;
  outputTileGrid: Readonly<{ rows: number; columns: number; total: number }>;
  kSliceCount: number;
  threadblockCount: number;
  warpsPerThreadblock: number;
  modeledOperationSlotsPerWarpKSlice: number;
  panels: readonly GemmHierarchyPanel[];
  selectedPanel: GemmHierarchyPanel;
  contract: typeof GEMM_HIERARCHY_MODEL_CONTRACT;
}>;

export type GemmHierarchyIssue =
  | 'invalid-state'
  | 'invalid-action'
  | 'unknown-matrix-shape'
  | 'unknown-tile-shape'
  | 'unknown-hierarchy-level';

export type GemmHierarchyViewResult =
  | Readonly<{ accepted: true; view: GemmHierarchyView }>
  | Readonly<{ accepted: false; issue: 'invalid-state' }>;

export type GemmHierarchyStateUpdate =
  | Readonly<{ accepted: true; state: GemmHierarchyState }>
  | Readonly<{ accepted: false; state: GemmHierarchyState; issue: GemmHierarchyIssue }>;

type RecordValue = Record<string, unknown>;

const matrixShapes: Readonly<Record<GemmHierarchyMatrixShape, GemmShape>> = {
  '128x128x32': { m: 128, n: 128, k: 32 },
  '256x128x64': { m: 256, n: 128, k: 64 },
};

const tileShapes: Readonly<Record<GemmHierarchyTileShape, GemmShape>> = {
  '64x64x16': { m: 64, n: 64, k: 16 },
  '128x64x16': { m: 128, n: 64, k: 16 },
};

const warpShape: GemmShape = { m: 32, n: 32, k: 16 };
const instructionShape: GemmShape = { m: 1, n: 1, k: 1 };

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: RecordValue, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function parseMatrixShape(value: unknown): GemmHierarchyMatrixShape | null {
  if (typeof value !== 'string') return null;
  return GEMM_HIERARCHY_MATRIX_SHAPES.find((shape) => shape === value) ?? null;
}

function parseTileShape(value: unknown): GemmHierarchyTileShape | null {
  if (typeof value !== 'string') return null;
  return GEMM_HIERARCHY_TILE_SHAPES.find((shape) => shape === value) ?? null;
}

function parseLevel(value: unknown): GemmHierarchyLevel | null {
  if (typeof value !== 'string') return null;
  return GEMM_HIERARCHY_LEVELS.find((level) => level === value) ?? null;
}

function validState(state: GemmHierarchyState): boolean {
  return isRecord(state)
    && hasExactKeys(state, ['matrixShape', 'tileShape', 'level'])
    && parseMatrixShape(state.matrixShape) !== null
    && parseTileShape(state.tileShape) !== null
    && parseLevel(state.level) !== null;
}

function cloneShape(shape: GemmShape): GemmShape {
  return { ...shape };
}

function buildView(state: GemmHierarchyState): GemmHierarchyView {
  const matrix = cloneShape(matrixShapes[state.matrixShape]);
  const tile = cloneShape(tileShapes[state.tileShape]);
  const threadblock = cloneShape(tile);
  const warp = cloneShape(warpShape);
  const instruction = cloneShape(instructionShape);
  const outputTileGrid = {
    rows: Math.ceil(matrix.m / tile.m),
    columns: Math.ceil(matrix.n / tile.n),
    total: Math.ceil(matrix.m / tile.m) * Math.ceil(matrix.n / tile.n),
  };
  const kSliceCount = Math.ceil(matrix.k / tile.k);
  const warpsPerThreadblock = (tile.m / warp.m) * (tile.n / warp.n);
  const panels: readonly GemmHierarchyPanel[] = [
    {
      level: 'matrix',
      shape: cloneShape(matrix),
    },
    {
      level: 'tile',
      shape: cloneShape(tile),
    },
    {
      level: 'threadblock',
      shape: cloneShape(threadblock),
    },
    {
      level: 'warp',
      shape: cloneShape(warp),
    },
    {
      level: 'instruction',
      shape: cloneShape(instruction),
    },
  ];
  const selected = panels.find((panel) => panel.level === state.level);
  if (!selected) throw new Error('Reviewed GEMM hierarchy level is missing.');

  return {
    matrixShape: state.matrixShape,
    tileShape: state.tileShape,
    level: state.level,
    matrix,
    tile,
    threadblock,
    warp,
    instruction,
    outputTileGrid,
    kSliceCount,
    threadblockCount: outputTileGrid.total,
    warpsPerThreadblock,
    modeledOperationSlotsPerWarpKSlice: warp.m * warp.n * tile.k,
    panels,
    selectedPanel: { ...selected, shape: cloneShape(selected.shape) },
    contract: GEMM_HIERARCHY_MODEL_CONTRACT,
  };
}

export function createGemmHierarchyState(): GemmHierarchyState {
  return { matrixShape: '128x128x32', tileShape: '64x64x16', level: 'matrix' };
}

export function deriveGemmHierarchyView(state: GemmHierarchyState): GemmHierarchyViewResult {
  if (!validState(state)) return { accepted: false, issue: 'invalid-state' };
  return { accepted: true, view: buildView(state) };
}

export function reduceGemmHierarchyState(
  state: GemmHierarchyState,
  action: unknown,
): GemmHierarchyStateUpdate {
  if (!validState(state)) return { accepted: false, state, issue: 'invalid-state' };
  if (!isRecord(action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }

  if (action.type === 'reset') {
    if (!hasExactKeys(action, ['type'])) return { accepted: false, state, issue: 'invalid-action' };
    return { accepted: true, state: createGemmHierarchyState() };
  }
  if (action.type === 'select-matrix-shape') {
    if (!hasExactKeys(action, ['type', 'matrixShape']) || typeof action.matrixShape !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const matrixShape = parseMatrixShape(action.matrixShape);
    if (matrixShape === null) return { accepted: false, state, issue: 'unknown-matrix-shape' };
    return { accepted: true, state: { ...state, matrixShape } };
  }
  if (action.type === 'select-tile-shape') {
    if (!hasExactKeys(action, ['type', 'tileShape']) || typeof action.tileShape !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const tileShape = parseTileShape(action.tileShape);
    if (tileShape === null) return { accepted: false, state, issue: 'unknown-tile-shape' };
    return { accepted: true, state: { ...state, tileShape } };
  }
  if (action.type === 'select-level') {
    if (!hasExactKeys(action, ['type', 'level']) || typeof action.level !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const level = parseLevel(action.level);
    if (level === null) return { accepted: false, state, issue: 'unknown-hierarchy-level' };
    return { accepted: true, state: { ...state, level } };
  }
  return { accepted: false, state, issue: 'invalid-action' };
}
