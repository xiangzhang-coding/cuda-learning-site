// SPDX-License-Identifier: Apache-2.0
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
  output: 'static',
  outDir: './dist',
  trailingSlash: 'always',
  prerenderConflictBehavior: 'error',
  integrations: [
    starlight({
      title: {
        'zh-CN': 'CUDA 学习站',
        en: 'CUDA Learning Site',
      },
      defaultLocale: 'root',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
        en: { label: 'English', lang: 'en' },
      },
      prerender: true,
      pagefind: true,
      disable404Route: true,
      customCss: ['./src/styles/site.css'],
      components: {
        Banner: './src/components/ThemeFallbackBanner.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      sidebar: [
        {
          label: '从这里开始',
          translations: { en: 'Start Here' },
          items: [
            { slug: 'start/using-the-learning-site' },
            { slug: 'start/evidence-status' },
            { slug: 'start/environment-manifest' },
          ],
        },
        {
          label: '可运行示例',
          translations: { en: 'Runnable Examples' },
          items: [{ slug: 'examples/vector-addition' }],
        },
        {
          label: '可视化讲解',
          translations: { en: 'Visual Explainers' },
          items: [{ slug: 'visuals/kernel-journey' }, { slug: 'visuals/indexing' }],
        },
        { slug: 'practice' },
        { slug: 'glossary' },
        { slug: 'sources-and-versions' },
        { slug: 'about' },
      ],
    }),
  ],
});
