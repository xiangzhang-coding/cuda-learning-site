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

export async function settlePublicationPage(page: Page) {
  const search = page.locator('site-search');
  // Idle preloading is opportunistic. A busy runner may never deliver its callback
  // within the assertion budget, so exercise the public intent path if still cold.
  if (await search.locator('input').count() === 0) {
    await search.locator('button[data-open-modal]').click();
    const dialog = search.getByRole('dialog');
    await expect(dialog.getByRole('textbox')).toBeEditable();
    await expect(dialog.getByRole('textbox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
  await expect(page.locator('site-search input'), 'publication initializes static search').toHaveCount(1);
  // Firefox can still be fetching the favicon after load and search UI creation.
  // Drain that page's requests before the sweep replaces its document; keep the
  // failure collector strict rather than hiding NS_BINDING_ABORTED globally.
  await page.waitForLoadState('networkidle');
}

export async function expectSearchReadyForNavigation(
  page: Page,
  { label, query, href }: { label: string; query: string; href: string },
) {
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('banner').getByRole('button', { name: label, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: label, exact: true });
  const input = dialog.getByRole('textbox', { name: label, exact: true });
  await expect(input).toBeVisible();
  await expect(input).toBeEditable();
  await input.fill(query);
  // Match the existing ranked-search budget: editable input and a result count
  // precede fetching/rendering result fragments on a cold browser.
  await expect(dialog.locator(`a[href="${href}"]`).first()).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
}
