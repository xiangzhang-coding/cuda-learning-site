// SPDX-License-Identifier: Apache-2.0

export const TRANSPOSE_TILE_SIZES = [4, 8] as const;
export const TRANSPOSE_TILE_LAYOUTS = ['input-row-major', 'output-row-major'] as const;
export const TRANSPOSE_TILE_PADDINGS = [0, 1] as const;

export type TransposeTileSize = (typeof TRANSPOSE_TILE_SIZES)[number];
export type TransposeTileLayout = (typeof TRANSPOSE_TILE_LAYOUTS)[number];
export type TransposeTilePadding = (typeof TRANSPOSE_TILE_PADDINGS)[number];

export const TRANSPOSE_TILE_MODEL_CONTRACT = {
  modelId: 'bounded-square-transpose-tile-layout',
  selectionBoundary: 'two-reviewed-square-sizes-two-logical-layouts-two-padding-values',
  mappingRule: 'input-row-col-to-output-col-row',
  physicalStrideRule: 'tile-size-plus-padding',
  paddingMeaning: 'physical-shared-slot-with-no-logical-cell',
  executesCuda: false,
  queriesDevice: false,
  compilationEvidence: 'none',
  runtimeEvidence: 'none',
  performanceEvidence: 'none',
  evidenceStatusEffect: 'none',
} as const;

export type TransposeTileState = Readonly<{
  tileSize: TransposeTileSize;
  layout: TransposeTileLayout;
  padding: TransposeTilePadding;
}>;

export type TransposeTileCell = Readonly<{
  inputRow: number;
  inputCol: number;
  outputRow: number;
  outputCol: number;
  inputIndex: number;
  outputIndex: number;
  sharedRow: number;
  sharedCol: number;
  physicalSlotIndex: number;
}>;

export type TransposeTileDataSlot = Readonly<{
  kind: 'data';
  row: number;
  col: number;
  slotIndex: number;
  cell: TransposeTileCell;
}>;

export type TransposeTilePaddingSlot = Readonly<{
  kind: 'padding';
  row: number;
  col: number;
  slotIndex: number;
}>;

export type TransposeTilePhysicalSlot = TransposeTileDataSlot | TransposeTilePaddingSlot;

export type TransposeTilePhysicalRow = Readonly<{
  row: number;
  slots: readonly TransposeTilePhysicalSlot[];
}>;

export type TransposeTileView = Readonly<{
  tileSize: TransposeTileSize;
  layout: TransposeTileLayout;
  padding: TransposeTilePadding;
  logicalCellCount: number;
  sharedRowStride: number;
  cells: readonly TransposeTileCell[];
  inputRowMajor: readonly TransposeTileCell[];
  outputRowMajor: readonly TransposeTileCell[];
  physicalRows: readonly TransposeTilePhysicalRow[];
  paddingSlots: readonly TransposeTilePaddingSlot[];
  contract: typeof TRANSPOSE_TILE_MODEL_CONTRACT;
}>;

export type TransposeTileIssue =
  | 'invalid-state'
  | 'invalid-action'
  | 'unknown-tile-size'
  | 'unknown-layout'
  | 'unknown-padding';

export type TransposeTileViewResult =
  | Readonly<{ accepted: true; view: TransposeTileView }>
  | Readonly<{ accepted: false; issue: 'invalid-state' }>;

export type TransposeTileStateUpdate =
  | Readonly<{ accepted: true; state: TransposeTileState }>
  | Readonly<{ accepted: false; state: TransposeTileState; issue: TransposeTileIssue }>;

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: RecordValue, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function parseTileSize(value: unknown): TransposeTileSize | null {
  if (typeof value !== 'number') return null;
  return TRANSPOSE_TILE_SIZES.find((tileSize) => tileSize === value) ?? null;
}

function parseLayout(value: unknown): TransposeTileLayout | null {
  if (typeof value !== 'string') return null;
  return TRANSPOSE_TILE_LAYOUTS.find((layout) => layout === value) ?? null;
}

function parsePadding(value: unknown): TransposeTilePadding | null {
  if (typeof value !== 'number') return null;
  return TRANSPOSE_TILE_PADDINGS.find((padding) => padding === value) ?? null;
}

function validateState(state: TransposeTileState): boolean {
  return isRecord(state)
    && hasExactKeys(state, ['tileSize', 'layout', 'padding'])
    && parseTileSize(state.tileSize) !== null
    && parseLayout(state.layout) !== null
    && parsePadding(state.padding) !== null;
}

