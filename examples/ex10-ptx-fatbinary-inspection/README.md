<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX10 PTX and Fatbinary Inspection

EX10 is an original Apache-2.0 Runnable Example for inspecting CUDA compilation artifacts without executing CUDA or host code. It targets native `sm_75` code and forward-compatible `compute_75` PTX.

## Build stages

Run each stage explicitly from this directory:

```sh
make preprocess DIALECT=c++17
make standalone-ptx DIALECT=c++17
make cubin DIALECT=c++17
make fatbin DIALECT=c++17
make relocatable-compile DIALECT=c++17
make device-link DIALECT=c++17
make host-link DIALECT=c++17
make inspect DIALECT=c++17
make artifact-test DIALECT=c++17
```

`relocatable-compile` applies `-dc` separately to `src/device_math.cu` and `src/caller.cu`. `device-link` creates `build/device_link.o`. `host-link` consumes that object with `--no-device-link`, so the explicit device link is not repeated.

`inspect` hashes the preprocessing, PTX, cubin, fatbin, relocatable objects, device-link object, and final linked artifact. It writes PTX and ELF inventories from the same standalone fatbinary, a separate ELF inventory for the linked artifact, PTX/SASS/ELF dumps, CUDA symbols, and a symbol/link ledger. `artifact-test` checks those files and writes a boundary report.

## Execution boundary

Do not run `build/ex10-ptx-fatbinary-inspection`. The final artifact exists only so `cuobjdump`, `nm`, and the hash ledger can inspect the completed host-link output. Neither the ordinary Toolkit Lanes nor the C++23 probe use `--gpus`, and neither executes a host or GPU executable. Runtime evidence is therefore Runtime-Not-Applicable, and this project makes no performance claim.

## Toolkit Lanes and probe

- CUDA 11.8.0: C++17.
- CUDA 12.9.2: C++17 and C++20.
- CUDA 13.3.1: C++17 and C++20.
- CUDA 13.3.1 C++23 probe: a separate ephemeral image based on the exact pinned 13.3.1 image installs Ubuntu's `g++-14` package and compiles only `probes/cxx23.cu` with `/usr/bin/g++-14`.

Run 33266515216 retains five ordinary Compile-Checked records for the Lane/dialect rows above at source commit `16256cbeded889cb1a45f2461585317ed3fe0296`. The separate C++23 record passed under CUDA 13.3.1, NVCC 13.3.73, and GCC 14.2.0 as `C++23-Dialect-Probe` only. It does not extend the ordinary EX10 Lane claim, and no command uses `--allow-unsupported-compiler`.
