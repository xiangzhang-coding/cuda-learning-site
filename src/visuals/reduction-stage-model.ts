// SPDX-License-Identifier: Apache-2.0

export const REDUCTION_STAGE_VARIANTS = ['adjacent-pairs', 'stride-halving'] as const;
export const REDUCTION_STAGE_ELEMENT_COUNTS = [5, 6, 8] as const;
export const REDUCTION_STAGE_INPUT_VALUES = [3, 1, 4, 1, 5, 9, 2, 6] as const;
export const REDUCTION_STAGE_LANE_COUNT = 8;
export const REDUCTION_STAGE_FRAME_COUNT = 4;

export type ReductionStageVariant = (typeof REDUCTION_STAGE_VARIANTS)[number];
export type ReductionStageElementCount = (typeof REDUCTION_STAGE_ELEMENT_COUNTS)[number];
export type ReductionStageLaneState = 'active' | 'inactive';

export const REDUCTION_STAGE_MODEL_CONTRACT = {
  modelId: 'bounded-eight-lane-reduction-stage-ledger',
  selectionBoundary: 'two-reviewed-variants-three-reviewed-element-counts',
  stageMeaning: 'declared-integer-sum-dependency-stages-not-device-execution',
  inactiveLaneValue: 0,
  executesCuda: false,
  queriesDevice: false,
  compilationEvidence: 'none',
  runtimeEvidence: 'none',
  performanceEvidence: 'none',
  evidenceStatusEffect: 'none',
} as const;

export type ReductionStageLane = Readonly<{
  lane: number;
  state: ReductionStageLaneState;
  value: number;
}>;

export type ReductionStageFrame = Readonly<{
  variant: ReductionStageVariant;
  elementCount: ReductionStageElementCount;
  stepIndex: number;
  sequenceComplete: boolean;
  lanes: readonly ReductionStageLane[];
}>;

export type ReductionStageState = Readonly<{
  variant: ReductionStageVariant;
  elementCount: ReductionStageElementCount;
  stepIndex: number;
}>;

export type ReductionStageIssue =
  | 'invalid-state'
  | 'invalid-action'
  | 'unknown-variant'
  | 'unknown-element-count'
  | 'sequence-complete';

export type ReductionStageFrameResult =
  | Readonly<{ accepted: true; frame: ReductionStageFrame }>
  | Readonly<{ accepted: false; issue: ReductionStageIssue }>;

export type ReductionStageFramesResult =
  | Readonly<{ accepted: true; frames: readonly ReductionStageFrame[] }>
  | Readonly<{ accepted: false; issue: ReductionStageIssue }>;

export type ReductionStageStateUpdate =
  | Readonly<{ accepted: true; state: ReductionStageState }>
  | Readonly<{ accepted: false; state: ReductionStageState; issue: ReductionStageIssue }>;

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: RecordValue, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function parseVariant(value: unknown): ReductionStageVariant | null {
  if (typeof value !== 'string') return null;
  return REDUCTION_STAGE_VARIANTS.find((variant) => variant === value) ?? null;
}

function parseElementCount(value: unknown): ReductionStageElementCount | null {
  if (typeof value !== 'number') return null;
  return REDUCTION_STAGE_ELEMENT_COUNTS.find((count) => count === value) ?? null;
}

function makeFrame(
  variant: ReductionStageVariant,
  elementCount: ReductionStageElementCount,
  stepIndex: number,
  values: readonly number[],
  active: readonly boolean[],
): ReductionStageFrame {
  return {
    variant,
    elementCount,
    stepIndex,
    sequenceComplete: stepIndex === REDUCTION_STAGE_FRAME_COUNT - 1,
    lanes: Array.from({ length: REDUCTION_STAGE_LANE_COUNT }, (_, lane) => ({
      lane,
      state: active[lane] ? 'active' : 'inactive',
      value: active[lane] ? (values[lane] ?? 0) : 0,
    })),
  };
}

function buildAdjacentPairFrames(elementCount: ReductionStageElementCount): readonly ReductionStageFrame[] {
  const frames: ReductionStageFrame[] = [];
  let values: number[] = Array.from(
    { length: REDUCTION_STAGE_LANE_COUNT },
    (_, lane) => lane < elementCount ? (REDUCTION_STAGE_INPUT_VALUES[lane] ?? 0) : 0,
  );
  let active = Array.from({ length: REDUCTION_STAGE_LANE_COUNT }, (_, lane) => lane < elementCount);
  frames.push(makeFrame('adjacent-pairs', elementCount, 0, values, active));

  for (let stepIndex = 1; stepIndex < REDUCTION_STAGE_FRAME_COUNT; stepIndex += 1) {
    const groupWidth = 2 ** stepIndex;
    const sourceOffset = groupWidth / 2;
    const nextValues = Array<number>(REDUCTION_STAGE_LANE_COUNT).fill(0);
    const nextActive = Array<boolean>(REDUCTION_STAGE_LANE_COUNT).fill(false);

    for (let lane = 0; lane < REDUCTION_STAGE_LANE_COUNT; lane += groupWidth) {
      const rightLane = lane + sourceOffset;
      if (!active[lane] && !active[rightLane]) continue;
      nextActive[lane] = true;
      nextValues[lane] = (active[lane] ? (values[lane] ?? 0) : 0)
        + (active[rightLane] ? (values[rightLane] ?? 0) : 0);
    }

    values = nextValues;
    active = nextActive;
    frames.push(makeFrame('adjacent-pairs', elementCount, stepIndex, values, active));
  }

  return frames;
}

