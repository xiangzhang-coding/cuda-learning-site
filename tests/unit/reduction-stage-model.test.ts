// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  REDUCTION_STAGE_ELEMENT_COUNTS,
  REDUCTION_STAGE_INPUT_VALUES,
  REDUCTION_STAGE_MODEL_CONTRACT,
  REDUCTION_STAGE_VARIANTS,
  createReductionStageState,
  deriveReductionStageFrame,
  deriveReductionStageFrames,
  reduceReductionStageState,
  type ReductionStageState,
} from '../../src/visuals/reduction-stage-model';

type ActiveLane = readonly [lane: number, value: number];

function expectedLanes(activeLanes: readonly ActiveLane[]) {
  const values = new Map<number, number>(activeLanes);
  return Array.from({ length: 8 }, (_, lane) => values.has(lane)
    ? { lane, state: 'active', value: values.get(lane) }
    : { lane, state: 'inactive', value: 0 });
}

const reductionFixtures = [
  {
    variant: 'adjacent-pairs',
    elementCount: 5,
    sum: 14,
    stages: [
      [[0, 3], [1, 1], [2, 4], [3, 1], [4, 5]],
      [[0, 4], [2, 5], [4, 5]],
      [[0, 9], [4, 5]],
      [[0, 14]],
    ],
  },
  {
    variant: 'adjacent-pairs',
    elementCount: 6,
    sum: 23,
    stages: [
      [[0, 3], [1, 1], [2, 4], [3, 1], [4, 5], [5, 9]],
      [[0, 4], [2, 5], [4, 14]],
      [[0, 9], [4, 14]],
      [[0, 23]],
    ],
  },
  {
    variant: 'adjacent-pairs',
    elementCount: 8,
    sum: 31,
    stages: [
      [[0, 3], [1, 1], [2, 4], [3, 1], [4, 5], [5, 9], [6, 2], [7, 6]],
      [[0, 4], [2, 5], [4, 14], [6, 8]],
      [[0, 9], [4, 22]],
      [[0, 31]],
    ],
  },
  {
    variant: 'stride-halving',
    elementCount: 5,
    sum: 14,
    stages: [
      [[0, 3], [1, 1], [2, 4], [3, 1], [4, 5]],
      [[0, 8], [1, 1], [2, 4], [3, 1]],
      [[0, 12], [1, 2]],
      [[0, 14]],
    ],
  },
  {
    variant: 'stride-halving',
    elementCount: 6,
    sum: 23,
    stages: [
      [[0, 3], [1, 1], [2, 4], [3, 1], [4, 5], [5, 9]],
      [[0, 8], [1, 10], [2, 4], [3, 1]],
      [[0, 12], [1, 11]],
      [[0, 23]],
    ],
  },
  {
    variant: 'stride-halving',
    elementCount: 8,
    sum: 31,
    stages: [
      [[0, 3], [1, 1], [2, 4], [3, 1], [4, 5], [5, 9], [6, 2], [7, 6]],
      [[0, 8], [1, 10], [2, 6], [3, 7]],
      [[0, 14], [1, 17]],
      [[0, 31]],
    ],
  },
] as const;

