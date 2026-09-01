<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The current rolling Stable Curriculum publication contains 55 Learning Units: O01-O08, F01-F08, M01-M19, A01-A09/A14, and Q01-Q10. Exercises and reviewed solutions accompany O02-O08, F01-F08, M01-M19, A01-A09/A14, and every Q unit. The public surface also contains sixteen Runnable Examples, EX01-EX16; nine Labs, LAB01-LAB09; eighteen formal Visual Explainers, standalone VIS01-VIS14 plus embedded VIS19-VIS22; 56 Practice Bank entries; 165 Glossary terms; 68 source/version records; and About. These files form exactly 209 bilingual Publication Pairs and 418 source routes. Future Q11/LAB10 and Q13/L06/LAB12 remain unpublished.

The issue #26 graph adds `A14<-[A01,A02,A05,A08]`, `Q09<-[Q08,F08]`, `Q10<-[Q05,A14]`, `LAB09<-[Q10]`, and `VIS13<-[Q10]`. The validated current catalog contains 9 Labs, 56 Practice Bank entries, 18 Visual Explainers, 165 Glossary terms, and 68 source/version records, or 316 records total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Publication and release review

R2 is the latest completed aggregate release review. `src/r2-release-manifest.json` is the immutable reviewed R2 contract: 49 Learning Units, 16 Runnable Examples, 6 Labs, 16 Visual Explainers, 50 Practice Bank entries, 151 Glossary terms, 61 source records, 284 catalog records, 186 Publication Pairs, and 372 source routes. Every static build emits that snapshot as `/release.json`; `src/r1-release-manifest.json` remains immutable historical metadata. The rolling `src/current-publication-manifest.json` independently describes the issue #26 incremental surface above and is emitted as `/publication.json`. R3 aggregate review remains pending. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) remains the dynamic R2 acceptance record; [issue #26](https://github.com/xiangzhang-coding/cuda-learning-site/issues/26) records the current incremental publication without changing completed R2.

R2 declares no Reference Environment or Runtime-Verified subject. EX02, EX10, and LAB02 retain the only qualifying Compile-Checked evidence. Fifteen Runnable Examples, EX01-EX09 and EX11-EX16, plus all six Labs remain Pending Hardware Verification. EX10 is Runtime-Not-Applicable. EX11-EX15 have empty compilation evidence and no Compile-Checked claim. R2 declares no sanitizer, profiler, numerical-output, performance, overlap, migration, contention, timing, or speedup observation.

The issue #25 additions are original project work: Q06-Q08, LAB06/LAB08, VIS14, PB-R3-001 through PB-R3-003, TERM-152 through TERM-159, `SRC-CUDA-046` through `SRC-CUDA-049`, the profiler fixture policy, and the two expected-only sanitized JSON fixtures. Those fixtures are project-authored plans, not `nsys` or `ncu` captures, and publish no runtime, timeline, metric, bottleneck, or speedup result. LAB06 and LAB08 have empty compilation and recorded-observation arrays and remain Pending Hardware Verification.

The issue #26 additions are also original project work: A14, Q09-Q10, LAB09, VIS13, PB-R3-004 through PB-R3-006, TERM-160 through TERM-165, and `SRC-CUDA-050` through `SRC-CUDA-052`. LAB09 has empty compilation and recorded-observation arrays and remains Pending Hardware Verification; no Reference Environment or `performanceObservations` is declared. VIS13 browser values and its static chart execute no CUDA, query no GPU, and are not measured GPU evidence.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the authoritative R1 dynamic acceptance record. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) owns the equivalent R2 coordinates and is updated only after the required checks, Preview, production deployment, and remote smoke runs exist. Source metadata does not pre-certify those dynamic results.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

Host-only tests are available without CUDA for the fifteen current Runnable Examples whose runtime remains Pending Hardware Verification:

```sh
make -C examples/ex01-environment-report host-test
make -C examples/ex02-vector-addition host-test
make -C examples/ex03-multidimensional-indexing host-test
make -C examples/ex04-error-handling-lifecycle host-test
make -C examples/ex05-coalesced-strided-access host-test
make -C examples/ex06-shared-memory-tile-bank-padding host-test
make -C examples/ex07-streams-events-overlap host-test
make -C examples/ex08-unified-memory-migration host-test
make -C examples/ex09-graph-capture host-test
make -C examples/ex11-multi-stage-reduction host-test
make -C examples/ex12-inclusive-exclusive-scan host-test
make -C examples/ex13-privatized-histogram host-test
make -C examples/ex14-tiled-transpose host-test
make -C examples/ex15-tiled-gemm host-test
make -C examples/ex16-sanitizer-defect-suite host-test
```

EX11 checks its double CPU reference and tolerance contract, EX12 checks exact prefix recurrences and totals, EX13 checks exact bins, EX14 checks rectangular transpose mapping, and EX15 checks its hand GEMM oracle, double reference, finite abs-plus-rel tolerance, and mismatch reporting. They execute no CUDA and grant no Compile-Checked or runtime Evidence Status.

EX10 is different: its CUDA compile job generates preprocessing output, PTX, cubin, fatbinary, relocatable objects, a device-link object, and a final host-link artifact for inspection only. The final artifact is never executed, so runtime remains Runtime-Not-Applicable. Five ordinary Lane/dialect records from [run 33275734951](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/33275734951) are Compile-Checked at source commit `904c6da03800ed3012baacb861494377c0fa01f2`. The separate CUDA 13.3.1/NVCC 13.3.73/GCC 14.2.0 C++23 probe passed only as a narrow `C++23-Dialect-Probe`; it does not declare ordinary EX10 C++23 support, another compiler or platform, runtime, or performance.

The independent `CUDA Compile Evidence` workflow retains qualifying Compile-Checked evidence for EX02, EX10, and LAB02. Other CUDA matrix jobs remain build gates whose short-lived artifacts are not qualifying retained evidence. The retained EX10 C++23 probe is separate from its five ordinary Compile-Checked records. No CUDA binary, Compute Sanitizer tool, or profiler execution is inferred from a successful web, host-only, or compile-gate job.

[Issues #19-#25](https://github.com/xiangzhang-coding/cuda-learning-site/issues/19) retain the prior owner-source review. Issue #26 adds `SRC-CUDA-050` through `SRC-CUDA-052` for exact-GPU occupancy/stall/throughput facts, arithmetic-intensity and original Roofline boundaries, and LAB09/VIS13 measured-evidence separation across the 11.8/12.9/13.3 component lanes. Context7 retrieval was used only for discovery and cross-checking; exact owner documents and the 2009 DOI govern, and neither retrieval nor source review creates runtime or performance evidence.

The build is fully static. All eighteen Visual Explainers use deterministic browser-only models, preserve static or textual fallbacks, execute no CUDA, and grant no CUDA Evidence Status. VIS13's browser values and static chart are synthetic teaching state, not GPU evidence. Theme selection is the only learner preference retained across browser sessions.

## Deployment

Repository-pinned Wrangler deploys static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Deployment validation requires both the R2 `/release.json` and exact current `/publication.json` to match their source manifests and the same checked-out commit. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation remains disabled, preserving one deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
