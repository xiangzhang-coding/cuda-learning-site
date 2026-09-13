// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const slugs = ['frameworks/profile-led-optimization', 'frameworks/sdpa-dispatch-verification'];
for (const locale of ['', '/en']) {
  test(`optimization to dispatch path and reusable visual ${locale || 'zh'}`, async ({ page }) => {
    await page.goto(`${locale}/${slugs[0]}/`);
    await page.locator(`main a[href="${locale}/labs/profile-custom-operator/"]`).first().click();
    await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'Pending Hardware Verification');
    await page.locator(`main a[href="${locale}/${slugs[1]}/"]`).first().click();
    await expect(page.locator('main h1')).toContainText('P12');
    await page.locator(`main a[href="${locale}/visuals/attention-memory-traffic/"]`).first().click();
    await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', 'VIS18');
    await expect(page.locator('main h1')).toContainText('Attention Memory Traffic');
    for (const slug of slugs) {
      await page.goto(`${locale}/${slug}/exercises/`);
      const hint = page.locator('main details').first();
      await hint.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(hint).toHaveAttribute('open', '');
      await page.locator(`main a[href="${locale}/${slug}/solutions/"]`).click();
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(`${locale ? '' : '/en'}/${slug}/solutions/`);
    }
  });

  test(`@accessibility optimization dispatch and lab ${locale || 'zh'}`, async ({ page }) => {
    for (const slug of [...slugs.flatMap((slug) => [slug, `${slug}/exercises`, `${slug}/solutions`]), 'labs/profile-custom-operator']) {
      await page.goto(`${locale}/${slug}/`);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    }
  });
}
