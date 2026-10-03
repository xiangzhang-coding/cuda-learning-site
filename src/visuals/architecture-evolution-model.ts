// SPDX-License-Identifier: Apache-2.0
// Source-reviewed contracts, not detected devices or measured performance.
export const ARCHITECTURE_CAPABILITIES = ['all', '7.5', '8.0', '8.6', '8.7', '8.9', '9.0'] as const;
export const ARCHITECTURE_FEATURES = ['all', 'its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'fp64', 'l2-policy', 'clusters', 'dsm', 'tma'] as const;
export type ArchitectureFeature = Exclude<(typeof ARCHITECTURE_FEATURES)[number], 'all'>;
export type ArchitectureContract = Readonly<{
  cc: Exclude<(typeof ARCHITECTURE_CAPABILITIES)[number], 'all'>;
  architecture: 'Turing' | 'Ampere' | 'Ada' | 'Hopper';
  target: string;
  sharedKiB: number;
  features: readonly ArchitectureFeature[];
}>;
export const ARCHITECTURE_CONTRACTS: readonly ArchitectureContract[] = [
  { cc: '7.5', architecture: 'Turing', target: 'compute_75 / sm_75', sharedKiB: 64, features: ['its', 'fp16'] },
  { cc: '8.0', architecture: 'Ampere', target: 'compute_80 / sm_80', sharedKiB: 163, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'fp64', 'l2-policy'] },
  { cc: '8.6', architecture: 'Ampere', target: 'compute_86 / sm_86', sharedKiB: 99, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'l2-policy'] },
  { cc: '8.7', architecture: 'Ampere', target: 'compute_87 / sm_87', sharedKiB: 163, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'l2-policy'] },
  { cc: '8.9', architecture: 'Ada', target: 'compute_89 / sm_89', sharedKiB: 99, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'l2-policy'] },
  { cc: '9.0', architecture: 'Hopper', target: 'compute_90 / sm_90', sharedKiB: 227, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'fp64', 'l2-policy', 'clusters', 'dsm', 'tma'] },
];

export function filterArchitectures(capability: string, feature: string): readonly ArchitectureContract[] {
  if (!(ARCHITECTURE_CAPABILITIES as readonly string[]).includes(capability)
    || !(ARCHITECTURE_FEATURES as readonly string[]).includes(feature)) {
    throw new RangeError('Unknown architecture filter');
  }
  return ARCHITECTURE_CONTRACTS.filter(row => (capability === 'all' || row.cc === capability)
    && (feature === 'all' || row.features.includes(feature as ArchitectureFeature)));
}
