<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX09: CUDA Graph Capture

EX09 is the standalone CUDA Graph Capture Runnable Example for CUDA Learning Site. The original Apache-2.0 C++17 project captures one deterministic two-kernel stream workload, instantiates the captured graph, launches the executable graph three times, and verifies every result against an independent pure-host oracle.

## Correctness and Graph Contract

The fixed DAG contains `accumulate-input -> affine-transform`. For each of eight elements, state starts at zero and input is `index + 1`. One graph launch applies:

`state[index] = 2 * (state[index] + input[index]) + 1`

After three launches, the literal expected result is `21, 35, 49, 63, 77, 91, 105, 119`. The pure C++17 header validates the fixed DAG and topological order independently of CUDA. Its structural validator rejects cycles, unknown endpoints, self-edges, duplicate edges, duplicate nodes, and invalid node or order sizes. The oracle rejects invalid buffer sizes and replay counts before mutating output.

The CUDA executable allocates an eight-element input and an eight-element state buffer, totaling 64 device bytes and remaining far below 8 GB. It creates a nonblocking stream, brackets the two kernel launches with global stream capture, uses the CUDA 11.8-compatible five-argument `cudaGraphInstantiate` signature, launches the executable graph three times, and synchronizes at the explicit observation boundary before copying and checking all results.

## Build Contract

The declared build inputs are `include/graph_capture_reference.hpp` and `src/graph_capture.cu`. Every Toolkit Lane builds those same files and embeds a native `sm_75` cubin plus forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/graph_capture.ii`, `build/graph_capture.o`, and `build/ex09-graph-capture`. Inspection uses `cuobjdump` to check the embedded cubin and PTX. The host test needs only a host C++17 compiler and includes no CUDA header or device code.

`scripts/compile-check.sh c++17 ex09 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test in order. It retains logs and inspection artifacts but never executes the CUDA binary. No qualifying EX09 compilation record is currently published.

## External Runtime

On Native Linux with one CUDA GPU of compute capability 7.5 or newer, build and run:

```sh
./build/ex09-graph-capture
```

The program prints only `result=PASS` or `result=FAIL`. It reports no timing, launch overhead, latency, throughput, speedup, or other performance quantity.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification because no qualifying execution in a declared Reference Environment exists. The host test cannot establish stream capture, CUDA graph instantiation or execution, executable-graph replay, or performance. Its fixed-DAG validation and literal recurrence result are independent acceptance criteria, not device observations.

This implementation and its prose are original and are not derived from NVIDIA sample source.
