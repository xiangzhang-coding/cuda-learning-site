// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  ARTIFACT_PIPELINE_DEFAULT_LANE,
  ARTIFACT_PIPELINE_DEFAULT_TARGET_PLAN_ID,
  ARTIFACT_PIPELINE_MODEL_CONTRACT,
  ARTIFACT_PIPELINE_REVIEWED_SELECTIONS,
  ARTIFACT_PIPELINE_STAGES,
  ARTIFACT_PIPELINE_TARGET_PLANS,
  ARTIFACT_PIPELINE_TOOLKIT_LANES,
  createArtifactPipelineState,
  deriveArtifactPipelineFrame,
  deriveArtifactPipelineFrames,
  getArtifactPipelineTargetPlans,
  reduceArtifactPipelineState,
  type ArtifactPipelineState,
} from '../../src/visuals/artifact-pipeline-model';

describe('VIS09 artifact-pipeline model', () => {
  it('publishes only the seven F06-aligned reviewed lane and target-plan selections', () => {
    expect(ARTIFACT_PIPELINE_TOOLKIT_LANES).toEqual(['11.8.0', '12.9.2', '13.3.1']);
    expect(ARTIFACT_PIPELINE_TARGET_PLANS.map(({ id, virtualTarget, realTarget, targetScope }) => ({
      id,
      virtualTarget,
      realTarget,
      targetScope,
    }))).toEqual([
      {
        id: 'baseline-75',
        virtualTarget: 'compute_75',
        realTarget: 'sm_75',
        targetScope: 'baseline',
      },
      {
        id: 'exact-90a',
        virtualTarget: 'compute_90a',
        realTarget: 'sm_90a',
        targetScope: 'exact-architecture',
      },
      {
        id: 'family-100f',
        virtualTarget: 'compute_100f',
        realTarget: 'sm_100f',
        targetScope: 'same-family',
      },
    ]);
    expect(ARTIFACT_PIPELINE_REVIEWED_SELECTIONS).toEqual([
      { lane: '11.8.0', targetPlanId: 'baseline-75' },
      { lane: '12.9.2', targetPlanId: 'baseline-75' },
      { lane: '12.9.2', targetPlanId: 'exact-90a' },
      { lane: '12.9.2', targetPlanId: 'family-100f' },
      { lane: '13.3.1', targetPlanId: 'baseline-75' },
      { lane: '13.3.1', targetPlanId: 'exact-90a' },
      { lane: '13.3.1', targetPlanId: 'family-100f' },
    ]);
    expect(getArtifactPipelineTargetPlans('11.8.0').map(({ id }) => id)).toEqual(['baseline-75']);
    expect(getArtifactPipelineTargetPlans('12.9.2').map(({ id }) => id)).toEqual([
      'baseline-75',
      'exact-90a',
      'family-100f',
    ]);
    expect(getArtifactPipelineTargetPlans('13.3.1').map(({ id }) => id)).toEqual([
      'baseline-75',
      'exact-90a',
      'family-100f',
    ]);
    expect(getArtifactPipelineTargetPlans('12.8')).toEqual([]);
  });

  it('keeps the teaching model deterministic and evidence-neutral', () => {
    expect(ARTIFACT_PIPELINE_DEFAULT_LANE).toBe('11.8.0');
    expect(ARTIFACT_PIPELINE_DEFAULT_TARGET_PLAN_ID).toBe('baseline-75');
    expect(ARTIFACT_PIPELINE_MODEL_CONTRACT).toMatchObject({
      selectionBoundary: 'exact-reviewed-toolkit-lane-and-target-plan-only',
      flowMeaning: 'documented-phase-model-not-observed-build',
      optionalDeviceLink: 'only-when-relocatable-device-code-requires-separate-linking',
      runtimeImageSelection: 'unknown',
      executesCompiler: false,
      executesCuda: false,
      queriesDevice: false,
      observesArtifacts: false,
      compilationEvidence: 'none',
      runtimeEvidence: 'none',
      performanceEvidence: 'none',
      evidenceStatusEffect: 'none',
      sourceFactIds: ['SRC-CUDA-016'],
    });
    expect(ARTIFACT_PIPELINE_STAGES).toEqual([
      { id: 'source-split', branch: 'host-and-device', optional: false },
      { id: 'device-ptx', branch: 'device', optional: false },
      { id: 'device-cubin', branch: 'device', optional: false },
      { id: 'fatbinary', branch: 'package', optional: false },
      { id: 'host-object', branch: 'host', optional: false },
      { id: 'optional-device-link', branch: 'conditional', optional: true },
      { id: 'final-link', branch: 'link', optional: false },
    ]);
  });

  it('derives stable host/device, PTX, cubin, fatbinary, object, optional link, and final-link frames', () => {
    const result = deriveArtifactPipelineFrames('12.9.2', 'exact-90a');
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error('Expected a reviewed lane/target selection.');

    expect(result.frames).toHaveLength(8);
    expect(result.frames.map(({ stepIndex, currentStage, sequenceComplete }) => ({
      stepIndex,
      currentStage: currentStage?.id ?? null,
      sequenceComplete,
    }))).toEqual([
      { stepIndex: 0, currentStage: 'source-split', sequenceComplete: false },
      { stepIndex: 1, currentStage: 'device-ptx', sequenceComplete: false },
      { stepIndex: 2, currentStage: 'device-cubin', sequenceComplete: false },
      { stepIndex: 3, currentStage: 'fatbinary', sequenceComplete: false },
      { stepIndex: 4, currentStage: 'host-object', sequenceComplete: false },
      { stepIndex: 5, currentStage: 'optional-device-link', sequenceComplete: false },
      { stepIndex: 6, currentStage: 'final-link', sequenceComplete: false },
      { stepIndex: 7, currentStage: null, sequenceComplete: true },
    ]);

    expect(result.frames[0]?.manifest).toEqual({
      source: 'kernel.cu',
      virtualTarget: 'compute_90a',
      realTarget: 'sm_90a',
      ptxImage: 'compute_90a.ptx',
      cubinImage: 'sm_90a.cubin',
      cubinPayload: 'SASS',
      fatbinaryImages: ['sm_90a', 'compute_90a'],
      hostObject: 'host-object-with-embedded-fatbinary',
      optionalDeviceLink: 'conditional-relocatable-device-code',
      finalArtifact: 'linked-executable-or-shared-library',
      runtimeImageSelection: 'unknown',
    });
    expect(result.frames[3]?.stages.map(({ state }) => state)).toEqual([
      'complete',
      'complete',
      'complete',
      'current',
      'pending',
      'pending',
      'pending',
    ]);
    expect(result.frames.at(-1)?.stages.every(({ state }) => state === 'complete')).toBe(true);
  });

  it('steps, resets, and resets the target plan whenever the selected lane changes', () => {
    const initial = createArtifactPipelineState();
    expect(initial).toEqual({ lane: '11.8.0', targetPlanId: 'baseline-75', stepIndex: 0 });

    const lane = reduceArtifactPipelineState(initial, { type: 'select-lane', lane: '12.9.2' });
    expect(lane).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'baseline-75', stepIndex: 0 },
    });
    if (!lane.accepted) throw new Error('Expected lane selection to succeed.');

    const plan = reduceArtifactPipelineState(lane.state, {
      type: 'select-target-plan',
      targetPlanId: 'family-100f',
    });
    expect(plan).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'family-100f', stepIndex: 0 },
    });
    if (!plan.accepted) throw new Error('Expected target-plan selection to succeed.');

    const stepped = reduceArtifactPipelineState(plan.state, { type: 'step' });
    expect(stepped).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'family-100f', stepIndex: 1 },
    });
    if (!stepped.accepted) throw new Error('Expected step to succeed.');

    const changedLane = reduceArtifactPipelineState(stepped.state, {
      type: 'select-lane',
      lane: '13.3.1',
    });
    expect(changedLane).toEqual({
      accepted: true,
      state: { lane: '13.3.1', targetPlanId: 'baseline-75', stepIndex: 0 },
    });

    const reset = reduceArtifactPipelineState(stepped.state, { type: 'reset' });
    expect(reset).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'family-100f', stepIndex: 0 },
    });
  });

  it('fails closed for every malformed or unsupported action and preserves the state reference', () => {
    const state: ArtifactPipelineState = { lane: '11.8.0', targetPlanId: 'baseline-75', stepIndex: 2 };
    for (const action of [
      null,
      7,
      {},
      { type: 7 },
      { type: 'select-lane' },
      { type: 'select-lane', lane: 7 },
      { type: 'select-target-plan' },
      { type: 'select-target-plan', targetPlanId: 7 },
      { type: 'unknown-action' },
    ]) {
      const result = reduceArtifactPipelineState(state, action);
      expect(result).toMatchObject({ accepted: false, state, issue: 'invalid-action' });
      expect(result.state).toBe(state);
    }

    const unknownLane = reduceArtifactPipelineState(state, { type: 'select-lane', lane: '12.8.0' });
    expect(unknownLane).toEqual({ accepted: false, state, issue: 'unknown-lane' });
    expect(unknownLane.state).toBe(state);

    const unknownPlan = reduceArtifactPipelineState(state, {
      type: 'select-target-plan',
      targetPlanId: 'compute-everything',
    });
    expect(unknownPlan).toEqual({ accepted: false, state, issue: 'unknown-target-plan' });
    expect(unknownPlan.state).toBe(state);

    const unsupported = reduceArtifactPipelineState(state, {
      type: 'select-target-plan',
      targetPlanId: 'exact-90a',
    });
    expect(unsupported).toEqual({ accepted: false, state, issue: 'unsupported-target-plan' });
    expect(unsupported.state).toBe(state);

    const complete: ArtifactPipelineState = { ...state, stepIndex: ARTIFACT_PIPELINE_STAGES.length };
    const extraStep = reduceArtifactPipelineState(complete, { type: 'step' });
    expect(extraStep).toEqual({ accepted: false, state: complete, issue: 'sequence-complete' });
    expect(extraStep.state).toBe(complete);
  });

  it('fails closed for invalid state without coercion or mutation', () => {
    const invalidStates = [
      { lane: '12.8.0', targetPlanId: 'baseline-75', stepIndex: 0 },
      { lane: '11.8.0', targetPlanId: 'exact-90a', stepIndex: 0 },
      { lane: '12.9.2', targetPlanId: 'unknown', stepIndex: 0 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', stepIndex: -1 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', stepIndex: 1.5 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', stepIndex: 8 },
    ] as unknown as ArtifactPipelineState[];

    for (const state of invalidStates) {
      expect(deriveArtifactPipelineFrame(state).accepted).toBe(false);
      const update = reduceArtifactPipelineState(state, { type: 'reset' });
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
    }

    expect(deriveArtifactPipelineFrames('11.8.0', 'exact-90a')).toEqual({
      accepted: false,
      issue: 'unsupported-target-plan',
    });
    expect(deriveArtifactPipelineFrames('unknown', 'baseline-75')).toEqual({
      accepted: false,
      issue: 'unknown-lane',
    });
    expect(deriveArtifactPipelineFrames('12.9.2', 'unknown')).toEqual({
      accepted: false,
      issue: 'unknown-target-plan',
    });

    const first = deriveArtifactPipelineFrame(createArtifactPipelineState());
    const second = deriveArtifactPipelineFrame(createArtifactPipelineState());
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});
