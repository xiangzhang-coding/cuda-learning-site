// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_THEME,
  THEME_COPY,
  THEME_IDS,
  THEME_STORAGE_KEY,
  parseStoredTheme,
  starlightThemeFor,
} from '../../src/theme-contract';

describe('learning theme contract', () => {
  it('defines three named themes with Silicon Light as the static default', () => {
    expect(THEME_IDS).toEqual(['silicon-light', 'profiler-dark', 'blueprint']);
    expect(DEFAULT_THEME).toBe('silicon-light');
    expect(THEME_STORAGE_KEY).toBe('starlight-theme');
  });

  it.each([
    ['silicon-light', 'silicon-light'],
    ['profiler-dark', 'profiler-dark'],
    ['blueprint', 'blueprint'],
    ['light', 'silicon-light'],
    ['dark', 'profiler-dark'],
    ['auto', 'silicon-light'],
    ['', 'silicon-light'],
    [null, 'silicon-light'],
    ['unknown', 'silicon-light'],
    ['constructor', 'silicon-light'],
    ['toString', 'silicon-light'],
    ['__proto__', 'silicon-light'],
  ] as const)('parses stored value %s as %s', (stored, expected) => {
    expect(parseStoredTheme(stored)).toBe(expected);
  });

  it('maps each visual theme to the Starlight color contract', () => {
    expect(starlightThemeFor('silicon-light')).toBe('light');
    expect(starlightThemeFor('profiler-dark')).toBe('dark');
    expect(starlightThemeFor('blueprint')).toBe('dark');
  });

  it('keeps every control label and static fallback complete in both locales', () => {
    expect(Object.keys(THEME_COPY).sort()).toEqual(['en', 'zh-CN']);

    for (const copy of Object.values(THEME_COPY)) {
      expect(copy.controlLabel.length).toBeGreaterThan(0);
      expect(copy.staticFallback.length).toBeGreaterThan(0);
      expect(Object.keys(copy.options)).toEqual(THEME_IDS);
      for (const theme of THEME_IDS) expect(copy.options[theme].length).toBeGreaterThan(0);
    }
  });
});
