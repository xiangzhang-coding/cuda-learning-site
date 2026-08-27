// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  BLOCK_SHAPE_CAPABILITIES,
  BLOCK_SHAPE_STATIC_CASES,
  DEFAULT_BLOCK_SHAPE_CAPABILITY_ID,
  assessBlockShape,
  createDefaultBlockShapeInput,
  findBlockShapeCapability,
  parsePositiveBlockShapeInteger,
  safeBlockShapeCeilDivide,
  safeBlockShapeProduct,
  type BlockShapeCapabilityRecord,
  type BlockShapeInput,
} from '../../src/visuals/block-shape-model';

const baseline = BLOCK_SHAPE_CAPABILITIES[0];

function input(overrides: Partial<BlockShapeInput> = {}): BlockShapeInput {
  return { ...createDefaultBlockShapeInput(), ...overrides };
}

describe('F08 block-shape model', () => {
  it.each([
    ['1', 1],
    ['1024', 1_024],
    [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
  ])('parses positive safe integer input %s', (value, expected) => {
    expect(parsePositiveBlockShapeInteger(value)).toBe(expected);
  });

  it.each(['', ' ', '0', '-1', '+1', '1.5', '1e3', '01', 'NaN', 'Infinity', '9007199254740992'])(
    'rejects malformed, zero, or unsafe input %j',
    (value) => {
      expect(parsePositiveBlockShapeInteger(value)).toBeNull();
    },
  );

  it('checks products before multiplication and uses overflow-safe ceiling division', () => {
    expect(safeBlockShapeProduct([1_024, 1_024])).toBe(1_048_576);
    expect(safeBlockShapeProduct([Number.MAX_SAFE_INTEGER, 2])).toBeNull();
    expect(safeBlockShapeProduct([4, 0])).toBeNull();
    expect(safeBlockShapeCeilDivide(Number.MAX_SAFE_INTEGER, 2)).toBe(4_503_599_627_370_496);
    expect(safeBlockShapeCeilDivide(65, 16)).toBe(5);
    expect(safeBlockShapeCeilDivide(0, 16)).toBeNull();
  });

  it('derives grid, launch, and fringe only after the selected capability checks pass', () => {
    const assessment = assessBlockShape(createDefaultBlockShapeInput(), baseline);

    expect(assessment.valid).toBe(true);
    if (!assessment.valid) throw new Error('Expected a valid default assessment.');
    expect(assessment.geometry).toEqual({
      logical: { width: 65, height: 41, elements: 2_665 },
      block: { x: 16, y: 8, threads: 128 },
      grid: { x: 5, y: 6, blocks: 30 },
      coverage: { width: 80, height: 48, launchedThreads: 3_840, fringeThreads: 1_175 },
    });
    expect(assessment.sourceFactIds).toEqual(['SRC-CUDA-016']);
    expect(assessment.remainingFeasibilityChecks).toEqual([
      'kernel-max-threads-per-block',
      'compiled-register-demand-per-block',
      'static-plus-dynamic-shared-memory-per-block',
    ]);
    expect(assessment.performanceVerdict).toBe('not-assessed');
    expect(assessment.evidenceStatusEffect).toBe('none');
  });

  it('preserves the logical extent when a launch divides exactly', () => {
    const assessment = assessBlockShape(
      { logicalWidth: '64', logicalHeight: '40', blockX: '16', blockY: '8' },
      baseline,
    );

    expect(assessment.valid).toBe(true);
    if (!assessment.valid) throw new Error('Expected an exact valid assessment.');
    expect(assessment.geometry.grid).toEqual({ x: 4, y: 5, blocks: 20 });
    expect(assessment.geometry.coverage).toEqual({
      width: 64,
      height: 40,
      launchedThreads: 2_560,
      fringeThreads: 0,
    });
  });

  it.each([
    ['logical width', { logicalWidth: '0' }, 'logical-width-invalid'],
    ['logical height', { logicalHeight: '-2' }, 'logical-height-invalid'],
    ['block x', { blockX: '1e2' }, 'block-x-invalid'],
    ['block y', { blockY: '8.5' }, 'block-y-invalid'],
  ] as const)('fails closed for invalid %s', (_name, override, issue) => {
    const assessment = assessBlockShape(input(override), baseline);

    expect(assessment).toMatchObject({ valid: false, geometry: null });
    expect(assessment.issues).toContain(issue);
  });

  it('checks each block axis independently from the aggregate thread count', () => {
    const xAxis = assessBlockShape(input({ blockX: '1025', blockY: '1' }), baseline);
    const yAxis = assessBlockShape(input({ blockX: '1', blockY: '1025' }), baseline);
    const aggregate = assessBlockShape(input({ blockX: '1024', blockY: '2' }), baseline);

    expect(xAxis).toMatchObject({ valid: false, geometry: null });
    expect(xAxis.issues).toContain('block-x-exceeds-capability');
    expect(yAxis.issues).toContain('block-y-exceeds-capability');
    expect(aggregate.issues).toEqual(['threads-per-block-exceeds-capability']);
  });

  it('rejects grid axes that exceed the explicit capability record', () => {
    const gridX = assessBlockShape(input({ logicalWidth: '2147483648', blockX: '1' }), baseline);
    const gridY = assessBlockShape(input({ logicalHeight: '65536', blockY: '1' }), baseline);

    expect(gridX.issues).toContain('grid-x-exceeds-capability');
    expect(gridY.issues).toContain('grid-y-exceeds-capability');
    expect(gridX.geometry).toBeNull();
    expect(gridY.geometry).toBeNull();
  });

  it('returns no partial geometry when logical or launch arithmetic would overflow', () => {
    const logicalOverflow = assessBlockShape(
      input({ logicalWidth: String(Number.MAX_SAFE_INTEGER), logicalHeight: '2', blockX: '1', blockY: '1' }),
      baseline,
    );
    expect(logicalOverflow.issues).toContain('logical-elements-overflow');
    expect(logicalOverflow.geometry).toBeNull();

    const wideCapability: BlockShapeCapabilityRecord = {
      ...baseline,
      id: 'wide-test-record',
      maxBlockDim: { x: 2, y: 1 },
      maxThreadsPerBlock: 2,
      maxGridDim: { x: Number.MAX_SAFE_INTEGER, y: 1 },
    };
    const launchOverflow = assessBlockShape(
      { logicalWidth: String(Number.MAX_SAFE_INTEGER), logicalHeight: '1', blockX: '2', blockY: '1' },
      wideCapability,
    );
    expect(launchOverflow.issues).toEqual(
      expect.arrayContaining(['coverage-width-overflow', 'launched-threads-overflow']),
    );
    expect(launchOverflow.geometry).toBeNull();
  });

  it('uses deterministic reset data and explicit reviewed capability records', () => {
    expect(createDefaultBlockShapeInput()).toEqual({
      logicalWidth: '65',
      logicalHeight: '41',
      blockX: '16',
      blockY: '8',
    });
    expect(findBlockShapeCapability(DEFAULT_BLOCK_SHAPE_CAPABILITY_ID)).toBe(baseline);
    expect(findBlockShapeCapability('unknown')).toBeNull();
    expect(BLOCK_SHAPE_CAPABILITIES.map(({ id, sourceFactIds }) => [id, sourceFactIds])).toEqual([
      ['cc-7.5', ['SRC-CUDA-016']],
      ['cc-8.0', ['SRC-CUDA-016']],
    ]);
  });

  it('keeps all static fallback cases model-derived and fail-closed', () => {
    const assessments = BLOCK_SHAPE_STATIC_CASES.map(({ id, input: caseInput }) => ({
      id,
      assessment: assessBlockShape(caseInput, baseline),
    }));

    expect(assessments.map(({ id }) => id)).toEqual(['exact', 'fringe', 'aggregate-invalid']);
    expect(assessments[0].assessment).toMatchObject({ valid: true });
    expect(assessments[1].assessment).toMatchObject({ valid: true });
    expect(assessments[2].assessment).toMatchObject({
      valid: false,
      issues: ['threads-per-block-exceeds-capability'],
      geometry: null,
    });
  });
});
