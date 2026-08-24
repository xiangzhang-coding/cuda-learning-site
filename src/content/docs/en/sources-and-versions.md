---
title: Sources and Version Record
description: Framework interfaces, content sources, and review dates for the Orientation release.
pairId: sources-and-versions
counterpart: /sources-and-versions/
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

<a class="locale-pair" data-locale-counterpart href="/sources-and-versions/" lang="zh-CN">阅读中文对应页</a>

This record names the exact publishing interfaces behind the current CUDA Learning Site shell and the owner sources used to verify their configuration. Tool versions here are not CUDA teaching facts.

## Scope of this record

This page covers the Home, O01, initial Glossary, and static publishing shell only. Every link below was reopened on **2026-08-24**. Builds use Node.js 24.19.0 and npm 11.17.0.

## Verified publishing interfaces

| Interface | Exact version | What was checked | Context7 | Owner sources |
| --- | --- | --- | --- | --- |
| Astro | 7.2.4 | `output: 'static'`, `site`, `outDir`, `trailingSlash`, `prerenderConflictBehavior`, and integrations | `/withastro/docs` | [npm manifest](https://registry.npmjs.org/astro/7.2.4), [configuration reference](https://docs.astro.build/en/reference/configuration-reference/) |
| Starlight | 0.41.7 | Root locale, localized title, direct counterpart switching, explicit sidebar, prerendering, and Pagefind | `/withastro/starlight` | [npm manifest](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7), [internationalization](https://starlight.astro.build/guides/i18n/#use-a-root-locale), [sidebar](https://starlight.astro.build/guides/sidebar/), [site search](https://starlight.astro.build/guides/site-search/) |
| Pagefind | 1.5.2 | Language-partitioned indexes selected from `<html lang>` and extended Chinese segmentation | `/websites/pagefind_app` | [npm manifest](https://registry.npmjs.org/pagefind/1.5.2), [multilingual search](https://pagefind.app/docs/multilingual/) |

Exact npm manifests govern package versions, engines, dependencies, and package licenses. Current owner documentation governs configuration semantics. Context7 supports interface discovery and cross-checking but does not override the target-version manifests.

## Content and asset sources

- The Home, O01, term definitions, and CSS silicon-routing texture are original project work under **CC BY 4.0** for prose and **Apache-2.0** for styles and tooling.
- This release contains no adapted diagram, copied sample code, external font, or third-party image.
- Language, theme, and search interface icons come from the installed Starlight 0.41.7 package and are not copied into project source. The upstream package declares the MIT license.
- Technical links support publishing-interface verification. Public prose summarizes and paraphrases; it does not mirror owner documentation.

## Review record

**Reviewed: 2026-08-24.** npm 11.17.0 resolved the exact Astro 7.2.4, Starlight 0.41.7, and Pagefind 1.5.2 dependency set without a peer-dependency conflict. The exact-version static build and bilingual indexes completed successfully. No interface conflict remains unresolved.
