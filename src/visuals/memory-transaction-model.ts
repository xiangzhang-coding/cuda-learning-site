// SPDX-License-Identifier: Apache-2.0

export const MEMORY_TRANSACTION_LIMITS = {
  segmentBytes: 32,
  maxActiveLanes: 32,
  maxStrideElements: 64,
  maxOffsetBytes: 4_096,
  elementSizes: [1, 2, 4, 8],
} as const;

export const MEMORY_TRANSACTION_MODEL_CONTRACT = {
  architectureScope: 'compute-capability-6.0-or-newer',
  siteCapabilityScope: 'compute-capability-7.5-or-newer',
  instructionScope: 'one-global-memory-instruction-from-one-warp',
  baseAddressBytes: 0,
  elementAlignment: 'offset-multiple-of-element-size',
  groupingUnit: 'naturally-aligned-32-byte-segment',
  observationScope: 'address-arithmetic-only',
  executesCuda: false,
  performanceInference: 'none',
  evidenceStatusEffect: 'none',
} as const;

export type MemoryAccessPattern = 'contiguous' | 'strided';

export type MemoryTransactionInput = Readonly<{
  pattern: MemoryAccessPattern;
  elementSize: string;
  stride: string;
  offset: string;
  activeLanes: string;
}>;

export type MemoryTransactionIssue =
  | 'pattern-invalid'
  | 'element-size-invalid'
  | 'stride-invalid'
  | 'contiguous-stride-mismatch'
  | 'offset-invalid'
  | 'offset-element-misaligned'
  | 'active-lanes-invalid';

export type MemoryLaneRequest = Readonly<{
  lane: number;
  startByte: number;
  endByte: number;
  segmentStarts: readonly number[];
}>;

export type MemorySegmentGroup = Readonly<{
  startByte: number;
  endByte: number;
  laneIds: readonly number[];
  requestedBytes: number;
}>;

export type MemoryTransactionGrouping =
  | Readonly<{
      valid: false;
      issues: readonly MemoryTransactionIssue[];
      configuration: null;
      lanes: readonly [];
      segments: readonly [];
      accounting: null;
      contract: typeof MEMORY_TRANSACTION_MODEL_CONTRACT;
    }>
  | Readonly<{
      valid: true;
      issues: readonly [];
      configuration: Readonly<{
        pattern: MemoryAccessPattern;
        elementSizeBytes: 1 | 2 | 4 | 8;
        strideElements: number;
        offsetBytes: number;
        activeLanes: number;
      }>;
      lanes: readonly MemoryLaneRequest[];
      segments: readonly MemorySegmentGroup[];
      accounting: Readonly<{
        requestedBytes: number;
        coveredSegmentBytes: number;
        unusedSegmentBytes: number;
      }>;
      contract: typeof MEMORY_TRANSACTION_MODEL_CONTRACT;
    }>;

export const MEMORY_TRANSACTION_STATIC_CASES = [
  {
    id: 'aligned-contiguous',
    input: { pattern: 'contiguous', elementSize: '4', stride: '1', offset: '0', activeLanes: '32' },
  },
  {
    id: 'offset-four',
    input: { pattern: 'contiguous', elementSize: '4', stride: '1', offset: '4', activeLanes: '32' },
  },
  {
    id: 'stride-two',
    input: { pattern: 'strided', elementSize: '4', stride: '2', offset: '0', activeLanes: '32' },
  },
  {
    id: 'partial-warp',
    input: { pattern: 'contiguous', elementSize: '4', stride: '1', offset: '0', activeLanes: '5' },
  },
] as const satisfies readonly { id: string; input: MemoryTransactionInput }[];

export function createDefaultMemoryTransactionInput(): MemoryTransactionInput {
  return { pattern: 'contiguous', elementSize: '4', stride: '1', offset: '0', activeLanes: '32' };
}

export function isMemoryAccessPattern(value: string): value is MemoryAccessPattern {
  return value === 'contiguous' || value === 'strided';
}

