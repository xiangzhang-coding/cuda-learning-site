// SPDX-License-Identifier: Apache-2.0

export const ARTIFACT_PIPELINE_TOOLKIT_LANES = ['11.8.0', '12.9.2', '13.3.1'] as const;
export const ARTIFACT_PIPELINE_MODES = ['whole-program', 'separate-compilation-rdc'] as const;
export const ARTIFACT_PIPELINE_DEFAULT_LANE = '11.8.0';
export const ARTIFACT_PIPELINE_DEFAULT_TARGET_PLAN_ID = 'baseline-75';
export const ARTIFACT_PIPELINE_DEFAULT_MODE = 'whole-program';

export const ARTIFACT_PIPELINE_STAGE_IDS = [
  'source-split',
  'device-ptx',
  'device-cubin',
  'fatbinary',
  'host-object',
  'optional-device-link',
  'final-link',
] as const;

export type ArtifactPipelineToolkitLane = (typeof ARTIFACT_PIPELINE_TOOLKIT_LANES)[number];
export type ArtifactPipelineMode = (typeof ARTIFACT_PIPELINE_MODES)[number];
export type ArtifactPipelineTargetPlanId = 'baseline-75' | 'exact-90a' | 'family-100f';
export type ArtifactPipelineTargetScope = 'baseline' | 'exact-architecture' | 'same-family';
export type ArtifactPipelineStageId = (typeof ARTIFACT_PIPELINE_STAGE_IDS)[number];
export type ArtifactPipelineBranch = 'host-and-device' | 'device' | 'package' | 'host' | 'conditional' | 'link';
export type ArtifactPipelineStageState = 'complete' | 'current' | 'pending' | 'skipped';

export type ArtifactPipelineTargetPlan = Readonly<{
  id: ArtifactPipelineTargetPlanId;
  reviewed: true;
  virtualTarget: string;
  realTarget: string;
  targetScope: ArtifactPipelineTargetScope;
  toolkitLanes: readonly ArtifactPipelineToolkitLane[];
}>;

const ALL_REVIEWED_LANES = ARTIFACT_PIPELINE_TOOLKIT_LANES;
const QUALIFIED_TARGET_LANES = ['12.9.2', '13.3.1'] as const;

export const ARTIFACT_PIPELINE_TARGET_PLANS = [
  {
    id: 'baseline-75',
    reviewed: true,
    virtualTarget: 'compute_75',
    realTarget: 'sm_75',
    targetScope: 'baseline',
    toolkitLanes: ALL_REVIEWED_LANES,
  },
  {
    id: 'exact-90a',
    reviewed: true,
    virtualTarget: 'compute_90a',
    realTarget: 'sm_90a',
    targetScope: 'exact-architecture',
    toolkitLanes: QUALIFIED_TARGET_LANES,
  },
  {
    id: 'family-100f',
    reviewed: true,
    virtualTarget: 'compute_100f',
    realTarget: 'sm_100f',
    targetScope: 'same-family',
    toolkitLanes: QUALIFIED_TARGET_LANES,
  },
] as const satisfies readonly ArtifactPipelineTargetPlan[];

export type ArtifactPipelineStage = Readonly<{
  id: ArtifactPipelineStageId;
  branch: ArtifactPipelineBranch;
  optional: boolean;
}>;

export const ARTIFACT_PIPELINE_STAGES = [
  { id: 'source-split', branch: 'host-and-device', optional: false },
  { id: 'device-ptx', branch: 'device', optional: false },
  { id: 'device-cubin', branch: 'device', optional: false },
  { id: 'fatbinary', branch: 'package', optional: false },
  { id: 'host-object', branch: 'host', optional: false },
  { id: 'optional-device-link', branch: 'conditional', optional: true },
  { id: 'final-link', branch: 'link', optional: false },
] as const satisfies readonly ArtifactPipelineStage[];

