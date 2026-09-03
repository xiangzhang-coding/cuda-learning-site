// SPDX-License-Identifier: Apache-2.0

export const ATTENTION_IO_SEQUENCE_SHAPES = ['8x4', '16x8'] as const;
export const ATTENTION_IO_TILE_SHAPES = ['4x4', '8x8'] as const;
export const ATTENTION_IO_STAGES = ['score', 'normalize', 'value'] as const;

export type AttentionIoSequenceShape = (typeof ATTENTION_IO_SEQUENCE_SHAPES)[number];
export type AttentionIoTileShape = (typeof ATTENTION_IO_TILE_SHAPES)[number];
export type AttentionIoStage = (typeof ATTENTION_IO_STAGES)[number];

export const ATTENTION_IO_MODEL_CONTRACT = {
  modelId: 'bounded-exact-attention-io-ledger',
  selectionBoundary: 'two-reviewed-sequence-shapes-two-reviewed-tile-shapes-three-forward-stages',
  attentionScope: 'single-head-unmasked-forward-self-attention',
  schedule: 'query-tile-outer-key-value-tile-sweep',
  accountingBoundary: 'logical-slow-fast-store-transfers',
  storageType: 'fp32',
  elementBytes: 4,
  includes: 'precomputed-q-k-v-inputs-score-normalization-value-aggregation-output',
  excludes: 'projections-mask-bias-dropout-backward-allocation-cache-lines-host-device-traffic',
  exactMeaning: 'equivalent-dense-attention-in-real-arithmetic-not-bitwise-identity',
  executesCuda: false,
  queriesDevice: false,
  compilationEvidence: 'none',
  runtimeEvidence: 'none',
  performanceEvidence: 'none',
  evidenceStatusEffect: 'none',
} as const;

export type AttentionIoState = Readonly<{
  sequenceShape: AttentionIoSequenceShape;
  tileShape: AttentionIoTileShape;
  stage: AttentionIoStage;
}>;

export type AttentionSequence = Readonly<{
  queryRows: number;
  keyRows: number;
  keyDepth: number;
  valueDepth: number;
}>;

export type AttentionTile = Readonly<{
  queryRows: number;
  keyRows: number;
}>;

export type AttentionStageTraffic = Readonly<{
  stage: AttentionIoStage;
  elements: number;
  bytes: number;
}>;

export type AttentionTrafficLedger = Readonly<{
  stages: readonly AttentionStageTraffic[];
  elements: number;
  bytes: number;
}>;

export type AttentionIoView = Readonly<{
  sequenceShape: AttentionIoSequenceShape;
  tileShape: AttentionIoTileShape;
  stage: AttentionIoStage;
  sequence: AttentionSequence;
  tile: AttentionTile;
  queryTileCount: number;
  keyTileCount: number;
  scoreTileCount: number;
  fullScoreElements: number;
  temporaryScoreTileElements: number;
  materialized: AttentionTrafficLedger;
  tiled: AttentionTrafficLedger;
  analysisDifference: Readonly<{ elements: number; bytes: number }>;
  selectedStage: Readonly<{
    stage: AttentionIoStage;
    materializedElements: number;
    materializedBytes: number;
    tiledElements: number;
    tiledBytes: number;
  }>;
  contract: typeof ATTENTION_IO_MODEL_CONTRACT;
}>;

export type AttentionIoIssue =
  | 'invalid-state'
  | 'invalid-action'
  | 'unknown-sequence-shape'
  | 'unknown-tile-shape'
  | 'unknown-stage';

export type AttentionIoViewResult =
  | Readonly<{ accepted: true; view: AttentionIoView }>
  | Readonly<{ accepted: false; issue: 'invalid-state' }>;

export type AttentionIoStateUpdate =
  | Readonly<{ accepted: true; state: AttentionIoState }>
  | Readonly<{ accepted: false; state: AttentionIoState; issue: AttentionIoIssue }>;

type RecordValue = Record<string, unknown>;

const sequenceShapes: Readonly<Record<AttentionIoSequenceShape, AttentionSequence>> = {
  '8x4': { queryRows: 8, keyRows: 8, keyDepth: 4, valueDepth: 4 },
  '16x8': { queryRows: 16, keyRows: 16, keyDepth: 8, valueDepth: 8 },
};

const tileShapes: Readonly<Record<AttentionIoTileShape, AttentionTile>> = {
  '4x4': { queryRows: 4, keyRows: 4 },
  '8x8': { queryRows: 8, keyRows: 8 },
};

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: RecordValue, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function parseSequenceShape(value: unknown): AttentionIoSequenceShape | null {
  if (typeof value !== 'string') return null;
  return ATTENTION_IO_SEQUENCE_SHAPES.find((shape) => shape === value) ?? null;
}

function parseTileShape(value: unknown): AttentionIoTileShape | null {
  if (typeof value !== 'string') return null;
  return ATTENTION_IO_TILE_SHAPES.find((shape) => shape === value) ?? null;
}

