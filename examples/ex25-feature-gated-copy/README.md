<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX25: Feature-gated tile copy

Original Apache-2.0 source. Native Linux only. `make host-test` tests dispatch and
the independent integer oracle without CUDA. `make TARGET=100f preprocess inspect`
builds portable and family-scoped bulk-copy paths in separate translation units.
Use `TARGET=90` for LAB19; LAB20 selects exactly one of `100f`, `103f`, `110f`,
`120f`, `121f`. `portable` is the default and excludes the bulk-copy translation
unit. Separate build directories prevent accidental cross-target reuse.

The full comparison selects Toolkit 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17
on Ubuntu 24.04 x86-64. The portable-only project also has C++17 build gates on
the site's CUDA 11.8.0 and 12.9.2 lanes. List compiler targets before building;
an unsupported target fails rather than silently substituting one. The 13.3.1
profile deliberately excludes documented CC 10.7. No experimental API is used.

Host-platform admission is separate from GPU image compatibility. This project
selects only x86-64 runtime hosts: specialized runtime CC 9.0/10.0/10.3/12.0.
Targets 110f and 121f (and 120f's 12.1 image membership) are compile-target coverage
only. CC 11.0 Jetson and CC 12.1 GB10/Spark use Arm hosts; their native platform
software, driver, toolchain and profiler profiles are withheld pending separate
review. Do not execute an x86-64 binary there or treat target substitution as a
host port. The pure host dispatch test checks GPU image membership, not complete
platform admission. LAB20 applies this additional gate before execution.

After Lab preflight: `timeout 120s ./build/100f/ex25-copy specialized`.
Modes: `portable` forces the baseline, `auto` falls back before launch when the
reviewed target/device set does not match, `specialized` rejects such a mismatch.
Both selected paths are checked against CPU expectations, not against each other.
No failed CUDA call is retried as a fallback. Device ordinal 0 is used; select
visibility before starting. One GPU, CC 7.5+, 8 GB total and 512 MiB free required.

Counts 256/4096/65536, three integer patterns, 128 threads/block, 256 values/tile.
Input/output include four guards at each end: maximum 524352 bytes total.
Each tile uses 1024 B shared memory; specialization adds an 8 B transaction barrier.
The input offset is 16 B, preserving bulk-copy alignment. One issuer accounts
1024 bytes once, waits phase zero, then publishes completion to all consumers.
The final block barrier protects shared storage before invalidation and exit.
This is a single-stage load/consume pipeline, not an overlap benchmark or a
family-exclusive instruction demonstration. No TMA store, tensor map, cluster,
Tensor Core or numerical precision change is involved.

Timing: five warmups, ten samples of 100 launches, CUDA events in the same stream;
transfers/initialization are excluded. Print raw batch milliseconds and compare
distributions only on the same device after correctness. Tiny tiles and sequential
path order can bias results; alternate process order and record clocks/cache policy.
Use a separate authorized profiler pass. Logs require a full Environment Manifest.

Compilation evidence: none retained. Runtime: Pending Hardware Verification.
No output, instruction-selection, timing or speedup observation is published.