export const ARTIFACT_PIPELINE_MODEL_CONTRACT = {
  modelId: 'reviewed-nvcc-artifact-flow',
  selectionBoundary: 'exact-reviewed-toolkit-lane-target-plan-and-mode-only',
  flowMeaning: 'documented-phase-model-not-observed-build',
  optionalDeviceLink: 'only-when-relocatable-device-code-requires-separate-linking',
  compilationModes: ARTIFACT_PIPELINE_MODES,
  targetModeRelationship: 'independent-explicit-selections',
  runtimeImageSelection: 'unknown',
  executesCompiler: false,
  executesCuda: false,
  queriesDevice: false,
  observesArtifacts: false,
  compilationEvidence: 'none',
  runtimeEvidence: 'none',
  performanceEvidence: 'none',
  evidenceStatusEffect: 'none',
  sourceFactIds: ['SRC-CUDA-016', 'SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033'],
} as const;

export type ArtifactPipelineReviewedSelection = Readonly<{
  lane: ArtifactPipelineToolkitLane;
  targetPlanId: ArtifactPipelineTargetPlanId;
  mode: ArtifactPipelineMode;
}>;

export const ARTIFACT_PIPELINE_REVIEWED_SELECTIONS = ARTIFACT_PIPELINE_TOOLKIT_LANES.flatMap(
  (lane) => ARTIFACT_PIPELINE_TARGET_PLANS
    .filter((plan) => plan.toolkitLanes.some((candidate) => candidate === lane))
    .flatMap((plan) => ARTIFACT_PIPELINE_MODES.map((mode) => ({ lane, targetPlanId: plan.id, mode }))),
) satisfies readonly ArtifactPipelineReviewedSelection[];

export type ArtifactPipelineState = Readonly<{
  lane: ArtifactPipelineToolkitLane;
  targetPlanId: ArtifactPipelineTargetPlanId;
  mode: ArtifactPipelineMode;
  stepIndex: number;
}>;

export type ArtifactPipelineIssue =
  | 'invalid-state'
  | 'invalid-action'
  | 'unknown-lane'
  | 'unknown-target-plan'
  | 'unknown-mode'
  | 'unsupported-target-plan'
  | 'sequence-complete';

export type ArtifactPipelineManifest = Readonly<{
  source: 'kernel.cu';
  pipelineMode: ArtifactPipelineMode;
  virtualTarget: string;
  realTarget: string;
  ptxImage: string;
  cubinImage: string;
  cubinPayload: 'SASS';
  fatbinaryImages: readonly [string, string];
  hostObject: 'host-object-with-embedded-fatbinary';
  deviceLink: 'skipped-whole-program' | 'active-separate-compilation-rdc';
  finalArtifact: 'linked-executable-or-shared-library';
  runtimeImageSelection: 'unknown';
}>;

export type ArtifactPipelineStageFrame = Readonly<{
  id: ArtifactPipelineStageId;
  branch: ArtifactPipelineBranch;
  optional: boolean;
  state: ArtifactPipelineStageState;
}>;

export type ArtifactPipelineFrame = Readonly<{
  lane: ArtifactPipelineToolkitLane;
  targetPlan: ArtifactPipelineTargetPlan;
  mode: ArtifactPipelineMode;
  stepIndex: number;
  stageCount: number;
  sequenceComplete: boolean;
  currentStage: ArtifactPipelineStage | null;
  stages: readonly ArtifactPipelineStageFrame[];
  manifest: ArtifactPipelineManifest;
  contract: typeof ARTIFACT_PIPELINE_MODEL_CONTRACT;
}>;

export type ArtifactPipelineStateUpdate =
  | Readonly<{ accepted: true; state: ArtifactPipelineState }>
  | Readonly<{ accepted: false; state: ArtifactPipelineState; issue: ArtifactPipelineIssue }>;

export type ArtifactPipelineFrameResult =
  | Readonly<{ accepted: true; frame: ArtifactPipelineFrame }>
  | Readonly<{
      accepted: false;
      issue: Extract<
        ArtifactPipelineIssue,
        'invalid-state' | 'unknown-lane' | 'unknown-target-plan' | 'unknown-mode' | 'unsupported-target-plan'
      >;
    }>;

