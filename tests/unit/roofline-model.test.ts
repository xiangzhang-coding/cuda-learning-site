// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  ROOFLINE_DEFAULT_INPUTS,
  ROOFLINE_INPUT_KEYS,
  ROOFLINE_INPUT_LIMITS,
  ROOFLINE_MODEL_CONTRACT,
  ROOFLINE_SVG_CONTRACT,
  createRooflineState,
  deriveRooflineView,
  parseRooflineDecimal,
  reduceRooflineState,
  type RooflineInputs,
  type RooflineState,
  type RooflineSvgGeometry,
  type RooflineSvgPoint,
} from '../../src/visuals/roofline-model';

function state(overrides: Partial<RooflineInputs> = {}): RooflineState {
  return { inputs: { ...createRooflineState().inputs, ...overrides } };
}

function derive(inputState: RooflineState = createRooflineState()) {
  const result = deriveRooflineView(inputState);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error('Expected a valid declared Roofline state.');
  return result.view;
}

function geometryPoints(geometry: RooflineSvgGeometry): readonly RooflineSvgPoint[] {
  return [
    geometry.axes.horizontal.start,
    geometry.axes.horizontal.end,
    geometry.axes.vertical.start,
    geometry.axes.vertical.end,
    geometry.roof.bandwidthSegment.start,
    geometry.roof.bandwidthSegment.end,
    geometry.roof.computeSegment.start,
    geometry.roof.computeSegment.end,
    geometry.roof.ridgePoint,
    ...geometry.roof.ridgeMarker,
    geometry.workloadPoint,
    geometry.workloadGuides.horizontal.start,
    geometry.workloadGuides.horizontal.end,
    geometry.workloadGuides.vertical.start,
    geometry.workloadGuides.vertical.end,
    geometry.labels.ridge,
    geometry.labels.workload,
  ];
}

