// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('EX24 accepts signed literal sums and rejects corrupted or empty host results', () => {
  const output = execFileSync('make', ['host-test'], { cwd: 'examples/ex24-nccl-all-reduce', encoding: 'utf8' });
  expect(output).toContain('EX24 host oracle checks passed; no CUDA execution');
});
