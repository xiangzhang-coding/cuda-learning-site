// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  WARP_DIVERGENCE_MODEL_CONTRACT,
  WARP_DIVERGENCE_PRESETS,
  WARP_DIVERGENCE_STAGES,
  createWarpDivergenceState,
  createWarpDivergenceTrace,
  reduceWarpDivergenceState,
} from '../../src/visuals/warp-divergence-model';

describe('VIS03 warp-divergence model', () => {
  it('derives five deterministic 32-lane traces with disjoint, complete path masks', () => {
    expect(WARP_DIVERGENCE_STAGES.map(({ id }) => id)).toEqual([
      'before-branch',
      'predicate-evaluated',
      'true-path',
      'false-path',
      'logical-join',
    ]);
    expect(WARP_DIVERGENCE_PRESETS.map(({ id }) => id)).toEqual([
      'uniform-true',
      'uniform-false',
      'lower-half',
      'alternating',
      'non-contiguous',
    ]);

    for (const preset of WARP_DIVERGENCE_PRESETS) {
      const trace = createWarpDivergenceTrace(preset.id);
      expect(trace.lanes).toHaveLength(32);
      expect(trace.participatingMask).toEqual(Array.from({ length: 32 }, (_, lane) => lane));
      expect(trace.trueMask.filter((lane) => trace.falseMask.includes(lane))).toEqual([]);
      expect([...trace.trueMask, ...trace.falseMask].sort((left, right) => left - right)).toEqual(
        trace.participatingMask,
      );
      expect(trace.stages.map(({ id }) => id)).toEqual(WARP_DIVERGENCE_STAGES.map(({ id }) => id));
      expect(trace.stages.map(({ laneSetMeaning }) => laneSetMeaning)).toEqual([
        'active-mask',
        'active-mask',
        'active-mask',
        'active-mask',
        'source-level-participating-set',
      ]);
      expect(trace.stages[0]?.laneSet).toEqual(trace.participatingMask);
      expect(trace.stages[1]?.laneSet).toEqual(trace.participatingMask);
      expect(trace.stages[2]?.laneSet).toEqual(trace.trueMask);
      expect(trace.stages[3]?.laneSet).toEqual(trace.falseMask);
      expect(trace.stages[4]?.laneSet).toEqual(trace.participatingMask);
      expect(trace.stages.every((stage) => !('activeMask' in stage))).toBe(true);
      expect(trace.contract).toBe(WARP_DIVERGENCE_MODEL_CONTRACT);
    }
  });

  it('makes uniform empty paths explicit and preserves the reviewed predicate fixtures', () => {
    expect(createWarpDivergenceTrace('uniform-true')).toMatchObject({
      trueMask: Array.from({ length: 32 }, (_, lane) => lane),
      falseMask: [],
      divergent: false,
    });
    expect(createWarpDivergenceTrace('uniform-true').stages[3]).toMatchObject({
      id: 'false-path',
      laneSet: [],
      laneSetMeaning: 'active-mask',
      disposition: 'skipped',
    });
    expect(createWarpDivergenceTrace('uniform-false').stages[2]).toMatchObject({
      id: 'true-path',
      laneSet: [],
      laneSetMeaning: 'active-mask',
      disposition: 'skipped',
    });
    expect(createWarpDivergenceTrace('lower-half').trueMask).toEqual(
      Array.from({ length: 16 }, (_, lane) => lane),
    );
    expect(createWarpDivergenceTrace('alternating').trueMask).toEqual(
      Array.from({ length: 16 }, (_, index) => index * 2),
    );
    expect(createWarpDivergenceTrace('non-contiguous').trueMask).toEqual([
      0, 1, 4, 7, 8, 13, 17, 18, 23, 27, 30,
    ]);
  });

  it('steps, switches presets, rejects unknown presets, and resets deterministically', () => {
    const initial = createWarpDivergenceState();
    expect(initial).toEqual({ presetId: 'lower-half', stageIndex: 0 });

    let state = reduceWarpDivergenceState(initial, { type: 'step' });
    expect(state).toEqual({ presetId: 'lower-half', stageIndex: 1 });
    for (let index = 1; index < WARP_DIVERGENCE_STAGES.length + 2; index += 1) {
      state = reduceWarpDivergenceState(state, { type: 'step' });
    }
    expect(state.stageIndex).toBe(WARP_DIVERGENCE_STAGES.length - 1);

    expect(reduceWarpDivergenceState(state, { type: 'select-preset', presetId: 'alternating' })).toEqual({
      presetId: 'alternating',
      stageIndex: 0,
    });
    expect(reduceWarpDivergenceState(state, { type: 'select-preset', presetId: 'unknown' })).toBe(state);
    expect(reduceWarpDivergenceState(state, { type: 'reset' })).toEqual(initial);
  });

  it('states the scheduling, synchronization, ITS, timing, and evidence boundaries', () => {
    expect(WARP_DIVERGENCE_MODEL_CONTRACT).toEqual({
      lanes: 32,
      teachingPathOrder: 'deterministic-not-hardware-scheduling',
      logicalJoin: 'control-flow-only-not-memory-synchronization',
      stageLaneSetMeaning: {
        executableStages: 'active-mask',
        logicalJoin: 'source-level-participating-set',
      },
      logicalJoinInstructionClaim: 'none-its-may-regroup-sub-warps',
      independentThreadScheduling: 'compute-capability-7.0-or-newer',
      implicitLockstepAssumptions: 'invalid',
      executesCuda: false,
      timing: 'not-modeled',
      evidenceStatusEffect: 'none',
    });
  });
});
