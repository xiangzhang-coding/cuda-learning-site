// SPDX-License-Identifier: Apache-2.0
export const THEME_IDS = ['silicon-light', 'profiler-dark', 'blueprint'] as const;

export type LearningTheme = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: LearningTheme = 'silicon-light';
export const THEME_STORAGE_KEY = 'starlight-theme';
export const LEGACY_THEME_ALIASES = {
  auto: 'silicon-light',
  light: 'silicon-light',
  dark: 'profiler-dark',
} as const satisfies Record<string, LearningTheme>;
export const STARLIGHT_THEME_BY_LEARNING_THEME = {
  'silicon-light': 'light',
  'profiler-dark': 'dark',
  blueprint: 'dark',
} as const satisfies Record<LearningTheme, 'light' | 'dark'>;

export const THEME_COPY = {
  'zh-CN': {
    controlLabel: '选择视觉主题',
    staticFallback: '当前使用硅光浅色（Silicon Light）静态默认。选择其他主题需要启用脚本并允许本站存储。',
    options: {
      'silicon-light': '硅光浅色',
      'profiler-dark': '分析器深色',
      blueprint: '蓝图',
    },
  },
  en: {
    controlLabel: 'Select visual theme',
    staticFallback: 'Silicon Light is the static default. Choosing another theme requires scripts and site storage.',
    options: {
      'silicon-light': 'Silicon Light',
      'profiler-dark': 'Profiler Dark',
      blueprint: 'Blueprint',
    },
  },
} as const satisfies Record<
  'zh-CN' | 'en',
  {
    controlLabel: string;
    staticFallback: string;
    options: Record<LearningTheme, string>;
  }
>;

export function parseStoredTheme(value: unknown): LearningTheme {
  if (typeof value === 'string' && Object.hasOwn(LEGACY_THEME_ALIASES, value)) {
    return LEGACY_THEME_ALIASES[value as keyof typeof LEGACY_THEME_ALIASES];
  }
  return THEME_IDS.includes(value as LearningTheme) ? (value as LearningTheme) : DEFAULT_THEME;
}

export function starlightThemeFor(theme: LearningTheme): 'light' | 'dark' {
  return STARLIGHT_THEME_BY_LEARNING_THEME[theme];
}