export type ArtifactPipelineFramesResult =
  | Readonly<{ accepted: true; frames: readonly ArtifactPipelineFrame[] }>
  | Readonly<{
      accepted: false;
      issue: Extract<ArtifactPipelineIssue, 'unknown-lane' | 'unknown-target-plan' | 'unknown-mode' | 'unsupported-target-plan'>;
    }>;

function parseToolkitLane(value: unknown): ArtifactPipelineToolkitLane | null {
  return typeof value === 'string' && ARTIFACT_PIPELINE_TOOLKIT_LANES.some((lane) => lane === value)
    ? value as ArtifactPipelineToolkitLane
    : null;
}

function parseMode(value: unknown): ArtifactPipelineMode | null {
  return typeof value === 'string' && ARTIFACT_PIPELINE_MODES.some((mode) => mode === value)
    ? value as ArtifactPipelineMode
    : null;
}

function findTargetPlan(value: unknown) {
  return typeof value === 'string'
    ? ARTIFACT_PIPELINE_TARGET_PLANS.find(({ id }) => id === value)
    : undefined;
}

function validateSelection(laneValue: unknown, targetPlanValue: unknown, modeValue: unknown) {
  const lane = parseToolkitLane(laneValue);
  if (!lane) return { accepted: false, issue: 'unknown-lane' } as const;
  const targetPlan = findTargetPlan(targetPlanValue);
  if (!targetPlan) return { accepted: false, issue: 'unknown-target-plan' } as const;
  if (!targetPlan.toolkitLanes.some((candidate) => candidate === lane)) {
    return { accepted: false, issue: 'unsupported-target-plan' } as const;
  }
  const mode = parseMode(modeValue);
  if (!mode) return { accepted: false, issue: 'unknown-mode' } as const;
  return { accepted: true, lane, targetPlan, mode } as const;
}

function getActiveStages(mode: ArtifactPipelineMode): readonly ArtifactPipelineStage[] {
  return mode === 'whole-program'
    ? ARTIFACT_PIPELINE_STAGES.filter(({ id }) => id !== 'optional-device-link')
    : ARTIFACT_PIPELINE_STAGES;
}

function validateState(state: ArtifactPipelineState) {
  if (!state || typeof state !== 'object') {
    return { accepted: false, issue: 'invalid-state' } as const;
  }
  const selection = validateSelection(state.lane, state.targetPlanId, state.mode);
  if (!selection.accepted) return selection;
  const stageCount = getActiveStages(selection.mode).length;
  if (!Number.isInteger(state.stepIndex) || state.stepIndex < 0 || state.stepIndex > stageCount) {
    return { accepted: false, issue: 'invalid-state' } as const;
  }
  return selection;
}

function buildManifest(targetPlan: ArtifactPipelineTargetPlan, mode: ArtifactPipelineMode): ArtifactPipelineManifest {
  return {
    source: 'kernel.cu',
    pipelineMode: mode,
    virtualTarget: targetPlan.virtualTarget,
    realTarget: targetPlan.realTarget,
    ptxImage: `${targetPlan.virtualTarget}.ptx`,
    cubinImage: `${targetPlan.realTarget}.cubin`,
    cubinPayload: 'SASS',
    fatbinaryImages: [targetPlan.realTarget, targetPlan.virtualTarget],
    hostObject: 'host-object-with-embedded-fatbinary',
    deviceLink: mode === 'whole-program' ? 'skipped-whole-program' : 'active-separate-compilation-rdc',
    finalArtifact: 'linked-executable-or-shared-library',
    runtimeImageSelection: ARTIFACT_PIPELINE_MODEL_CONTRACT.runtimeImageSelection,
  };
}

function buildFrame(
  lane: ArtifactPipelineToolkitLane,
  targetPlan: ArtifactPipelineTargetPlan,
  mode: ArtifactPipelineMode,
  stepIndex: number,
): ArtifactPipelineFrame {
  const activeStages = getActiveStages(mode);
  return {
    lane,
    targetPlan,
    mode,
    stepIndex,
    stageCount: activeStages.length,
    sequenceComplete: stepIndex === activeStages.length,
    currentStage: activeStages[stepIndex] ?? null,
    stages: ARTIFACT_PIPELINE_STAGES.map((stage) => {
      const activeIndex = activeStages.findIndex(({ id }) => id === stage.id);
      const state: ArtifactPipelineStageState = activeIndex === -1
        ? 'skipped'
        : activeIndex < stepIndex
          ? 'complete'
          : activeIndex === stepIndex
            ? 'current'
            : 'pending';
      return { ...stage, state };
    }),
    manifest: buildManifest(targetPlan, mode),
    contract: ARTIFACT_PIPELINE_MODEL_CONTRACT,
  };
}

