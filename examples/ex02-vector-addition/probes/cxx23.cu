// SPDX-License-Identifier: Apache-2.0
#if __cplusplus <= 202002L
#error "The CUDA 13.3 C++23 probe requires a post-C++20 language mode."
#endif

__global__ void ex02_cxx23_dialect_probe() {}
