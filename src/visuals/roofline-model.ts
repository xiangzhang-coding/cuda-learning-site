// SPDX-License-Identifier: Apache-2.0

export const ROOFLINE_INPUT_KEYS = [
  'computeCeiling',
  'bandwidthCeiling',
  'arithmeticIntensity',
  'achievedRate',
] as const;

export type RooflineInputKey = (typeof ROOFLINE_INPUT_KEYS)[number];

export type RooflineInputs = Readonly<Record<RooflineInputKey, string>>;
export type RooflineState = Readonly<{ inputs: RooflineInputs }>;

export const ROOFLINE_INPUT_LIMITS = {
  computeCeiling: { minimum: 100, maximum: 100_000 },
  bandwidthCeiling: { minimum: 10, maximum: 10_000 },
  arithmeticIntensity: { minimum: 0.01, maximum: 10_000 },
  achievedRate: { minimum: 0.01, maximum: 100_000 },
} as const satisfies Readonly<Record<RooflineInputKey, Readonly<{ minimum: number; maximum: number }>>>;

export const ROOFLINE_DEFAULT_INPUTS = {
  computeCeiling: '12000',
  bandwidthCeiling: '800',
  arithmeticIntensity: '8',
  achievedRate: '5600',
} as const satisfies RooflineInputs;

export const ROOFLINE_MODEL_CONTRACT = {
  modelId: 'declared-single-roofline-teaching-model',
  inputSemantics: 'synthetic-declared-browser-inputs-not-device-facts-or-observations',
  computeUnit: 'Gop/s',
  bandwidthUnit: 'decimal-GB/s',
  decimalGigabyteBytes: 1_000_000_000,
  intensityUnit: 'operations/byte',
  ridgeFormula: 'declared-compute-ceiling/declared-bandwidth-ceiling',
  roofFormula: 'min(declared-compute-ceiling,arithmetic-intensity*declared-bandwidth-ceiling)',
  executesCuda: false,
  queriesDevice: false,
  observesWorkload: false,
  acceptsMeasuredInputAsEvidence: false,
  compilationEvidence: [] as const,
  runtimeEvidence: [] as const,
  expectedObservations: [] as const,
  recordedObservations: [] as const,
  evidenceStatusEffect: 'none',
} as const;

export const ROOFLINE_SVG_CONTRACT = {
  viewBox: { x: 0, y: 0, width: 720, height: 420 },
  plot: { left: 84, right: 684, top: 32, bottom: 356 },
  xDomain: {
    minimum: ROOFLINE_INPUT_LIMITS.arithmeticIntensity.minimum,
    maximum: ROOFLINE_INPUT_LIMITS.arithmeticIntensity.maximum,
  },
  yDomain: {
    minimum: ROOFLINE_INPUT_LIMITS.achievedRate.minimum,
    maximum: ROOFLINE_INPUT_LIMITS.achievedRate.maximum,
  },
  pointRadius: 7,
} as const;

export const ROOFLINE_COMPARISON_RELATIVE_TOLERANCE = 1e-9;

export type RooflineParseIssue = 'empty' | 'non-decimal' | 'nonpositive' | 'out-of-range';
export type RooflineInputIssue = Readonly<{ input: RooflineInputKey; reason: RooflineParseIssue }>;
export type RooflineModelRegion = 'bandwidth-side' | 'ridge' | 'compute-side';
export type RooflinePointRelation = 'below-roof' | 'on-roof' | 'above-declared-roof';
export type RooflineStateIssue = 'invalid-state' | 'invalid-action' | 'unknown-input-key';

export type RooflineSvgPoint = Readonly<{ x: number; y: number }>;
export type RooflineSvgLine = Readonly<{ start: RooflineSvgPoint; end: RooflineSvgPoint }>;
export type RooflineSvgTick = Readonly<{ value: number; coordinate: number }>;

export type RooflineSvgGeometry = Readonly<{
  viewBox: typeof ROOFLINE_SVG_CONTRACT.viewBox;
  viewBoxValue: string;
  plot: typeof ROOFLINE_SVG_CONTRACT.plot;
  axes: Readonly<{ horizontal: RooflineSvgLine; vertical: RooflineSvgLine }>;
  roof: Readonly<{
    bandwidthSegment: RooflineSvgLine;
    computeSegment: RooflineSvgLine;
    ridgePoint: RooflineSvgPoint;
    ridgeMarker: readonly RooflineSvgPoint[];
  }>;
  workloadPoint: Readonly<RooflineSvgPoint & { radius: number }>;
  workloadGuides: Readonly<{ horizontal: RooflineSvgLine; vertical: RooflineSvgLine }>;
  labels: Readonly<{ ridge: RooflineSvgPoint; workload: RooflineSvgPoint }>;
  xTicks: readonly RooflineSvgTick[];
  yTicks: readonly RooflineSvgTick[];
}>;

export type RooflineView = Readonly<{
  values: Readonly<{
    computeCeiling: number;
    bandwidthCeiling: number;
    arithmeticIntensity: number;
    achievedRate: number;
  }>;
  ridgeIntensity: number;
  workloadRoof: number;
  region: RooflineModelRegion;
  pointRelation: RooflinePointRelation;
  geometry: RooflineSvgGeometry;
  contract: typeof ROOFLINE_MODEL_CONTRACT;
}>;

