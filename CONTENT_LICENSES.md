<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/r1-release-manifest.json`, `src/r2-release-manifest.json`, `src/r3-release-manifest.json`, `src/current-publication-manifest.json`, `src/components/`, `src/resource-indexes/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`, including generation and validation of both `release.json` and `publication.json`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original source, build files, host models, artifact-inspection tooling, and tests for the sixteen Runnable Examples EX01-EX16 under `examples/`
- original reviewed-solution software under `public/assets/exercise-solutions/`, currently `q11-lab10-transpose-candidates.cu`, `lab10-report-reducer.mjs`, `q12-reduction-candidates.cu`, and `q13-gemm-candidates.cu`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments. JSON files use an `SPDX-License-Identifier` member.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual teaching compositions are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). The R3 scope includes 62 Learning Units, O01-O08/F01-F08/M01-M19/A01-A14/Q01-Q13; 61 Exercise-set and 61 solution-set Publication Pairs; 16 Runnable Example publication pages, EX01-EX16; 10 Labs, LAB01-LAB10; all 66 Practice Bank entries, including 10 Nsight report-analysis entries; all 176 Glossary terms; all 76 source/version records; and 19 formal Visual Explainers, standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22. The five catalog groups total 347 records, and public source contains exactly 232 bilingual Publication Pairs and 464 source routes. Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

The current file-level license scope follows `src/current-publication-manifest.json` and its `/publication.json` output. R3 is the latest completed aggregate release review: immutable `src/r3-release-manifest.json` and `/release.json` retain 62 Learning Units, 16 Runnable Examples, 10 Labs, 19 Visual Explainers, 66 Practice Bank entries including 10 Nsight report-analysis entries, 176 Glossary terms, 76 source records, 347 catalog records, 232 Publication Pairs, and 464 source routes. [Issue #32](https://github.com/xiangzhang-coding/cuda-learning-site/issues/32) owns dynamic R3 acceptance. R1 and R2 remain immutable history in `src/r1-release-manifest.json` and `src/r2-release-manifest.json`; R4 aggregate review remains pending.

## Adaptations

No adapted content or assets are included in the current publication. It contains no copied, traced, or adapted NVIDIA sample, figure, table, diagram, prose, source listing, external font, third-party image, owner asset, or private material. EX01-EX16 are original code rather than reconstructions of NVIDIA samples.

The issue #23 A08-A09, EX15, VIS12, PB-R2-020/021, TERM-147 through TERM-151, and `SRC-CUDA-044/045` additions are original. EX15 is an original Apache-2.0 C++17 project with empty compilation evidence, Pending Hardware Verification runtime, and no recorded observations. VIS12's controls, hierarchy model, and static fallback are an original teaching composition. These additions publish no observed runtime or measured performance result.

The issue #25 Q06-Q08, LAB06/LAB08, VIS14, PB-R3-001 through PB-R3-003, TERM-152 through TERM-159, and `SRC-CUDA-046` through `SRC-CUDA-049` additions are also original. The profiler fixture policy is original Apache-2.0 tooling, while the two sanitized expected-only JSON fixtures are original CC BY 4.0 project-authored plans. They are not `nsys` or `ncu` captures and publish no runtime, timeline, metric, bottleneck, or speedup result. LAB06 and LAB08 have empty compilation and recorded-observation arrays and remain Pending Hardware Verification.

The issue #26 A14, Q09-Q10, LAB09, VIS13, PB-R3-004 through PB-R3-006, TERM-160 through TERM-165, and `SRC-CUDA-050` through `SRC-CUDA-052` additions are original. LAB09 has empty compilation and recorded-observation arrays, remains Pending Hardware Verification, and declares no Reference Environment or `performanceObservations`. VIS13's model, values, SVG, static chart, copy, and interaction are original; browser state is not GPU evidence.

The issue #27 Q11, LAB10, PB-R3-007/008, and `SRC-CUDA-053/054` additions are original CC BY 4.0 teaching content. Q11 and LAB10 reuse the original immutable EX14 source and original VIS11 teaching composition without changing, adapting, or newly runtime-verifying either one. The original LAB10 expected-only JSON fixture has an adjacent sidecar recording `CC-BY-4.0`, `provenance: original`, and project attribution. It is not captured profiler output and contains no environment values, timing, metric, speedup, bottleneck, winner, or other performance evidence.

Issue #27 also includes two original Apache-2.0 reviewed-solution software assets: `public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu` at SHA-256 `920a4ca6f44586a3882e31756fca3e28feb655282327721e3fb3a308bac3f251`, and `public/assets/exercise-solutions/lab10-report-reducer.mjs` at SHA-256 `7754a9b63369ea00d994c5f43627796a87f57607e869e10e5a5cd238c51056cb`. The first is one reviewed answer after the learner attempt, not a second canonical EX14; its three pinned Toolkit Lane gate is compile/link/static-inspection only and never executes the binary. The second is exercised only against synthetic/static test records. Neither asset creates a seventeenth Runnable Example, records a GPU or profiler observation, or grants Compile-Checked, runtime, or other Evidence Status.

Issue #28 Q12, its Exercises and solutions, PB-R3-009/010, and `SRC-CUDA-055` are original CC BY 4.0 teaching content. Q12 reuses immutable original EX11 and original VIS10 without adapting either. The original Q12 expected-only JSON fixture has an adjacent sidecar recording `CC-BY-4.0`, `provenance: original`, and project attribution. It contains no environment values, numerical output, timing, metric, speedup, bottleneck, winner, CUB comparison, or other performance evidence. The original Apache-2.0 reviewed solution `public/assets/exercise-solutions/q12-reduction-candidates.cu` is fixed at SHA-256 `a7dde4a836c44b296d62a92e7131f43f568857ff8bb910a8edad6d28a821c106`; its three-Lane gate only compiles, links, and statically inspects without execution. It is not a second canonical EX11, a new Runnable Example, or an Evidence Status subject.

Issue #29 Q13, its Exercises and solutions, PB-R3-011/012, and `SRC-CUDA-056` are original CC BY 4.0 teaching content. Q13 reuses immutable original EX15 and original VIS12 without adapting either. The original Q13 expected-only JSON fixture has an adjacent sidecar recording `CC-BY-4.0`, `provenance: original`, and project attribution. It contains no environment values, numerical output, compiled register count, occupancy, traffic, timing, metric, speedup, winner, cuBLAS comparison, Tensor Core result, or other performance evidence. The original Apache-2.0 reviewed solution `public/assets/exercise-solutions/q13-gemm-candidates.cu` is fixed at SHA-256 `00a809be2e2224022f4dce544fd84cba7144a97918a2c0b2a17768054514ecc7`; its three-Lane gate only compiles, links, and statically inspects without execution. It is not a second canonical EX15, a new Runnable Example, or an Evidence Status subject.

Issue #30 A10/A11, their Exercises and solutions, VIS18, PB-R3-013/014, TERM-166 through TERM-170, and `SRC-CUDA-057/058` are original CC BY 4.0 teaching content and rendered teaching compositions. VIS18's component, pure model, copy data, CSS, and tests are original Apache-2.0 software; the rendered inline SVG and static ledger are original CC BY 4.0 instructional compositions, not copied, traced, or adapted paper figures. The papers and NVIDIA owner documents are cited and paraphrased only. No CUDA, actual traffic, backend, dtype, timing, speedup, or other performance evidence is published.

Issue #31 A12/A13, their Exercises and solutions, PB-R3-015/016, TERM-171 through TERM-176, and `SRC-CUDA-059/060` are original CC BY 4.0 teaching content. `SparseMatrixFixture.astro`, its CSS, and focused tests are original Apache-2.0 software; rendered matrix, storage, SpMV, SpMM, and lifecycle compositions are original CC BY 4.0 instructional material, not copied, traced, or adapted owner diagrams or tables. NVIDIA owner documents are cited and paraphrased only. No CUDA/cuSPARSE execution, workspace or preprocessing result, determinism or structured-sparsity observation, actual traffic, timing, speedup, or other performance evidence is published.

VIS01-VIS14 and VIS18 use standalone pages; VIS19-VIS22 keep static or textual fallbacks inside their Learning Units. Every formal Visual Explainer is deterministic, browser-only, preserves a fallback, and grants no CUDA Evidence Status. Component and pure-model implementations, example software, styles, and tests are original Apache-2.0 software; instructional prose and rendered teaching compositions are CC BY 4.0.

Except for Apache-2.0 source files under `public/assets/exercise-solutions/`, which carry inline SPDX identifiers and are covered by the software scope above, original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
