// SPDX-License-Identifier: Apache-2.0

export type BlockShapeCapabilityRecord = Readonly<{
  id: string;
  computeCapability: string;
  maxBlockDim: Readonly<{ x: number; y: number }>;
  maxThreadsPerBlock: number;
  maxGridDim: Readonly<{ x: number; y: number }>;
  registersPerBlock: number;
  sharedMemoryPerBlockBytes: number;
  sourceFactIds: readonly string[];
}>;

export type BlockShapeInput = Readonly<{
  logicalWidth: string;
  logicalHeight: string;
  blockX: string;
  blockY: string;
}>;

export type BlockShapeIssueCode =
  | 'capability-record-invalid'
  | 'logical-width-invalid'
  | 'logical-height-invalid'
  | 'block-x-invalid'
  | 'block-y-invalid'
  | 'block-x-exceeds-capability'
  | 'block-y-exceeds-capability'
  | 'block-product-overflow'
  | 'threads-per-block-exceeds-capability'
  | 'logical-elements-overflow'
  | 'grid-x-exceeds-capability'
  | 'grid-y-exceeds-capability'
  | 'grid-product-overflow'
  | 'coverage-width-overflow'
  | 'coverage-height-overflow'
  | 'launched-threads-overflow'
  | 'fringe-calculation-invalid';

export type BlockShapeGeometry = Readonly<{
  logical: Readonly<{ width: number; height: number; elements: number }>;
  block: Readonly<{ x: number; y: number; threads: number }>;
  grid: Readonly<{ x: number; y: number; blocks: number }>;
  coverage: Readonly<{
    width: number;
    height: number;
    launchedThreads: number;
    fringeThreads: number;
  }>;
}>;

type BlockShapeAssessmentBase = Readonly<{
  capability: BlockShapeCapabilityRecord;
  sourceFactIds: readonly string[];
  remainingFeasibilityChecks: typeof BLOCK_SHAPE_KERNEL_RESOURCE_CHECKS;
  performanceVerdict: 'not-assessed';
  evidenceStatusEffect: 'none';
}>;

export type BlockShapeAssessment =
  | (BlockShapeAssessmentBase &
      Readonly<{
        valid: false;
        deviceConstraintsSatisfied: false;
        issues: readonly BlockShapeIssueCode[];
        geometry: null;
      }>)
  | (BlockShapeAssessmentBase &
      Readonly<{
        valid: true;
        deviceConstraintsSatisfied: true;
        issues: readonly [];
        geometry: BlockShapeGeometry;
      }>);

export const BLOCK_SHAPE_KERNEL_RESOURCE_CHECKS = [
  'kernel-max-threads-per-block',
  'compiled-register-demand-per-block',
  'static-plus-dynamic-shared-memory-per-block',
] as const;

export const BLOCK_SHAPE_CAPABILITIES = [
  {
    id: 'cc-7.5',
    computeCapability: '7.5',
    maxBlockDim: { x: 1_024, y: 1_024 },
    maxThreadsPerBlock: 1_024,
    maxGridDim: { x: 2_147_483_647, y: 65_535 },
    registersPerBlock: 65_536,
    sharedMemoryPerBlockBytes: 64 * 1_024,
    sourceFactIds: ['SRC-CUDA-016'],
  },
  {
    id: 'cc-8.0',
    computeCapability: '8.0',
    maxBlockDim: { x: 1_024, y: 1_024 },
    maxThreadsPerBlock: 1_024,
    maxGridDim: { x: 2_147_483_647, y: 65_535 },
    registersPerBlock: 65_536,
    sharedMemoryPerBlockBytes: 163 * 1_024,
    sourceFactIds: ['SRC-CUDA-016'],
  },
] as const satisfies readonly BlockShapeCapabilityRecord[];

export const DEFAULT_BLOCK_SHAPE_CAPABILITY_ID = 'cc-7.5';

export const BLOCK_SHAPE_STATIC_CASES = [
  {
    id: 'exact',
    input: { logicalWidth: '64', logicalHeight: '40', blockX: '16', blockY: '8' },
  },
  {
    id: 'fringe',
    input: { logicalWidth: '65', logicalHeight: '41', blockX: '16', blockY: '8' },
  },
  {
    id: 'aggregate-invalid',
    input: { logicalWidth: '64', logicalHeight: '40', blockX: '1024', blockY: '2' },
  },
] as const satisfies readonly { id: string; input: BlockShapeInput }[];

function isPositiveSafeInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

function isCapabilityRecordValid(capability: BlockShapeCapabilityRecord) {
  return (
    capability.id.length > 0 &&
    capability.computeCapability.length > 0 &&
    isPositiveSafeInteger(capability.maxBlockDim.x) &&
    isPositiveSafeInteger(capability.maxBlockDim.y) &&
    isPositiveSafeInteger(capability.maxThreadsPerBlock) &&
    isPositiveSafeInteger(capability.maxGridDim.x) &&
    isPositiveSafeInteger(capability.maxGridDim.y) &&
    isPositiveSafeInteger(capability.registersPerBlock) &&
    isPositiveSafeInteger(capability.sharedMemoryPerBlockBytes) &&
    capability.sourceFactIds.length > 0
  );
}

export function parsePositiveBlockShapeInteger(value: string): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return isPositiveSafeInteger(parsed) ? parsed : null;
}

export function safeBlockShapeProduct(values: readonly number[]): number | null {
  let product = 1;
  for (const value of values) {
    if (!isPositiveSafeInteger(value) || product > Number.MAX_SAFE_INTEGER / value) return null;
    product *= value;
  }
  return product;
}

