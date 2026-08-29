// SPDX-License-Identifier: Apache-2.0

// [ex10-cxx23-probe-start]
#if __cplusplus < 202302L
#error "EX10 C++23 probe requires __cplusplus >= 202302L"
#endif

constexpr int cxx23_language_value() {
  if consteval {
    return 23;
  }
  return 0;
}

static_assert(cxx23_language_value() == 23);

extern "C" __global__ void ex10_cxx23_probe(int* output) {
  *output = 23;
}
// [ex10-cxx23-probe-end]
