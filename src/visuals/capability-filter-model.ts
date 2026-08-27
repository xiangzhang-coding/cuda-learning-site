// SPDX-License-Identifier: Apache-2.0

export const REVIEWED_TOOLKIT_LANES = ['11.8.0', '12.9.2', '13.3.1'] as const;

export type ReviewedToolkitLane = (typeof REVIEWED_TOOLKIT_LANES)[number];
export type ComputeCapabilityId = '7.5' | '8.0' | '9.0' | '10.0' | '12.0';
export type CapabilityFeatureId =
  | 'hardware-memcpy-async'
  | 'thread-block-clusters'
  | 'architecture-specific-feature-set'
  | 'family-specific-feature-set';
export type CompilerTargetSet = 'baseline' | 'architecture-specific' | 'family-specific';
export type CompilerTargetScope = 'baseline-features' | 'exact-capability' | 'same-family';

export type CapabilityFeature = Readonly<{
  id: CapabilityFeatureId;
  available: boolean;
}>;

export type CapabilityNumericLimits = Readonly<{
  warpSize: 32;
  maximumThreadsPerBlock: 1024;
  maximumSharedMemoryPerSmKiB: number;
  maximumSharedMemoryPerBlockKiB: number;
}>;

export type CapabilityCompilerTarget = Readonly<{
  set: CompilerTargetSet;
  virtual: string;
  real: string;
  scope: CompilerTargetScope;
  toolkitLanes: readonly ReviewedToolkitLane[];
}>;

export type CapabilityRecord = Readonly<{
  id: ComputeCapabilityId;
  featureAvailability: readonly CapabilityFeature[];
  numericLimits: CapabilityNumericLimits;
  compilerTargets: readonly CapabilityCompilerTarget[];
  sourceFactIds: readonly ['SRC-CUDA-016'];
}>;

export const CAPABILITY_SOURCE_FACT_IDS = ['SRC-CUDA-016'] as const;

const ALL_REVIEWED_LANES = REVIEWED_TOOLKIT_LANES;
const CUDA_12_9_AND_13_3 = ['12.9.2', '13.3.1'] as const;

export const CAPABILITY_RECORDS = [
  {
    id: '7.5',
    featureAvailability: [
      { id: 'hardware-memcpy-async', available: false },
      { id: 'thread-block-clusters', available: false },
      { id: 'architecture-specific-feature-set', available: false },
      { id: 'family-specific-feature-set', available: false },
    ],
    numericLimits: {
      warpSize: 32,
      maximumThreadsPerBlock: 1024,
      maximumSharedMemoryPerSmKiB: 64,
      maximumSharedMemoryPerBlockKiB: 64,
    },
    compilerTargets: [
      {
        set: 'baseline',
        virtual: 'compute_75',
        real: 'sm_75',
        scope: 'baseline-features',
        toolkitLanes: ALL_REVIEWED_LANES,
      },
    ],
    sourceFactIds: CAPABILITY_SOURCE_FACT_IDS,
  },
  {
    id: '8.0',
    featureAvailability: [
      { id: 'hardware-memcpy-async', available: true },
      { id: 'thread-block-clusters', available: false },
      { id: 'architecture-specific-feature-set', available: false },
      { id: 'family-specific-feature-set', available: false },
    ],
    numericLimits: {
      warpSize: 32,
      maximumThreadsPerBlock: 1024,
      maximumSharedMemoryPerSmKiB: 164,
      maximumSharedMemoryPerBlockKiB: 163,
    },
    compilerTargets: [
      {
        set: 'baseline',
        virtual: 'compute_80',
        real: 'sm_80',
        scope: 'baseline-features',
        toolkitLanes: ALL_REVIEWED_LANES,
      },
    ],
    sourceFactIds: CAPABILITY_SOURCE_FACT_IDS,
  },
  {
    id: '9.0',
    featureAvailability: [
      { id: 'hardware-memcpy-async', available: true },
      { id: 'thread-block-clusters', available: true },
      { id: 'architecture-specific-feature-set', available: true },
      { id: 'family-specific-feature-set', available: false },
    ],
    numericLimits: {
      warpSize: 32,
      maximumThreadsPerBlock: 1024,
      maximumSharedMemoryPerSmKiB: 228,
      maximumSharedMemoryPerBlockKiB: 227,
    },
    compilerTargets: [
      {
        set: 'baseline',
        virtual: 'compute_90',
        real: 'sm_90',
        scope: 'baseline-features',
        toolkitLanes: ALL_REVIEWED_LANES,
      },
      {
        set: 'architecture-specific',
        virtual: 'compute_90a',
        real: 'sm_90a',
        scope: 'exact-capability',
        toolkitLanes: CUDA_12_9_AND_13_3,
      },
    ],
    sourceFactIds: CAPABILITY_SOURCE_FACT_IDS,
  },
  {
    id: '10.0',
    featureAvailability: [
      { id: 'hardware-memcpy-async', available: true },
      { id: 'thread-block-clusters', available: true },
      { id: 'architecture-specific-feature-set', available: true },
      { id: 'family-specific-feature-set', available: true },
    ],
    numericLimits: {
      warpSize: 32,
      maximumThreadsPerBlock: 1024,
      maximumSharedMemoryPerSmKiB: 228,
      maximumSharedMemoryPerBlockKiB: 227,
    },
    compilerTargets: [
      {
        set: 'baseline',
        virtual: 'compute_100',
        real: 'sm_100',
        scope: 'baseline-features',
        toolkitLanes: CUDA_12_9_AND_13_3,
      },
      {
        set: 'family-specific',
        virtual: 'compute_100f',
        real: 'sm_100f',
        scope: 'same-family',
        toolkitLanes: CUDA_12_9_AND_13_3,
      },
      {
        set: 'architecture-specific',
        virtual: 'compute_100a',
        real: 'sm_100a',
        scope: 'exact-capability',
        toolkitLanes: CUDA_12_9_AND_13_3,
      },
    ],
    sourceFactIds: CAPABILITY_SOURCE_FACT_IDS,
  },
  {
    id: '12.0',
    featureAvailability: [
      { id: 'hardware-memcpy-async', available: true },
      { id: 'thread-block-clusters', available: true },
      { id: 'architecture-specific-feature-set', available: true },
      { id: 'family-specific-feature-set', available: true },
    ],
    numericLimits: {
      warpSize: 32,
      maximumThreadsPerBlock: 1024,
      maximumSharedMemoryPerSmKiB: 100,
      maximumSharedMemoryPerBlockKiB: 99,
    },
    compilerTargets: [
      {
        set: 'baseline',
        virtual: 'compute_120',
        real: 'sm_120',
        scope: 'baseline-features',
        toolkitLanes: CUDA_12_9_AND_13_3,
      },
      {
        set: 'family-specific',
        virtual: 'compute_120f',
        real: 'sm_120f',
        scope: 'same-family',
        toolkitLanes: CUDA_12_9_AND_13_3,
      },
      {
        set: 'architecture-specific',
        virtual: 'compute_120a',
        real: 'sm_120a',
        scope: 'exact-capability',
        toolkitLanes: CUDA_12_9_AND_13_3,
      },
    ],
    sourceFactIds: CAPABILITY_SOURCE_FACT_IDS,
  },
] as const satisfies readonly CapabilityRecord[];

