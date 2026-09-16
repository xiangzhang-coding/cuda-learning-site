// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';
import { collectBrowserFailures, settlePublicationPage } from '../helpers/browser-contract';

for (const prefix of ['', 'en/']) {
  test(`${prefix || 'zh-CN/'}publication navigation settles without an idle search preload`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    // A busy browser need not deliver an idle callback within the assertion budget.
    await page.addInitScript(() => { window.requestIdleCallback = () => 1; });
    await page.goto(`/${prefix}libraries/cufft-plans-layouts-startup/solutions/`);
    await settlePublicationPage(page);
    await expect(page.locator('site-search input')).toHaveCount(1);
    await expect(page.locator('site-search dialog')).not.toBeVisible();
    await page.locator('[data-locale-counterpart]').click();
    await settlePublicationPage(page);
    await expect(page.locator('site-search input')).toHaveCount(1);
    await expect(page.locator('site-search dialog')).not.toBeVisible();
    expect(failures).toEqual([]);
  });
}

test('a delayed Firefox favicon completes before the route sweep navigates again', async ({ page, browserName, baseURL }) => {
  test.skip(browserName !== 'firefox', 'Reproduce the Firefox NS_BINDING_ABORTED favicon trace.');
  const failures = collectBrowserFailures(page, baseURL!);
  const gate = Promise.withResolvers<void>();
  const requested = page.waitForEvent('request', (request) => request.url().endsWith('/favicon.svg'));
  const finished = page.waitForEvent('requestfinished', (request) => request.url().endsWith('/favicon.svg'));
  await page.route('**/favicon.svg', async (route) => {
    await gate.promise;
    await route.continue();
  });
  let released = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await page.goto('/en/toolchain/ptx-cubin-fatbinary/exercises/', { waitUntil: 'load' });
    await requested;
    // The input is ready while the independently loaded icon is still in flight.
    await expect(page.locator('site-search input')).toHaveCount(1);
    timer = setTimeout(() => { released = true; gate.resolve(); }, 250);
    await settlePublicationPage(page);
    expect(released, 'input creation alone must not end the page readiness boundary').toBe(true);
    await finished;
    await page.goto('/en/toolchain/ptx-cubin-fatbinary/solutions/', { waitUntil: 'load' });
    await settlePublicationPage(page);
    expect(failures).toEqual([]);
  } finally {
    clearTimeout(timer);
    gate.resolve();
    await finished;
  }
});
