// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  GEMM_HIERARCHY_LEVELS,
  GEMM_HIERARCHY_MATRIX_SHAPES,
  GEMM_HIERARCHY_MODEL_CONTRACT,
  GEMM_HIERARCHY_TILE_SHAPES,
  createGemmHierarchyState,
  deriveGemmHierarchyView,
  reduceGemmHierarchyState,
  type GemmHierarchyState,
} from '../../src/visuals/gemm-hierarchy-model';

function derive(state: GemmHierarchyState) {
  const result = deriveGemmHierarchyView(state);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error('Expected a reviewed GEMM hierarchy state.');
  return result.view;
}

describe('VIS12 GEMM hierarchy model', () => {
  it('publishes a bounded five-level evidence-neutral model', () => {
    expect(GEMM_HIERARCHY_LEVELS).toEqual(['matrix', 'tile', 'threadblock', 'warp', 'instruction']);
    expect(GEMM_HIERARCHY_MATRIX_SHAPES).toEqual(['128x128x32', '256x128x64']);
    expect(GEMM_HIERARCHY_TILE_SHAPES).toEqual(['64x64x16', '128x64x16']);
    expect(createGemmHierarchyState()).toEqual({
      matrixShape: '128x128x32',
      tileShape: '64x64x16',
      level: 'matrix',
    });
    expect(GEMM_HIERARCHY_MODEL_CONTRACT).toMatchObject({
      executesCuda: false,
      queriesDevice: false,
      observesInstructionEmission: false,
      compilationEvidence: 'none',
      runtimeEvidence: 'none',
      performanceEvidence: 'none',
      evidenceStatusEffect: 'none',
    });
  });

  it.each(GEMM_HIERARCHY_MATRIX_SHAPES.flatMap((matrixShape) =>
    GEMM_HIERARCHY_TILE_SHAPES.flatMap((tileShape) =>
      GEMM_HIERARCHY_LEVELS.map((level) => ({ matrixShape, tileShape, level }))))) (
    'derives $matrixShape / $tileShape / $level deterministically',
    (state) => {
      const view = derive(state);
      expect(view.panels.map(({ level }) => level)).toEqual(GEMM_HIERARCHY_LEVELS);
      expect(view.selectedPanel.level).toBe(state.level);
      expect(view.threadblock).toEqual(view.tile);
      expect(view.threadblockCount).toBe(view.outputTileGrid.total);
      expect(view.threadblockCount).not.toBe(view.outputTileGrid.total * view.kSliceCount);
      expect(view.tile.m % view.warp.m).toBe(0);
      expect(view.tile.n % view.warp.n).toBe(0);
      expect(view.warpsPerThreadblock).toBe((view.tile.m / view.warp.m) * (view.tile.n / view.warp.n));
      expect(view.instruction).toEqual({ m: 1, n: 1, k: 1 });
      expect(view.modeledOperationSlotsPerWarpKSlice).toBe(view.warp.m * view.warp.n * view.tile.k);
      expect(deriveGemmHierarchyView(state)).toEqual(deriveGemmHierarchyView(state));
    },
  );

  it('applies each native selection and reset', () => {
    const initial = createGemmHierarchyState();
    const matrix = reduceGemmHierarchyState(initial, {
      type: 'select-matrix-shape', matrixShape: '256x128x64',
    });
    expect(matrix).toEqual({
      accepted: true,
      state: { ...initial, matrixShape: '256x128x64' },
    });
    if (!matrix.accepted) throw new Error('Expected matrix selection.');
    const tile = reduceGemmHierarchyState(matrix.state, {
      type: 'select-tile-shape', tileShape: '128x64x16',
    });
    expect(tile.accepted).toBe(true);
    if (!tile.accepted) throw new Error('Expected tile selection.');
    const level = reduceGemmHierarchyState(tile.state, {
      type: 'select-level', level: 'instruction',
    });
    expect(level.accepted).toBe(true);
    if (!level.accepted) throw new Error('Expected level selection.');
    expect(reduceGemmHierarchyState(level.state, { type: 'reset' })).toEqual({
      accepted: true,
      state: initial,
    });
  });

  it('fails closed for malformed state and actions while preserving rejected state identity', () => {
    const state: GemmHierarchyState = {
      matrixShape: '256x128x64', tileShape: '128x64x16', level: 'instruction',
    };
    for (const action of [
      null,
      {},
      { type: 'reset', extra: true },
      { type: 'select-matrix-shape', matrixShape: 'bad' },
      { type: 'select-tile-shape', tileShape: 'bad' },
      { type: 'select-level', level: 'device' },
      { type: 'unknown' },
    ]) {
      const update = reduceGemmHierarchyState(state, action);
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
    }

    const invalid = { ...state, extra: true } as unknown as GemmHierarchyState;
    expect(deriveGemmHierarchyView(invalid)).toEqual({ accepted: false, issue: 'invalid-state' });
    const update = reduceGemmHierarchyState(invalid, { type: 'reset' });
    expect(update).toMatchObject({ accepted: false, state: invalid, issue: 'invalid-state' });
    expect(update.state).toBe(invalid);
  });
});
