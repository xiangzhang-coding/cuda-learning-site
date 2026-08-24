---
title: 来源与版本记录
description: 本次 Orientation 发布使用的框架接口、内容来源和复核日期。
pairId: sources-and-versions
counterpart: /en/sources-and-versions/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - scope
  - verified-interfaces
  - content-sources
  - review-record
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: sources-and-versions
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'scope,verified-interfaces,content-sources,review-record'
---

<a class="locale-pair" data-locale-counterpart href="/en/sources-and-versions/" lang="en">Read the English counterpart</a>

这份记录说明 CUDA 学习站（Learning Site）当前静态外壳使用了哪些精确版本，以及哪些上游资料支撑了配置。它不把工具版本当作 CUDA 教学事实。

## 记录范围

本页只覆盖 Home、O01、首批术语表（Glossary）和静态发布外壳。所有链接在 **2026-08-24** 重新打开复核；构建使用 Node.js 24.19.0 与 npm 11.17.0。

## 已核对的发布接口

| 接口 | 精确版本 | 核对内容 | Context7 | 上游资料 |
| --- | --- | --- | --- | --- |
| Astro | 7.2.4 | `output: 'static'`、`site`、`outDir`、`trailingSlash`、`prerenderConflictBehavior`、集成配置 | `/withastro/docs` | [npm 清单](https://registry.npmjs.org/astro/7.2.4)、[配置参考](https://docs.astro.build/en/reference/configuration-reference/) |
| Starlight | 0.41.7 | 根语言、本地化标题、对应页切换、显式侧边栏、预渲染、Pagefind | `/withastro/starlight` | [npm 清单](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7)、[国际化](https://starlight.astro.build/guides/i18n/#use-a-root-locale)、[侧边栏](https://starlight.astro.build/guides/sidebar/)、[站内搜索](https://starlight.astro.build/guides/site-search/) |
| Pagefind | 1.5.2 | 根据 `<html lang>` 生成语言分区索引，以及扩展版中文分词 | `/websites/pagefind_app` | [npm 清单](https://registry.npmjs.org/pagefind/1.5.2)、[多语言搜索](https://pagefind.app/docs/multilingual/) |

精确 npm 清单负责版本、引擎、依赖和许可信息；当前上游文档负责配置语义。Context7 用于发现和交叉核对接口，不覆盖目标版本清单。

## 内容与素材来源

- Home、O01、术语定义和 CSS 硅片布线纹理由项目原创，采用 **CC BY 4.0**（文字）或 **Apache-2.0**（样式与工具代码）。
- 本次发布没有改编图表、复制示例代码、外部字体或第三方图片。
- 语言、主题、搜索等界面图标来自已安装的 Starlight 0.41.7 包，没有复制为项目素材；其上游包声明 MIT 许可。
- 所有技术链接只用于核对发布接口；公开文字为摘要和改写，不镜像上游正文。

## 复核记录

**复核日期：2026-08-24。** Astro 7.2.4、Starlight 0.41.7 与 Pagefind 1.5.2 的精确依赖组合已由 npm 11.17.0 解析，未出现 peer dependency 冲突，精确版本静态构建和双语索引均成功。当前没有未解决的接口冲突。