describe('VIS13 Roofline model', () => {
  it.each([
    ['0.01', 0.01],
    ['1', 1],
    ['1.25', 1.25],
    ['100000', 100_000],
  ])('parses the canonical plain decimal %s', (raw, expected) => {
    expect(parseRooflineDecimal(raw, 0.01, 100_000)).toEqual({ accepted: true, value: expected });
  });

  it.each([
    ['', 'empty'],
    [' ', 'non-decimal'],
    [' 1', 'non-decimal'],
    ['1 ', 'non-decimal'],
    ['NaN', 'non-decimal'],
    ['Infinity', 'non-decimal'],
    ['+1', 'non-decimal'],
    ['1e3', 'non-decimal'],
    ['.5', 'non-decimal'],
    ['1.', 'non-decimal'],
    ['01', 'non-decimal'],
    ['1,5', 'non-decimal'],
    [null, 'non-decimal'],
    ['0', 'nonpositive'],
    ['0.0', 'nonpositive'],
    ['-1', 'nonpositive'],
    ['-0.25', 'nonpositive'],
    ['0.009', 'out-of-range'],
    ['100001', 'out-of-range'],
    ['9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999', 'out-of-range'],
  ] as const)('rejects %j as %s', (raw, issue) => {
    expect(parseRooflineDecimal(raw, 0.01, 100_000)).toEqual({ accepted: false, issue });
  });

  it('fails closed when the supplied parser bounds are malformed', () => {
    expect(parseRooflineDecimal('1', Number.NaN, 10)).toEqual({ accepted: false, issue: 'out-of-range' });
    expect(parseRooflineDecimal('1', 1, Number.POSITIVE_INFINITY)).toEqual({ accepted: false, issue: 'out-of-range' });
    expect(parseRooflineDecimal('1', 0, 10)).toEqual({ accepted: false, issue: 'out-of-range' });
    expect(parseRooflineDecimal('1', 10, 1)).toEqual({ accepted: false, issue: 'out-of-range' });
  });

  it('publishes bounded synthetic defaults and derives the default ridge and roof', () => {
    expect(ROOFLINE_INPUT_KEYS).toEqual([
      'computeCeiling',
      'bandwidthCeiling',
      'arithmeticIntensity',
      'achievedRate',
    ]);
    expect(createRooflineState()).toEqual({ inputs: ROOFLINE_DEFAULT_INPUTS });
    expect(ROOFLINE_INPUT_LIMITS).toEqual({
      computeCeiling: { minimum: 100, maximum: 100_000 },
      bandwidthCeiling: { minimum: 10, maximum: 10_000 },
      arithmeticIntensity: { minimum: 0.01, maximum: 10_000 },
      achievedRate: { minimum: 0.01, maximum: 100_000 },
    });

    const view = derive();
    expect(view.values).toEqual({
      computeCeiling: 12_000,
      bandwidthCeiling: 800,
      arithmeticIntensity: 8,
      achievedRate: 5_600,
    });
    expect(view.ridgeIntensity).toBe(15);
    expect(view.workloadRoof).toBe(6_400);
    expect(view.region).toBe('bandwidth-side');
    expect(view.pointRelation).toBe('below-roof');
    expect(view.contract).toBe(ROOFLINE_MODEL_CONTRACT);
  });

  it.each([
    ['5', '400', 'bandwidth-side', 500],
    ['10', '900', 'ridge', 1_000],
    ['20', '900', 'compute-side', 1_000],
  ] as const)('classifies intensity %s in the %s model region', (arithmeticIntensity, achievedRate, region, roof) => {
    const view = derive(state({
      computeCeiling: '1000',
      bandwidthCeiling: '100',
      arithmeticIntensity,
      achievedRate,
    }));
    expect(view.ridgeIntensity).toBe(10);
    expect(view.workloadRoof).toBe(roof);
    expect(view.region).toBe(region);
  });

  it.each([
    ['499', 'below-roof'],
    ['500', 'on-roof'],
    ['501', 'above-declared-roof'],
  ] as const)('classifies achieved rate %s as %s', (achievedRate, pointRelation) => {
    const view = derive(state({
      computeCeiling: '1000',
      bandwidthCeiling: '100',
      arithmeticIntensity: '5',
      achievedRate,
    }));
    expect(view.workloadRoof).toBe(500);
    expect(view.pointRelation).toBe(pointRelation);
  });

  it('uses a deterministic relative tolerance at the ridge and roof', () => {
    const view = derive(state({
      computeCeiling: '1000',
      bandwidthCeiling: '100',
      arithmeticIntensity: '10.000000005',
      achievedRate: '1000.0000005',
    }));
    expect(view.region).toBe('ridge');
    expect(view.pointRelation).toBe('on-roof');
  });

  it('keeps above-roof input as a mismatch-audit view without granting evidence', () => {
    const result = deriveRooflineView(state({
      computeCeiling: '1000',
      bandwidthCeiling: '100',
      arithmeticIntensity: '20',
      achievedRate: '1200',
    }));
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error('Expected the mismatch-audit point to remain accepted.');
    expect(result.view).toMatchObject({
      workloadRoof: 1_000,
      region: 'compute-side',
      pointRelation: 'above-declared-roof',
    });
    expect(result.view.geometry.workloadPoint.y).toBeLessThan(result.view.geometry.roof.computeSegment.end.y);
    expect(result.view.contract.acceptsMeasuredInputAsEvidence).toBe(false);
    expect(result.view.contract.evidenceStatusEffect).toBe('none');
  });

  it('returns deterministic fixed-viewBox geometry with every coordinate finite and in bounds', () => {
    const states = [
      createRooflineState(),
      state({
        computeCeiling: '100',
        bandwidthCeiling: '10000',
        arithmeticIntensity: '0.01',
        achievedRate: '0.01',
      }),
      state({
        computeCeiling: '100000',
        bandwidthCeiling: '10',
        arithmeticIntensity: '10000',
        achievedRate: '100000',
      }),
    ];

    for (const inputState of states) {
      const first = deriveRooflineView(inputState);
      const second = deriveRooflineView(inputState);
      expect(first).toEqual(second);
      expect(first.accepted).toBe(true);
      if (!first.accepted) throw new Error('Expected bounded geometry.');
      const geometry = first.view.geometry;
      expect(geometry.viewBox).toBe(ROOFLINE_SVG_CONTRACT.viewBox);
      expect(geometry.viewBoxValue).toBe('0 0 720 420');
      expect(geometry.axes.horizontal).toEqual({
        start: { x: 84, y: 356 },
        end: { x: 684, y: 356 },
      });
      expect(geometry.roof.bandwidthSegment.end).toEqual(geometry.roof.ridgePoint);
      expect(geometry.roof.computeSegment.start).toEqual(geometry.roof.ridgePoint);
      expect(geometry.workloadPoint.radius).toBe(7);
      for (const point of geometryPoints(geometry)) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        expect(point.x).toBeGreaterThanOrEqual(geometry.viewBox.x);
        expect(point.x).toBeLessThanOrEqual(geometry.viewBox.width);
        expect(point.y).toBeGreaterThanOrEqual(geometry.viewBox.y);
        expect(point.y).toBeLessThanOrEqual(geometry.viewBox.height);
      }
      for (const tick of geometry.xTicks) {
        expect(Number.isFinite(tick.coordinate)).toBe(true);
        expect(tick.coordinate).toBeGreaterThanOrEqual(geometry.plot.left);
        expect(tick.coordinate).toBeLessThanOrEqual(geometry.plot.right);
      }
      for (const tick of geometry.yTicks) {
        expect(Number.isFinite(tick.coordinate)).toBe(true);
        expect(tick.coordinate).toBeGreaterThanOrEqual(geometry.plot.top);
        expect(tick.coordinate).toBeLessThanOrEqual(geometry.plot.bottom);
      }
    }
  });

  it('rejects every invalid input together and returns no chart geometry', () => {
    const result = deriveRooflineView(state({
      computeCeiling: '',
      bandwidthCeiling: '1e3',
      arithmeticIntensity: '0',
      achievedRate: '100001',
    }));
    expect(result).toEqual({
      accepted: false,
      issue: 'invalid-input',
      inputIssues: [
        { input: 'computeCeiling', reason: 'empty' },
        { input: 'bandwidthCeiling', reason: 'non-decimal' },
        { input: 'arithmeticIntensity', reason: 'nonpositive' },
        { input: 'achievedRate', reason: 'out-of-range' },
      ],
      geometry: null,
      contract: ROOFLINE_MODEL_CONTRACT,
    });
  });

  it('accepts raw set-input values, derives fail-closed, and resets from editable invalid input', () => {
    const initial = createRooflineState();
    const changed = reduceRooflineState(initial, {
      type: 'set-input',
      input: 'arithmeticIntensity',
      value: '',
    });
    expect(changed).toEqual({
      accepted: true,
      state: { inputs: { ...ROOFLINE_DEFAULT_INPUTS, arithmeticIntensity: '' } },
    });
    expect(initial).toEqual({ inputs: ROOFLINE_DEFAULT_INPUTS });
    if (!changed.accepted) throw new Error('Expected an editable raw-string state.');
    expect(deriveRooflineView(changed.state)).toMatchObject({
      accepted: false,
      issue: 'invalid-input',
      geometry: null,
    });
    expect(reduceRooflineState(changed.state, { type: 'reset' })).toEqual({
      accepted: true,
      state: initial,
    });
  });

  it('rejects malformed actions with exact-key validation and preserves state identity', () => {
    const current = state({ arithmeticIntensity: '20' });
    for (const action of [
      null,
      {},
      { type: 'reset', extra: true },
      { type: 'set-input' },
      { type: 'set-input', input: 'achievedRate', value: 500 },
      { type: 'set-input', input: 'achievedRate', value: '500', extra: true },
      { type: 'set-input', input: 'devicePeak', value: '500' },
      { type: 'sample-device' },
    ]) {
      const update = reduceRooflineState(current, action);
      expect(update.accepted).toBe(false);
      expect(update.state).toBe(current);
    }
    expect(reduceRooflineState(current, {
      type: 'set-input',
      input: 'devicePeak',
      value: '500',
    })).toMatchObject({ accepted: false, issue: 'unknown-input-key' });
  });

  it('rejects malformed states with exact-key validation and preserves rejected state identity', () => {
    const malformedStates = [
      { inputs: { ...ROOFLINE_DEFAULT_INPUTS }, extra: true },
      { inputs: { ...ROOFLINE_DEFAULT_INPUTS, extra: '1' } },
      { inputs: { ...ROOFLINE_DEFAULT_INPUTS, achievedRate: 5600 } },
      { inputs: { computeCeiling: '12000' } },
      { inputs: null },
    ] as unknown as RooflineState[];

    for (const malformed of malformedStates) {
      expect(deriveRooflineView(malformed)).toEqual({
        accepted: false,
        issue: 'invalid-state',
        inputIssues: [],
        geometry: null,
        contract: ROOFLINE_MODEL_CONTRACT,
      });
      const update = reduceRooflineState(malformed, { type: 'reset' });
      expect(update).toMatchObject({ accepted: false, issue: 'invalid-state' });
      expect(update.state).toBe(malformed);
    }
  });

  it('keeps the model contract evidence-neutral and free of device observations', () => {
    expect(ROOFLINE_MODEL_CONTRACT).toMatchObject({
      inputSemantics: 'synthetic-declared-browser-inputs-not-device-facts-or-observations',
      computeUnit: 'Gop/s',
      bandwidthUnit: 'decimal-GB/s',
      decimalGigabyteBytes: 1_000_000_000,
      executesCuda: false,
      queriesDevice: false,
      observesWorkload: false,
      acceptsMeasuredInputAsEvidence: false,
      evidenceStatusEffect: 'none',
    });
    expect(ROOFLINE_MODEL_CONTRACT.compilationEvidence).toEqual([]);
    expect(ROOFLINE_MODEL_CONTRACT.runtimeEvidence).toEqual([]);
    expect(ROOFLINE_MODEL_CONTRACT.expectedObservations).toEqual([]);
    expect(ROOFLINE_MODEL_CONTRACT.recordedObservations).toEqual([]);
  });
});
