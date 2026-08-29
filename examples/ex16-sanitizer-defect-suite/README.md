<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX16: Compute Sanitizer Defect Suite

EX16 is the standalone Compute Sanitizer Runnable Example for CUDA Learning Site. The original Apache-2.0 C++17 project contains one isolated defect and one same-semantics corrected executable for each of `memcheck`, `racecheck`, `initcheck`, and `synccheck`. Each executable owns one case so a failed CUDA context or tool report cannot contaminate another case.

## Scenario Contract

| Tool | Defect | Minimal correction | Intended work retained |
| --- | --- | --- | --- |
| `memcheck` | One thread passes a single `<= count` bounds check and writes one element beyond a 32-element global allocation | Change `<=` to `<` | Write the same 32-element deterministic sequence |
| `racecheck` | Thread 1 reads a plain shared value without ordering it after thread 0's write | Insert one block barrier between producer and consumer | Publish 41 and return 42 |
| `initcheck` | The kernel reads a newly allocated, uninitialized global input | Zero-initialize that input before launch | Increment 16 zero values to 1 |
| `synccheck` | Only even threads enter a conditional `__syncthreads()` | Move the same barrier outside the conditional | Copy each thread's deterministic shared value |

The largest per-process global-plus-shared problem footprint is 128 bytes. Every executable checks the immediate launch status, establishes an explicit completion boundary, and checks deterministic output where that output remains meaningful. A defect may also make completion fail; the process reports that failure and exits rather than treating it as success.

## Build Contract

On Native Linux, the selected Toolkit Lane preprocesses, compiles, links, and inspects all eight CUDA binaries as C++17:

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA build embeds a native `sm_75` cubin and forward-compatible PTX generated from `compute_75` in every binary. `make inspect` checks both images for each executable. The pure-host utility verifies only the ordered scenario IDs, tool commands, variants, and categories. It includes no CUDA API and cannot establish GPU correctness or sanitizer behavior.

`scripts/compile-check.sh c++17 ex16 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test. It preserves build logs and inspection text but never launches a CUDA executable or a checking tool.

## External Tool Runs

Use Native Linux, exactly one CUDA GPU with compute capability 7.5 or newer, and the `compute-sanitizer` delivered by the selected CUDA 11.8.0, 12.9.2, or 13.3.1 Toolkit Lane. Run `memcheck` first, then run each remaining tool only against its matching pair. Every line below starts a separate process:

```sh
compute-sanitizer --tool memcheck ./build/memcheck-defect
compute-sanitizer --tool memcheck ./build/memcheck-corrected
compute-sanitizer --tool racecheck ./build/racecheck-defect
compute-sanitizer --tool racecheck ./build/racecheck-corrected
compute-sanitizer --tool initcheck ./build/initcheck-defect
compute-sanitizer --tool initcheck ./build/initcheck-corrected
compute-sanitizer --tool synccheck ./build/synccheck-defect
compute-sanitizer --tool synccheck ./build/synccheck-corrected
```

Do not infer a clean pair from the application's correctness line alone. Preserve the exact command, tool version, stdout, stderr, process exit status, correctness result, and Environment Manifest when collecting candidate evidence.

## Evidence Boundary

Compilation evidence is empty, runtime remains Pending Hardware Verification, and recorded observations are empty. The manifest states expected defect-versus-corrected behavior only. This project commits no sanitizer diagnostic, console transcript, timing result, or performance claim.
