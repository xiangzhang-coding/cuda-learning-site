// SPDX-License-Identifier: Apache-2.0

export const COMPATIBILITY_LANES = [
  {
    id: 'cuda-11.8',
    toolkit: '11.8.0',
    toolkitMajor: 11,
    minimumLinuxDriver: '450.80.02',
    pairedLinuxDriver: '520.61.05',
    floorLabel: '450.80.02',
  },
  {
    id: 'cuda-12.9',
    toolkit: '12.9.2',
    toolkitMajor: 12,
    minimumLinuxDriver: '525.60.13',
    pairedLinuxDriver: '575.57.08',
    floorLabel: '525.60.13',
  },
  {
    id: 'cuda-13.3',
    toolkit: '13.3.1',
    toolkitMajor: 13,
    minimumLinuxDriver: '580.0.0',
    pairedLinuxDriver: '610.43.02',
    floorLabel: 'R580 (>= 580)',
  },
] as const;

export type CompatibilityLaneId = (typeof COMPATIBILITY_LANES)[number]['id'];
export type ForwardPackageState = 'not-used' | 'verified-loaded' | 'unknown';
export type CompatibilityState = 'documented-path' | 'not-documented' | 'indeterminate';
export type CompatibilityMechanism = 'backward' | 'minor' | 'forward-package';
export type CompatibilityReason =
  | 'missing-driver'
  | 'invalid-driver'
  | 'meets-paired-driver'
  | 'meets-major-floor'
  | 'below-major-floor'
  | 'forward-package-needs-review'
  | 'forward-package-unknown';
export type CompatibilityMissingFact =
  | 'application-components'
  | 'binary-targets'
  | 'feature-dependencies'
  | 'forward-eligible-device'
  | 'loaded-user-mode-driver'
  | 'runtime-observation';

export type CompatibilityAssessment = Readonly<{
  state: CompatibilityState;
  mechanisms: readonly CompatibilityMechanism[];
  reasons: readonly CompatibilityReason[];
  missingFacts: readonly CompatibilityMissingFact[];
  sourceFactIds: readonly string[];
  requiresRuntimeRun: true;
  evidenceStatusEffect: 'none';
}>;

export type CompatibilityInput = Readonly<{
  laneId: CompatibilityLaneId;
  driverRelease: string;
  forwardPackage: ForwardPackageState;
}>;

export function parseDriverRelease(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+){0,3}$/.test(normalized)) return null;
  const parts = normalized.split('.').map((part) => Number.parseInt(part, 10));
  return parts.every(Number.isSafeInteger) ? parts : null;
}

export function compareDriverReleases(left: string, right: string) {
  const leftParts = parseDriverRelease(left);
  const rightParts = parseDriverRelease(right);
  if (!leftParts || !rightParts) return null;
  const width = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < width; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function assessCompatibility({ laneId, driverRelease, forwardPackage }: CompatibilityInput): CompatibilityAssessment {
  const lane = COMPATIBILITY_LANES.find((candidate) => candidate.id === laneId);
  if (!lane) throw new Error(`Unknown Toolkit Lane: ${laneId}`);

  if (driverRelease.trim().length === 0) {
    return {
      state: 'indeterminate',
      mechanisms: [],
      reasons: ['missing-driver'],
      missingFacts: ['runtime-observation'],
      sourceFactIds: ['SRC-CUDA-012'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    };
  }

  const floorComparison = compareDriverReleases(driverRelease, lane.minimumLinuxDriver);
  const pairedComparison = compareDriverReleases(driverRelease, lane.pairedLinuxDriver);
  if (floorComparison === null || pairedComparison === null) {
    return {
      state: 'indeterminate',
      mechanisms: [],
      reasons: ['invalid-driver'],
      missingFacts: ['runtime-observation'],
      sourceFactIds: ['SRC-CUDA-012'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    };
  }

  if (pairedComparison >= 0) {
    return {
      state: 'documented-path',
      mechanisms: ['backward'],
      reasons: ['meets-paired-driver'],
      missingFacts: ['application-components', 'binary-targets', 'feature-dependencies', 'runtime-observation'],
      sourceFactIds: ['SRC-CUDA-012'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    };
  }

  if (floorComparison >= 0) {
    return {
      state: 'documented-path',
      mechanisms: ['minor'],
      reasons: ['meets-major-floor'],
      missingFacts: ['application-components', 'binary-targets', 'feature-dependencies', 'runtime-observation'],
      sourceFactIds: ['SRC-CUDA-012'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    };
  }

  if (forwardPackage === 'verified-loaded') {
    return {
      state: 'indeterminate',
      mechanisms: ['forward-package'],
      reasons: ['below-major-floor', 'forward-package-needs-review'],
      missingFacts: ['application-components', 'binary-targets', 'feature-dependencies', 'forward-eligible-device', 'loaded-user-mode-driver', 'runtime-observation'],
      sourceFactIds: ['SRC-CUDA-012'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    };
  }

  if (forwardPackage === 'unknown') {
    return {
      state: 'indeterminate',
      mechanisms: [],
      reasons: ['below-major-floor', 'forward-package-unknown'],
      missingFacts: ['forward-eligible-device', 'loaded-user-mode-driver', 'runtime-observation'],
      sourceFactIds: ['SRC-CUDA-012'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    };
  }

  return {
    state: 'not-documented',
    mechanisms: [],
    reasons: ['below-major-floor'],
    missingFacts: ['runtime-observation'],
    sourceFactIds: ['SRC-CUDA-012'],
    requiresRuntimeRun: true,
    evidenceStatusEffect: 'none',
  };
}
