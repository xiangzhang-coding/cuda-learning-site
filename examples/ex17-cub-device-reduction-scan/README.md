<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX17: CUB Device Reduction and Scan

EX17 is a standalone C++17 Runnable Example that calls the production CUB device-wide primitives without copying their implementation. It uses `cub::DeviceReduce::Sum`, `cub::DeviceScan::InclusiveSum`, and `cub::DeviceScan::ExclusiveSum`. The project reports correctness only and contains no timer or measured performance result.

## Correctness Contract

The reduction input is byte-for-byte compatible with EX11's deterministic 4,099-`float` workload: each value uses the same centered coarse term and positive fine term. `include/cub_device_reduction_scan_reference.hpp` accumulates those stored `float` values serially in `double` and applies the same EX11 absolute-plus-relative acceptance rule:

```text
absolute_error <= absolute_tolerance + relative_tolerance * abs(cpu_reference)
```

The scan input contains 4,099 `std::uint32_t` values repeating 1 through 7. Every possible prefix is bounded by 28,693, and the deterministic total is exactly 16,390. The inclusive and exclusive CPU references are independent serial computations. Device outputs must match both arrays exactly and satisfy the recurrence and last-total invariants.

## CUB API and Completion Boundary

The source imports exactly `<cub/device/device_reduce.cuh>`, `<cub/device/device_scan.cuh>`, and `<cub/version.cuh>` for the CUB operations and version gate. Each primitive uses the legacy two-call API: first pass `nullptr` to query temporary-storage bytes, allocate that storage, and then call the same primitive with the allocation. This common API is the compatibility surface for all five declared checks.

All CUB calls and all host/device copies use one explicitly created nonblocking CUDA stream. The source checks every CUDA and CUB return value. Five checked `cudaMemcpyAsync` calls enqueue the two inputs and three outputs. One `cudaStreamSynchronize` after the output copies is the explicit completion boundary before any host result is validated.

## Version and Dependency Profiles

`EXPECTED_CUB_VERSION` is required for CUDA build targets. The Makefile passes it as `EX17_EXPECTED_CUB_VERSION`, and the source statically requires equality with `CUB_VERSION` from `<cub/version.cuh>`. `COMPONENT_MODE=bundled` selects `BUNDLED_INCLUDE_ROOT`; the profile script uses `/usr/local/cuda/include` for CUDA 11.8/12.9 and `/usr/local/cuda/include/cccl` for CUDA 13.3. `COMPONENT_MODE=selected` requires an independent CCCL checkout in `CCCL_ROOT` and adds all three matching roots: `cub/`, `thrust/`, and `libcudacxx/include`.

The profile ID passed to `scripts/compile-check.sh` derives both Make variables:

| Profile ID | Toolkit | Dependency | Include-root expectation | Expected `CUB_VERSION` |
| --- | --- | --- | --- | ---: |
| `cuda-11-8-bundled-cub-1-15-1` | 11.8.0 | bundled CUB 1.15.1 | `/usr/local/cuda/include` | 101501 |
| `cuda-12-9-bundled-cub-2-8-2` | 12.9.2 | bundled CUB 2.8.2 | `/usr/local/cuda/include` | 200802 |
| `cuda-13-3-bundled-cub-3-3-4` | 13.3.1 | bundled CUB 3.3.4 | `/usr/local/cuda/include/cccl` | 300304 |
| `cuda-12-9-selected-cccl-3-4-2` | 12.9.2 | selected CCCL 3.4.2 | `CCCL_ROOT` component roots | 300402 |
| `cuda-13-3-selected-cccl-3-4-2` | 13.3.1 | selected CCCL 3.4.2 | `CCCL_ROOT` component roots | 300402 |

The selected profiles pin CCCL v3.4.2 at commit `d36012203ef73ac7f966e848dd88482273e91e02`. They do not infer availability from the Toolkit label.

The bundled package coordinates are `cuda-cccl-11-8=11.8.89-1`, `cuda-cccl-12-9=12.9.27-1`, and `cccl-13-3=13.3.3.4.1-1`. Each remains paired with the exact container coordinate declared in `project.json`.

```sh
CCCL_ROOT=/path/to/cccl scripts/compile-check.sh c++17 cuda-12-9-selected-cccl-3-4-2
```

For a bundled profile:

```sh
scripts/compile-check.sh c++17 cuda-11-8-bundled-cub-1-15-1 results/ex17-11-8
```

The optional third argument is the result directory. Without it, the script creates a temporary result directory. It runs clean, preprocess, compile, link, inspect, and host-test, but does not execute the CUDA binary.

## Local Commands

The pure host test needs no CUDA headers or runtime:

```sh
make host-test DIALECT=c++17
```

Direct CUDA builds must name their dependency contract:

```sh
make compile DIALECT=c++17 COMPONENT_MODE=bundled EXPECTED_CUB_VERSION=101501
make link DIALECT=c++17 COMPONENT_MODE=bundled EXPECTED_CUB_VERSION=101501
make inspect DIALECT=c++17 COMPONENT_MODE=bundled EXPECTED_CUB_VERSION=101501
```

After building in a Native Linux environment with a CUDA GPU of compute capability 7.5 or newer, `./build/ex17-cub-device-reduction-scan` prints the selected CUB version and the reduction and scan correctness verdicts.

## Evidence Boundary

All five compilation checks currently have empty evidence, and runtime remains Pending Hardware Verification. Declared versions, expected outputs, and compatibility profiles are acceptance criteria rather than observed build or runtime results.

This source and prose are original Apache-2.0 work. CUB remains an external dependency under its own license.
