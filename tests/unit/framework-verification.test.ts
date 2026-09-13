// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('framework report evidence boundary', () => {
  it('rejects constructed missing, ambiguous and fallback dispatch evidence', () => {
    expect(() => execFileSync('python3', ['-I', 'scripts/framework-verification/test_check.py'], {
      encoding: 'utf8', stdio: 'pipe',
    })).not.toThrow();
  });
});
