// SPDX-License-Identifier: Apache-2.0
#include "contract.h"
#include <torch/library.h>
#include <Python.h>

// [ex22-cpu-start]
at::Tensor adjacent_energy_cpu(const at::Tensor& x) {
  check_input(x);
  TORCH_CHECK(x.device().is_cpu(), "expected CPU input");
  auto y = at::empty({x.numel() - 1}, x.options());
  AT_DISPATCH_FLOATING_TYPES(x.scalar_type(), "adjacent_energy_cpu", [&] {
    const auto* input = x.const_data_ptr<scalar_t>();
    auto* output = y.mutable_data_ptr<scalar_t>();
    for (int64_t i = 0; i < y.numel(); ++i) {
      const scalar_t difference = input[i + 1] - input[i];
      output[i] = difference * difference;
    }
  });
  return y;
}
// [ex22-cpu-end]

// [ex22-schema-start]
TORCH_LIBRARY(cuda_learning, m) {
  m.def("adjacent_energy(Tensor x) -> Tensor");
}
TORCH_LIBRARY_IMPL(cuda_learning, CPU, m) {
  m.impl("adjacent_energy", &adjacent_energy_cpu);
}
// [ex22-schema-end]

// Importing this small CPython module loads the dispatcher registrations.
// It exports no tensor bindings and makes no stable-ABI promise.
static PyModuleDef module = {PyModuleDef_HEAD_INIT, "_C", nullptr, -1, nullptr};
PyMODINIT_FUNC PyInit__C() { return PyModule_Create(&module); }
