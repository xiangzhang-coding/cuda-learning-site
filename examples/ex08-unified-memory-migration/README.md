<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX08: Unified Memory Migration

EX08 is the standalone Unified Memory Migration Runnable Example for CUDA Learning Site. The original Apache-2.0 C++17 project allocates one managed array, initializes it deterministically on the host, applies one device transform, establishes completion, and verifies the entire array on the host. Correctness does not depend on observing residency, a fault, or movement.

## Access Sequence and Correctness Contract

The declared software sequence covers 16 logical 4,096-byte pages in three phases: host initialization, device transform, and host verification. The pure C++17 model treats the first origin named for each page as its initial modeled state. A later change of origin adds one transition, one moved-page unit, and 4,096 moved-byte units to a software cost proxy. The declared sequence therefore derives 32 transitions, 32 moved-page units, and 131,072 moved-byte units.

That ledger is a deliberately software-coherent teaching model. It does not inspect CUDA, operating-system page tables, physical page size, hardware coherence, residency, faults, or data movement. Repeated accesses from one origin add no model transition. Invalid pages or origins, arithmetic overflow, and undersized ledgers are rejected before output mutation.

The workload contains 16,384 `std::uint32_t` values, or 65,536 managed bytes, far below 8 GB. Host initialization uses `29 + 11 * index`; both the kernel and independent oracle apply XOR with `0x5a5a5a5a`. Every value must match exactly.

## Managed Workload

The executable queries and reports `managedMemory` and `concurrentManagedAccess` as capabilities only. It uses `cudaMallocManaged` for the shared array and a named nonblocking stream for the kernel. When `concurrentManagedAccess` is nonzero, it optionally submits preferred-location advice and device/host prefetch requests. The source selects the CUDA 11.8/12.9 integer-destination signatures or the CUDA 13 location-based signatures at compile time, so all three declared Toolkit Lanes build the same C++17 source.

Advice and prefetch are requests, not observations. Their successful submission does not prove a particular physical placement or movement. The kernel receives an immediate launch check; `cudaStreamSynchronize` supplies the completion check before any host verification access. Cleanup occurs only after that completion and full-array comparison.

## Build Contract

The declared build inputs are `include/unified_memory_migration_reference.hpp` and `src/unified_memory_migration.cu`. Every Toolkit Lane embeds a native `sm_75` cubin plus forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/unified_memory_migration.ii`, `build/unified_memory_migration.o`, and `build/ex08-unified-memory-migration`. Inspection checks the embedded cubin and PTX. The host test needs only a host C++17 compiler. It covers no transition, alternating origins, repeated origin, invalid page and access origin, overflow, undersized output, exact proxy values, the complete expected transform, mismatch reporting, and nonmutation. It cannot establish any CUDA runtime behavior.

`scripts/compile-check.sh c++17 ex08 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test without executing the CUDA binary. No qualifying EX08 compilation record is currently published.

## External Runtime

On Native Linux with one CUDA GPU of compute capability 7.5 or newer, build and run:

```sh
./build/ex08-unified-memory-migration
```

The output separates device capability fields, the software-only transition proxy, optional-hint submission, and the correctness verdict. It prints no timing and makes no statement that a page fault or migration occurred.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification because no qualifying execution in a declared Reference Environment exists. The proxy values and expected `PASS` verdict are acceptance criteria, not runtime records.

This implementation and its prose are original and are not derived from NVIDIA sample source.
