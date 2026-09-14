// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { it } from 'vitest';

it('LAB16 rejects corrupt numerical results, invalid selections and unsafe benchmark environments', () => {
  execFileSync('python3', ['-m', 'unittest', 'discover', '-s', 'scripts/gemm-verification', '-p', 'test_*.py']);
});
