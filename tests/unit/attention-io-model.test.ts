// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  ATTENTION_IO_SEQUENCE_SHAPES,
  ATTENTION_IO_STAGES,
  ATTENTION_IO_TILE_SHAPES,
  ATTENTION_IO_MODEL_CONTRACT,
  createAttentionIoState,
  deriveAttentionIoView,
  reduceAttentionIoState,
  type AttentionIoState,
} from '../../src/visuals/attention-io-model';

function derive(state: AttentionIoState) {
  const result = deriveAttentionIoView(state);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error('Expected a reviewed attention IO state.');
  return result.view;
}

describe('VIS18 attention IO model', () => {
  it('publishes a bounded evidence-neutral model with reviewed defaults', () => {
    expect(ATTENTION_IO_SEQUENCE_SHAPES).toEqual(['8x4', '16x8']);
    expect(ATTENTION_IO_TILE_SHAPES).toEqual(['4x4', '8x8']);
    expect(ATTENTION_IO_STAGES).toEqual(['score', 'normalize', 'value']);
    expect(createAttentionIoState()).toEqual({
      sequenceShape: '8x4',
      tileShape: '4x4',
      stage: 'score',
    });
    expect(ATTENTION_IO_MODEL_CONTRACT).toMatchObject({
      elementBytes: 4,
      storageType: 'fp32',
      attentionScope: 'single-head-unmasked-forward-self-attention',
      accountingBoundary: 'logical-slow-fast-store-transfers',
      executesCuda: false,
      queriesDevice: false,
      compilationEvidence: 'none',
      runtimeEvidence: 'none',
      performanceEvidence: 'none',
      evidenceStatusEffect: 'none',
    });
  });

  it('matches the independent 8x4 and 4x4 worked ledger', () => {
    const view = derive(createAttentionIoState());

    expect(view.sequence).toEqual({ queryRows: 8, keyRows: 8, keyDepth: 4, valueDepth: 4 });
    expect(view.tile).toEqual({ queryRows: 4, keyRows: 4 });
    expect(view.queryTileCount).toBe(2);
    expect(view.keyTileCount).toBe(2);
    expect(view.scoreTileCount).toBe(4);
    expect(view.fullScoreElements).toBe(64);
    expect(view.temporaryScoreTileElements).toBe(16);
    expect(view.materialized.stages).toEqual([
      { stage: 'score', elements: 128, bytes: 512 },
      { stage: 'normalize', elements: 256, bytes: 1024 },
      { stage: 'value', elements: 128, bytes: 512 },
    ]);
    expect(view.materialized).toMatchObject({ elements: 512, bytes: 2048 });
    expect(view.tiled.stages).toEqual([
      { stage: 'score', elements: 96, bytes: 384 },
      { stage: 'normalize', elements: 0, bytes: 0 },
      { stage: 'value', elements: 96, bytes: 384 },
    ]);
    expect(view.tiled).toMatchObject({ elements: 192, bytes: 768 });
    expect(view.analysisDifference).toEqual({ elements: 320, bytes: 1280 });
    expect(view.selectedStage).toEqual({
      stage: 'score',
      materializedElements: 128,
      materializedBytes: 512,
      tiledElements: 96,
      tiledBytes: 384,
    });
  });

  it.each(ATTENTION_IO_SEQUENCE_SHAPES.flatMap((sequenceShape) =>
    ATTENTION_IO_TILE_SHAPES.flatMap((tileShape) =>
      ATTENTION_IO_STAGES.map((stage) => ({ sequenceShape, tileShape, stage }))))) (
    'derives $sequenceShape / $tileShape / $stage deterministically',
    (state) => {
      const view = derive(state);
      expect(view.materialized.elements).toBe(
        view.materialized.stages.reduce((sum, stage) => sum + stage.elements, 0),
      );
      expect(view.tiled.elements).toBe(
        view.tiled.stages.reduce((sum, stage) => sum + stage.elements, 0),
      );
      expect(view.materialized.bytes).toBe(view.materialized.elements * 4);
      expect(view.tiled.bytes).toBe(view.tiled.elements * 4);
      expect(view.analysisDifference.bytes).toBe(view.materialized.bytes - view.tiled.bytes);
      expect(view.scoreTileCount).toBe(view.queryTileCount * view.keyTileCount);
      expect(view.selectedStage.stage).toBe(state.stage);
      expect(deriveAttentionIoView(state)).toEqual(deriveAttentionIoView(state));
    },
  );

  it('changes query-tile replay explicitly without claiming a universal winner', () => {
    const narrow = derive({ sequenceShape: '16x8', tileShape: '4x4', stage: 'value' });
    const wide = derive({ sequenceShape: '16x8', tileShape: '8x8', stage: 'value' });

    expect(narrow.queryTileCount).toBe(4);
    expect(narrow.tiled).toMatchObject({ elements: 1280, bytes: 5120 });
    expect(wide.queryTileCount).toBe(2);
    expect(wide.tiled).toMatchObject({ elements: 768, bytes: 3072 });
    expect(wide.contract.performanceEvidence).toBe('none');
  });

  it('applies native selections and reset', () => {
    const initial = createAttentionIoState();
    const sequence = reduceAttentionIoState(initial, {
      type: 'select-sequence-shape', sequenceShape: '16x8',
    });
    expect(sequence).toEqual({
      accepted: true,
      state: { ...initial, sequenceShape: '16x8' },
    });
    if (!sequence.accepted) throw new Error('Expected sequence selection.');
    const tile = reduceAttentionIoState(sequence.state, {
      type: 'select-tile-shape', tileShape: '8x8',
    });
    expect(tile.accepted).toBe(true);
    if (!tile.accepted) throw new Error('Expected tile selection.');
    const stage = reduceAttentionIoState(tile.state, {
      type: 'select-stage', stage: 'value',
    });
    expect(stage.accepted).toBe(true);
    if (!stage.accepted) throw new Error('Expected stage selection.');
    expect(reduceAttentionIoState(stage.state, { type: 'reset' })).toEqual({
      accepted: true,
      state: initial,
    });
  });

  it('fails closed for malformed state and actions while preserving rejected state identity', () => {
    const state: AttentionIoState = {
      sequenceShape: '16x8', tileShape: '8x8', stage: 'value',
    };
    for (const action of [
      null,
      {},
      { type: 'reset', extra: true },
      { type: 'select-sequence-shape', sequenceShape: 'bad' },
      { type: 'select-tile-shape', tileShape: 'bad' },
      { type: 'select-stage', stage: 'backward' },
      { type: 'unknown' },
    ]) {
      const update = reduceAttentionIoState(state, action);
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
    }

    const invalid = { ...state, extra: true } as unknown as AttentionIoState;
    expect(deriveAttentionIoView(invalid)).toEqual({ accepted: false, issue: 'invalid-state' });
    const update = reduceAttentionIoState(invalid, { type: 'reset' });
    expect(update).toMatchObject({ accepted: false, state: invalid, issue: 'invalid-state' });
    expect(update.state).toBe(invalid);
  });
});
