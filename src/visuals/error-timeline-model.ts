// SPDX-License-Identifier: Apache-2.0

export const ERROR_TIMELINE_STAGES = [
  { id: 'launch-submission' },
  { id: 'immediate-check' },
  { id: 'device-execution' },
  { id: 'synchronization' },
  { id: 'host-visible-result' },
] as const;

export type ErrorTimelineStageId = (typeof ERROR_TIMELINE_STAGES)[number]['id'];

export type ErrorTimelineDisposition =
  | 'accepted'
  | 'rejected'
  | 'no-new-error-observed'
  | 'error-observed'
  | 'failure-occurs'
  | 'not-reached'
  | 'boundary-observes-error'
  | 'not-first-observation'
  | 'launch-failed'
  | 'execution-failed';

type ErrorTimelineEvent = Readonly<{
  stageId: ErrorTimelineStageId;
  disposition: ErrorTimelineDisposition;
}>;

export const ERROR_TIMELINE_SCENARIOS = [
  {
    id: 'launch-configuration',
    events: [
      { stageId: 'launch-submission', disposition: 'rejected' },
      { stageId: 'immediate-check', disposition: 'error-observed' },
      { stageId: 'device-execution', disposition: 'not-reached' },
      { stageId: 'synchronization', disposition: 'not-first-observation' },
      { stageId: 'host-visible-result', disposition: 'launch-failed' },
    ],
  },
  {
    id: 'deferred-execution',
    events: [
      { stageId: 'launch-submission', disposition: 'accepted' },
      { stageId: 'immediate-check', disposition: 'no-new-error-observed' },
      { stageId: 'device-execution', disposition: 'failure-occurs' },
      { stageId: 'synchronization', disposition: 'boundary-observes-error' },
      { stageId: 'host-visible-result', disposition: 'execution-failed' },
    ],
  },
] as const satisfies readonly {
  id: string;
  events: readonly ErrorTimelineEvent[];
}[];

export type ErrorTimelineScenarioId = (typeof ERROR_TIMELINE_SCENARIOS)[number]['id'];

export type ErrorTimelineState = Readonly<{
  scenarioId: ErrorTimelineScenarioId;
  stageIndex: number;
  isPlaying: boolean;
}>;

export type ErrorTimelineAction =
  | { type: 'select-scenario'; scenarioId: ErrorTimelineScenarioId }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'step' }
  | { type: 'tick' }
  | { type: 'scrub'; stageIndex: number }
  | { type: 'reset' };

const finalStageIndex = ERROR_TIMELINE_STAGES.length - 1;

export function isErrorTimelineScenarioId(value: string): value is ErrorTimelineScenarioId {
  return ERROR_TIMELINE_SCENARIOS.some(({ id }) => id === value);
}

export function createErrorTimelineState(
  scenarioId: ErrorTimelineScenarioId = 'launch-configuration',
): ErrorTimelineState {
  return { scenarioId, stageIndex: 0, isPlaying: false };
}

export function reduceErrorTimeline(
  state: ErrorTimelineState,
  action: ErrorTimelineAction,
): ErrorTimelineState {
  switch (action.type) {
    case 'select-scenario':
      return action.scenarioId === state.scenarioId
        ? { ...state, stageIndex: 0, isPlaying: false }
        : createErrorTimelineState(action.scenarioId);
    case 'play':
      return state.stageIndex === finalStageIndex || state.isPlaying ? state : { ...state, isPlaying: true };
    case 'pause':
      return state.isPlaying ? { ...state, isPlaying: false } : state;
    case 'step':
      if (state.stageIndex === finalStageIndex) return { ...state, isPlaying: false };
      return { ...state, stageIndex: state.stageIndex + 1, isPlaying: false };
    case 'tick': {
      if (!state.isPlaying) return state;
      const stageIndex = Math.min(state.stageIndex + 1, finalStageIndex);
      return { ...state, stageIndex, isPlaying: stageIndex !== finalStageIndex };
    }
    case 'scrub':
      if (
        !Number.isInteger(action.stageIndex) ||
        action.stageIndex < 0 ||
        action.stageIndex > finalStageIndex
      ) {
        return state;
      }
      return { ...state, stageIndex: action.stageIndex, isPlaying: false };
    case 'reset':
      return createErrorTimelineState(state.scenarioId);
  }
}
