// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  KERNEL_JOURNEY_STAGES,
  createKernelJourneyState,
  reduceKernelJourney,
} from '../../src/visuals/kernel-journey-model';

describe('VIS01 kernel journey model', () => {
  it('keeps the teaching trace in its declared causal order', () => {
    expect(KERNEL_JOURNEY_STAGES.map(({ id }) => id)).toEqual([
      'launch',
      'grid-ready',
      'block-scheduled',
      'warps-formed',
      'warp-issued',
      'memory-transactions',
      'block-complete',
      'synchronization-complete',
    ]);
  });

  it('starts paused at launch and advances only while playing', () => {
    const initial = createKernelJourneyState();

    expect(initial).toEqual({ stageIndex: 0, isPlaying: false });
    expect(reduceKernelJourney(initial, { type: 'tick' })).toEqual(initial);

    const playing = reduceKernelJourney(initial, { type: 'play' });
    expect(playing).toEqual({ stageIndex: 0, isPlaying: true });
    expect(reduceKernelJourney(playing, { type: 'tick' })).toEqual({ stageIndex: 1, isPlaying: true });
  });

  it('steps once and pauses an active trace', () => {
    const playing = reduceKernelJourney(createKernelJourneyState(), { type: 'play' });

    expect(reduceKernelJourney(playing, { type: 'step' })).toEqual({ stageIndex: 1, isPlaying: false });
    expect(reduceKernelJourney({ stageIndex: 3, isPlaying: false }, { type: 'pause' })).toEqual({
      stageIndex: 3,
      isPlaying: false,
    });
  });

  it('stops at completion and never advances beyond the trace', () => {
    let state = reduceKernelJourney(createKernelJourneyState(), { type: 'play' });
    for (let index = 1; index < KERNEL_JOURNEY_STAGES.length; index += 1) {
      state = reduceKernelJourney(state, { type: 'tick' });
    }

    expect(state).toEqual({ stageIndex: KERNEL_JOURNEY_STAGES.length - 1, isPlaying: false });
    expect(reduceKernelJourney(state, { type: 'tick' })).toEqual(state);
    expect(reduceKernelJourney(state, { type: 'step' })).toEqual(state);
    expect(reduceKernelJourney(state, { type: 'play' })).toEqual(state);
  });

  it('scrubs to every valid position and pauses playback', () => {
    for (let stageIndex = 0; stageIndex < KERNEL_JOURNEY_STAGES.length; stageIndex += 1) {
      const state = reduceKernelJourney({ stageIndex: 2, isPlaying: true }, { type: 'scrub', stageIndex });
      expect(state).toEqual({ stageIndex, isPlaying: false });
    }
  });

  it.each([-1, KERNEL_JOURNEY_STAGES.length, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid scrub position %s without corrupting state',
    (stageIndex) => {
      const state = { stageIndex: 2, isPlaying: true } as const;
      expect(reduceKernelJourney(state, { type: 'scrub', stageIndex })).toEqual(state);
    },
  );

  it('resets every reachable state to the same initial value', () => {
    for (let stageIndex = 0; stageIndex < KERNEL_JOURNEY_STAGES.length; stageIndex += 1) {
      for (const isPlaying of [false, true]) {
        expect(reduceKernelJourney({ stageIndex, isPlaying }, { type: 'reset' })).toEqual(
          createKernelJourneyState(),
        );
      }
    }
  });

  it('preserves stage and completion invariants for mixed actions', () => {
    const actions = [
      { type: 'play' },
      { type: 'tick' },
      { type: 'tick' },
      { type: 'pause' },
      { type: 'step' },
      { type: 'scrub', stageIndex: 5 },
      { type: 'play' },
      { type: 'tick' },
      { type: 'tick' },
      { type: 'reset' },
    ] as const;
    let state = createKernelJourneyState();

    for (const action of actions) {
      state = reduceKernelJourney(state, action);
      expect(state.stageIndex).toBeGreaterThanOrEqual(0);
      expect(state.stageIndex).toBeLessThan(KERNEL_JOURNEY_STAGES.length);
      if (state.stageIndex === KERNEL_JOURNEY_STAGES.length - 1) expect(state.isPlaying).toBe(false);
    }
  });
});
