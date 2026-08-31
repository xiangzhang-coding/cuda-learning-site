// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { collectBrowserFailures } from '../helpers/browser-contract';

describe('browser failure diagnostics', () => {
  it('records only controlled categories and never raw browser input', () => {
    const handlers = new Map<string, (value: never) => void>();
    const page = {
      on(event: string, handler: (value: never) => void) {
        handlers.set(event, handler);
        return page;
      },
    };
    const secret = ['ghp', 'abcdefghijklmnopqrstuvwxyz123456'].join('_');
    const failures = collectBrowserFailures(page as never, 'https://release.example');

    handlers.get('console')?.({ type: () => 'error', text: () => secret } as never);
    handlers.get('pageerror')?.(new Error(secret) as never);
    handlers.get('requestfailed')?.({ url: () => `https://release.example/file?token=${secret}` } as never);
    handlers.get('requestfailed')?.({ url: () => `https://external.example/${secret}` } as never);
    handlers.get('response')?.({ url: () => `https://release.example/${secret}`, status: () => 500 } as never);

    expect(failures).toEqual([
      'console error',
      'page error',
      'request failed at target origin',
      'request failed at external origin',
      'response 500 at target origin',
    ]);
    expect(JSON.stringify(failures)).not.toContain(secret);
  });
});