export type CapabilityInferenceBoundaries = Readonly<{
  productModel: 'not-inferred';
  environmentCompatibility: 'not-assessed';
  performance: 'not-assessed';
}>;

const INFERENCE_BOUNDARIES: CapabilityInferenceBoundaries = {
  productModel: 'not-inferred',
  environmentCompatibility: 'not-assessed',
  performance: 'not-assessed',
};

export type CapabilityFilterResult =
  | Readonly<{
      state: 'known';
      capability: ComputeCapabilityId;
      featureAvailability: readonly CapabilityFeature[];
      numericLimits: CapabilityNumericLimits;
      compilerTargets: readonly CapabilityCompilerTarget[];
      sourceFactIds: readonly ['SRC-CUDA-016'];
      inferenceBoundaries: CapabilityInferenceBoundaries;
      evidenceStatusEffect: 'none';
    }>
  | Readonly<{
      state: 'unknown';
      capability: null;
      featureAvailability: readonly [];
      numericLimits: null;
      compilerTargets: readonly [];
      sourceFactIds: readonly ['SRC-CUDA-016'];
      inferenceBoundaries: CapabilityInferenceBoundaries;
      evidenceStatusEffect: 'none';
    }>;

export function parseComputeCapability(value: unknown): ComputeCapabilityId | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(normalized)) return null;
  return CAPABILITY_RECORDS.some((record) => record.id === normalized)
    ? (normalized as ComputeCapabilityId)
    : null;
}

export function resolveCapabilityContract(value: unknown): CapabilityFilterResult {
  const capability = parseComputeCapability(value);
  const record = capability === null
    ? undefined
    : CAPABILITY_RECORDS.find((candidate) => candidate.id === capability);

  if (!record) {
    return {
      state: 'unknown',
      capability: null,
      featureAvailability: [],
      numericLimits: null,
      compilerTargets: [],
      sourceFactIds: CAPABILITY_SOURCE_FACT_IDS,
      inferenceBoundaries: INFERENCE_BOUNDARIES,
      evidenceStatusEffect: 'none',
    };
  }

  return {
    state: 'known',
    capability: record.id,
    featureAvailability: record.featureAvailability,
    numericLimits: record.numericLimits,
    compilerTargets: record.compilerTargets,
    sourceFactIds: record.sourceFactIds,
    inferenceBoundaries: INFERENCE_BOUNDARIES,
    evidenceStatusEffect: 'none',
  };
}
