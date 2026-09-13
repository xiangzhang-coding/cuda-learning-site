// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const locale of ['', '/en']) {
  test(`custom operator learning path and keyboard hints ${locale || 'zh'}`, async ({ page }) => {
    await page.goto(`${locale}/frameworks/first-custom-operator/`);
    await expect(page.locator('main h1')).toContainText('P08');
    await page.locator(`main a[href="${locale}/frameworks/operator-registration/"]`).first().click();
    await expect(page.locator('main h1')).toContainText('P09');
    await page.locator(`main a[href="${locale}/frameworks/operator-registration/exercises/"]`).first().click();
    const hint = page.locator('main details').first();
    await expect(hint).not.toHaveAttribute('open', '');
    await hint.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(hint).toHaveAttribute('open', '');
    await page.locator(`main a[href="${locale}/frameworks/operator-registration/solutions/"]`).click();
    await expect(page.locator('main')).toContainText('[-8,2,6]');
    await page.goto(`${locale}/labs/build-custom-operator/`);
    await expect(page.locator('[data-canonical-example="EX22"]')).toHaveCount(2);
    await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'Pending Hardware Verification');
    await page.locator('[data-locale-counterpart]').click();
    await expect(page).toHaveURL(`${locale ? '' : '/en'}/labs/build-custom-operator/`);
  });

  test(`@accessibility custom operator canonical code and lab ${locale || 'zh'}`, async ({ page }) => {
    for (const slug of ['frameworks/first-custom-operator', 'frameworks/operator-registration',
      'frameworks/operator-packaging', 'examples/adjacent-energy', 'labs/build-custom-operator']) {
      await page.goto(`${locale}/${slug}/`);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    }
  });
}
