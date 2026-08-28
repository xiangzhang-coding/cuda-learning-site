// SPDX-License-Identifier: Apache-2.0

export const WARP_DIVERGENCE_STAGES = [
  { id: 'before-branch' },
  { id: 'predicate-evaluated' },
  { id: 'true-path' },
  { id: 'false-path' },
  { id: 'logical-join' },
] as const;

export const WARP_DIVERGENCE_PRESETS = [
  { id: 'uniform-true', trueLanes: Array.from({ length: 32 }, (_, lane) => lane) },
  { id: 'uniform-false', trueLanes: [] },
  { id: 'lower-half', trueLanes: Array.from({ length: 16 }, (_, lane) => lane) },
  { id: 'alternating', trueLanes: Array.from({ length: 16 }, (_, index) => index * 2) },
  { id: 'non-contiguous', trueLanes: [0, 1, 4, 7, 8, 13, 17, 18, 23, 27, 30] },
] as const;

export const WARP_DIVERGENCE_MODEL_CONTRACT = {
  lanes: 32,
  teachingPathOrder: 'deterministic-not-hardware-scheduling',
  logicalJoin: 'control-flow-only-not-memory-synchronization',
  independentThreadScheduling: 'compute-capability-7.0-or-newer',
  implicitLockstepAssumptions: 'invalid',
  executesCuda: false,
  timing: 'not-modeled',
  evidenceStatusEffect: 'none',
} as const;

export type WarpDivergenceStageId = (typeof WARP_DIVERGENCE_STAGES)[number]['id'];
export type WarpDivergencePresetId = (typeof WARP_DIVERGENCE_PRESETS)[number]['id'];

export type WarpDivergenceTraceStage = Readonly<{
  id: WarpDivergenceStageId;
  activeMask: readonly number[];
  disposition: 'executed' | 'skipped' | 'logical-join';
}>;

export type WarpDivergenceTrace = Readonly<{
  presetId: WarpDivergencePresetId;
  lanes: readonly Readonly<{ lane: number; predicate: boolean }>[];
  participatingMask: readonly number[];
  trueMask: readonly number[];
  falseMask: readonly number[];
  divergent: boolean;
  stages: readonly WarpDivergenceTraceStage[];
  contract: typeof WARP_DIVERGENCE_MODEL_CONTRACT;
}>;

export type WarpDivergenceState = Readonly<{
  presetId: WarpDivergencePresetId;
  stageIndex: number;
}>;

export type WarpDivergenceAction =
  | Readonly<{ type: 'step' }>
  | Readonly<{ type: 'select-preset'; presetId: string }>
  | Readonly<{ type: 'reset' }>;

const participatingMask = Array.from({ length: WARP_DIVERGENCE_MODEL_CONTRACT.lanes }, (_, lane) => lane);

export function createWarpDivergenceTrace(presetId: WarpDivergencePresetId): WarpDivergenceTrace {
  const preset = WARP_DIVERGENCE_PRESETS.find(({ id }) => id === presetId);
  if (!preset) throw new Error(`Unknown warp-divergence preset: ${presetId}`);

  const trueSet = new Set<number>(preset.trueLanes);
  const trueMask = participatingMask.filter((lane) => trueSet.has(lane));
  const falseMask = participatingMask.filter((lane) => !trueSet.has(lane));
  const pathStage = (id: 'true-path' | 'false-path', activeMask: readonly number[]): WarpDivergenceTraceStage => ({
    id,
    activeMask,
    disposition: activeMask.length === 0 ? 'skipped' : 'executed',
  });

  return {
    presetId,
    lanes: participatingMask.map((lane) => ({ lane, predicate: trueSet.has(lane) })),
    participatingMask: [...participatingMask],
    trueMask,
    falseMask,
    divergent: trueMask.length > 0 && falseMask.length > 0,
    stages: [
      { id: 'before-branch', activeMask: [...participatingMask], disposition: 'executed' },
      { id: 'predicate-evaluated', activeMask: [...participatingMask], disposition: 'executed' },
      pathStage('true-path', trueMask),
      pathStage('false-path', falseMask),
      { id: 'logical-join', activeMask: [...participatingMask], disposition: 'logical-join' },
    ],
    contract: WARP_DIVERGENCE_MODEL_CONTRACT,
  };
}

export function createWarpDivergenceState(): WarpDivergenceState {
  return { presetId: 'lower-half', stageIndex: 0 };
}

export function reduceWarpDivergenceState(
  state: WarpDivergenceState,
  action: WarpDivergenceAction,
): WarpDivergenceState {
  switch (action.type) {
    case 'step':
      return state.stageIndex === WARP_DIVERGENCE_STAGES.length - 1
        ? state
        : { ...state, stageIndex: state.stageIndex + 1 };
    case 'select-preset': {
      const preset = WARP_DIVERGENCE_PRESETS.find(({ id }) => id === action.presetId);
      return preset ? { presetId: preset.id, stageIndex: 0 } : state;
    }
    case 'reset':
      return createWarpDivergenceState();
  }
}
