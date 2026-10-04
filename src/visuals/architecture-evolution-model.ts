// SPDX-License-Identifier: Apache-2.0
// Source-reviewed contracts, not detected devices or measured performance.
export const ARCHITECTURE_CAPABILITIES = ['all', '7.5', '8.0', '8.6', '8.7', '8.9', '9.0', '10.0', '10.3', '10.7', '11.0', '12.0', '12.1'] as const;
export const ARCHITECTURE_FEATURES = ['all', 'its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'fp64', 'l2-policy', 'clusters', 'dsm', 'tma', 'family-target', 'fp4'] as const;
export type ArchitectureFeature = Exclude<(typeof ARCHITECTURE_FEATURES)[number], 'all'>;
export type ArchitectureContract = Readonly<{
  cc: Exclude<(typeof ARCHITECTURE_CAPABILITIES)[number], 'all'>;
  architecture: 'Turing' | 'Ampere' | 'Ada' | 'Hopper' | 'Blackwell';
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
  { cc: '10.0', architecture: 'Blackwell', target: 'compute_100 / sm_100; compute_100f / sm_100f', sharedKiB: 227, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'fp64', 'l2-policy', 'clusters', 'dsm', 'tma', 'family-target', 'fp4'] },
  { cc: '10.3', architecture: 'Blackwell', target: 'compute_103 / sm_103; compute_103f / sm_103f', sharedKiB: 227, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'l2-policy', 'clusters', 'dsm', 'tma', 'family-target', 'fp4'] },
  { cc: '10.7', architecture: 'Blackwell', target: 'compute_107 / sm_107; compute_107f / sm_107f', sharedKiB: 327, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'fp64', 'l2-policy', 'clusters', 'dsm', 'tma', 'family-target', 'fp4'] },
  { cc: '11.0', architecture: 'Blackwell', target: 'compute_110 / sm_110; compute_110f / sm_110f', sharedKiB: 227, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'l2-policy', 'clusters', 'dsm', 'tma', 'family-target', 'fp4'] },
  { cc: '12.0', architecture: 'Blackwell', target: 'compute_120 / sm_120; compute_120f / sm_120f', sharedKiB: 99, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'l2-policy', 'clusters', 'dsm', 'tma', 'family-target', 'fp4'] },
  { cc: '12.1', architecture: 'Blackwell', target: 'compute_121 / sm_121; compute_121f / sm_121f', sharedKiB: 99, features: ['its', 'async-copy', 'split-barrier', 'fp16', 'bf16', 'tf32', 'l2-policy', 'clusters', 'dsm', 'tma', 'family-target', 'fp4'] },
];

export function filterArchitectures(capability: string, feature: string): readonly ArchitectureContract[] {
  if (!(ARCHITECTURE_CAPABILITIES as readonly string[]).includes(capability)
    || !(ARCHITECTURE_FEATURES as readonly string[]).includes(feature)) {
    throw new RangeError('Unknown architecture filter');
  }
  return ARCHITECTURE_CONTRACTS.filter(row => (capability === 'all' || row.cc === capability)
    && (feature === 'all' || row.features.includes(feature as ArchitectureFeature)));
}