export function getArtifactPipelineTargetPlans(laneValue: unknown): readonly ArtifactPipelineTargetPlan[] {
  const lane = parseToolkitLane(laneValue);
  if (!lane) return [];
  return ARTIFACT_PIPELINE_TARGET_PLANS.filter((plan) =>
    plan.toolkitLanes.some((candidate) => candidate === lane));
}

export function createArtifactPipelineState(): ArtifactPipelineState {
  return {
    lane: ARTIFACT_PIPELINE_DEFAULT_LANE,
    targetPlanId: ARTIFACT_PIPELINE_DEFAULT_TARGET_PLAN_ID,
    mode: ARTIFACT_PIPELINE_DEFAULT_MODE,
    stepIndex: 0,
  };
}

export function deriveArtifactPipelineFrame(state: ArtifactPipelineState): ArtifactPipelineFrameResult {
  const validation = validateState(state);
  if (!validation.accepted) return validation;
  return {
    accepted: true,
    frame: buildFrame(validation.lane, validation.targetPlan, validation.mode, state.stepIndex),
  };
}

export function deriveArtifactPipelineFrames(
  laneValue: unknown,
  targetPlanValue: unknown,
  modeValue: unknown,
): ArtifactPipelineFramesResult {
  const selection = validateSelection(laneValue, targetPlanValue, modeValue);
  if (!selection.accepted) return selection;
  const stageCount = getActiveStages(selection.mode).length;
  return {
    accepted: true,
    frames: Array.from(
      { length: stageCount + 1 },
      (_, stepIndex) => buildFrame(selection.lane, selection.targetPlan, selection.mode, stepIndex),
    ),
  };
}

export function reduceArtifactPipelineState(
  state: ArtifactPipelineState,
  action: unknown,
): ArtifactPipelineStateUpdate {
  const validation = validateState(state);
  if (!validation.accepted) return { accepted: false, state, issue: validation.issue };
  if (!action || typeof action !== 'object' || !('type' in action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }

  if (action.type === 'step') {
    if (state.stepIndex === getActiveStages(validation.mode).length) {
      return { accepted: false, state, issue: 'sequence-complete' };
    }
    return { accepted: true, state: { ...state, stepIndex: state.stepIndex + 1 } };
  }

  if (action.type === 'reset') {
    return { accepted: true, state: { ...state, stepIndex: 0 } };
  }

  if (action.type === 'select-lane') {
    if (!('lane' in action) || typeof action.lane !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const lane = parseToolkitLane(action.lane);
    if (!lane) return { accepted: false, state, issue: 'unknown-lane' };
    return {
      accepted: true,
      state: {
        lane,
        targetPlanId: ARTIFACT_PIPELINE_DEFAULT_TARGET_PLAN_ID,
        mode: state.mode,
        stepIndex: 0,
      },
    };
  }

  if (action.type === 'select-target-plan') {
    if (!('targetPlanId' in action) || typeof action.targetPlanId !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const selection = validateSelection(state.lane, action.targetPlanId, state.mode);
    if (!selection.accepted) return { accepted: false, state, issue: selection.issue };
    return {
      accepted: true,
      state: { ...state, targetPlanId: selection.targetPlan.id, stepIndex: 0 },
    };
  }

  if (action.type === 'select-mode') {
    if (!('mode' in action) || typeof action.mode !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const mode = parseMode(action.mode);
    if (!mode) return { accepted: false, state, issue: 'unknown-mode' };
    return {
      accepted: true,
      state: { ...state, mode, stepIndex: 0 },
    };
  }

  return { accepted: false, state, issue: 'invalid-action' };
}
