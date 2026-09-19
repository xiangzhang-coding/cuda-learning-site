<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX24: NCCL all-reduce

Original C++17 software. One process / one submitting thread; 2–8 distinct full GPUs. Rank r uses visible device r. No MPI, graph capture, MIG, registered buffers, benchmark or selected algorithm claim.

## Build

`make host-test` needs only a C++17 compiler. From this directory:

```sh
docker build --platform linux/amd64 -t ex24-build .
```

The digest-pinned CUDA 13.3.1 Ubuntu 24.04 image installs hash-checked NCCL runtime/development packages 2.31.2-1+cuda13.3. It runs CPU tests, preprocessing, compilation, linking and dynamic-library inspection, never the GPU executable. `g++` compiles the original host-only API client; no project device kernel or NVCC-generated cubin is required. Record the actual g++ package/version with logs. On an equivalently provisioned native Linux host, `make host-test preprocess inspect` builds the same inputs.

## External runtime

Use LAB17 for the full Environment Manifest and authorized topology/platform preflight. Native Ubuntu 24.04 x86-64, driver >=610.43.02, CUDA 13.3.1 and the exact NCCL packages above are selected. Each GPU requires CC >=7.5, >=8 GB total and >=256 MiB free; two arrays reserve 8 MiB per GPU at maximum count, with NCCL/context resources additional. No supported MIG or VM profile is declared. Resolve CUDA-visible ordinals to private physical identities; establish appropriate IOMMU/ACS/P2P configuration with the operator before execution. Do not change machine policy to get a passing run.

In the matching native runtime environment, from the standalone directory:

```sh
timeout --signal=TERM --kill-after=5s 180s env NCCL_DEBUG=INFO ./build/ex24-nccl-all-reduce 2 > rank-run.log 2>&1
```

Preserve the exit code immediately (`status=$?`), then review logs privately. Never pipe through `tee` without preserving the process status. Record any NCCL environment variables and configuration files; use default blocking communicators and no custom tuning/plugin overrides. A timeout, missing device, mismatch, asynchronous error or release failure is a failed/blocked run, never a pass. Optional rank counts 3–8 need that many distinct qualifying full GPUs. Fewer than two is an error.

Input at rank r and index i is `3*(r+1)+(i%17)-8`. Every result must equal `3*R*(R+1)/2+R*((i%17)-8)` exactly. The counts are 1, 257 and 1048576. One nonblocking CUDA stream per rank orders H2D → grouped all-reduce → D2H. After group end, completion is polled before pageable downloads so a blocking D2H call cannot hide a stalled collective from the error monitor. A second completion poll precedes host comparison. Each poll has a 60-second deadline and checks all streams and communicator asynchronous errors; the external watchdog also bounds blocking initialization/group/finalization/abort. Fatal paths attempt abort for every acquired communicator and exit without freeing possibly live buffers. Normal completion finalizes the communicators as a group before destruction and cleanup. No resilient recovery promise is made.

## Evidence and rights

Published compilation and recorded observations are empty; runtime remains **Pending Hardware Verification**. Host checks and a container build provide no GPU correctness, algorithm, latency or bandwidth observation. `environment-manifest.json` is a blank worksheet, never a captured run.

NCCL is an external dependency. Its exact [LICENSE.txt](https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/LICENSE.txt) has SHA-256 `c1f53beabe4dbf05bd87c00f7ca6084c0cb541c3f7bf8edab7913f266018b7be`: Apache-2.0 plus retained BSD terms and per-file notices. CUDA packages retain NVIDIA terms. No upstream sample, source, header or library is redistributed here. The workload, oracle and lifecycle are original, not an adaptation of the NCCL example listing.
