// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { describe, it } from 'vitest';

describe('LAB15 numerical acceptance boundary', () => {
  it('checks independent reference values and rejects corrupted outputs without GPU libraries', () => {
    execFileSync('python3', ['-m', 'unittest', 'discover', '-s', 'scripts/softmax-verification', '-p', 'test_*.py']);
  });
});
