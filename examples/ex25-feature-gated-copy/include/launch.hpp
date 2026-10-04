// SPDX-License-Identifier: Apache-2.0
#pragma once
#include <cuda_runtime.h>
cudaError_t launch_portable(const int*, int*, int, cudaStream_t);
cudaError_t launch_specialized(const int*, int*, int, cudaStream_t);
