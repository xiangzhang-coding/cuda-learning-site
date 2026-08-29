// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX16_CUDA_ERROR_HPP_
#define CUDA_LEARNING_SITE_EX16_CUDA_ERROR_HPP_

#include <cuda_runtime.h>

#include <iostream>
#include <string_view>

inline bool cuda_ok(cudaError_t status, std::string_view operation) {
  if (status == cudaSuccess) return true;
  std::cerr << "operation=" << operation
            << " status=" << cudaGetErrorName(status)
            << " detail=\"" << cudaGetErrorString(status) << "\"\n";
  return false;
}

#endif  // CUDA_LEARNING_SITE_EX16_CUDA_ERROR_HPP_