function parseStage(value: unknown): AttentionIoStage | null {
  if (typeof value !== 'string') return null;
  return ATTENTION_IO_STAGES.find((stage) => stage === value) ?? null;
}

function validState(state: AttentionIoState): boolean {
  return isRecord(state)
    && hasExactKeys(state, ['sequenceShape', 'tileShape', 'stage'])
    && parseSequenceShape(state.sequenceShape) !== null
    && parseTileShape(state.tileShape) !== null
    && parseStage(state.stage) !== null;
}

function stageTraffic(stage: AttentionIoStage, elements: number): AttentionStageTraffic {
  return { stage, elements, bytes: elements * ATTENTION_IO_MODEL_CONTRACT.elementBytes };
}

function ledger(stages: readonly AttentionStageTraffic[]): AttentionTrafficLedger {
  const elements = stages.reduce((sum, stage) => sum + stage.elements, 0);
  return {
    stages,
    elements,
    bytes: elements * ATTENTION_IO_MODEL_CONTRACT.elementBytes,
  };
}

function buildView(state: AttentionIoState): AttentionIoView {
  const sequence = { ...sequenceShapes[state.sequenceShape] };
  const tile = { ...tileShapes[state.tileShape] };
  const { queryRows, keyRows, keyDepth, valueDepth } = sequence;
  const queryTileCount = Math.ceil(queryRows / tile.queryRows);
  const keyTileCount = Math.ceil(keyRows / tile.keyRows);
  const fullScoreElements = queryRows * keyRows;

  const materialized = ledger([
    stageTraffic('score', queryRows * keyDepth + keyRows * keyDepth + fullScoreElements),
    stageTraffic('normalize', 4 * fullScoreElements),
    stageTraffic('value', fullScoreElements + keyRows * valueDepth + queryRows * valueDepth),
  ]);
  const tiled = ledger([
    stageTraffic('score', queryRows * keyDepth + queryTileCount * keyRows * keyDepth),
    stageTraffic('normalize', 0),
    stageTraffic('value', queryTileCount * keyRows * valueDepth + queryRows * valueDepth),
  ]);
  const materializedStage = materialized.stages.find(({ stage }) => stage === state.stage);
  const tiledStage = tiled.stages.find(({ stage }) => stage === state.stage);
  if (!materializedStage || !tiledStage) throw new Error('Reviewed attention IO stage is missing.');

  return {
    sequenceShape: state.sequenceShape,
    tileShape: state.tileShape,
    stage: state.stage,
    sequence,
    tile,
    queryTileCount,
    keyTileCount,
    scoreTileCount: queryTileCount * keyTileCount,
    fullScoreElements,
    temporaryScoreTileElements: tile.queryRows * tile.keyRows,
    materialized,
    tiled,
    analysisDifference: {
      elements: materialized.elements - tiled.elements,
      bytes: materialized.bytes - tiled.bytes,
    },
    selectedStage: {
      stage: state.stage,
      materializedElements: materializedStage.elements,
      materializedBytes: materializedStage.bytes,
      tiledElements: tiledStage.elements,
      tiledBytes: tiledStage.bytes,
    },
    contract: ATTENTION_IO_MODEL_CONTRACT,
  };
}

export function createAttentionIoState(): AttentionIoState {
  return { sequenceShape: '8x4', tileShape: '4x4', stage: 'score' };
}

export function deriveAttentionIoView(state: AttentionIoState): AttentionIoViewResult {
  if (!validState(state)) return { accepted: false, issue: 'invalid-state' };
  return { accepted: true, view: buildView(state) };
}

export function reduceAttentionIoState(
  state: AttentionIoState,
  action: unknown,
): AttentionIoStateUpdate {
  if (!validState(state)) return { accepted: false, state, issue: 'invalid-state' };
  if (!isRecord(action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }

  if (action.type === 'reset') {
    if (!hasExactKeys(action, ['type'])) return { accepted: false, state, issue: 'invalid-action' };
    return { accepted: true, state: createAttentionIoState() };
  }
  if (action.type === 'select-sequence-shape') {
    if (!hasExactKeys(action, ['type', 'sequenceShape']) || typeof action.sequenceShape !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const sequenceShape = parseSequenceShape(action.sequenceShape);
    if (sequenceShape === null) return { accepted: false, state, issue: 'unknown-sequence-shape' };
    return { accepted: true, state: { ...state, sequenceShape } };
  }
  if (action.type === 'select-tile-shape') {
    if (!hasExactKeys(action, ['type', 'tileShape']) || typeof action.tileShape !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const tileShape = parseTileShape(action.tileShape);
    if (tileShape === null) return { accepted: false, state, issue: 'unknown-tile-shape' };
    return { accepted: true, state: { ...state, tileShape } };
  }
  if (action.type === 'select-stage') {
    if (!hasExactKeys(action, ['type', 'stage']) || typeof action.stage !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const stage = parseStage(action.stage);
    if (stage === null) return { accepted: false, state, issue: 'unknown-stage' };
    return { accepted: true, state: { ...state, stage } };
  }
  return { accepted: false, state, issue: 'invalid-action' };
}
