// SPDX-License-Identifier: Apache-2.0
#include "launch.hpp"
cudaError_t launch_specialized(const int*, int*, int, cudaStream_t) {
  return cudaErrorNotSupported;
}
