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
export type ForwardPackageState = 'not-used' | 'package-observed' | 'unknown';
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

function createAssessment(
  state: CompatibilityState,
  mechanisms: readonly CompatibilityMechanism[],
  reasons: readonly CompatibilityReason[],
  missingFacts: readonly CompatibilityMissingFact[],
): CompatibilityAssessment {
  return {
    state,
    mechanisms,
    reasons,
    missingFacts,
    sourceFactIds: ['SRC-CUDA-012'],
    requiresRuntimeRun: true,
    evidenceStatusEffect: 'none',
  };
}

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
    return createAssessment('indeterminate', [], ['missing-driver'], ['runtime-observation']);
  }

  const floorComparison = compareDriverReleases(driverRelease, lane.minimumLinuxDriver);
  const pairedComparison = compareDriverReleases(driverRelease, lane.pairedLinuxDriver);
  if (floorComparison === null || pairedComparison === null) {
    return createAssessment('indeterminate', [], ['invalid-driver'], ['runtime-observation']);
  }

  if (pairedComparison >= 0) {
    return createAssessment(
      'documented-path',
      ['backward'],
      ['meets-paired-driver'],
      ['application-components', 'binary-targets', 'feature-dependencies', 'runtime-observation'],
    );
  }

  if (floorComparison >= 0) {
    return createAssessment(
      'documented-path',
      ['minor'],
      ['meets-major-floor'],
      ['application-components', 'binary-targets', 'feature-dependencies', 'runtime-observation'],
    );
  }

  if (forwardPackage === 'package-observed') {
    return createAssessment(
      'indeterminate',
      ['forward-package'],
      ['below-major-floor', 'forward-package-needs-review'],
      ['application-components', 'binary-targets', 'feature-dependencies', 'forward-eligible-device', 'loaded-user-mode-driver', 'runtime-observation'],
    );
  }

  if (forwardPackage === 'unknown') {
    return createAssessment(
      'indeterminate',
      [],
      ['below-major-floor', 'forward-package-unknown'],
      ['forward-eligible-device', 'loaded-user-mode-driver', 'runtime-observation'],
    );
  }

  return createAssessment('not-documented', [], ['below-major-floor'], ['runtime-observation']);
}
