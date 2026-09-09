---
title: 'L12 Solutions: Storage Proofs and Completion Edges'
description: Review exact real and complex layout arithmetic, independent DFT values, workspace capacity decisions, and version-scoped callback exclusions.
pairId: l12-solutions
counterpart: /libraries/cufft-plans-layouts-startup/solutions/
factCheckDate: '2026-09-08'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L12-SOLUTIONS
prerequisites: [L12-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'cuFFT storage and plan contract'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cufft/index.html'
    version: 'Toolkit 12.9.2 archive; cuFFT 11.4.1.4'
    platform: 'Static reasoning, not CUDA execution'
    accessDate: '2026-09-08'
  - title: 'cuFFT 13.3 Update 1 known issue'
    url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html#cufft-release-13-3-update-1'
    version: 'Live 13.3 Update 1; cuFFT 12.3.0.29'
    platform: 'Real-side LTO callback exclusion, not a reproduced failure'
    accessDate: '2026-09-08'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l12-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/libraries/cufft-plans-layouts-startup/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-08' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L12-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
---

<a class="locale-pair" data-locale-counterpart href="/libraries/cufft-plans-layouts-startup/solutions/" lang="zh-CN">阅读中文对应页</a>

## Reviewed solutions

Attempt the [Exercises](/en/libraries/cufft-plans-layouts-startup/exercises/) first. The numbers below are exact paper derivations or stipulated workspace sizes. They are not cuFFT query results, execution logs, or performance observations. All evidence arrays remain empty.

## Solution 1: One allocation, two element types

`K=floor(10/2)+1=6`, so each batch needs `2*K=12` real slots. Three batches need `3*12=36` floats and `36*4=144` bytes. Logical N stays 10, not 12. Embeddings express the real physical row of 12 and the complex row of 6; element strides stay 1.

| Direction | Input distance | Output distance | Allocated floats | Bytes |
| --- | --- | --- | --- | --- |
| `R2C` | 12 | 6 | 36 | 144 |
| `C2R` | 6 | 12 | 36 | 144 |

Real starts `0,12,24` times 4 bytes and complex starts `0,6,12` times 8 bytes both yield `0,48,96`. Slots 10 and 11 of each real row are storage padding. Multiplying K by 4 instead of 8 would underallocate the spectrum.

The stored bins are k=0 through 5. For real input, omitted k=6..9 follow conjugate symmetry; DC k=0 and Nyquist k=5 have zero imaginary part. C2R requires that contract, not arbitrary six complex numbers. A round trip gives ten times each original sample: scale by `1/10` once. Scaling by 1/12 or 1/30 is incorrect.

C2R may overwrite its spectrum, including out-of-place C2R. If another consumer needs it, copy it before inverse or reconstruct it later; establish completion and keep the saved allocation alive. Moving the base pointer for a subarray also requires rechecking complex-type alignment.

## Solution 2: Different offsets do not change the DFT

| Batch | Input offsets | Output offsets |
| --- | --- | --- |
| 0 | `0,2,4,6` | `0,3,6,9` |
| 1 | `11,13,15,17` | `16,19,22,25` |

The minimum touched extents are `1+11+3*2=18` and `1+16+3*3=26` complex elements. The stipulated allocations are larger: `22*8=176` input bytes and `32*8=256` output bytes. They are separate allocations, totaling 432 bytes before scratch and library resources. The disjoint offsets establish batch separation here; allocation capacity alone would not.

The forward roots are `[1,-i,-1,i]`. For `[1,2,3,4]`, DC is 10; bin 1 is `1-2i-3+4i=-2+2i`; bin 2 is `1-2+3-4=-2`; bin 3 is its conjugate. Thus the forward spectrum is `[10,-2+2i,-2,-2-2i]`. The impulse batch produces `[1,-i,-1,i]`. Their unnormalized inverses are `[4,8,12,16]` and `[0,4,0,0]`. Multiplication by `1/4` restores each input. These exact values are an independent oracle, not output observed from EX19.

Null embeddings would discard the advanced stride interpretation. Swapping the device pointers is also wrong: the existing plan would still read stride 2/distance 11 from data written at stride 3/distance 16. After completion, extract the logical spectrum and repack it into the prescribed input layout before inverse. EX19 follows that policy for its own, different literal fixtures. Keep sign, input preservation, and output validation explicit even if a round trip passes.

## Solution 3: Capacity follows overlap

Concurrent exclusive workspaces require `4096+6144=10240` bytes, exceeding the 8192-byte budget. Reject that concurrent design. Explicitly serialized executions can share a sufficiently aligned `max(4096,6144)=6144` byte allocation, which fits. Neither result proves actual allocation success or a zero internal-memory footprint.

Create each plan on its intended device/context, disable automatic allocation before making it, check the final size query, allocate enough storage, and attach it. For serialization, the edge is A's last workspace use **completes before** B's first use. A host wait or a correctly recorded event plus a wait in B's stream can establish the edge. Submission order across unrelated streams cannot. Keep separate writable I/O, and do not mutate shared plan state concurrently.

On partial initialization failure, release only acquired resources. After partial submission, drain the associated stream before releasing transfer buffers, workspaces, plans, or the stream itself; check completion errors and attempt the remaining cleanup without replacing the original failure with a success verdict. Future valid buffers do not repair an already failed execution.

| Separate ledger | Required future record | Observation now |
| --- | --- | --- |
| Host planning | Host clock; initialization, allocation and plan boundaries | Unfilled |
| Cache state | Driver/package identity, cache controls, capacity and cold-state method | Unfilled |
| First execution | Completion boundary, transfers and input restoration | Unfilled |
| Warm transforms | Explicit warmup, device events on the correct stream, repetitions and raw results | Unfilled |

A fresh process may reuse the persistent driver cache. Record driver package, Toolkit, full cuFFT package, loaded library path/hash, GPU, OS/compiler, and cache controls in an Environment Manifest. `cufftGetProperty` exposes only loaded major/minor/patch; do not append the header build number and call the result observed. First-use and warm measurements remain Pending Hardware Verification where runtime applies.

For FP32 real-side LTO callbacks, `17554=2*67*131` is even, exceeds 8192, and has largest prime factor 131, so it meets the unresolved 13.3 Update 1 conjunction and must be excluded. `8192=2^13` meets the length threshold but not the largest-prime-factor condition. It is outside this particular warning, **not thereby validated or universally supported**. EX19 uses C2C without callbacks and tests neither case. The FP64 warning uses a 4096 threshold with the same even-length/prime-factor conditions.

## Valid alternatives

A second C2C inverse plan can read stride 3/distance 16 and write stride 2/distance 11, provided its embeddings, capacities and lifetimes are re-proved. That avoids host repacking but adds a plan and potentially workspace; no performance benefit follows without measurement. Separate workspaces are valid if an explicitly revised budget permits them. An out-of-place real layout is another design, not a reason to retain the in-place distance table unchanged.

## Common errors

- Treating real padding as signal zero-padding changes the mathematical problem.
- Measuring distances in bytes or using the same numeric distance on both real and complex sides moves batch boundaries.
- Validating only DC, one batch, or a round trip misses sign and layout mistakes.
- Sharing a workspace after host submission, but before device completion, creates an ownership conflict.
- Calling 13.3.1 a fix for every callback issue ignores its explicit known-issue section.

Return to [L12](/en/libraries/cufft-plans-layouts-startup/) and [EX19](/en/examples/cufft-batched-transform/). Source basis: [SRC-CUDA-073](/en/sources-and-versions/#src-cuda-073), [SRC-CUDA-074](/en/sources-and-versions/#src-cuda-074), checked **2026-09-08**. No owner exercise or sample is adapted.
