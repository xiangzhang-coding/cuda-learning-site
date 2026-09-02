<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The current rolling Stable Curriculum publication contains 58 Learning Units: O01-O08, F01-F08, M01-M19, A01-A09/A14, and Q01-Q13. Exercises and reviewed solutions accompany O02-O08, F01-F08, M01-M19, A01-A09/A14, and every Q unit. The public surface also contains sixteen Runnable Examples, EX01-EX16; ten Labs, LAB01-LAB10; eighteen formal Visual Explainers, standalone VIS01-VIS14 plus embedded VIS19-VIS22; 62 Practice Bank entries; 165 Glossary terms; 72 source/version records; and About. These files form exactly 219 bilingual Publication Pairs and 438 source routes. L03 and LAB11 remain unpublished; L06 and LAB12 also remain unpublished, and LAB12 waits for L06 after Q13 publication.

The issue #29 graph adds [Q13](https://cuda-learning-site.hmzhangxiang.workers.dev/en/correctness/gemm-optimization-case-study/)`<-[A08,Q06,Q08,Q10]`, beginning from EX15 and reusing VIS12. The validated current catalog contains 10 Labs, 62 Practice Bank entries, 18 Visual Explainers, 165 Glossary terms, and 72 source/version records, or 327 records total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Publication and release review

R2 is the latest completed aggregate release review. `src/r2-release-manifest.json` is the immutable reviewed R2 contract: 49 Learning Units, 16 Runnable Examples, 6 Labs, 16 Visual Explainers, 50 Practice Bank entries, 151 Glossary terms, 61 source records, 284 catalog records, 186 Publication Pairs, and 372 source routes. Every static build emits that snapshot as `/release.json`; `src/r1-release-manifest.json` remains immutable historical metadata. The rolling `src/current-publication-manifest.json` independently describes the issue #29 incremental surface above and is emitted as `/publication.json`. R3 aggregate review remains pending. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) remains the dynamic R2 acceptance record; [issue #29](https://github.com/xiangzhang-coding/cuda-learning-site/issues/29) records the current incremental publication without changing completed R2.

R2 declares no Reference Environment or Runtime-Verified subject. EX02, EX10, and LAB02 retain the only qualifying Compile-Checked evidence. Fifteen Runnable Examples, EX01-EX09 and EX11-EX16, plus all six Labs remain Pending Hardware Verification. EX10 is Runtime-Not-Applicable. EX11-EX15 have empty compilation evidence and no Compile-Checked claim. R2 declares no sanitizer, profiler, numerical-output, performance, overlap, migration, contention, timing, or speedup observation.

The issue #25 additions are original project work: Q06-Q08, LAB06/LAB08, VIS14, PB-R3-001 through PB-R3-003, TERM-152 through TERM-159, `SRC-CUDA-046` through `SRC-CUDA-049`, the profiler fixture policy, and the two expected-only sanitized JSON fixtures. Those fixtures are project-authored plans, not `nsys` or `ncu` captures, and publish no runtime, timeline, metric, bottleneck, or speedup result. LAB06 and LAB08 have empty compilation and recorded-observation arrays and remain Pending Hardware Verification.

The issue #26 additions are also original project work: A14, Q09-Q10, LAB09, VIS13, PB-R3-004 through PB-R3-006, TERM-160 through TERM-165, and `SRC-CUDA-050` through `SRC-CUDA-052`. LAB09 has empty compilation and recorded-observation arrays and remains Pending Hardware Verification; no Reference Environment or `performanceObservations` is declared. VIS13 browser values and its static chart execute no CUDA, query no GPU, and are not measured GPU evidence.

