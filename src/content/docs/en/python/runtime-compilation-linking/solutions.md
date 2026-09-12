---
title: 'P03 Solutions: Stage Identity and First-Failure Preservation'
description: Separate PTX compilation, cubin linking and lazy loading, then work through status-return and exception-based failures without fabricating logs.
pairId: p03-solutions
counterpart: /python/runtime-compilation-linking/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P03-SOLUTIONS
prerequisites: [P03-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Stable NVRTC binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvrtc.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Status-first compiler contract; static review'
    accessDate: '2026-09-12'
  - title: 'Stable nvJitLink binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvjitlink.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Exception and writable-output linker contract; static review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/python/runtime-compilation-linking/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-bindings-13.4.1 } }
---

<a class="locale-pair" data-locale-counterpart href="/python/runtime-compilation-linking/solutions/" lang="zh-CN">阅读中文对应页</a>

## Reviewed solutions

Attempt [P03-EXERCISES](/en/python/runtime-compilation-linking/exercises/) first; it is the sole direct prerequisite. All four evidence arrays remain empty. The status cases below are supplied scenarios, not captured compiler or linker output.

## Solution 1: The build stops at artifacts

| Stage | Repaired contract |
| --- | --- |
| Environment | Use the selected interpreter/Python packages and native-profile.json: five Toolkit deb packages plus pinned driver userspace. Check native-file ownership and identities, then real libcuda for core's cuDriverGetVersion query. No Toolkit version.json, Device or cuInit is required |
| Target | Read explicit `--arch 75`; derive `compute_75` and `sm_75` without device enumeration |
| Compile | Program with C++17, virtual target and relocatable device code; `compile("ptx")` yields PTX bytes |
| Link | `Linker(ptx, options=LinkerOptions(arch="sm_75"))`, require nvJitLink backend, then `link("cubin")` |
| Inspect | Retain nonempty artifact identities, source/options/target/backend, actual component records and stage logs; no execution |
| Later run only | Select/set device context, choose a supported device target, obtain Kernel by lazy lookup, submit typed launch and copies, sync and validate every result |

`Device(0).arch` is rejected because the no-GPU build needs no device-derived target. Virtual-target NVRTC compilation does not directly provide cubin; its cubin-size query is zero. There is no public `ObjectCode.load()`. Reconstructing from cubin bytes is optional and does not establish loading; `get_kernel` is the lazy load/lookup point and belongs outside this build.

For this deb profile, the two Toolkit-level package anchors are `cuda-compiler-13-3=13.3.1-1` and `cuda-command-line-tools-13-3=13.3.1-1`; component records are `cuda-nvrtc-13-3=13.3.33-1`, `libnvjitlink-13-3=13.3.33-1`, and `cuda-cuobjdump-13-3=13.3.73-1`. Missing/wrong installed records or ownership mismatches are real failures. Missing `version.json` is not: inventing it would hide an incorrect install-layout assumption without checking the actual packages. Preserve resolved NVRTC/nvJitLink patch filenames and binary hashes separately from API version pairs, without asserting an unobserved transitive-library identity. Driver userspace import and build success still require their own validation.

The current profile separately requires `cuda-compat-13-3=610.43.02-1ubuntu1`. Package-only checking can inspect its files without proving they can be loaded or queried. Similarly, a disk record for `nvrtcBuiltins` is not a loaded record: package-only checking creates no `nativeLibraries` object, and native validation initializes `nativeLibraries.nvrtcBuiltins` to null until the post-compilation mapping/identity check succeeds. Neither the paper table nor a passed package-only preflight supplies that observation.

Before importing CUDA, the CLI sets `CUDA_CACHE_DISABLE=1`; its ProgramOptions and LinkerOptions also specify `no_cache=True`. This excludes NVRTC's default-cache initialization path, which otherwise invokes `cuInit()` on first compilation. The source records `cachePolicy: "disabled"`; this is configuration evidence, not proof that compilation or later builtins-map inspection succeeded. The absence of Device construction alone would be an incomplete no-initialization argument.

Direct real-target `Program(...).compile("cubin")` is a different valid production path, not proof that an explicit Linker ran. EX21 intentionally retains PTX then nvJitLink. The linker must support its compiler inputs; the pinned native pair avoids a newer-compiler/older-linker mismatch, without promising arbitrary compatible inputs.

A hypothetical cache key must distinguish source bytes/content hash, compile options including language/target/RDC, compiler identity, link options/target, linker identity and backend. Retain artifact integrity and provenance, and recheck deployment compatibility. Changing the body while keeping `ex21_vector_add` changes the source identity, so a function-name-only key is unsafe. This is a design constraint, not an implemented cache or measured benefit.

EX21's acceptance includes GPU output. A no-GPU build mode does not change that subject to Runtime-Not-Applicable. Qualifying compilation evidence and qualifying runtime evidence are separate; no evidence is created by this paper plan.

## Solution 2: Two error contracts, one preservation rule

NVRTC creation is `nvrtc.nvrtcCreateProgram(src_bytes, name_bytes, 0, [], [])`, returning `(status, program)`. Compilation returns `(status,)`; size queries return `(status, size)`; extraction/destruction return one-item status tuples. Check every status before outputs. Do not assume a generic two-item unpack works even across all NVRTC functions.

nvJitLink creation is `nvjitlink.create(1, ["-arch=sm_75"])`, returning an integer handle. `version()` returns major/minor without a status; `add_data`, `complete`, output extraction and `destroy` return None on success. Native errors raise `nvjitlink.nvJitLinkError`. On success, query cubin size, allocate exact-size `bytearray`, extract, and convert to immutable bytes only after writing. Query/read error and info logs before destroying an acquired handle.

| Case | Primary diagnostic | Secondary and ownership rules |
| --- | --- | --- |
| A | `NVRTC_ERROR_COMPILATION` from compile | Record failed log-size retrieval separately; no trustworthy size/storage follows from that failure. Destroy the successfully acquired program once and check its status; do not continue to output extraction/linking |
| B | Exception from nvJitLink create | No returned handle exists. Do not query a handle log or call destroy. Retain supplied options and loader/exception details without inventing a log |
| C | Exception from complete | Read 17 bytes into `bytearray(17)` while handle is valid; decode and remove trailing NULs only. Attempt destroy once in finally; its failure is secondary and must not replace complete failure |

Seventeen is a supplied size, not a known message. Do not invent its contents or remove meaningful whitespace by a broad strip. If error reporting itself fails, add that diagnostic and keep the original exception. A missing library or Python `ValueError`/`TypeError` is not a native status tuple and may occur before any resource acquisition.

Core Program's successful `logs=` output and failed exception diagnostics are separate. The stream is written after successful compile; when compile raises, inspect the preserved exception type/message/log annotation, not an empty StringIO as an all-clear. Core's implementation error classes are private; the standalone CLI can report exceptions without importing them. Successful core Linker logs can be cached, but failed-link logs should be read before close rather than assuming later availability.

EX21 captures Python stderr and native FD 2 around explicit `cleanup_step` actions, including Program/Linker closure and code-reference release. Any nonempty captured stderr is retained in `cleanupWarnings` and prevents success; exceptions/capture failures are additional `cleanupErrors`, not replacements for the original failure. The 16,384-byte/character payload bounds apply per action, with truncation indicated; they do not cap spool disk use or observe delayed destruction. Later GC, native output flushed after the action and shutdown after the verdict remain outside that verdict. The paper cases above do not demonstrate actual native cleanup, and the helper is not a concurrency-safe general library facility.

## Valid alternatives

Separate small adapters for a status-return API and an exception API can normalize reporting after validating their actual contracts. Do not normalize away stage identity or ownership. Direct cubin compilation is reasonable where explicit linking is unnecessary, but then the build description and acceptance must say so. A compilation-only subject could be Runtime-Not-Applicable under its own acceptance criteria; EX21 is not that subject.

## Common errors

- Equating nonempty cubin bytes with a loaded library, found symbol, completed kernel, or correct vector.
- Reusing stale code after compilation failure merely because a function-name cache entry exists.
- Interpreting nvJitLink's major version as a success status or its integer handle as a tuple.
- Writing into immutable bytes, querying logs after destroy, or cleaning up an unacquired handle.
- Letting a finally exception erase the first compiler/linker error.
- Printing fictional diagnostic text or granting evidence from a paper failure scenario.

Return to [P03](/en/python/runtime-compilation-linking/) and [EX21](/en/examples/cuda-python-launch/). Sources: [SRC-CUDA-077](/en/sources-and-versions/#src-cuda-077), [SRC-CUDA-078](/en/sources-and-versions/#src-cuda-078), and [SRC-CUDA-079](/en/sources-and-versions/#src-cuda-079), checked **2026-09-12**.
