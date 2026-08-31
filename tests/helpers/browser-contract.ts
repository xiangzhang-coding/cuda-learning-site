// SPDX-License-Identifier: Apache-2.0
import { expect, type Page } from '@playwright/test';

export type SearchScenario = {
  route: string;
  button: RegExp;
  query: string;
  expectedHrefs: readonly string[];
  localePrefix?: string;
};

export function collectBrowserFailures(page: Page, targetOrigin: string) {
  const origin = new URL(targetOrigin).origin;
  const failures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push('console error');
  });
  page.on('pageerror', () => failures.push('page error'));
  page.on('requestfailed', (request) => {
    const scope = new URL(request.url()).origin === origin ? 'target origin' : 'external origin';
    failures.push(`request failed at ${scope}`);
  });
  page.on('response', (response) => {
    if (new URL(response.url()).origin === origin && response.status() >= 400) {
      failures.push(`response ${response.status()} at target origin`);
    }
  });
  return failures;
}

export async function expectRankedSearchResult(page: Page, scenario: SearchScenario) {
  await page.goto(scenario.route);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: scenario.button }).first().focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: scenario.button });
  await dialog.getByRole('textbox', { name: scenario.button }).fill(scenario.query);
  const resultLinks = dialog.locator(
    '.pagefind-ui__result > .pagefind-ui__result-inner > .pagefind-ui__result-title > a[href]',
  );
  await expect(resultLinks.first(), scenario.query).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => {
    const hrefs = await resultLinks.evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));
    const topPaths = hrefs.slice(0, 5).map((href) => new URL(href, page.url()).pathname);
    return scenario.expectedHrefs.some((href) => topPaths.includes(href));
  }, { message: scenario.query, timeout: 15_000 }).toBe(true);

  const hrefs = await resultLinks.evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));

  if (scenario.localePrefix) {
    expect(
      hrefs.every((href) =>
        scenario.localePrefix === '/en/' ? href.startsWith('/en/') : !href.startsWith('/en/'),
      ),
    ).toBe(true);
  }

  await page.keyboard.press('Escape');
}
