// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  COMPATIBILITY_LANES,
  assessCompatibility,
  compareDriverReleases,
  parseDriverRelease,
  type CompatibilityLaneId,
} from '../../src/visuals/compatibility-model';

describe('O08 compatibility explorer model', () => {
  it('parses driver releases as opaque dotted integer tuples', () => {
    expect(parseDriverRelease(' 580.82.09 ')).toEqual([580, 82, 9]);
    expect(parseDriverRelease('610')).toEqual([610]);
    expect(parseDriverRelease('610.0.0.1')).toEqual([610, 0, 0, 1]);
    for (const invalid of ['', 'R580', '580.', '.580', '580.1.2.3.4', '580-beta', '580..2', '999999999999999999999999999999999']) {
      expect(parseDriverRelease(invalid), invalid).toBeNull();
    }
  });

  it('compares releases by integer fields rather than decimal or SemVer rules', () => {
    expect(compareDriverReleases('580.10', '580.9')).toBe(1);
    expect(compareDriverReleases('580', '580.0.0')).toBe(0);
    expect(compareDriverReleases('575.57.08', '580')).toBe(-1);
    expect(compareDriverReleases('invalid', '580')).toBeNull();
    expect(compareDriverReleases('580', 'invalid')).toBeNull();
  });

  it('keeps the three selected Lane facts explicit and source-scoped', () => {
    expect(COMPATIBILITY_LANES.map(({ id, toolkit, floorLabel }) => [id, toolkit, floorLabel])).toEqual([
      ['cuda-11.8', '11.8.0', '450.80.02'],
      ['cuda-12.9', '12.9.2', '525.60.13'],
      ['cuda-13.3', '13.3.1', 'R580 (>= 580)'],
    ]);
  });

  it('returns indeterminate for missing or malformed driver observations', () => {
    expect(assessCompatibility({ laneId: 'cuda-13.3', driverRelease: '', forwardPackage: 'unknown' })).toMatchObject({
      state: 'indeterminate',
      mechanisms: [],
      reasons: ['missing-driver'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    });
    expect(assessCompatibility({ laneId: 'cuda-13.3', driverRelease: 'R580', forwardPackage: 'unknown' })).toMatchObject({
      state: 'indeterminate',
      reasons: ['invalid-driver'],
    });
  });

  it('distinguishes backward and same-major minor-version paths without declaring compatibility', () => {
    const backward = assessCompatibility({
      laneId: 'cuda-12.9',
      driverRelease: '575.57.08',
      forwardPackage: 'not-used',
    });
    expect(backward).toMatchObject({
      state: 'documented-path',
      mechanisms: ['backward'],
      reasons: ['meets-paired-driver'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    });
    expect(backward.missingFacts).toContain('runtime-observation');

    const minor = assessCompatibility({
      laneId: 'cuda-12.9',
      driverRelease: '525.60.13',
      forwardPackage: 'not-used',
    });
    expect(minor).toMatchObject({
      state: 'documented-path',
      mechanisms: ['minor'],
      reasons: ['meets-major-floor'],
    });
    expect(minor.missingFacts).toEqual([
      'application-components',
      'binary-targets',
      'feature-dependencies',
      'runtime-observation',
    ]);
  });

  it('keeps below-floor forward-package cases unresolved until their restrictions are reviewed', () => {
    expect(assessCompatibility({
      laneId: 'cuda-13.3',
      driverRelease: '575.57.08',
      forwardPackage: 'verified-loaded',
    })).toMatchObject({
      state: 'indeterminate',
      mechanisms: ['forward-package'],
      reasons: ['below-major-floor', 'forward-package-needs-review'],
      missingFacts: expect.arrayContaining(['forward-eligible-device', 'loaded-user-mode-driver', 'runtime-observation']),
    });
    expect(assessCompatibility({
      laneId: 'cuda-13.3',
      driverRelease: '575.57.08',
      forwardPackage: 'unknown',
    })).toMatchObject({
      state: 'indeterminate',
      mechanisms: [],
      reasons: ['below-major-floor', 'forward-package-unknown'],
    });
    expect(assessCompatibility({
      laneId: 'cuda-13.3',
      driverRelease: '575.57.08',
      forwardPackage: 'not-used',
    })).toMatchObject({
      state: 'not-documented',
      mechanisms: [],
      reasons: ['below-major-floor'],
      requiresRuntimeRun: true,
      evidenceStatusEffect: 'none',
    });
  });

  it('fails closed for an unknown Toolkit Lane', () => {
    expect(() => assessCompatibility({
      laneId: 'cuda-99.9' as CompatibilityLaneId,
      driverRelease: '999',
      forwardPackage: 'not-used',
    })).toThrow('Unknown Toolkit Lane');
  });
});
