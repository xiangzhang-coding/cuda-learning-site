<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The current Stable Curriculum contains 49 Learning Units: O01-O08, F01-F08, M01-M19, A01-A09, and Q01-Q05. Exercises and reviewed solutions accompany O02-O08, F01-F08, M01-M19, A01-A09, and every Q unit. The public surface also contains sixteen Runnable Examples, EX01-EX16; six noncontiguous Labs, LAB01-LAB05 and LAB07; sixteen formal Visual Explainers, standalone VIS01-VIS12 plus embedded VIS19-VIS22; 50 Practice Bank entries; 151 Glossary terms; 61 source/version records; and About. These files form exactly 186 bilingual Publication Pairs and 372 source routes. Q13, L06, and LAB12 have no public destinations.

The strict graph adds `A08<-[A05,M03,M04,A02]`, `A09<-[A03,A04]`, `EX15<-A08`, and `VIS12<-A08` to the previously reviewed edges. LAB12 remains unpublished until Q13 and L06 are published. The validated catalog contains 6 Labs, 50 Practice Bank entries, 16 Visual Explainers, 151 Glossary terms, and 61 source/version records, or 284 records total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Publication and release review

R1 remains the latest completed aggregate release review and an immutable historical subset of the growing Learning Site. `src/r1-release-manifest.json` is preserved as the reviewed R1 contract; every static build emits it as `/release.json` with the exact 40-character source commit. The current incremental publication is recorded separately in `src/current-publication-manifest.json` and emitted as `/publication.json` with the same commit. That record describes the exact current artifact surface but is not a completed R2 review. The R2 aggregate review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

R1 declares no Reference Environment or Runtime-Verified subject. EX02 and LAB02 retain the qualifying Compile-Checked evidence from R1, and EX10 retains its later Compile-Checked records. Fifteen Runnable Examples, EX01-EX09 and EX11-EX16, plus all six Labs remain Pending Hardware Verification. EX10 is Runtime-Not-Applicable. EX15 has empty compilation evidence and no Compile-Checked claim. The current publication declares no performance observation or measured GEMM, sorting, selection, compaction, library-comparison, timing, or speedup result.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the authoritative R1 dynamic acceptance record. It binds R1 to its accepted `main` commit, successful GitHub checks, Cloudflare version and deployment IDs, verified Preview URL, and production smoke result. The incremental publication record does not rewrite that history.

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

[Issue #23](https://github.com/xiangzhang-coding/cuda-learning-site/issues/23) reviewed current and archived CUDA owner documentation plus the immutable CCCL v3.4.2 release, recorded in `SRC-CUDA-044` and `SRC-CUDA-045`. Context7 output is discovery and cross-checking only. The refresh records no measured GEMM, sorting, selection, compaction, library comparison, timing, or speedup.

The build is fully static. All sixteen Visual Explainers use deterministic browser-only models, preserve static or textual fallbacks, execute no CUDA, and grant no CUDA Evidence Status. VIS12's hierarchy panels are not emitted-instruction, runtime, or performance observations. Theme selection is the only learner preference retained across browser sessions.

## Deployment

Repository-pinned Wrangler deploys static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Deployment validation requires both the immutable R1 `/release.json` and exact current `/publication.json` to match their source manifests and the same checked-out commit. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation remains disabled, preserving one deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