export function parseBoundedMemoryInteger(value: string, minimum: number, maximum: number): number | null {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function invalidGrouping(issues: readonly MemoryTransactionIssue[]): MemoryTransactionGrouping {
  return {
    valid: false,
    issues,
    configuration: null,
    lanes: [],
    segments: [],
    accounting: null,
    contract: MEMORY_TRANSACTION_MODEL_CONTRACT,
  };
}

export function groupMemoryByteRequests(input: MemoryTransactionInput): MemoryTransactionGrouping {
  const issues: MemoryTransactionIssue[] = [];
  if (!isMemoryAccessPattern(input.pattern)) issues.push('pattern-invalid');

  const elementSize = parseBoundedMemoryInteger(input.elementSize, 1, 8);
  if (
    elementSize === null ||
    !MEMORY_TRANSACTION_LIMITS.elementSizes.includes(elementSize as 1 | 2 | 4 | 8)
  ) {
    issues.push('element-size-invalid');
  }
  const stride = parseBoundedMemoryInteger(input.stride, 1, MEMORY_TRANSACTION_LIMITS.maxStrideElements);
  if (stride === null) issues.push('stride-invalid');
  if (input.pattern === 'contiguous' && stride !== null && stride !== 1) {
    issues.push('contiguous-stride-mismatch');
  }
  const offset = parseBoundedMemoryInteger(input.offset, 0, MEMORY_TRANSACTION_LIMITS.maxOffsetBytes);
  if (offset === null) issues.push('offset-invalid');
  if (
    offset !== null
    && elementSize !== null
    && MEMORY_TRANSACTION_LIMITS.elementSizes.includes(elementSize as 1 | 2 | 4 | 8)
    && offset % elementSize !== 0
  ) {
    issues.push('offset-element-misaligned');
  }
  const activeLanes = parseBoundedMemoryInteger(input.activeLanes, 1, MEMORY_TRANSACTION_LIMITS.maxActiveLanes);
  if (activeLanes === null) issues.push('active-lanes-invalid');

  if (
    issues.length > 0 ||
    !isMemoryAccessPattern(input.pattern) ||
    elementSize === null ||
    !MEMORY_TRANSACTION_LIMITS.elementSizes.includes(elementSize as 1 | 2 | 4 | 8) ||
    stride === null ||
    offset === null ||
    activeLanes === null
  ) {
    return invalidGrouping(issues);
  }

  const lanes: MemoryLaneRequest[] = [];
  const segmentMap = new Map<number, { laneIds: number[]; requestedBytes: number }>();
  const strideBytes = stride * elementSize;
  for (let lane = 0; lane < activeLanes; lane += 1) {
    const startByte = offset + lane * strideBytes;
    const endByte = startByte + elementSize - 1;

    const firstSegment = Math.floor(startByte / MEMORY_TRANSACTION_LIMITS.segmentBytes)
      * MEMORY_TRANSACTION_LIMITS.segmentBytes;
    const lastSegment = Math.floor(endByte / MEMORY_TRANSACTION_LIMITS.segmentBytes)
      * MEMORY_TRANSACTION_LIMITS.segmentBytes;
    const segmentStarts: number[] = [];
    for (
      let segmentStart = firstSegment;
      segmentStart <= lastSegment;
      segmentStart += MEMORY_TRANSACTION_LIMITS.segmentBytes
    ) {
      segmentStarts.push(segmentStart);
      const overlapStart = Math.max(startByte, segmentStart);
      const overlapEnd = Math.min(endByte, segmentStart + MEMORY_TRANSACTION_LIMITS.segmentBytes - 1);
      const current = segmentMap.get(segmentStart) ?? { laneIds: [], requestedBytes: 0 };
      current.laneIds.push(lane);
      current.requestedBytes += overlapEnd - overlapStart + 1;
      segmentMap.set(segmentStart, current);
    }
    lanes.push({ lane, startByte, endByte, segmentStarts });
  }

  const segments = [...segmentMap.entries()]
    .sort(([left], [right]) => left - right)
    .map(([startByte, group]) => ({
      startByte,
      endByte: startByte + MEMORY_TRANSACTION_LIMITS.segmentBytes - 1,
      laneIds: group.laneIds,
      requestedBytes: group.requestedBytes,
    }));
  const requestedBytes = activeLanes * elementSize;
  const coveredSegmentBytes = segments.length * MEMORY_TRANSACTION_LIMITS.segmentBytes;

  return {
    valid: true,
    issues: [],
    configuration: {
      pattern: input.pattern,
      elementSizeBytes: elementSize as 1 | 2 | 4 | 8,
      strideElements: stride,
      offsetBytes: offset,
      activeLanes,
    },
    lanes,
    segments,
    accounting: {
      requestedBytes,
      coveredSegmentBytes,
      unusedSegmentBytes: coveredSegmentBytes - requestedBytes,
    },
    contract: MEMORY_TRANSACTION_MODEL_CONTRACT,
  };
}
