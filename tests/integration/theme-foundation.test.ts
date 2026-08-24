// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { THEME_COPY, THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function builtHtmlFiles() {
  return (await readdir(path.join(projectRoot, 'dist'), { recursive: true }))
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => file.endsWith('.html'));
}

describe('built theme foundation', () => {
  it('renders the complete localized theme control and static fallback on every page', async () => {
    const htmlFiles = await builtHtmlFiles();
    expect(htmlFiles).toHaveLength(38);

    for (const file of htmlFiles) {
      const document = parseHTML(await readFile(path.join(projectRoot, 'dist', file), 'utf8')).document;
      const locale = document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
      const copy = THEME_COPY[locale];
      const controls = [...document.querySelectorAll('learning-theme-select')];

      expect(controls.length, file).toBeGreaterThanOrEqual(1);
      expect(controls.length, file).toBeLessThanOrEqual(2);
      for (const control of controls) {
        expect(control.querySelector('.sr-only')?.textContent).toBe(copy.controlLabel);
        expect(
          [...control.querySelectorAll('option')].map((option) => [option.getAttribute('value'), option.textContent]),
        ).toEqual(THEME_IDS.map((theme) => [theme, copy.options[theme]]));
      }
      expect(document.querySelector('[data-static-theme-fallback]')?.textContent?.trim(), file).toBe(copy.staticFallback);
    }
  });

  it('uses one local-storage key and no account or application-state transport', async () => {
    for (const file of await builtHtmlFiles()) {
      const html = await readFile(path.join(projectRoot, 'dist', file), 'utf8');
      const storageOperations = [...html.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(([^,)]+)/g)].map(
        (match) => match[1]?.trim(),
      );

      expect(storageOperations, file).toEqual(['probeKey', 'probeKey', 'storageKey', 'storageKey']);
      expect(html, file).toContain(THEME_STORAGE_KEY);
      expect(html, file).not.toMatch(/document\.cookie|indexedDB\.open|\bfetch\s*\(/);
      expect(html, file).not.toContain('<form');
    }
  });

  it('ships all theme selectors and accessibility media fallbacks in generated CSS', async () => {
    const cssFiles = (await readdir(path.join(projectRoot, 'dist/_astro'))).filter((file) => file.endsWith('.css'));
    const css = (await Promise.all(cssFiles.map((file) => readFile(path.join(projectRoot, 'dist/_astro', file), 'utf8')))).join(
      '\n',
    );

    for (const theme of THEME_IDS) expect(css).toContain(`[data-learning-theme=${theme}]`);
    for (const media of ['prefers-reduced-motion:reduce', 'prefers-contrast:more', 'forced-colors:active']) {
      expect(css).toContain(`@media (${media})`);
    }
    expect(css).toContain('@media print');
    expect(css).toContain(':root:not([data-learning-theme])');
  });

  it('publishes aligned explanations and the automated-testing disclaimer', async () => {
    for (const file of [
      'start/using-the-learning-site/index.html',
      'en/start/using-the-learning-site/index.html',
    ]) {
      const document = parseHTML(await readFile(path.join(projectRoot, 'dist', file), 'utf8')).document;
      const text = document.querySelector('main')?.textContent ?? '';

      for (const label of ['Silicon Light', 'Profiler Dark', 'Blueprint']) expect(text, file).toContain(label);
      expect(text, file).toMatch(/localStorage/);
      expect(text, file).toMatch(/不能证明 WCAG 一致性|do not prove WCAG conformance/);
      expect(text, file).toMatch(/静态默认|static Silicon Light default/);
    }
  });
});