export function safeBlockShapeCeilDivide(dividend: number, divisor: number): number | null {
  if (!isPositiveSafeInteger(dividend) || !isPositiveSafeInteger(divisor)) return null;
  const quotient = Math.floor((dividend - 1) / divisor) + 1;
  return Number.isSafeInteger(quotient) ? quotient : null;
}

export function createDefaultBlockShapeInput(): BlockShapeInput {
  return { logicalWidth: '65', logicalHeight: '41', blockX: '16', blockY: '8' };
}

export function findBlockShapeCapability(id: string): BlockShapeCapabilityRecord | null {
  return BLOCK_SHAPE_CAPABILITIES.find((capability) => capability.id === id) ?? null;
}

function invalidAssessment(
  capability: BlockShapeCapabilityRecord,
  issues: readonly BlockShapeIssueCode[],
): BlockShapeAssessment {
  return {
    valid: false,
    deviceConstraintsSatisfied: false,
    issues,
    geometry: null,
    capability,
    sourceFactIds: capability.sourceFactIds,
    remainingFeasibilityChecks: BLOCK_SHAPE_KERNEL_RESOURCE_CHECKS,
    performanceVerdict: 'not-assessed',
    evidenceStatusEffect: 'none',
  };
}

export function assessBlockShape(
  input: BlockShapeInput,
  capability: BlockShapeCapabilityRecord,
): BlockShapeAssessment {
  if (!isCapabilityRecordValid(capability)) {
    return invalidAssessment(capability, ['capability-record-invalid']);
  }

  const logicalWidth = parsePositiveBlockShapeInteger(input.logicalWidth);
  const logicalHeight = parsePositiveBlockShapeInteger(input.logicalHeight);
  const blockX = parsePositiveBlockShapeInteger(input.blockX);
  const blockY = parsePositiveBlockShapeInteger(input.blockY);
  const inputIssues: BlockShapeIssueCode[] = [];
  if (logicalWidth === null) inputIssues.push('logical-width-invalid');
  if (logicalHeight === null) inputIssues.push('logical-height-invalid');
  if (blockX === null) inputIssues.push('block-x-invalid');
  if (blockY === null) inputIssues.push('block-y-invalid');
  if (logicalWidth === null || logicalHeight === null || blockX === null || blockY === null) {
    return invalidAssessment(capability, inputIssues);
  }

  const constraintIssues: BlockShapeIssueCode[] = [];
  if (blockX > capability.maxBlockDim.x) constraintIssues.push('block-x-exceeds-capability');
  if (blockY > capability.maxBlockDim.y) constraintIssues.push('block-y-exceeds-capability');

  const blockThreads = safeBlockShapeProduct([blockX, blockY]);
  const logicalElements = safeBlockShapeProduct([logicalWidth, logicalHeight]);
  if (blockThreads === null) {
    constraintIssues.push('block-product-overflow');
  } else if (blockThreads > capability.maxThreadsPerBlock) {
    constraintIssues.push('threads-per-block-exceeds-capability');
  }
  if (logicalElements === null) constraintIssues.push('logical-elements-overflow');
  if (blockThreads === null || logicalElements === null || constraintIssues.length > 0) {
    return invalidAssessment(capability, constraintIssues);
  }

  const gridX = safeBlockShapeCeilDivide(logicalWidth, blockX);
  const gridY = safeBlockShapeCeilDivide(logicalHeight, blockY);
  if (gridX === null || gridY === null) {
    return invalidAssessment(capability, ['fringe-calculation-invalid']);
  }
  if (gridX > capability.maxGridDim.x) constraintIssues.push('grid-x-exceeds-capability');
  if (gridY > capability.maxGridDim.y) constraintIssues.push('grid-y-exceeds-capability');
  if (constraintIssues.length > 0) return invalidAssessment(capability, constraintIssues);

  const gridBlocks = safeBlockShapeProduct([gridX, gridY]);
  const coverageWidth = safeBlockShapeProduct([gridX, blockX]);
  const coverageHeight = safeBlockShapeProduct([gridY, blockY]);
  const launchedThreads = gridBlocks === null ? null : safeBlockShapeProduct([gridBlocks, blockThreads]);
  if (gridBlocks === null) constraintIssues.push('grid-product-overflow');
  if (coverageWidth === null) constraintIssues.push('coverage-width-overflow');
  if (coverageHeight === null) constraintIssues.push('coverage-height-overflow');
  if (launchedThreads === null) constraintIssues.push('launched-threads-overflow');
  if (
    gridBlocks === null ||
    coverageWidth === null ||
    coverageHeight === null ||
    launchedThreads === null ||
    constraintIssues.length > 0
  ) {
    return invalidAssessment(capability, constraintIssues);
  }

  const fringeThreads = launchedThreads - logicalElements;
  if (!Number.isSafeInteger(fringeThreads) || fringeThreads < 0) {
    return invalidAssessment(capability, ['fringe-calculation-invalid']);
  }

  return {
    valid: true,
    deviceConstraintsSatisfied: true,
    issues: [],
    geometry: {
      logical: { width: logicalWidth, height: logicalHeight, elements: logicalElements },
      block: { x: blockX, y: blockY, threads: blockThreads },
      grid: { x: gridX, y: gridY, blocks: gridBlocks },
      coverage: {
        width: coverageWidth,
        height: coverageHeight,
        launchedThreads,
        fringeThreads,
      },
    },
    capability,
    sourceFactIds: capability.sourceFactIds,
    remainingFeasibilityChecks: BLOCK_SHAPE_KERNEL_RESOURCE_CHECKS,
    performanceVerdict: 'not-assessed',
    evidenceStatusEffect: 'none',
  };
}
