// SPDX-License-Identifier: Apache-2.0
import { setTimeout as delay } from 'node:timers/promises';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures, expectSearchReadyForNavigation } from '../helpers/browser-contract';

for (const locale of ['', 'en/']) {
  test(`${locale || 'zh-CN/'}navigation waits for delayed search result fragments`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    const scenario = {
      label: locale ? 'Search' : '搜索', query: 'P04', href: `/${locale}frameworks/queued-work-timing/`,
    };
    await page.goto(scenario.href);
    await expectSearchReadyForNavigation(page, scenario);

    let delayedFragments = 0;
    await page.route('**/pagefind/fragment/*.pf_fragment', async (route) => {
      delayedFragments += 1;
      // Model cold result-detail loading beyond the generic five-second assertion
      // budget. Serve the real index fragments, not invented search results.
      await delay(6_000);
      await route.continue();
    });
    await page.locator(`main a[href="/${locale}practice/#pb-r5-004"]`).first().click();
    await expectSearchReadyForNavigation(page, scenario);
    expect(delayedFragments).toBeGreaterThan(0);
    await expect(page.getByRole('dialog', { name: scenario.label, exact: true })).not.toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(failures).toEqual([]);
  });
}
