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
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    failures.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });
  page.on('response', (response) => {
    if (new URL(response.url()).origin === origin && response.status() >= 400) {
      failures.push(`response: ${response.status()} ${response.url()}`);
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
  const links = dialog.locator('a[href]');
  await expect(links.first()).toBeVisible();
  const hrefs = await links.evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));

  if (scenario.localePrefix) {
    expect(
      hrefs.every((href) =>
        scenario.localePrefix === '/en/' ? href.startsWith('/en/') : !href.startsWith('/en/'),
      ),
    ).toBe(true);
  }

  const topPaths = hrefs.slice(0, 5).map((href) => new URL(href, page.url()).pathname);
  expect(scenario.expectedHrefs.some((href) => topPaths.includes(href)), scenario.query).toBe(true);
  await page.keyboard.press('Escape');
}