describe('VIS10 reduction-stage model', () => {
  it('publishes the bounded variants, element counts, fixed values, and evidence-neutral contract', () => {
    expect(REDUCTION_STAGE_VARIANTS).toEqual(['adjacent-pairs', 'stride-halving']);
    expect(REDUCTION_STAGE_ELEMENT_COUNTS).toEqual([5, 6, 8]);
    expect(REDUCTION_STAGE_INPUT_VALUES).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
    expect(REDUCTION_STAGE_MODEL_CONTRACT).toMatchObject({
      executesCuda: false,
      compilationEvidence: 'none',
      runtimeEvidence: 'none',
      performanceEvidence: 'none',
      evidenceStatusEffect: 'none',
    });
  });

  it.each(reductionFixtures)(
    'derives exact deterministic eight-lane stages for $variant with $elementCount elements',
    ({ variant, elementCount, sum, stages }) => {
      const first = deriveReductionStageFrames(variant, elementCount);
      const second = deriveReductionStageFrames(variant, elementCount);
      expect(first).toEqual(second);
      expect(first).not.toBe(second);
      expect(first.accepted).toBe(true);
      if (!first.accepted) throw new Error('Expected a reviewed reduction selection.');

      expect(first.frames).toHaveLength(4);
      for (const [stepIndex, activeLanes] of stages.entries()) {
        const frame = first.frames[stepIndex];
        expect(frame).toMatchObject({
          variant,
          elementCount,
          stepIndex,
          sequenceComplete: stepIndex === stages.length - 1,
        });
        expect(frame?.lanes).toHaveLength(8);
        expect(frame?.lanes.map(({ lane, state, value }) => ({ lane, state, value }))).toEqual(
          expectedLanes(activeLanes),
        );
        expect(frame?.lanes.filter(({ state }) => state === 'inactive').every(({ value }) => value === 0)).toBe(true);
      }

      const finalActiveLanes = first.frames.at(-1)?.lanes.filter(({ state }) => state === 'active');
      expect(finalActiveLanes).toHaveLength(1);
      expect(finalActiveLanes?.[0]).toMatchObject({ lane: 0, value: sum });
    },
  );

  it('produces the same final sum for both variants at every supported element count', () => {
    const expectedSums = { 5: 14, 6: 23, 8: 31 } as const;

    for (const elementCount of REDUCTION_STAGE_ELEMENT_COUNTS) {
      const sums = REDUCTION_STAGE_VARIANTS.map((variant) => {
        const result = deriveReductionStageFrames(variant, elementCount);
        expect(result.accepted).toBe(true);
        if (!result.accepted) throw new Error('Expected a reviewed reduction selection.');
        const active = result.frames.at(-1)?.lanes.filter(({ state }) => state === 'active');
        expect(active).toHaveLength(1);
        return active?.[0]?.value;
      });
      expect(sums).toEqual([expectedSums[elementCount], expectedSums[elementCount]]);
    }
  });

  it('steps, resets, and changes either selection without carrying traversal state', () => {
    const initial = createReductionStageState();
    expect(REDUCTION_STAGE_VARIANTS).toContain(initial.variant);
    expect(REDUCTION_STAGE_ELEMENT_COUNTS).toContain(initial.elementCount);
    expect(initial.stepIndex).toBe(0);

    const state: ReductionStageState = {
      variant: 'adjacent-pairs',
      elementCount: 5,
      stepIndex: 1,
    };
    const stepped = reduceReductionStageState(state, { type: 'step' });
    expect(stepped).toEqual({
      accepted: true,
      state: { variant: 'adjacent-pairs', elementCount: 5, stepIndex: 2 },
    });

    const reset = reduceReductionStageState(state, { type: 'reset' });
    expect(reset).toEqual({
      accepted: true,
      state: { variant: 'adjacent-pairs', elementCount: 5, stepIndex: 0 },
    });

    const variant = reduceReductionStageState(state, {
      type: 'select-variant',
      variant: 'stride-halving',
    });
    expect(variant).toEqual({
      accepted: true,
      state: { variant: 'stride-halving', elementCount: 5, stepIndex: 0 },
    });

    const elementCount = reduceReductionStageState(state, {
      type: 'select-element-count',
      elementCount: 6,
    });
    expect(elementCount).toEqual({
      accepted: true,
      state: { variant: 'adjacent-pairs', elementCount: 6, stepIndex: 0 },
    });

    const first = deriveReductionStageFrame(state);
    const second = deriveReductionStageFrame(state);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it('fails closed for malformed actions, unsupported selections, and a completed sequence', () => {
    const state: ReductionStageState = {
      variant: 'adjacent-pairs',
      elementCount: 5,
      stepIndex: 1,
    };
    const invalidActions: unknown[] = [
      null,
      7,
      {},
      { type: 7 },
      { type: 'select-variant' },
      { type: 'select-variant', variant: 7 },
      { type: 'select-element-count' },
      { type: 'select-element-count', elementCount: '5' },
      { type: 'unknown-action' },
      { type: 'select-variant', variant: 'pair-everything' },
      { type: 'select-element-count', elementCount: 7 },
    ];

    for (const action of invalidActions) {
      const result = reduceReductionStageState(state, action);
      expect(result).toMatchObject({ accepted: false, state });
      expect(result.state).toBe(state);
      if (!result.accepted) expect(result.issue).toEqual(expect.any(String));
    }

    const complete: ReductionStageState = {
      variant: 'stride-halving',
      elementCount: 8,
      stepIndex: 3,
    };
    const extraStep = reduceReductionStageState(complete, { type: 'step' });
    expect(extraStep).toMatchObject({ accepted: false, state: complete });
    expect(extraStep.state).toBe(complete);
  });

  it('fails closed for invalid state and leaves every rejected state untouched', () => {
    const invalidStates = [
      { variant: 'pair-everything', elementCount: 5, stepIndex: 0 },
      { variant: 'adjacent-pairs', elementCount: 7, stepIndex: 0 },
      { variant: 'adjacent-pairs', elementCount: 5, stepIndex: -1 },
      { variant: 'adjacent-pairs', elementCount: 5, stepIndex: 1.5 },
      { variant: 'adjacent-pairs', elementCount: 5, stepIndex: 4 },
    ] as unknown as ReductionStageState[];

    for (const state of invalidStates) {
      expect(deriveReductionStageFrame(state).accepted).toBe(false);
      const update = reduceReductionStageState(state, { type: 'reset' });
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
    }

    for (const [variant, elementCount] of [
      ['pair-everything', 5],
      ['adjacent-pairs', 7],
      ['adjacent-pairs', '5'],
    ] as const) {
      expect(deriveReductionStageFrames(variant, elementCount).accepted).toBe(false);
    }
  });
});
