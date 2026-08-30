// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  TRANSPOSE_TILE_LAYOUTS,
  TRANSPOSE_TILE_MODEL_CONTRACT,
  TRANSPOSE_TILE_PADDINGS,
  TRANSPOSE_TILE_SIZES,
  createTransposeTileState,
  deriveTransposeTileView,
  reduceTransposeTileState,
  type TransposeTileLayout,
  type TransposeTilePadding,
  type TransposeTileSize,
  type TransposeTileState,
} from '../../src/visuals/transpose-tile-model';

const reviewedSelections = TRANSPOSE_TILE_SIZES.flatMap((tileSize) =>
  TRANSPOSE_TILE_LAYOUTS.flatMap((layout) =>
    TRANSPOSE_TILE_PADDINGS.map((padding) => ({ tileSize, layout, padding }))));

function derive(state: TransposeTileState) {
  const result = deriveTransposeTileView(state);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error('Expected a reviewed transpose-tile state.');
  return result.view;
}

describe('VIS11 transpose-tile model', () => {
  it('publishes the reviewed selection boundary and evidence-neutral contract', () => {
    expect(TRANSPOSE_TILE_SIZES).toEqual([4, 8]);
    expect(TRANSPOSE_TILE_LAYOUTS).toEqual(['input-row-major', 'output-row-major']);
    expect(TRANSPOSE_TILE_PADDINGS).toEqual([0, 1]);
    expect(createTransposeTileState()).toEqual({
      tileSize: 4,
      layout: 'input-row-major',
      padding: 0,
    });
    expect(TRANSPOSE_TILE_MODEL_CONTRACT).toMatchObject({
      mappingRule: 'input-row-col-to-output-col-row',
      physicalStrideRule: 'tile-size-plus-padding',
      executesCuda: false,
      queriesDevice: false,
      compilationEvidence: 'none',
      runtimeEvidence: 'none',
      performanceEvidence: 'none',
      evidenceStatusEffect: 'none',
    });
  });

  it.each(reviewedSelections)(
    'derives every logical mapping and physical slot for $tileSize/$layout/padding-$padding',
    ({ tileSize, layout, padding }) => {
      const view = derive({ tileSize, layout, padding });
      const stride = tileSize + padding;
      expect(view).toMatchObject({
        tileSize,
        layout,
        padding,
        logicalCellCount: tileSize * tileSize,
        sharedRowStride: stride,
      });
      expect(view.cells).toHaveLength(tileSize * tileSize);
      expect(view.inputRowMajor).toHaveLength(tileSize * tileSize);
      expect(view.outputRowMajor).toHaveLength(tileSize * tileSize);
      expect(view.physicalRows).toHaveLength(tileSize);
      expect(view.paddingSlots).toHaveLength(tileSize * padding);

      for (const [inputIndex, cell] of view.inputRowMajor.entries()) {
        const inputRow = Math.floor(inputIndex / tileSize);
        const inputCol = inputIndex % tileSize;
        const outputRow = inputCol;
        const outputCol = inputRow;
        const outputIndex = outputRow * tileSize + outputCol;
        const sharedRow = layout === 'input-row-major' ? inputRow : outputRow;
        const sharedCol = layout === 'input-row-major' ? inputCol : outputCol;
        expect(cell).toEqual({
          inputRow,
          inputCol,
          outputRow,
          outputCol,
          inputIndex,
          outputIndex,
          sharedRow,
          sharedCol,
          physicalSlotIndex: sharedRow * stride + sharedCol,
        });
      }

      expect(view.outputRowMajor.map(({ outputIndex }) => outputIndex)).toEqual(
        Array.from({ length: tileSize * tileSize }, (_, index) => index),
      );
      expect(view.outputRowMajor.map(({ inputIndex }) => inputIndex)).toEqual(
        Array.from({ length: tileSize * tileSize }, (_, outputIndex) =>
          (outputIndex % tileSize) * tileSize + Math.floor(outputIndex / tileSize)),
      );

      for (const row of view.physicalRows) {
        expect(row.slots).toHaveLength(stride);
        for (const slot of row.slots) {
          expect(slot.slotIndex).toBe(slot.row * stride + slot.col);
          if (slot.kind === 'padding') {
            expect(slot.col).toBe(tileSize);
          } else {
            expect(slot.cell.sharedRow).toBe(slot.row);
            expect(slot.cell.sharedCol).toBe(slot.col);
            expect(slot.cell.physicalSlotIndex).toBe(slot.slotIndex);
          }
        }
      }
      expect(view.paddingSlots).toEqual(padding === 0
        ? []
        : Array.from({ length: tileSize }, (_, row) => ({
            kind: 'padding',
            row,
            col: tileSize,
            slotIndex: row * stride + tileSize,
          })));
    },
  );

  it('keeps exact 4x4 and 8x8 row-major, transpose, stride, and padding arithmetic explicit', () => {
    const inputLayout = derive({ tileSize: 4, layout: 'input-row-major', padding: 1 });
    expect(inputLayout.cells[6]).toEqual({
      inputRow: 1,
      inputCol: 2,
      outputRow: 2,
      outputCol: 1,
      inputIndex: 6,
      outputIndex: 9,
      sharedRow: 1,
      sharedCol: 2,
      physicalSlotIndex: 7,
    });
    expect(inputLayout.physicalRows[0]?.slots).toEqual([
      expect.objectContaining({ kind: 'data', row: 0, col: 0, slotIndex: 0 }),
      expect.objectContaining({ kind: 'data', row: 0, col: 1, slotIndex: 1 }),
      expect.objectContaining({ kind: 'data', row: 0, col: 2, slotIndex: 2 }),
      expect.objectContaining({ kind: 'data', row: 0, col: 3, slotIndex: 3 }),
      { kind: 'padding', row: 0, col: 4, slotIndex: 4 },
    ]);

    const outputLayout = derive({ tileSize: 4, layout: 'output-row-major', padding: 1 });
    expect(outputLayout.cells[6]).toEqual({
      inputRow: 1,
      inputCol: 2,
      outputRow: 2,
      outputCol: 1,
      inputIndex: 6,
      outputIndex: 9,
      sharedRow: 2,
      sharedCol: 1,
      physicalSlotIndex: 11,
    });
    expect(outputLayout.physicalRows[2]?.slots[1]).toMatchObject({
      kind: 'data',
      row: 2,
      col: 1,
      slotIndex: 11,
      cell: { inputRow: 1, inputCol: 2, outputRow: 2, outputCol: 1 },
    });

    const eight = derive({ tileSize: 8, layout: 'output-row-major', padding: 1 });
    expect(eight.cells[51]).toMatchObject({
      inputRow: 6,
      inputCol: 3,
      outputRow: 3,
      outputCol: 6,
      inputIndex: 51,
      outputIndex: 30,
      sharedRow: 3,
      sharedCol: 6,
      physicalSlotIndex: 33,
    });
    expect(eight.paddingSlots.at(-1)).toEqual({
      kind: 'padding',
      row: 7,
      col: 8,
      slotIndex: 71,
    });
  });

  it('is deterministic and returns non-aliased views, arrays, cells, rows, and slots', () => {
    const state: TransposeTileState = { tileSize: 8, layout: 'output-row-major', padding: 1 };
    const first = deriveTransposeTileView(state);
    const second = deriveTransposeTileView(state);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    if (!first.accepted || !second.accepted) throw new Error('Expected reviewed states.');
    expect(first.view).not.toBe(second.view);
    expect(first.view.cells).not.toBe(second.view.cells);
    expect(first.view.cells[0]).not.toBe(second.view.cells[0]);
    expect(first.view.inputRowMajor).not.toBe(first.view.cells);
    expect(first.view.inputRowMajor[0]).not.toBe(first.view.cells[0]);
    expect(first.view.outputRowMajor[0]).not.toBe(first.view.cells[0]);
    expect(first.view.physicalRows[0]).not.toBe(second.view.physicalRows[0]);
    expect(first.view.physicalRows[0]?.slots[0]).not.toBe(second.view.physicalRows[0]?.slots[0]);
    expect(first.view.paddingSlots[0]).not.toBe(second.view.paddingSlots[0]);
  });

  it('applies every selection action and resets all fields to the reviewed default', () => {
    const initial = createTransposeTileState();
    const tileSize = reduceTransposeTileState(initial, { type: 'select-tile-size', tileSize: 8 });
    expect(tileSize).toEqual({
      accepted: true,
      state: { tileSize: 8, layout: 'input-row-major', padding: 0 },
    });
    if (!tileSize.accepted) throw new Error('Expected tile-size selection.');

    const layout = reduceTransposeTileState(tileSize.state, {
      type: 'select-layout',
      layout: 'output-row-major',
    });
    expect(layout).toEqual({
      accepted: true,
      state: { tileSize: 8, layout: 'output-row-major', padding: 0 },
    });
    if (!layout.accepted) throw new Error('Expected layout selection.');

    const padding = reduceTransposeTileState(layout.state, { type: 'select-padding', padding: 1 });
    expect(padding).toEqual({
      accepted: true,
      state: { tileSize: 8, layout: 'output-row-major', padding: 1 },
    });
    if (!padding.accepted) throw new Error('Expected padding selection.');
    expect(reduceTransposeTileState(padding.state, { type: 'reset' })).toEqual({
      accepted: true,
      state: initial,
    });
  });

  it('fails closed for malformed actions and preserves rejected state identity', () => {
    const state: TransposeTileState = { tileSize: 8, layout: 'output-row-major', padding: 1 };
    const malformedActions: unknown[] = [
      null,
      7,
      [],
      {},
      { type: 7 },
      { type: 'reset', extra: true },
      { type: 'select-tile-size' },
      { type: 'select-tile-size', tileSize: '4' },
      { type: 'select-tile-size', tileSize: 16 },
      { type: 'select-layout' },
      { type: 'select-layout', layout: 7 },
      { type: 'select-layout', layout: 'column-major' },
      { type: 'select-padding' },
      { type: 'select-padding', padding: '1' },
      { type: 'select-padding', padding: 2 },
      { type: 'unknown-action' },
    ];

    for (const action of malformedActions) {
      const update = reduceTransposeTileState(state, action);
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
      if (!update.accepted) expect(update.issue).toEqual(expect.any(String));
    }
  });

  it('fails closed for malformed states and leaves rejected state identity unchanged', () => {
    const invalidStates = [
      null,
      {},
      { tileSize: 4, layout: 'input-row-major' },
      { tileSize: 4, layout: 'input-row-major', padding: 0, extra: true },
      { tileSize: '4', layout: 'input-row-major', padding: 0 },
      { tileSize: 16, layout: 'input-row-major', padding: 0 },
      { tileSize: 4, layout: 'column-major', padding: 0 },
      { tileSize: 4, layout: 'input-row-major', padding: 2 },
    ] as unknown as TransposeTileState[];

    for (const state of invalidStates) {
      expect(deriveTransposeTileView(state)).toEqual({ accepted: false, issue: 'invalid-state' });
      const update = reduceTransposeTileState(state, { type: 'reset' });
      expect(update).toMatchObject({ accepted: false, state, issue: 'invalid-state' });
      expect(update.state).toBe(state);
    }
  });

  it('keeps the reviewed literal types usable by callers', () => {
    const size: TransposeTileSize = 4;
    const layout: TransposeTileLayout = 'input-row-major';
    const padding: TransposeTilePadding = 0;
    expect(deriveTransposeTileView({ tileSize: size, layout, padding }).accepted).toBe(true);
  });
});