export type RooflineViewResult =
  | Readonly<{ accepted: true; view: RooflineView }>
  | Readonly<{
      accepted: false;
      issue: 'invalid-state' | 'invalid-input';
      inputIssues: readonly RooflineInputIssue[];
      geometry: null;
      contract: typeof ROOFLINE_MODEL_CONTRACT;
    }>;

export type RooflineStateUpdate =
  | Readonly<{ accepted: true; state: RooflineState }>
  | Readonly<{ accepted: false; state: RooflineState; issue: RooflineStateIssue }>;

export type RooflineDecimalResult =
  | Readonly<{ accepted: true; value: number }>
  | Readonly<{ accepted: false; issue: RooflineParseIssue }>;

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: RecordValue, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => actual.includes(key));
}

function parseInputKey(value: unknown): RooflineInputKey | null {
  if (typeof value !== 'string') return null;
  return ROOFLINE_INPUT_KEYS.find((key) => key === value) ?? null;
}

function hasValidStateShape(state: RooflineState): boolean {
  if (!isRecord(state) || !hasExactKeys(state, ['inputs']) || !isRecord(state.inputs)) return false;
  return hasExactKeys(state.inputs, ROOFLINE_INPUT_KEYS)
    && ROOFLINE_INPUT_KEYS.every((key) => typeof state.inputs[key] === 'string');
}

export function parseRooflineDecimal(
  raw: unknown,
  minimum: number,
  maximum: number,
): RooflineDecimalResult {
  if (raw === '') return { accepted: false, issue: 'empty' };
  if (typeof raw !== 'string' || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw)) {
    return { accepted: false, issue: 'non-decimal' };
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) return { accepted: false, issue: 'out-of-range' };
  if (value <= 0) return { accepted: false, issue: 'nonpositive' };
  if (
    !Number.isFinite(minimum)
    || !Number.isFinite(maximum)
    || minimum <= 0
    || maximum < minimum
    || value < minimum
    || value > maximum
  ) {
    return { accepted: false, issue: 'out-of-range' };
  }
  return { accepted: true, value };
}

function compareWithTolerance(left: number, right: number): -1 | 0 | 1 {
  const scale = Math.max(Math.abs(left), Math.abs(right), 1);
  if (Math.abs(left - right) <= scale * ROOFLINE_COMPARISON_RELATIVE_TOLERANCE) return 0;
  return left < right ? -1 : 1;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(3));
}

function projectLogarithmic(value: number, minimum: number, maximum: number, start: number, end: number): number {
  const ratio = (Math.log10(value) - Math.log10(minimum)) / (Math.log10(maximum) - Math.log10(minimum));
  return roundCoordinate(start + ratio * (end - start));
}

function projectX(value: number): number {
  const { xDomain, plot } = ROOFLINE_SVG_CONTRACT;
  return projectLogarithmic(value, xDomain.minimum, xDomain.maximum, plot.left, plot.right);
}

