<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX07: Streams, Events, and Overlap

EX07 is the standalone Streams, Events, and Overlap Runnable Example for CUDA Learning Site. The original Apache-2.0 C++17 project applies one deterministic transform through a serial stream path and a bounded, chunked two-stream path. It proves only that both paths produce the same complete result; it does not measure or claim overlap.

## Correctness and Chunk Contract

Both paths apply `output[index] = input[index] * 3 + 7` to 4,099 `std::uint32_t` elements. The pure header partitions that extent into chunks with `(offset, count)` values `(0, 1024)`, `(1024, 1024)`, `(2048, 1024)`, `(3072, 1024)`, and `(4096, 3)`. It rejects zero chunk sizes, overflowing byte or offset calculations, invalid chunk indices, and undersized destinations before mutating outputs.

The CUDA path allocates page-locked input and result buffers with `cudaMallocHost`. A named nonblocking serial stream enqueues one complete H2D, kernel, and D2H sequence. Two named nonblocking chunk streams wait on a timing-disabled serial-completion event, then each bounded chunk enqueues H2D, the same transform kernel, and D2H in one stream. Per-stream completion events establish the host observation boundary. Every launch receives an immediate error check, and every completion event is checked before verification and cleanup.

The serial device input and output use 32,792 bytes. Two chunk slots, each with a 1,024-element input and output, use another 16,384 bytes. The maximum declared device allocation is therefore 49,176 bytes, far below 8 GB. The three page-locked host buffers total 49,188 bytes.

## Build Contract

The declared build inputs are `include/streams_events_overlap_reference.hpp` and `src/streams_events_overlap.cu`. Every Toolkit Lane builds those same files and embeds a native `sm_75` cubin plus forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/streams_events_overlap.ii`, `build/streams_events_overlap.o`, and `build/ex07-streams-events-overlap`. Inspection checks the embedded cubin and PTX. The host test needs only a host C++17 compiler. It validates the complete chunk partition, zero-size behavior, the partial final chunk, overflow and undersized rejection, exact full-array output, deterministic mismatch reporting, and nonmutation on rejected input. It includes no CUDA header and cannot establish page locking, copy-engine use, stream execution, or overlap.

`scripts/compile-check.sh c++17 ex07 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test in order. It retains logs and inspection artifacts but never executes the CUDA binary. No qualifying EX07 compilation record is currently published.

## External Runtime

On Native Linux with one CUDA GPU of compute capability 7.5 or newer, build and run:

```sh
./build/ex07-streams-events-overlap
```

The program reports `deviceOverlap` and `asyncEngineCount` explicitly as capability fields, followed by correctness for the serial and chunked paths. These fields do not report a timeline or establish that any operations ran concurrently. The program prints no duration, bandwidth, throughput, speedup, or observed-overlap statement.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification because no qualifying execution in a declared Reference Environment exists. The expected partition, dependency structure, and exact `PASS` criteria are acceptance conditions, not runtime records.

This implementation and its prose are original and are not derived from NVIDIA sample source.