The issue #27 additions are original project work: Q11, LAB10, PB-R3-007/008, `SRC-CUDA-053/054`, the CC BY 4.0 LAB10 expected-only fixture with its provenance sidecar, and two Apache-2.0 reviewed-solution software assets. The complete runner is `public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu` at SHA-256 `920a4ca6f44586a3882e31756fca3e28feb655282327721e3fb3a308bac3f251`; the report reducer is `public/assets/exercise-solutions/lab10-report-reducer.mjs` at SHA-256 `7754a9b63369ea00d994c5f43627796a87f57607e869e10e5a5cd238c51056cb`. The runner's three pinned Toolkit Lane gate compiles, links, and statically inspects it without execution; reducer tests use synthetic files and static contracts only. Neither asset is a new Runnable Example or grants compilation/runtime Evidence Status. Q11 starts from immutable EX14 and reuses evidence-neutral VIS11; EX14 source did not change and received no new runtime evidence. As a Learning Unit, Q11 has empty compilation, runtime, expected-observation, and recorded-observation arrays; it grants no Evidence Status and only summarizes linked subjects. EX14 and LAB10 have empty compilation and recorded observations and remain Pending Hardware Verification. LAB10 declares a 4096x4096 `float` workload, a conservative 134,221,952-byte bound, one excluded warm-up, explicit synchronization, ten retained attempts, and exact-hash static reduction to count=10 median/min/max plus a report/CSV hash chain. Its host analysis runtime is exactly Node.js 24.19.0 with required `node --version` output `v24.19.0`; selected CUDA images do not imply Node.js availability, and passing the Node.js/reducer gate grants no CUDA evidence. No captured report, ledger value, timing, metric, speedup, bottleneck, or winner is published.

The issue #28 additions are original project work: Q12, its Exercises and reviewed solutions, PB-R3-009/010, `SRC-CUDA-055`, the CC BY 4.0 Q12 expected-only fixture with its provenance sidecar, and `public/assets/exercise-solutions/q12-reduction-candidates.cu` at SHA-256 `a7dde4a836c44b296d62a92e7131f43f568857ff8bb910a8edad6d28a821c106`. The three pinned Toolkit Lane gate compiles, links, and statically inspects the runner without execution. It is not a new Runnable Example and grants no Evidence Status. Q12 starts from immutable EX11, retains its double CPU reference and tolerance, and reuses evidence-neutral VIS10. Q12 has all four evidence arrays empty; linked EX11 remains Pending Hardware Verification. The fixture declares workload, warm-up, synchronization, ten-attempt median/min/max, profiler permission and report custody, complete unfilled Environment Manifest fields, expected correctness, and bounded interpretations, but no captured report, numerical result, timing, metric, traffic, speedup, bottleneck, winner, CUB comparison, or runtime result. L03 and LAB11 remain unpublished.

The issue #29 additions are original project work: Q13, its Exercises and reviewed solutions, PB-R3-011/012, `SRC-CUDA-056`, the CC BY 4.0 Q13 expected-only fixture with its provenance sidecar, and `public/assets/exercise-solutions/q13-gemm-candidates.cu` at SHA-256 `00a809be2e2224022f4dce544fd84cba7144a97918a2c0b2a17768054514ecc7`. The three pinned Toolkit Lane gate compiles, links, and statically inspects the runner without execution. It is not a new Runnable Example and grants no Evidence Status. Q13 starts from immutable EX15, retains its FP32 device/double CPU reference and tolerance contract, and reuses evidence-neutral VIS12. Q13 has all four evidence arrays empty; linked EX15 remains Pending Hardware Verification. The fixture declares matrix shape, precision, compute capability, C restoration, warm-up, synchronization, ten-attempt median/min/max, compiler/resource and profiler custody, complete unfilled Environment Manifest fields, expected correctness, and bounded interpretations, but no captured report, numerical result, register count, occupancy, traffic, timing, metric, speedup, winner, cuBLAS comparison, Tensor Core result, or runtime result. L06 and LAB12 remain unpublished; the educational kernel is not a production replacement.

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

[Issues #19-#28](https://github.com/xiangzhang-coding/cuda-learning-site/issues/19) retain the prior owner-source review. Issue #29 adds `SRC-CUDA-056` for controlled GEMM tile/reuse, precision, compiler/resource, occupancy, traffic, profiler, and expected-only evidence boundaries. Context7 retrieval was used only for discovery and cross-checking; exact owner documents govern, and neither retrieval nor source review creates runtime or performance evidence.

The build is fully static. All eighteen Visual Explainers use deterministic browser-only models, preserve static or textual fallbacks, execute no CUDA, and grant no CUDA Evidence Status. VIS13's browser values and static chart are synthetic teaching state, not GPU evidence. Theme selection is the only learner preference retained across browser sessions.

## Deployment

Repository-pinned Wrangler deploys static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Deployment validation requires both the R2 `/release.json` and exact current `/publication.json` to match their source manifests and the same checked-out commit. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation remains disabled, preserving one deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
