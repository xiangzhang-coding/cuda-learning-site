// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  PROFILER_DECISION_CASES,
  PROFILER_DECISION_MODEL_CONTRACT,
  PROFILER_DECISION_SYMPTOMS,
  createProfilerDecisionState,
  deriveProfilerDecisionView,
  reduceProfilerDecisionState,
  type ProfilerDecisionState,
} from '../../src/visuals/profiler-decision-model';

function derive(state: ProfilerDecisionState) {
  const result = deriveProfilerDecisionView(state);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error('Expected a reviewed profiler decision state.');
  return result.view;
}

describe('VIS14 profiler decision model', () => {
  it('publishes six bounded symptoms with a timeline-first evidence order', () => {
    expect(PROFILER_DECISION_SYMPTOMS).toEqual([
      'whole-workload-slow',
      'cpu-or-launch-gaps',
      'copy-overlap-unclear',
      'kernel-not-selected',
      'selected-kernel-memory-question',
      'selected-kernel-execution-question',
    ]);
    expect(createProfilerDecisionState()).toEqual({ symptomId: 'whole-workload-slow' });
    expect(PROFILER_DECISION_MODEL_CONTRACT).toMatchObject({
      decisionRule: 'timeline-first-then-selected-kernel-question',
      executesCuda: false,
      launchesProfiler: false,
      generatesProfilerArtifact: false,
      observesProfilerData: false,
      queriesDevice: false,
      compilationEvidence: 'none',
      runtimeEvidence: 'none',
      performanceEvidence: 'none',
      evidenceStatusEffect: 'none',
    });
  });

  it.each([
    ['whole-workload-slow', 'nsight-systems', 'application-timeline', 'nsys-rep', 'timeline-first', 'form-timeline-hypothesis'],
    ['cpu-or-launch-gaps', 'nsight-systems', 'application-timeline', 'nsys-rep', 'timeline-first', 'form-timeline-hypothesis'],
    ['copy-overlap-unclear', 'nsight-systems', 'application-timeline', 'nsys-rep', 'timeline-first', 'form-timeline-hypothesis'],
    ['kernel-not-selected', 'nsight-systems', 'application-timeline', 'nsys-rep', 'timeline-first', 'select-kernel-and-question'],
    ['selected-kernel-memory-question', 'nsight-compute', 'selected-kernel', 'ncu-rep', 'kernel-and-question-selected', 'test-kernel-hypothesis'],
    ['selected-kernel-execution-question', 'nsight-compute', 'selected-kernel', 'ncu-rep', 'kernel-and-question-selected', 'test-kernel-hypothesis'],
  ] as const)(
    'maps %s deterministically to %s',
    (symptomId, recommendedTool, analysisScope, artifactKind, decisionGate, nextGate) => {
      const view = derive({ symptomId });
      expect(view).toMatchObject({
        symptomId,
        recommendedTool,
        analysisScope,
        artifactKind,
        decisionGate,
        nextGate,
      });
      expect(view.contract).toBe(PROFILER_DECISION_MODEL_CONTRACT);
      expect(PROFILER_DECISION_CASES[symptomId]).toEqual({
        recommendedTool,
        analysisScope,
        artifactKind,
        decisionGate,
        nextGate,
      });
      expect(deriveProfilerDecisionView({ symptomId })).toEqual(deriveProfilerDecisionView({ symptomId }));
    },
  );

  it('accepts a native symptom selection and reset', () => {
    const initial = createProfilerDecisionState();
    const selected = reduceProfilerDecisionState(initial, {
      type: 'select-symptom',
      symptomId: 'selected-kernel-memory-question',
    });
    expect(selected).toEqual({
      accepted: true,
      state: { symptomId: 'selected-kernel-memory-question' },
    });
    if (!selected.accepted) throw new Error('Expected a reviewed symptom selection.');
    expect(reduceProfilerDecisionState(selected.state, { type: 'reset' })).toEqual({
      accepted: true,
      state: initial,
    });
  });

  it('fails closed for malformed state and actions while preserving rejected state identity', () => {
    const state: ProfilerDecisionState = { symptomId: 'copy-overlap-unclear' };
    for (const action of [
      null,
      {},
      { type: 'reset', extra: true },
      { type: 'select-symptom' },
      { type: 'select-symptom', symptomId: 'metric-dump' },
      { type: 'select-tool', tool: 'nsight-compute' },
    ]) {
      const update = reduceProfilerDecisionState(state, action);
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
    }

    const invalid = { ...state, extra: true } as unknown as ProfilerDecisionState;
    expect(deriveProfilerDecisionView(invalid)).toEqual({ accepted: false, issue: 'invalid-state' });
    const update = reduceProfilerDecisionState(invalid, { type: 'reset' });
    expect(update).toMatchObject({ accepted: false, state: invalid, issue: 'invalid-state' });
    expect(update.state).toBe(invalid);
  });
});
