// SPDX-License-Identifier: Apache-2.0
export const TRITON_MAPPING_TILES = [8, 16, 32, 64, 128, 256] as const;

/** Logical ownership only. CUDA uses a separate, fixed 32-thread teaching block. */
export function mapTritonPositions(size: number, tile: number, program: number) {
  if (!Number.isSafeInteger(size) || size < 1 || size > 4096 ||
      !TRITON_MAPPING_TILES.some((value) => value === tile)) {
    throw new RangeError('Unsupported problem size or tile');
  }
  const programs = Math.ceil(size / tile);
  if (!Number.isSafeInteger(program) || program < 0 || program >= programs) {
    throw new RangeError('Program outside grid');
  }
  const positions = Array.from({ length: tile }, (_, position) => {
    const index = program * tile + position;
    return { position, index, valid: index < size,
      cudaBlock: Math.floor(index / 32), cudaThread: index % 32,
      cudaLaunched: index < Math.ceil(size / 32) * 32 };
  });
  return { size, tile, program, programs, cudaBlocks: Math.ceil(size / 32),
    masked: programs * tile - size, positions };
}
