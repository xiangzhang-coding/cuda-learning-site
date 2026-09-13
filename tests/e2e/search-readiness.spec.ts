// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

declare global {
  interface Window {
    withheldSearchIdle: IdleRequestCallback[];
  }
}

test.beforeEach(async ({ page }) => {
  // Model a busy host at the browser scheduling boundary, never in production code.
  await page.addInitScript(() => {
    window.withheldSearchIdle = [];
    window.requestIdleCallback = (callback) => window.withheldSearchIdle.push(callback);
  });
});

for (const locale of ['', 'en/']) {
  const name = locale ? 'Search' : '搜索';
  for (const intent of ['click', 'Control+k', 'Meta+k']) {
    test(`${locale || 'zh-CN/'}search initializes on ${intent} without idle time`, async ({ page, baseURL }) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.goto(`/${locale}frameworks/queued-work-timing/`, { waitUntil: 'domcontentloaded' });
      const open = page.getByRole('banner').getByRole('button', { name, exact: true });
      await expect(open).toBeEnabled();
      expect(await page.evaluate(() => window.withheldSearchIdle.length)).toBeGreaterThan(0);
      if (intent === 'click') await open.click();
      else await page.keyboard.press(intent);

      const dialog = page.getByRole('dialog', { name, exact: true });
      const input = dialog.getByRole('textbox', { name, exact: true });
      await expect(dialog).toBeVisible();
      await expect(input).toBeVisible();
      await expect(input).toBeEditable();
      await expect(input).toBeFocused();
      await input.fill('P04');
      const result = dialog.locator(`a[href="/${locale}frameworks/queued-work-timing/"]`).first();
      await expect(result).toBeVisible();

      const originalInput = await input.elementHandle();
      await page.evaluate(async () => {
        const deadline = { didTimeout: false, timeRemaining: () => 50 };
        await Promise.all(window.withheldSearchIdle.flatMap((callback) => [callback(deadline), callback(deadline)]));
      });
      await expect(input).toHaveCount(1);
      expect(await input.evaluate((element, original) => element === original, originalInput)).toBe(true);
      await expect(input).toHaveValue('P04');
      await expect(result).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await open.click();
      // Pagefind clears the query on Escape; reopening must retain the same UI, not the query.
      expect(await input.evaluate((element, original) => element === original, originalInput)).toBe(true);
      await expect(input).toBeEditable();
      expect(failures).toEqual([]);
    });
  }

  for (const outcome of ['ready', 'closed', 'failure', 'timeout']) {
    test(`${locale || 'zh-CN/'}search handles delayed initialization: ${outcome}`, async ({ page, baseURL }) => {
      const failures = collectBrowserFailures(page, baseURL!);
      const gate = Promise.withResolvers<void>();
      let requests = 0;
      await page.route('**/_astro/ui-core.*.js', async (route) => {
        requests += 1;
        await gate.promise;
        if (outcome === 'failure') {
          // A module evaluation failure at the network boundary, not a mock Pagefind UI.
          await route.fulfill({ contentType: 'text/javascript', body: 'throw new Error("Deliberate search-module load failure");' });
        } else await route.continue();
      });
      await page.goto(`/${locale}frameworks/queued-work-timing/`, { waitUntil: 'domcontentloaded' });
      if (outcome === 'timeout') await page.clock.install();
      const open = page.getByRole('banner').getByRole('button', { name, exact: true });
      await expect(open).toBeEnabled();
      // Start an idle preload first; intent must join it instead of constructing a second UI.
      await page.evaluate(() => {
        window.withheldSearchIdle.forEach((callback) => callback({ didTimeout: false, timeRemaining: () => 50 }));
      });
      await open.click();
      await expect.poll(() => requests).toBe(1);
      const dialog = page.getByRole('dialog', { name, exact: true });
      const status = dialog.getByRole('status');
      const error = dialog.getByRole('alert');
      const input = page.locator('site-search').getByRole('textbox', { name, exact: true, includeHidden: true });
      await expect(status).toHaveText(locale ? 'Loading search…' : '正在加载搜索…');
      await expect(status).toBeVisible();
      await expect(input).toHaveCount(0);
      await expect(page.locator('#starlight__search')).toHaveAttribute('aria-busy', 'true');
      if (outcome === 'closed') {
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await open.focus();
      } else if (outcome === 'timeout') {
        await page.clock.fastForward(10_001);
        await expect(error).toBeVisible();
      }
      const loaded = page.waitForEvent('requestfinished', (request) => /\/_astro\/ui-core\.[^/]+\.js$/.test(request.url()));
      gate.resolve();
      await loaded;
      await page.evaluate(async () => {
        await Promise.all(window.withheldSearchIdle.map((callback) => callback({ didTimeout: false, timeRemaining: () => 50 })));
      });
      await expect(status).not.toBeVisible();
      await expect(page.locator('#starlight__search')).not.toHaveAttribute('aria-busy');
      if (outcome === 'failure' || outcome === 'timeout') {
        await expect(error).toHaveText(locale ? 'Search could not load. Reload the page to try again.' : '搜索未能加载。请重新加载页面后再试。');
        await expect(error).toBeVisible();
        const cancel = dialog.locator('button[data-close-modal]');
        if (await cancel.isVisible()) {
          const cancelBox = await cancel.boundingBox();
          expect(await error.evaluate((element, box) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return [...range.getClientRects()].some((rect) =>
              rect.left < box!.x + box!.width && rect.right > box!.x &&
              rect.top < box!.y + box!.height && rect.bottom > box!.y);
          }, cancelBox), 'Failure text must not overlap the mobile Cancel button').toBe(false);
        }
        await expect(input).toHaveCount(0);
        await page.keyboard.press('Escape');
        await open.click();
        await expect(error).toBeVisible();
        await expect(input).toHaveCount(0);
      } else {
        await expect(input).toHaveCount(1);
        if (outcome === 'closed') {
          await expect(open).toBeFocused();
          await expect(dialog).not.toBeVisible();
          await open.click();
        }
        await expect(input).toBeFocused();
        await input.fill('P04');
        await expect(dialog.locator(`a[href="/${locale}frameworks/queued-work-timing/"]`).first()).toBeVisible();
      }
      expect(requests).toBe(1);
      expect(failures).toEqual([]);
    });
  }
}
