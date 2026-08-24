# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

This branch contains the Orientation shell: Home, O01, the initial Glossary, the Sources and Version Record, and About. Navigation exposes no unfinished learning material.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm install
npx playwright install chromium firefox webkit
npm run check
npm run build
npm run test
```

The build is fully static. The website has no server application, account, progress tracking, API, hosted GPU service, or in-browser CUDA execution.

## Licensing

Software and tooling files use Apache-2.0. Original learning content uses CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for file-level scope and dependency notices.
