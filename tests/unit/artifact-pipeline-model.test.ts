// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  ARTIFACT_PIPELINE_DEFAULT_LANE,
  ARTIFACT_PIPELINE_DEFAULT_MODE,
  ARTIFACT_PIPELINE_DEFAULT_TARGET_PLAN_ID,
  ARTIFACT_PIPELINE_MODEL_CONTRACT,
  ARTIFACT_PIPELINE_MODES,
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
  it('publishes fourteen bounded lane, target-plan, and independent mode selections', () => {
    expect(ARTIFACT_PIPELINE_TOOLKIT_LANES).toEqual(['11.8.0', '12.9.2', '13.3.1']);
    expect(ARTIFACT_PIPELINE_MODES).toEqual(['whole-program', 'separate-compilation-rdc']);
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
      { lane: '11.8.0', targetPlanId: 'baseline-75', mode: 'whole-program' },
      { lane: '11.8.0', targetPlanId: 'baseline-75', mode: 'separate-compilation-rdc' },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'whole-program' },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'separate-compilation-rdc' },
      { lane: '12.9.2', targetPlanId: 'exact-90a', mode: 'whole-program' },
      { lane: '12.9.2', targetPlanId: 'exact-90a', mode: 'separate-compilation-rdc' },
      { lane: '12.9.2', targetPlanId: 'family-100f', mode: 'whole-program' },
      { lane: '12.9.2', targetPlanId: 'family-100f', mode: 'separate-compilation-rdc' },
      { lane: '13.3.1', targetPlanId: 'baseline-75', mode: 'whole-program' },
      { lane: '13.3.1', targetPlanId: 'baseline-75', mode: 'separate-compilation-rdc' },
      { lane: '13.3.1', targetPlanId: 'exact-90a', mode: 'whole-program' },
      { lane: '13.3.1', targetPlanId: 'exact-90a', mode: 'separate-compilation-rdc' },
      { lane: '13.3.1', targetPlanId: 'family-100f', mode: 'whole-program' },
      { lane: '13.3.1', targetPlanId: 'family-100f', mode: 'separate-compilation-rdc' },
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
    expect(ARTIFACT_PIPELINE_DEFAULT_MODE).toBe('whole-program');
    expect(ARTIFACT_PIPELINE_MODEL_CONTRACT).toMatchObject({
      selectionBoundary: 'exact-reviewed-toolkit-lane-target-plan-and-mode-only',
      flowMeaning: 'documented-phase-model-not-observed-build',
      optionalDeviceLink: 'only-when-relocatable-device-code-requires-separate-linking',
      compilationModes: ['whole-program', 'separate-compilation-rdc'],
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
      sourceFactIds: ['SRC-CUDA-016', 'SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033', 'SRC-CUDA-034'],
    });
    expect(ARTIFACT_PIPELINE_STAGES).toEqual({
      'whole-program': [
        { id: 'source-split', identity: 'whole-source-split', mode: 'whole-program', branch: 'host-and-device', optional: false },
        { id: 'device-ptx', identity: 'whole-ptx-image', mode: 'whole-program', branch: 'device', optional: false },
        { id: 'device-cubin', identity: 'whole-cubin-image', mode: 'whole-program', branch: 'device', optional: false },
        { id: 'fatbinary', identity: 'whole-fatbinary', mode: 'whole-program', branch: 'package', optional: false },
        { id: 'host-object', identity: 'whole-host-object', mode: 'whole-program', branch: 'host', optional: false },
        { id: 'optional-device-link', identity: 'whole-device-link-skipped', mode: 'whole-program', branch: 'conditional', optional: true },
        { id: 'final-link', identity: 'whole-final-host-link', mode: 'whole-program', branch: 'link', optional: false },
      ],
      'separate-compilation-rdc': [
        { id: 'source-split', identity: 'rdc-source-pair', mode: 'separate-compilation-rdc', branch: 'host-and-device', optional: false },
        { id: 'device-ptx', identity: 'rdc-cross-tu-device-edge', mode: 'separate-compilation-rdc', branch: 'device', optional: false },
        { id: 'device-cubin', identity: 'rdc-caller-object', mode: 'separate-compilation-rdc', branch: 'host-and-device', optional: false },
        { id: 'fatbinary', identity: 'rdc-device-math-object', mode: 'separate-compilation-rdc', branch: 'host-and-device', optional: false },
        { id: 'host-object', identity: 'rdc-original-object-set', mode: 'separate-compilation-rdc', branch: 'host', optional: false },
        { id: 'optional-device-link', identity: 'rdc-device-link-object', mode: 'separate-compilation-rdc', branch: 'conditional', optional: false },
        { id: 'final-link', identity: 'rdc-final-host-link', mode: 'separate-compilation-rdc', branch: 'link', optional: false },
      ],
    });
  });

  it('skips rather than completes device link throughout whole-program traversal', () => {
    const result = deriveArtifactPipelineFrames('12.9.2', 'exact-90a', 'whole-program');
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error('Expected a reviewed whole-program selection.');

    expect(result.frames).toHaveLength(7);
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
      { stepIndex: 5, currentStage: 'final-link', sequenceComplete: false },
      { stepIndex: 6, currentStage: null, sequenceComplete: true },
    ]);

    expect(result.frames[0]?.manifest).toEqual({
      source: 'kernel.cu',
      pipelineMode: 'whole-program',
      virtualTarget: 'compute_90a',
      realTarget: 'sm_90a',
      ptxImage: 'compute_90a.ptx',
      cubinImage: 'sm_90a.cubin',
      cubinPayload: 'SASS',
      fatbinaryImages: ['sm_90a', 'compute_90a'],
      hostObject: {
        source: 'kernel.cu',
        object: 'kernel.o',
        embeddedDeviceCode: 'fatbinary-with-finalized-device-images',
      },
      deviceLink: {
        state: 'skipped-whole-program',
        object: null,
        linkedExecutableDeviceCode: null,
      },
      finalHostLink: {
        inputs: ['kernel.o'],
        artifact: 'linked-executable-or-shared-library',
      },
      runtimeImageSelection: 'unknown',
    });
    expect(result.frames[0]?.stages.map(({ identity }) => identity)).toEqual([
      'whole-source-split',
      'whole-ptx-image',
      'whole-cubin-image',
      'whole-fatbinary',
      'whole-host-object',
      'whole-device-link-skipped',
      'whole-final-host-link',
    ]);
    expect(result.frames[5]?.stages.map(({ state }) => state)).toEqual([
      'complete',
      'complete',
      'complete',
      'complete',
      'complete',
      'skipped',
      'current',
    ]);
    expect(result.frames.map((frame) =>
      frame.stages.find(({ id }) => id === 'optional-device-link')?.state)).toEqual(
      Array.from({ length: 7 }, () => 'skipped'),
    );
    expect(result.frames.at(-1)?.stages.map(({ state }) => state)).toEqual([
      'complete',
      'complete',
      'complete',
      'complete',
      'complete',
      'skipped',
      'complete',
    ]);
  });

  it('traverses and completes device link before final host link in RDC mode', () => {
    const result = deriveArtifactPipelineFrames('12.9.2', 'exact-90a', 'separate-compilation-rdc');
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error('Expected a reviewed RDC selection.');

    expect(result.frames).toHaveLength(8);
    expect(result.frames[5]).toMatchObject({
      mode: 'separate-compilation-rdc',
      stepIndex: 5,
      stageCount: 7,
      currentStage: { id: 'optional-device-link', identity: 'rdc-device-link-object' },
      manifest: { deviceLink: { state: 'active-separate-compilation-rdc' } },
    });
    expect(result.frames[0]?.manifest).toEqual({
      pipelineMode: 'separate-compilation-rdc',
      virtualTarget: 'compute_90a',
      realTarget: 'sm_90a',
      translationUnits: [
        {
          source: 'caller.cu',
          hostObject: 'caller.o',
          relocatableDeviceCode: 'caller.o::relocatable-device-code',
        },
        {
          source: 'device_math.cu',
          hostObject: 'device_math.o',
          relocatableDeviceCode: 'device_math.o::relocatable-device-code',
        },
      ],
      deviceLink: {
        state: 'active-separate-compilation-rdc',
        objectInputs: ['caller.o', 'device_math.o'],
        relocatableDeviceCodeInputs: [
          'caller.o::relocatable-device-code',
          'device_math.o::relocatable-device-code',
        ],
        object: 'device_link.o',
        linkedExecutableDeviceCode: 'device_link.o::linked-executable-device-code',
      },
      finalHostLink: {
        inputs: ['caller.o', 'device_math.o', 'device_link.o'],
        artifact: 'linked-executable-or-shared-library',
      },
      runtimeImageSelection: 'unknown',
    });
    expect(result.frames[0]?.manifest).not.toHaveProperty('ptxImage');
    expect(result.frames[0]?.manifest).not.toHaveProperty('cubinImage');
    expect(result.frames[0]?.manifest).not.toHaveProperty('fatbinaryImages');
    expect(result.frames[0]?.stages.map(({ identity }) => identity)).toEqual([
      'rdc-source-pair',
      'rdc-cross-tu-device-edge',
      'rdc-caller-object',
      'rdc-device-math-object',
      'rdc-original-object-set',
      'rdc-device-link-object',
      'rdc-final-host-link',
    ]);
    expect(result.frames[6]?.currentStage?.id).toBe('final-link');
    expect(result.frames[6]?.stages.find(({ id }) => id === 'optional-device-link')?.state).toBe('complete');
    expect(result.frames.at(-1)?.stages.every(({ state }) => state === 'complete')).toBe(true);
  });

  it('steps, resets, and resets the target plan whenever the selected lane changes', () => {
    const initial = createArtifactPipelineState();
    expect(initial).toEqual({
      lane: '11.8.0',
      targetPlanId: 'baseline-75',
      mode: 'whole-program',
      stepIndex: 0,
    });

    const lane = reduceArtifactPipelineState(initial, { type: 'select-lane', lane: '12.9.2' });
    expect(lane).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'whole-program', stepIndex: 0 },
    });
    if (!lane.accepted) throw new Error('Expected lane selection to succeed.');

    const plan = reduceArtifactPipelineState(lane.state, {
      type: 'select-target-plan',
      targetPlanId: 'family-100f',
    });
    expect(plan).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'family-100f', mode: 'whole-program', stepIndex: 0 },
    });
    if (!plan.accepted) throw new Error('Expected target-plan selection to succeed.');

    const stepped = reduceArtifactPipelineState(plan.state, { type: 'step' });
    expect(stepped).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'family-100f', mode: 'whole-program', stepIndex: 1 },
    });
    if (!stepped.accepted) throw new Error('Expected step to succeed.');

    const changedPlan = reduceArtifactPipelineState(stepped.state, {
      type: 'select-target-plan',
      targetPlanId: 'baseline-75',
    });
    expect(changedPlan).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'whole-program', stepIndex: 0 },
    });

    const changedLane = reduceArtifactPipelineState(stepped.state, {
      type: 'select-lane',
      lane: '13.3.1',
    });
    expect(changedLane).toEqual({
      accepted: true,
      state: { lane: '13.3.1', targetPlanId: 'baseline-75', mode: 'whole-program', stepIndex: 0 },
    });

    const mode = reduceArtifactPipelineState(stepped.state, {
      type: 'select-mode',
      mode: 'separate-compilation-rdc',
    });
    expect(mode).toEqual({
      accepted: true,
      state: {
        lane: '12.9.2',
        targetPlanId: 'family-100f',
        mode: 'separate-compilation-rdc',
        stepIndex: 0,
      },
    });

    const reset = reduceArtifactPipelineState(stepped.state, { type: 'reset' });
    expect(reset).toEqual({
      accepted: true,
      state: { lane: '12.9.2', targetPlanId: 'family-100f', mode: 'whole-program', stepIndex: 0 },
    });
  });

  it('fails closed for every malformed or unsupported action and preserves the state reference', () => {
    const state: ArtifactPipelineState = {
      lane: '11.8.0',
      targetPlanId: 'baseline-75',
      mode: 'whole-program',
      stepIndex: 2,
    };
    for (const action of [
      null,
      7,
      {},
      { type: 7 },
      { type: 'select-lane' },
      { type: 'select-lane', lane: 7 },
      { type: 'select-target-plan' },
      { type: 'select-target-plan', targetPlanId: 7 },
      { type: 'select-mode' },
      { type: 'select-mode', mode: 7 },
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

    const unknownMode = reduceArtifactPipelineState(state, {
      type: 'select-mode',
      mode: 'suffix-selected-mode',
    });
    expect(unknownMode).toEqual({ accepted: false, state, issue: 'unknown-mode' });
    expect(unknownMode.state).toBe(state);

    const complete: ArtifactPipelineState = {
      ...state,
      stepIndex: ARTIFACT_PIPELINE_STAGES['whole-program'].length - 1,
    };
    const extraStep = reduceArtifactPipelineState(complete, { type: 'step' });
    expect(extraStep).toEqual({ accepted: false, state: complete, issue: 'sequence-complete' });
    expect(extraStep.state).toBe(complete);
  });

  it('fails closed for invalid state without coercion or mutation', () => {
    const invalidStates = [
      { lane: '12.8.0', targetPlanId: 'baseline-75', mode: 'whole-program', stepIndex: 0 },
      { lane: '11.8.0', targetPlanId: 'exact-90a', mode: 'whole-program', stepIndex: 0 },
      { lane: '12.9.2', targetPlanId: 'unknown', mode: 'whole-program', stepIndex: 0 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', stepIndex: 0 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'unknown', stepIndex: 0 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 7, stepIndex: 0 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'whole-program', stepIndex: -1 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'whole-program', stepIndex: 1.5 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'whole-program', stepIndex: 7 },
      { lane: '12.9.2', targetPlanId: 'baseline-75', mode: 'separate-compilation-rdc', stepIndex: 8 },
    ] as unknown as ArtifactPipelineState[];

    for (const state of invalidStates) {
      expect(deriveArtifactPipelineFrame(state).accepted).toBe(false);
      const update = reduceArtifactPipelineState(state, { type: 'reset' });
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
    }

    expect(deriveArtifactPipelineFrames('11.8.0', 'exact-90a', 'whole-program')).toEqual({
      accepted: false,
      issue: 'unsupported-target-plan',
    });
    expect(deriveArtifactPipelineFrames('unknown', 'baseline-75', 'whole-program')).toEqual({
      accepted: false,
      issue: 'unknown-lane',
    });
    expect(deriveArtifactPipelineFrames('12.9.2', 'unknown', 'whole-program')).toEqual({
      accepted: false,
      issue: 'unknown-target-plan',
    });
    expect(deriveArtifactPipelineFrames('12.9.2', 'baseline-75', 'suffix-selected-mode')).toEqual({
      accepted: false,
      issue: 'unknown-mode',
    });

    const first = deriveArtifactPipelineFrame(createArtifactPipelineState());
    const second = deriveArtifactPipelineFrame(createArtifactPipelineState());
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});
