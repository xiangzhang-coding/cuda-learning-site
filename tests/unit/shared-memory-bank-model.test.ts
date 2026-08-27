// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  SHARED_MEMORY_BANK_MODEL_CONTRACT,
  SHARED_MEMORY_BANK_STATIC_CASES,
  createDefaultSharedMemoryBankInput,
  mapSharedMemoryBanks,
  parseSharedMemoryBankInteger,
  type SharedMemoryBankInput,
} from '../../src/visuals/shared-memory-bank-model';

function input(overrides: Partial<SharedMemoryBankInput> = {}): SharedMemoryBankInput {
  return { ...createDefaultSharedMemoryBankInput(), ...overrides };
}

describe('VIS05 shared-memory bank model', () => {
  it('maps the source-backed 32-bank, 4-byte-word default without a conflict', () => {
    const result = mapSharedMemoryBanks(createDefaultSharedMemoryBankInput());

    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error('Expected valid default bank mapping.');
    expect(result.classification).toBe('conflict-free');
    expect(result.conflictDegree).toBe(1);
    expect(result.mappings[0]).toEqual({ lane: 0, wordIndex: 0, byteAddress: 0, bank: 0 });
    expect(result.mappings[31]).toEqual({ lane: 31, wordIndex: 31, byteAddress: 124, bank: 31 });
    expect(result.banks).toHaveLength(32);
  });

  it.each([
    ['2', '0', 'bank-conflict', 2],
    ['32', '0', 'bank-conflict', 32],
    ['32', '1', 'conflict-free', 1],
  ] as const)('classifies stride %s with padding %s', (stride, padding, classification, degree) => {
    const result = mapSharedMemoryBanks(input({ stride, padding }));
    expect(result).toMatchObject({ valid: true, classification, conflictDegree: degree });
  });

  it('classifies one shared address as broadcast instead of a 32-way conflict', () => {
    const result = mapSharedMemoryBanks(input({ stride: '0', padding: '0' }));

    expect(result).toMatchObject({
      valid: true,
      classification: 'same-address-broadcast',
      conflictDegree: 1,
    });
    if (!result.valid) throw new Error('Expected valid broadcast mapping.');
    expect(result.banks).toEqual([{
      bank: 0,
      laneIds: Array.from({ length: 32 }, (_, lane) => lane),
      wordIndices: Array.from({ length: 32 }, () => 0),
      distinctAddressCount: 1,
    }]);
  });

  it('supports bounded abstract bank counts without presenting them as source-backed fixtures', () => {
    const result = mapSharedMemoryBanks(input({ bankCount: '16' }));
    expect(result).toMatchObject({ valid: true, classification: 'bank-conflict', conflictDegree: 2 });
    expect(SHARED_MEMORY_BANK_MODEL_CONTRACT.otherBankCounts).toBe('abstract-comparison-only');
  });

  it.each([
    [{ bankCount: '0' }, 'bank-count-invalid'],
    [{ bankCount: '65' }, 'bank-count-invalid'],
    [{ stride: '-1' }, 'stride-invalid'],
    [{ stride: '1.5' }, 'stride-invalid'],
    [{ padding: '65' }, 'padding-invalid'],
    [{ padding: '1e1' }, 'padding-invalid'],
  ] as const)('fails closed for %j', (override, issue) => {
    const result = mapSharedMemoryBanks(input(override));
    expect(result).toMatchObject({
      valid: false,
      configuration: null,
      mappings: [],
      banks: [],
      classification: null,
      conflictDegree: null,
    });
    expect(result.issues).toContain(issue);
  });

  it('parses canonical bounded input and keeps all required static cases model-derived', () => {
    expect(parseSharedMemoryBankInteger('0', 0, 64)).toBe(0);
    expect(parseSharedMemoryBankInteger('64', 0, 64)).toBe(64);
    expect(parseSharedMemoryBankInteger('064', 0, 64)).toBeNull();
    expect(SHARED_MEMORY_BANK_STATIC_CASES.map(({ id, input: caseInput }) => {
      const result = mapSharedMemoryBanks(caseInput);
      return [id, result.classification, result.conflictDegree];
    })).toEqual([
      ['stride-one', 'conflict-free', 1],
      ['stride-two', 'bank-conflict', 2],
      ['stride-thirty-two', 'bank-conflict', 32],
      ['padded-thirty-three', 'conflict-free', 1],
      ['broadcast', 'same-address-broadcast', 1],
    ]);
    expect(SHARED_MEMORY_BANK_MODEL_CONTRACT).toMatchObject({
      operation: 'read',
      siteCapabilityScope: 'compute-capability-7.5-or-newer',
      executesCuda: false,
      timing: 'not-modeled',
      speedInference: 'none',
      evidenceStatusEffect: 'none',
    });
  });
});
