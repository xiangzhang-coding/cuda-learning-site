// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { mapTritonPositions, TRITON_MAPPING_TILES } from '../../src/visuals/triton-mapping-model';

describe('VIS17 logical mapping', () => {
  it('keeps CUDA owners independent of Triton program boundaries', () => {
    const model = mapTritonPositions(37, 16, 2);
    expect(model).toMatchObject({ programs: 3, cudaBlocks: 2, masked: 11 });
    expect(model.positions[4]).toEqual({ position: 4, index: 36, valid: true, cudaBlock: 1, cudaThread: 4, cudaLaunched: true });
    expect(model.positions[5]).toMatchObject({ index: 37, valid: false, cudaThread: 5 });
    expect(mapTritonPositions(1, 256, 0).positions[32].cudaLaunched).toBe(false);
  });
  it('covers each valid index exactly once across every supported tile', () => {
    for (const n of [1, 17, 32, 37, 64, 255, 256, 257, 1003, 4096]) {
      for (const tile of TRITON_MAPPING_TILES) {
        const indices = Array.from({ length: Math.ceil(n / tile) }, (_, p) => mapTritonPositions(n, tile, p))
          .flatMap((model) => model.positions.filter((position) => position.valid).map((position) => position.index));
        expect(indices).toEqual(Array.from({ length: n }, (_, i) => i));
      }
    }
  });
  it('rejects unsafe shapes and out-of-grid programs', () => {
    for (const args of [[0, 16, 0], [4097, 16, 0], [NaN, 16, 0], [37, 17, 0], [37, 16, -1], [37, 16, 3], [37, 16, .5]]) {
      expect(() => mapTritonPositions(args[0], args[1], args[2])).toThrow(RangeError);
    }
  });
});