function projectY(value: number): number {
  const { yDomain, plot } = ROOFLINE_SVG_CONTRACT;
  return projectLogarithmic(value, yDomain.minimum, yDomain.maximum, plot.bottom, plot.top);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function createGeometry(
  computeCeiling: number,
  bandwidthCeiling: number,
  arithmeticIntensity: number,
  achievedRate: number,
  ridgeIntensity: number,
): RooflineSvgGeometry {
  const { viewBox, plot, xDomain, pointRadius } = ROOFLINE_SVG_CONTRACT;
  const ridgePoint = { x: projectX(ridgeIntensity), y: projectY(computeCeiling) };
  const roofStart = {
    x: projectX(xDomain.minimum),
    y: projectY(Math.min(computeCeiling, xDomain.minimum * bandwidthCeiling)),
  };
  const roofEnd = { x: projectX(xDomain.maximum), y: projectY(computeCeiling) };
  const workloadPoint = {
    x: projectX(arithmeticIntensity),
    y: projectY(achievedRate),
    radius: pointRadius,
  };
  const markerRadius = 7;
  const ridgeMarker = [
    { x: ridgePoint.x, y: roundCoordinate(ridgePoint.y - markerRadius) },
    { x: roundCoordinate(ridgePoint.x + markerRadius), y: ridgePoint.y },
    { x: ridgePoint.x, y: roundCoordinate(ridgePoint.y + markerRadius) },
    { x: roundCoordinate(ridgePoint.x - markerRadius), y: ridgePoint.y },
  ];
  const labelMaximumX = viewBox.width - 116;

  return {
    viewBox,
    viewBoxValue: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    plot,
    axes: {
      horizontal: { start: { x: plot.left, y: plot.bottom }, end: { x: plot.right, y: plot.bottom } },
      vertical: { start: { x: plot.left, y: plot.bottom }, end: { x: plot.left, y: plot.top } },
    },
    roof: {
      bandwidthSegment: { start: roofStart, end: ridgePoint },
      computeSegment: { start: ridgePoint, end: roofEnd },
      ridgePoint,
      ridgeMarker,
    },
    workloadPoint,
    workloadGuides: {
      horizontal: {
        start: { x: plot.left, y: workloadPoint.y },
        end: { x: workloadPoint.x, y: workloadPoint.y },
      },
      vertical: {
        start: { x: workloadPoint.x, y: plot.bottom },
        end: { x: workloadPoint.x, y: workloadPoint.y },
      },
    },
    labels: {
      ridge: {
        x: roundCoordinate(clamp(ridgePoint.x + 10, plot.left + 8, labelMaximumX)),
        y: roundCoordinate(clamp(ridgePoint.y + 19, plot.top + 15, plot.bottom - 8)),
      },
      workload: {
        x: roundCoordinate(clamp(workloadPoint.x + 12, plot.left + 8, labelMaximumX)),
        y: roundCoordinate(clamp(workloadPoint.y - 11, plot.top + 15, plot.bottom - 8)),
      },
    },
    xTicks: [0.01, 0.1, 1, 10, 100, 1_000, 10_000].map((value) => ({
      value,
      coordinate: projectX(value),
    })),
    yTicks: [0.01, 0.1, 1, 10, 100, 1_000, 10_000, 100_000].map((value) => ({
      value,
      coordinate: projectY(value),
    })),
  };
}

export function createRooflineState(): RooflineState {
  return { inputs: { ...ROOFLINE_DEFAULT_INPUTS } };
}

export function deriveRooflineView(state: RooflineState): RooflineViewResult {
  if (!hasValidStateShape(state)) {
    return {
      accepted: false,
      issue: 'invalid-state',
      inputIssues: [],
      geometry: null,
      contract: ROOFLINE_MODEL_CONTRACT,
    };
  }

  const parsed = Object.fromEntries(ROOFLINE_INPUT_KEYS.map((input) => {
    const limits = ROOFLINE_INPUT_LIMITS[input];
    return [input, parseRooflineDecimal(state.inputs[input], limits.minimum, limits.maximum)];
  })) as Record<RooflineInputKey, RooflineDecimalResult>;
  const inputIssues = ROOFLINE_INPUT_KEYS.flatMap((input): RooflineInputIssue[] => {
    const result = parsed[input];
    return result.accepted ? [] : [{ input, reason: result.issue }];
  });
  if (inputIssues.length > 0) {
    return {
      accepted: false,
      issue: 'invalid-input',
      inputIssues,
      geometry: null,
      contract: ROOFLINE_MODEL_CONTRACT,
    };
  }

  const computeCeiling = parsed.computeCeiling.accepted ? parsed.computeCeiling.value : Number.NaN;
  const bandwidthCeiling = parsed.bandwidthCeiling.accepted ? parsed.bandwidthCeiling.value : Number.NaN;
  const arithmeticIntensity = parsed.arithmeticIntensity.accepted ? parsed.arithmeticIntensity.value : Number.NaN;
  const achievedRate = parsed.achievedRate.accepted ? parsed.achievedRate.value : Number.NaN;
  const ridgeIntensity = computeCeiling / bandwidthCeiling;
  const workloadRoof = Math.min(computeCeiling, arithmeticIntensity * bandwidthCeiling);
  const ridgeComparison = compareWithTolerance(arithmeticIntensity, ridgeIntensity);
  const roofComparison = compareWithTolerance(achievedRate, workloadRoof);
  const region: RooflineModelRegion = ridgeComparison < 0
    ? 'bandwidth-side'
    : ridgeComparison > 0
      ? 'compute-side'
      : 'ridge';
  const pointRelation: RooflinePointRelation = roofComparison < 0
    ? 'below-roof'
    : roofComparison > 0
      ? 'above-declared-roof'
      : 'on-roof';

  return {
    accepted: true,
    view: {
      values: { computeCeiling, bandwidthCeiling, arithmeticIntensity, achievedRate },
      ridgeIntensity,
      workloadRoof,
      region,
      pointRelation,
      geometry: createGeometry(
        computeCeiling,
        bandwidthCeiling,
        arithmeticIntensity,
        achievedRate,
        ridgeIntensity,
      ),
      contract: ROOFLINE_MODEL_CONTRACT,
    },
  };
}

export function reduceRooflineState(state: RooflineState, action: unknown): RooflineStateUpdate {
  if (!hasValidStateShape(state)) return { accepted: false, state, issue: 'invalid-state' };
  if (!isRecord(action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }
  if (action.type === 'reset') {
    if (!hasExactKeys(action, ['type'])) return { accepted: false, state, issue: 'invalid-action' };
    return { accepted: true, state: createRooflineState() };
  }
  if (action.type === 'set-input') {
    if (!hasExactKeys(action, ['type', 'input', 'value']) || typeof action.value !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const input = parseInputKey(action.input);
    if (input === null) return { accepted: false, state, issue: 'unknown-input-key' };
    return {
      accepted: true,
      state: { inputs: { ...state.inputs, [input]: action.value } },
    };
  }
  return { accepted: false, state, issue: 'invalid-action' };
}