function buildCell(
  tileSize: TransposeTileSize,
  layout: TransposeTileLayout,
  sharedRowStride: number,
  inputRow: number,
  inputCol: number,
): TransposeTileCell {
  const outputRow = inputCol;
  const outputCol = inputRow;
  const sharedRow = layout === 'input-row-major' ? inputRow : outputRow;
  const sharedCol = layout === 'input-row-major' ? inputCol : outputCol;
  return {
    inputRow,
    inputCol,
    outputRow,
    outputCol,
    inputIndex: inputRow * tileSize + inputCol,
    outputIndex: outputRow * tileSize + outputCol,
    sharedRow,
    sharedCol,
    physicalSlotIndex: sharedRow * sharedRowStride + sharedCol,
  };
}

function cloneCell(cell: TransposeTileCell): TransposeTileCell {
  return { ...cell };
}

function buildView(state: TransposeTileState): TransposeTileView {
  const { tileSize, layout, padding } = state;
  const sharedRowStride = tileSize + padding;
  const cells = Array.from({ length: tileSize * tileSize }, (_, inputIndex) => {
    const inputRow = Math.floor(inputIndex / tileSize);
    const inputCol = inputIndex % tileSize;
    return buildCell(tileSize, layout, sharedRowStride, inputRow, inputCol);
  });
  const inputRowMajor = cells.map(cloneCell);
  const outputRowMajor = cells.map(cloneCell).sort((left, right) => left.outputIndex - right.outputIndex);
  const physicalRows = Array.from({ length: tileSize }, (_, row): TransposeTilePhysicalRow => ({
    row,
    slots: Array.from({ length: sharedRowStride }, (_, col): TransposeTilePhysicalSlot => {
      const slotIndex = row * sharedRowStride + col;
      if (col >= tileSize) return { kind: 'padding', row, col, slotIndex };
      const inputRow = layout === 'input-row-major' ? row : col;
      const inputCol = layout === 'input-row-major' ? col : row;
      return {
        kind: 'data',
        row,
        col,
        slotIndex,
        cell: buildCell(tileSize, layout, sharedRowStride, inputRow, inputCol),
      };
    }),
  }));
  const paddingSlots = physicalRows.flatMap(({ slots }) => slots
    .filter((slot): slot is TransposeTilePaddingSlot => slot.kind === 'padding')
    .map((slot) => ({ ...slot })));

  return {
    tileSize,
    layout,
    padding,
    logicalCellCount: tileSize * tileSize,
    sharedRowStride,
    cells,
    inputRowMajor,
    outputRowMajor,
    physicalRows,
    paddingSlots,
    contract: TRANSPOSE_TILE_MODEL_CONTRACT,
  };
}

export function createTransposeTileState(): TransposeTileState {
  return { tileSize: 4, layout: 'input-row-major', padding: 0 };
}

export function deriveTransposeTileView(state: TransposeTileState): TransposeTileViewResult {
  if (!validateState(state)) return { accepted: false, issue: 'invalid-state' };
  return { accepted: true, view: buildView(state) };
}

export function reduceTransposeTileState(
  state: TransposeTileState,
  action: unknown,
): TransposeTileStateUpdate {
  if (!validateState(state)) return { accepted: false, state, issue: 'invalid-state' };
  if (!isRecord(action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }

  if (action.type === 'reset') {
    if (!hasExactKeys(action, ['type'])) return { accepted: false, state, issue: 'invalid-action' };
    return { accepted: true, state: createTransposeTileState() };
  }

  if (action.type === 'select-tile-size') {
    if (!hasExactKeys(action, ['type', 'tileSize']) || typeof action.tileSize !== 'number') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const tileSize = parseTileSize(action.tileSize);
    if (tileSize === null) return { accepted: false, state, issue: 'unknown-tile-size' };
    return { accepted: true, state: { ...state, tileSize } };
  }

  if (action.type === 'select-layout') {
    if (!hasExactKeys(action, ['type', 'layout']) || typeof action.layout !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const layout = parseLayout(action.layout);
    if (layout === null) return { accepted: false, state, issue: 'unknown-layout' };
    return { accepted: true, state: { ...state, layout } };
  }

  if (action.type === 'select-padding') {
    if (!hasExactKeys(action, ['type', 'padding']) || typeof action.padding !== 'number') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const padding = parsePadding(action.padding);
    if (padding === null) return { accepted: false, state, issue: 'unknown-padding' };
    return { accepted: true, state: { ...state, padding } };
  }

  return { accepted: false, state, issue: 'invalid-action' };
}