function buildStrideHalvingFrames(elementCount: ReductionStageElementCount): readonly ReductionStageFrame[] {
  const frames: ReductionStageFrame[] = [];
  let values: number[] = Array.from(
    { length: REDUCTION_STAGE_LANE_COUNT },
    (_, lane) => lane < elementCount ? (REDUCTION_STAGE_INPUT_VALUES[lane] ?? 0) : 0,
  );
  let active = Array.from({ length: REDUCTION_STAGE_LANE_COUNT }, (_, lane) => lane < elementCount);
  frames.push(makeFrame('stride-halving', elementCount, 0, values, active));

  for (let stepIndex = 1; stepIndex < REDUCTION_STAGE_FRAME_COUNT; stepIndex += 1) {
    const sourceOffset = 2 ** (REDUCTION_STAGE_FRAME_COUNT - stepIndex - 1);
    const nextValues = Array<number>(REDUCTION_STAGE_LANE_COUNT).fill(0);
    const nextActive = Array<boolean>(REDUCTION_STAGE_LANE_COUNT).fill(false);

    for (let lane = 0; lane < sourceOffset; lane += 1) {
      const rightLane = lane + sourceOffset;
      if (!active[lane] && !active[rightLane]) continue;
      nextActive[lane] = true;
      nextValues[lane] = (active[lane] ? (values[lane] ?? 0) : 0)
        + (active[rightLane] ? (values[rightLane] ?? 0) : 0);
    }

    values = nextValues;
    active = nextActive;
    frames.push(makeFrame('stride-halving', elementCount, stepIndex, values, active));
  }

  return frames;
}

function buildFrames(
  variant: ReductionStageVariant,
  elementCount: ReductionStageElementCount,
): readonly ReductionStageFrame[] {
  return variant === 'adjacent-pairs'
    ? buildAdjacentPairFrames(elementCount)
    : buildStrideHalvingFrames(elementCount);
}

function validateState(state: ReductionStageState):
  | Readonly<{ accepted: true; variant: ReductionStageVariant; elementCount: ReductionStageElementCount }>
  | Readonly<{ accepted: false; issue: 'invalid-state' }> {
  if (!isRecord(state) || !hasExactKeys(state, ['variant', 'elementCount', 'stepIndex'])) {
    return { accepted: false, issue: 'invalid-state' };
  }
  const variant = parseVariant(state.variant);
  const elementCount = parseElementCount(state.elementCount);
  if (
    !variant
    || !elementCount
    || !Number.isInteger(state.stepIndex)
    || state.stepIndex < 0
    || state.stepIndex >= REDUCTION_STAGE_FRAME_COUNT
  ) {
    return { accepted: false, issue: 'invalid-state' };
  }
  return { accepted: true, variant, elementCount };
}

export function createReductionStageState(): ReductionStageState {
  return { variant: 'adjacent-pairs', elementCount: 5, stepIndex: 0 };
}

export function deriveReductionStageFrames(
  variantValue: unknown,
  elementCountValue: unknown,
): ReductionStageFramesResult {
  const variant = parseVariant(variantValue);
  if (!variant) return { accepted: false, issue: 'unknown-variant' };
  const elementCount = parseElementCount(elementCountValue);
  if (!elementCount) return { accepted: false, issue: 'unknown-element-count' };
  return { accepted: true, frames: buildFrames(variant, elementCount) };
}

export function deriveReductionStageFrame(state: ReductionStageState): ReductionStageFrameResult {
  const validation = validateState(state);
  if (!validation.accepted) return validation;
  const frame = buildFrames(validation.variant, validation.elementCount)[state.stepIndex];
  return frame ? { accepted: true, frame } : { accepted: false, issue: 'invalid-state' };
}

export function reduceReductionStageState(
  state: ReductionStageState,
  action: unknown,
): ReductionStageStateUpdate {
  const validation = validateState(state);
  if (!validation.accepted) return { accepted: false, state, issue: validation.issue };
  if (!isRecord(action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }

  if (action.type === 'step') {
    if (!hasExactKeys(action, ['type'])) return { accepted: false, state, issue: 'invalid-action' };
    if (state.stepIndex === REDUCTION_STAGE_FRAME_COUNT - 1) {
      return { accepted: false, state, issue: 'sequence-complete' };
    }
    return { accepted: true, state: { ...state, stepIndex: state.stepIndex + 1 } };
  }

  if (action.type === 'reset') {
    if (!hasExactKeys(action, ['type'])) return { accepted: false, state, issue: 'invalid-action' };
    return { accepted: true, state: { ...state, stepIndex: 0 } };
  }

  if (action.type === 'select-variant') {
    if (!hasExactKeys(action, ['type', 'variant']) || typeof action.variant !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const variant = parseVariant(action.variant);
    if (!variant) return { accepted: false, state, issue: 'unknown-variant' };
    return { accepted: true, state: { variant, elementCount: state.elementCount, stepIndex: 0 } };
  }

  if (action.type === 'select-element-count') {
    if (!hasExactKeys(action, ['type', 'elementCount']) || typeof action.elementCount !== 'number') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const elementCount = parseElementCount(action.elementCount);
    if (!elementCount) return { accepted: false, state, issue: 'unknown-element-count' };
    return { accepted: true, state: { variant: state.variant, elementCount, stepIndex: 0 } };
  }

  return { accepted: false, state, issue: 'invalid-action' };
}
