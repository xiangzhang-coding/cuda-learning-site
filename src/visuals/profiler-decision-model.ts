// SPDX-License-Identifier: Apache-2.0

export const PROFILER_DECISION_TOOLS = ['nsight-systems', 'nsight-compute'] as const;
export const PROFILER_DECISION_SYMPTOMS = [
  'whole-workload-slow',
  'cpu-or-launch-gaps',
  'copy-overlap-unclear',
  'kernel-not-selected',
  'selected-kernel-memory-question',
  'selected-kernel-execution-question',
] as const;

export type ProfilerDecisionTool = (typeof PROFILER_DECISION_TOOLS)[number];
export type ProfilerDecisionSymptom = (typeof PROFILER_DECISION_SYMPTOMS)[number];
export type ProfilerDecisionScope = 'application-timeline' | 'selected-kernel';
export type ProfilerDecisionArtifact = 'nsys-rep' | 'ncu-rep';
export type ProfilerDecisionGate = 'timeline-first' | 'kernel-and-question-selected';
export type ProfilerDecisionNextGate =
  | 'form-timeline-hypothesis'
  | 'select-kernel-and-question'
  | 'test-kernel-hypothesis';

export const PROFILER_DECISION_MODEL_CONTRACT = {
  modelId: 'bounded-profiler-evidence-decision',
  selectionBoundary: 'six-reviewed-observable-symptoms',
  decisionRule: 'timeline-first-then-selected-kernel-question',
  capabilityCoverage: 'bounded-teaching-path-not-feature-crosswalk',
  executesCuda: false,
  launchesProfiler: false,
  generatesProfilerArtifact: false,
  observesProfilerData: false,
  queriesDevice: false,
  compilationEvidence: 'none',
  runtimeEvidence: 'none',
  performanceEvidence: 'none',
  evidenceStatusEffect: 'none',
} as const;

type ProfilerDecisionCase = Readonly<{
  recommendedTool: ProfilerDecisionTool;
  analysisScope: ProfilerDecisionScope;
  artifactKind: ProfilerDecisionArtifact;
  decisionGate: ProfilerDecisionGate;
  nextGate: ProfilerDecisionNextGate;
}>;

export const PROFILER_DECISION_CASES: Readonly<Record<ProfilerDecisionSymptom, ProfilerDecisionCase>> = {
  'whole-workload-slow': {
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'form-timeline-hypothesis',
  },
  'cpu-or-launch-gaps': {
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'form-timeline-hypothesis',
  },
  'copy-overlap-unclear': {
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'form-timeline-hypothesis',
  },
  'kernel-not-selected': {
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'select-kernel-and-question',
  },
  'selected-kernel-memory-question': {
    recommendedTool: 'nsight-compute',
    analysisScope: 'selected-kernel',
    artifactKind: 'ncu-rep',
    decisionGate: 'kernel-and-question-selected',
    nextGate: 'test-kernel-hypothesis',
  },
  'selected-kernel-execution-question': {
    recommendedTool: 'nsight-compute',
    analysisScope: 'selected-kernel',
    artifactKind: 'ncu-rep',
    decisionGate: 'kernel-and-question-selected',
    nextGate: 'test-kernel-hypothesis',
  },
};

export type ProfilerDecisionState = Readonly<{ symptomId: ProfilerDecisionSymptom }>;
export type ProfilerDecisionView = Readonly<ProfilerDecisionCase & {
  symptomId: ProfilerDecisionSymptom;
  contract: typeof PROFILER_DECISION_MODEL_CONTRACT;
}>;
export type ProfilerDecisionIssue = 'invalid-state' | 'invalid-action' | 'unknown-symptom';
export type ProfilerDecisionViewResult =
  | Readonly<{ accepted: true; view: ProfilerDecisionView }>
  | Readonly<{ accepted: false; issue: 'invalid-state' }>;
export type ProfilerDecisionStateUpdate =
  | Readonly<{ accepted: true; state: ProfilerDecisionState }>
  | Readonly<{ accepted: false; state: ProfilerDecisionState; issue: ProfilerDecisionIssue }>;

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: RecordValue, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function parseSymptom(value: unknown): ProfilerDecisionSymptom | null {
  if (typeof value !== 'string') return null;
  return PROFILER_DECISION_SYMPTOMS.find((symptom) => symptom === value) ?? null;
}

function validState(state: ProfilerDecisionState): boolean {
  return isRecord(state)
    && hasExactKeys(state, ['symptomId'])
    && parseSymptom(state.symptomId) !== null;
}

export function createProfilerDecisionState(): ProfilerDecisionState {
  return { symptomId: 'whole-workload-slow' };
}

export function deriveProfilerDecisionView(state: ProfilerDecisionState): ProfilerDecisionViewResult {
  if (!validState(state)) return { accepted: false, issue: 'invalid-state' };
  return {
    accepted: true,
    view: {
      symptomId: state.symptomId,
      ...PROFILER_DECISION_CASES[state.symptomId],
      contract: PROFILER_DECISION_MODEL_CONTRACT,
    },
  };
}

export function reduceProfilerDecisionState(
  state: ProfilerDecisionState,
  action: unknown,
): ProfilerDecisionStateUpdate {
  if (!validState(state)) return { accepted: false, state, issue: 'invalid-state' };
  if (!isRecord(action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }
  if (action.type === 'reset') {
    if (!hasExactKeys(action, ['type'])) return { accepted: false, state, issue: 'invalid-action' };
    return { accepted: true, state: createProfilerDecisionState() };
  }
  if (action.type === 'select-symptom') {
    if (!hasExactKeys(action, ['type', 'symptomId']) || typeof action.symptomId !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const symptomId = parseSymptom(action.symptomId);
    if (symptomId === null) return { accepted: false, state, issue: 'unknown-symptom' };
    return { accepted: true, state: { symptomId } };
  }
  return { accepted: false, state, issue: 'invalid-action' };
}
