// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  ERROR_TIMELINE_SCENARIOS,
  ERROR_TIMELINE_STAGES,
  createErrorTimelineState,
  isErrorTimelineScenarioId,
  reduceErrorTimeline,
} from '../../src/visuals/error-timeline-model';

describe('embedded error timeline model', () => {
  it('keeps the host-visible lifecycle in its declared causal order', () => {
    expect(ERROR_TIMELINE_STAGES.map(({ id }) => id)).toEqual([
      'launch-submission',
      'immediate-check',
      'device-execution',
      'synchronization',
      'host-visible-result',
    ]);
  });

  it('models launch-configuration and deferred-execution failures separately', () => {
    expect(ERROR_TIMELINE_SCENARIOS.map(({ id }) => id)).toEqual([
      'launch-configuration',
      'deferred-execution',
    ]);

    for (const scenario of ERROR_TIMELINE_SCENARIOS) {
      expect(scenario.events.map(({ stageId }) => stageId)).toEqual(
        ERROR_TIMELINE_STAGES.map(({ id }) => id),
      );
    }

    expect(ERROR_TIMELINE_SCENARIOS[0].events.map(({ disposition }) => disposition)).toEqual([
      'rejected',
      'error-observed',
      'not-reached',
      'not-first-observation',
      'launch-failed',
    ]);
    expect(ERROR_TIMELINE_SCENARIOS[1].events.map(({ disposition }) => disposition)).toEqual([
      'accepted',
      'no-new-error-observed',
      'failure-occurs',
      'boundary-observes-error',
      'execution-failed',
    ]);
  });

  it('validates scenario identifiers without accepting lookalikes', () => {
    expect(isErrorTimelineScenarioId('launch-configuration')).toBe(true);
    expect(isErrorTimelineScenarioId('deferred-execution')).toBe(true);
    expect(isErrorTimelineScenarioId('deferred')).toBe(false);
    expect(isErrorTimelineScenarioId('')).toBe(false);
  });

  it('starts paused at the first launch-submission stage', () => {
    expect(createErrorTimelineState()).toEqual({
      scenarioId: 'launch-configuration',
      stageIndex: 0,
      isPlaying: false,
    });
    expect(createErrorTimelineState('deferred-execution')).toEqual({
      scenarioId: 'deferred-execution',
      stageIndex: 0,
      isPlaying: false,
    });
  });

  it('selects either scenario deterministically and stops playback', () => {
    const playing = { scenarioId: 'launch-configuration', stageIndex: 3, isPlaying: true } as const;

    expect(
      reduceErrorTimeline(playing, { type: 'select-scenario', scenarioId: 'deferred-execution' }),
    ).toEqual(createErrorTimelineState('deferred-execution'));
    expect(
      reduceErrorTimeline(playing, { type: 'select-scenario', scenarioId: 'launch-configuration' }),
    ).toEqual(createErrorTimelineState('launch-configuration'));
  });

  it('advances only while playing and pauses after a manual step', () => {
    const initial = createErrorTimelineState();
    expect(reduceErrorTimeline(initial, { type: 'tick' })).toEqual(initial);

    const playing = reduceErrorTimeline(initial, { type: 'play' });
    expect(playing).toEqual({ ...initial, isPlaying: true });
    expect(reduceErrorTimeline(playing, { type: 'tick' })).toEqual({
      ...initial,
      stageIndex: 1,
      isPlaying: true,
    });
    expect(reduceErrorTimeline(playing, { type: 'step' })).toEqual({
      ...initial,
      stageIndex: 1,
      isPlaying: false,
    });
    expect(reduceErrorTimeline(playing, { type: 'pause' })).toEqual(initial);
    expect(reduceErrorTimeline(initial, { type: 'pause' })).toEqual(initial);
  });

  it('stops at the host-visible result', () => {
    let state = reduceErrorTimeline(createErrorTimelineState('deferred-execution'), { type: 'play' });
    for (let index = 1; index < ERROR_TIMELINE_STAGES.length; index += 1) {
      state = reduceErrorTimeline(state, { type: 'tick' });
    }

    expect(state).toEqual({
      scenarioId: 'deferred-execution',
      stageIndex: ERROR_TIMELINE_STAGES.length - 1,
      isPlaying: false,
    });
    expect(reduceErrorTimeline(state, { type: 'play' })).toEqual(state);
    expect(reduceErrorTimeline(state, { type: 'step' })).toEqual(state);
    expect(reduceErrorTimeline(state, { type: 'tick' })).toEqual(state);
  });

  it('scrubs to valid stages, rejects invalid stages, and pauses', () => {
    const playing = { scenarioId: 'deferred-execution', stageIndex: 2, isPlaying: true } as const;
    for (let stageIndex = 0; stageIndex < ERROR_TIMELINE_STAGES.length; stageIndex += 1) {
      expect(reduceErrorTimeline(playing, { type: 'scrub', stageIndex })).toEqual({
        scenarioId: 'deferred-execution',
        stageIndex,
        isPlaying: false,
      });
    }

    for (const stageIndex of [-1, ERROR_TIMELINE_STAGES.length, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(reduceErrorTimeline(playing, { type: 'scrub', stageIndex })).toEqual(playing);
    }
  });

  it('resets the current scenario rather than switching scenarios', () => {
    expect(
      reduceErrorTimeline(
        { scenarioId: 'deferred-execution', stageIndex: 4, isPlaying: false },
        { type: 'reset' },
      ),
    ).toEqual(createErrorTimelineState('deferred-execution'));
  });
});
