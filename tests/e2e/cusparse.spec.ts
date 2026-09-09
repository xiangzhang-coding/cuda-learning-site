// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

const unit = 'libraries/cusparse-descriptors-spmv-spmm';
const example = 'examples/cusparse-spmv';
const slugs = [unit, `${unit}/exercises`, `${unit}/solutions`, example];
const ranges = ['cpu-reference', 'descriptors-workspace', 'stream-lifecycle'];

for (const slug of slugs) {
  test(`${slug} has direct locale navigation and independent evidence`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    await page.goto(`/${slug}/`);
    for (const locale of ['', 'en/']) {
      await expect(page.locator('main h1')).toContainText(slug === example ? 'EX20' : 'L13');
      await expect(page.locator('meta[name="cuda:fact-check-date"]')).toHaveAttribute('content', '2026-09-09');
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content',
        slug === example ? 'Pending Hardware Verification' : 'none');
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      if (slug === example) {
        await expect(page.locator('meta[name="cuda:prerequisites"]')).toHaveAttribute('content', 'L13');
        await expect(page.locator('meta[name="cuda:canonical-example"]')).toHaveAttribute('content', 'EX20');
        await expect(page.locator('meta[name="cuda:canonical-ranges"]')).toHaveAttribute('content', ranges.join(','));
      }
      const counterpart = `/${locale ? '' : 'en/'}${slug}/`;
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(`${baseURL}${counterpart}`);
      await page.waitForLoadState('domcontentloaded');
    }
    expect(failures).toEqual([]);
  });
}

for (const locale of ['', 'en/']) {
  test(`${locale || 'zh-CN/'}cuSPARSE narrow-screen learning, hints, solutions and canonical source journey`, async ({ page, baseURL }, info) => {
    const failures = collectBrowserFailures(page, baseURL!);
    const route = `/${locale}${unit}/`;
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const table = page.locator('main table').first();
    await expect(table).toHaveAttribute('tabindex', '0');
    if (info.project.name !== 'mobile-safari') {
      await table.focus();
      await expect(table).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(`main a[href="${route}exercises/"]`).first().click();
    const hints = page.locator('main details');
    await expect(hints).toHaveCount(6);
    await expect(page.locator('main details[open]')).toHaveCount(0);
    for (const hint of await hints.all()) {
      const summary = hint.locator('summary');
      if (info.project.name === 'mobile-safari') await summary.tap();
      else await summary.press('Enter');
      await expect(hint).toHaveJSProperty('open', true);
      expect((await hint.innerText()).replace(await summary.innerText(), '').trim()).not.toBe('');
      if (info.project.name === 'mobile-safari') await summary.tap();
      else await summary.press('Space');
      await expect(hint).toHaveJSProperty('open', false);
    }
    await page.locator(`main a[href="${route}solutions/"]`).first().click();
    for (const answer of ['[-1,2,-2]', '[[-1,14],[2,-3],[-2,17]]', 'R>20', '4096+4096=8192']) {
      await expect(page.locator('main')).toContainText(answer);
    }
    await expect(page.locator('main details')).toHaveCount(0);
    await page.locator(`main a[href="/${locale}${example}/"]`).first().click();
    const imports = page.locator('figure[data-canonical-example="EX20"]');
    await expect(imports).toHaveCount(3);
    expect(await imports.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-canonical-range')))).toEqual(ranges);
    for (const [index, token] of ['std::vector<double> spmv', 'cusparseSpMV_bufferSize(', 'cudaStreamSynchronize(stream)'].entries()) {
      await expect(imports.nth(index).locator('pre code')).toContainText(token);
    }
    for (const contract of ['[-1,0,14,-5]', '[-2.5,2,10,0]', 'abs(gpu-cpu) <= 1e-4 + 2e-5*abs(cpu)',
      'make compile DIALECT=c++17 BUILD_DIR=build EXPECTED_CUSPARSE_VERSION=11.7.5.86']) {
      await expect(page.locator('main')).toContainText(contract);
    }
    const repository = 'https://github.com/xiangzhang-coding/cuda-learning-site';
    const source = page.locator(`main a[href^="${repository}/tree/"][href$="/examples/ex20-cusparse-spmv"]`);
    await expect(source).toHaveCount(1);
    await expect(source).toBeVisible();
    await expect(source).toHaveAttribute('href', /^https:\/\/github\.com\/xiangzhang-coding\/cuda-learning-site\/tree\/[a-f0-9]{40}\/examples\/ex20-cusparse-spmv$/);
    const revision = new URL((await source.getAttribute('href'))!).pathname.split('/')[4];
    const download = page.locator(`main a[href="${repository}/archive/${revision}.zip"]`);
    await expect(download).toHaveCount(1);
    await expect(download).toBeVisible();
    for (const [index, file] of ['include/cusparse_spmv_reference.hpp', 'src/cusparse_spmv.cu', 'src/cusparse_spmv.cu'].entries()) {
      const pointer = new URL((await imports.nth(index).locator('figcaption a').getAttribute('href'))!);
      expect(`${pointer.origin}${pointer.pathname}`).toBe(`${repository}/blob/${revision}/examples/ex20-cusparse-spmv/${file}`);
      expect(pointer.hash).toMatch(/^#L\d+-L\d+$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    for (const code of await imports.all()) await expect(code.locator('pre code')).toBeVisible();
    await expect(source).toBeVisible();
    await expect(download).toBeVisible();
    expect(failures).toEqual([]);
  });

  test(`@accessibility ${locale || 'zh-CN/'}cuSPARSE pair surfaces and open hints`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the serialized axe gate.');
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of slugs) {
      await page.goto(`/${locale}${slug}/`);
      await expect(page.locator('main h1')).toContainText(slug === example ? 'EX20' : 'L13');
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })), slug).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
    }
  });
}

test.describe('cuSPARSE without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('bilingual paper hints, source links and canonical code remain readable', async ({ page, baseURL }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the no-script gate.');
    const failures = collectBrowserFailures(page, baseURL!);
    for (const locale of ['', 'en/']) {
      await page.goto(`/${locale}${unit}/exercises/`);
      const hints = page.locator('main details');
      await expect(hints).toHaveCount(6);
      await expect(page.locator('main details[open]')).toHaveCount(0);
      const hint = hints.first();
      await hint.locator('summary').press('Enter');
      await expect(hint).toHaveJSProperty('open', true);
      expect((await hint.innerText()).replace(await hint.locator('summary').innerText(), '').trim()).not.toBe('');
      await page.locator(`main a[href="/${locale}${example}/"]`).first().click();
      await expect(page.locator('figure[data-canonical-example="EX20"]')).toHaveCount(3);
      await expect(page.locator('main')).toContainText('cusparseSpMV_bufferSize');
      await expect(page.locator('main')).toContainText('CUSPARSE_SPMV_CSR_ALG2');
      await expect(page.locator('main a[href*="/tree/"][href$="/examples/ex20-cusparse-spmv"]')).toBeVisible();
      await expect(page.locator('main a[href*="/archive/"][href$=".zip"]')).toBeVisible();
      const counterpart = `/${locale ? '' : 'en/'}${example}/`;
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(`${baseURL}${counterpart}`);
      await expect(page.locator('figure[data-canonical-example="EX20"]')).toHaveCount(3);
    }
    expect(failures).toEqual([]);
  });
});
