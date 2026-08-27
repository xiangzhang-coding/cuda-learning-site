// SPDX-License-Identifier: Apache-2.0

export const SHARED_MEMORY_BANK_LIMITS = {
  lanes: 32,
  wordBytes: 4,
  maxBankCount: 64,
  maxStrideWords: 64,
  maxPaddingWords: 64,
} as const;

export const SHARED_MEMORY_BANK_MODEL_CONTRACT = {
  mapper: 'word-index-mod-bank-count',
  operation: 'read',
  siteCapabilityScope: 'compute-capability-7.5-or-newer',
  sourceBackedFixture: '32-banks-with-successive-4-byte-words',
  otherBankCounts: 'abstract-comparison-only',
  executesCuda: false,
  timing: 'not-modeled',
  speedInference: 'none',
  evidenceStatusEffect: 'none',
} as const;

export type SharedMemoryBankInput = Readonly<{
  bankCount: string;
  stride: string;
  padding: string;
}>;

export type SharedMemoryBankIssue = 'bank-count-invalid' | 'stride-invalid' | 'padding-invalid';
export type SharedMemoryBankClassification = 'conflict-free' | 'bank-conflict' | 'same-address-broadcast';

export type SharedMemoryLaneMapping = Readonly<{
  lane: number;
  wordIndex: number;
  byteAddress: number;
  bank: number;
}>;

export type SharedMemoryBankGroup = Readonly<{
  bank: number;
  laneIds: readonly number[];
  wordIndices: readonly number[];
  distinctAddressCount: number;
}>;

export type SharedMemoryBankAssessment =
  | Readonly<{
      valid: false;
      issues: readonly SharedMemoryBankIssue[];
      configuration: null;
      mappings: readonly [];
      banks: readonly [];
      classification: null;
      conflictDegree: null;
      contract: typeof SHARED_MEMORY_BANK_MODEL_CONTRACT;
    }>
  | Readonly<{
      valid: true;
      issues: readonly [];
      configuration: Readonly<{
        bankCount: number;
        strideWords: number;
        paddingWords: number;
        laneStepWords: number;
        wordBytes: 4;
        lanes: 32;
      }>;
      mappings: readonly SharedMemoryLaneMapping[];
      banks: readonly SharedMemoryBankGroup[];
      classification: SharedMemoryBankClassification;
      conflictDegree: number;
      contract: typeof SHARED_MEMORY_BANK_MODEL_CONTRACT;
    }>;

export const SHARED_MEMORY_BANK_STATIC_CASES = [
  { id: 'stride-one', input: { bankCount: '32', stride: '1', padding: '0' } },
  { id: 'stride-two', input: { bankCount: '32', stride: '2', padding: '0' } },
  { id: 'stride-thirty-two', input: { bankCount: '32', stride: '32', padding: '0' } },
  { id: 'padded-thirty-three', input: { bankCount: '32', stride: '32', padding: '1' } },
  { id: 'broadcast', input: { bankCount: '32', stride: '0', padding: '0' } },
] as const satisfies readonly { id: string; input: SharedMemoryBankInput }[];

export function createDefaultSharedMemoryBankInput(): SharedMemoryBankInput {
  return { bankCount: '32', stride: '1', padding: '0' };
}

export function parseSharedMemoryBankInteger(value: string, minimum: number, maximum: number): number | null {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function invalidAssessment(issues: readonly SharedMemoryBankIssue[]): SharedMemoryBankAssessment {
  return {
    valid: false,
    issues,
    configuration: null,
    mappings: [],
    banks: [],
    classification: null,
    conflictDegree: null,
    contract: SHARED_MEMORY_BANK_MODEL_CONTRACT,
  };
}

export function mapSharedMemoryBanks(input: SharedMemoryBankInput): SharedMemoryBankAssessment {
  const bankCount = parseSharedMemoryBankInteger(input.bankCount, 1, SHARED_MEMORY_BANK_LIMITS.maxBankCount);
  const stride = parseSharedMemoryBankInteger(input.stride, 0, SHARED_MEMORY_BANK_LIMITS.maxStrideWords);
  const padding = parseSharedMemoryBankInteger(input.padding, 0, SHARED_MEMORY_BANK_LIMITS.maxPaddingWords);
  const issues: SharedMemoryBankIssue[] = [];
  if (bankCount === null) issues.push('bank-count-invalid');
  if (stride === null) issues.push('stride-invalid');
  if (padding === null) issues.push('padding-invalid');
  if (bankCount === null || stride === null || padding === null) return invalidAssessment(issues);

  const laneStepWords = stride + padding;
  const mappings = Array.from({ length: SHARED_MEMORY_BANK_LIMITS.lanes }, (_, lane) => {
    const wordIndex = lane * laneStepWords;
    return {
      lane,
      wordIndex,
      byteAddress: wordIndex * SHARED_MEMORY_BANK_LIMITS.wordBytes,
      bank: wordIndex % bankCount,
    };
  });
  const bankMap = new Map<number, SharedMemoryLaneMapping[]>();
  for (const mapping of mappings) {
    bankMap.set(mapping.bank, [...(bankMap.get(mapping.bank) ?? []), mapping]);
  }
  const banks = [...bankMap.entries()]
    .sort(([left], [right]) => left - right)
    .map(([bank, bankMappings]) => {
      const wordIndices = bankMappings.map(({ wordIndex }) => wordIndex);
      return {
        bank,
        laneIds: bankMappings.map(({ lane }) => lane),
        wordIndices,
        distinctAddressCount: new Set(wordIndices).size,
      };
    });
  const conflictDegree = Math.max(...banks.map(({ distinctAddressCount }) => distinctAddressCount));
  const uniqueAddresses = new Set(mappings.map(({ wordIndex }) => wordIndex));
  const classification: SharedMemoryBankClassification = uniqueAddresses.size === 1
    ? 'same-address-broadcast'
    : conflictDegree === 1
      ? 'conflict-free'
      : 'bank-conflict';

  return {
    valid: true,
    issues: [],
    configuration: {
      bankCount,
      strideWords: stride,
      paddingWords: padding,
      laneStepWords,
      wordBytes: SHARED_MEMORY_BANK_LIMITS.wordBytes,
      lanes: SHARED_MEMORY_BANK_LIMITS.lanes,
    },
    mappings,
    banks,
    classification,
    conflictDegree,
    contract: SHARED_MEMORY_BANK_MODEL_CONTRACT,
  };
}
