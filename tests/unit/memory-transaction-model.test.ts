// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  MEMORY_TRANSACTION_MODEL_CONTRACT,
  MEMORY_TRANSACTION_STATIC_CASES,
  createDefaultMemoryTransactionInput,
  groupMemoryByteRequests,
  parseBoundedMemoryInteger,
  type MemoryTransactionInput,
} from '../../src/visuals/memory-transaction-model';

function input(overrides: Partial<MemoryTransactionInput> = {}): MemoryTransactionInput {
  return { ...createDefaultMemoryTransactionInput(), ...overrides };
}

describe('VIS04 memory-transaction grouping model', () => {
  it('groups the aligned default into four naturally aligned 32-byte segments', () => {
    const result = groupMemoryByteRequests(createDefaultMemoryTransactionInput());

    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error('Expected valid default grouping.');
    expect(result.segments.map(({ startByte }) => startByte)).toEqual([0, 32, 64, 96]);
    expect(result.accounting).toEqual({ requestedBytes: 128, coveredSegmentBytes: 128, unusedSegmentBytes: 0 });
    expect(result.lanes[0]).toEqual({ lane: 0, startByte: 0, endByte: 3, segmentStarts: [0] });
    expect(result.lanes[31]).toEqual({ lane: 31, startByte: 124, endByte: 127, segmentStarts: [96] });
  });

  it('produces five groups at offset four and eight groups at stride two', () => {
    const offset = groupMemoryByteRequests(input({ offset: '4' }));
    const strided = groupMemoryByteRequests(input({ pattern: 'strided', stride: '2' }));

    expect(offset.valid && offset.segments).toHaveLength(5);
    expect(offset.valid && offset.segments.map(({ startByte }) => startByte)).toEqual([0, 32, 64, 96, 128]);
    expect(strided.valid && strided.segments).toHaveLength(8);
    expect(strided.valid && strided.accounting).toEqual({
      requestedBytes: 128,
      coveredSegmentBytes: 256,
      unusedSegmentBytes: 128,
    });
  });

  it('keeps naturally aligned elements within one segment each at a segment boundary', () => {
    const result = groupMemoryByteRequests(input({ elementSize: '8', offset: '24', activeLanes: '2' }));

    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error('Expected a valid naturally aligned case.');
    expect(result.lanes).toEqual([
      { lane: 0, startByte: 24, endByte: 31, segmentStarts: [0] },
      { lane: 1, startByte: 32, endByte: 39, segmentStarts: [32] },
    ]);
    expect(result.segments).toEqual([
      { startByte: 0, endByte: 31, laneIds: [0], requestedBytes: 8 },
      { startByte: 32, endByte: 63, laneIds: [1], requestedBytes: 8 },
    ]);
  });

  it.each([
    [{ activeLanes: '0' }, 'active-lanes-invalid'],
    [{ activeLanes: '33' }, 'active-lanes-invalid'],
    [{ elementSize: '3' }, 'element-size-invalid'],
    [{ stride: '0' }, 'stride-invalid'],
    [{ stride: '2' }, 'contiguous-stride-mismatch'],
    [{ offset: '-1' }, 'offset-invalid'],
    [{ offset: '1e3' }, 'offset-invalid'],
    [{ elementSize: '2', offset: '1' }, 'offset-element-misaligned'],
    [{ elementSize: '4', offset: '2' }, 'offset-element-misaligned'],
    [{ elementSize: '8', offset: '28' }, 'offset-element-misaligned'],
  ] as const)('fails closed for %j', (override, issue) => {
    const result = groupMemoryByteRequests(input(override));
    expect(result).toMatchObject({ valid: false, configuration: null, lanes: [], segments: [], accounting: null });
    expect(result.issues).toContain(issue);
  });

  it('fails closed for an unknown access pattern', () => {
    const result = groupMemoryByteRequests(
      { ...createDefaultMemoryTransactionInput(), pattern: 'gather' } as unknown as MemoryTransactionInput,
    );
    expect(result).toMatchObject({ valid: false, issues: ['pattern-invalid'], configuration: null });
  });

  it('accepts only canonical bounded decimal integers', () => {
    expect(parseBoundedMemoryInteger('0', 0, 32)).toBe(0);
    expect(parseBoundedMemoryInteger('32', 0, 32)).toBe(32);
    for (const value of ['', ' ', '+1', '01', '1.5', '1e1', '33']) {
      expect(parseBoundedMemoryInteger(value, 0, 32)).toBeNull();
    }
  });

  it('keeps static cases model-derived and explicitly evidence-neutral', () => {
    expect(MEMORY_TRANSACTION_STATIC_CASES.map(({ id, input: caseInput }) => [
      id,
      groupMemoryByteRequests(caseInput).valid
        ? groupMemoryByteRequests(caseInput).segments.length
        : null,
    ])).toEqual([
      ['aligned-contiguous', 4],
      ['offset-four', 5],
      ['stride-two', 8],
      ['partial-warp', 1],
    ]);
    expect(MEMORY_TRANSACTION_MODEL_CONTRACT).toMatchObject({
      architectureScope: 'compute-capability-6.0-or-newer',
      siteCapabilityScope: 'compute-capability-7.5-or-newer',
      instructionScope: 'one-global-memory-instruction-from-one-warp',
      baseAddressBytes: 0,
      elementAlignment: 'offset-multiple-of-element-size',
      observationScope: 'address-arithmetic-only',
      executesCuda: false,
      performanceInference: 'none',
      evidenceStatusEffect: 'none',
    });
    expect(MEMORY_TRANSACTION_MODEL_CONTRACT).not.toHaveProperty('cacheBehavior');
    expect(MEMORY_TRANSACTION_MODEL_CONTRACT).not.toHaveProperty('hardwareTransactions');
    expect(MEMORY_TRANSACTION_MODEL_CONTRACT).not.toHaveProperty('transactionCount');
  });
});
