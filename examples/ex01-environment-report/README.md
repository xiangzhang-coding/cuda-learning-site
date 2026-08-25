<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX01: Environment Report

EX01 is an original C++17 CUDA Runtime utility that records environment observations as one JSON document. It launches no kernel, allocates no device memory, and invokes no subprocess, network client, profiler, or `nvidia-smi`. It reports inputs for later review without deciding compatibility, a GPU Capability Tier, a Reference Environment, or an Evidence Status.

## Report Contract

Build the utility, then request its only report format:

```sh
./build/ex01-environment-report --format=json
```

Report mode writes exactly one JSON document to standard output. CLI diagnostics use standard error. `--help` prints usage information and exits successfully. Any other CLI shape exits with status `2`.

The JSON document has schema version `1` and records:

- UTC collection time;
- compile-time NVCC and host-compiler coordinates;
- the Makefile-selected `shared` or `static` CUDART linkage;
- presence and value of `CUDA_VISIBLE_DEVICES` and `CUDA_DEVICE_ORDER`, preserving absent and present-but-empty as different states;
- `cudaDriverGetVersion`, `cudaRuntimeGetVersion`, and `cudaGetDeviceCount` observations;
- one entry per visible device with its name, UUID bytes, PCI bus ID, directly queried compute-capability major and minor values, and total global memory.

UUID bytes are encoded in their stored order as lowercase hexadecimal, exactly two characters per byte, with no separators. A CUDA API failure remains inside the JSON observation with the API source plus the error name, integer code, and message. A successful count of zero is an available count with an empty `devices` array, not a failure.

Exit status is `0` when every required query is available, including a successful zero-device inventory. Exit status is `3` when the utility still emits valid JSON but at least one required query is unavailable or reports an error.

`cudaDriverGetVersion` reports the latest CUDA API version supported by the driver. It is not the installed driver package version. The integer returned by `cudaRuntimeGetVersion` encodes major and minor coordinates; it does not identify a Toolkit patch release.

## Build Contract

The CUDA build has no architecture target because the source contains no device code:

```sh
make preprocess DIALECT=c++17 CUDART=shared
make compile DIALECT=c++17 CUDART=shared
make link DIALECT=c++17 CUDART=shared
```

`make build` is an alias for the link stage. Set `CUDART=static` to select static runtime linkage. `NVCC`, `HOST_CXX`, and `BUILD_DIR` are explicit Makefile inputs.

The compile-check orchestrator runs the declared stages and the host test but never executes the report binary:

```sh
bash scripts/compile-check.sh c++17 shared evidence-work
```

## Host-Only Contract Test

The reusable helpers in `include/environment_report.hpp` have no CUDA dependency:

```sh
make host-test
```

This checks CUDA integer-version decoding, JSON escaping, UUID byte encoding, and the distinction between an absent environment variable and a present empty value. It requires only a C++17 host compiler and does not establish any CUDA compilation or runtime evidence.

## Evidence Boundary

No compilation record or qualifying runtime observation is committed. Runtime remains Pending Hardware Verification. EX01 output is only one input to a complete Environment Manifest; it does not replace OS, installed driver-package, Toolkit-package, workload, command, correctness, custody, or maintainer-control records.
