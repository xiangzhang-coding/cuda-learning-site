// SPDX-License-Identifier: Apache-2.0
#pragma once
#include <ATen/ATen.h>

inline void check_input(const at::Tensor& x) {
  TORCH_CHECK(x.layout() == at::kStrided, "expected strided layout");
  TORCH_CHECK(x.dim() == 1, "expected rank one");
  TORCH_CHECK(x.is_contiguous(), "expected contiguous input");
  TORCH_CHECK(x.scalar_type() == at::kFloat || x.scalar_type() == at::kDouble,
              "expected float32 or float64");
  TORCH_CHECK(x.numel() >= 1 && x.numel() <= 1000000,
              "expected 1 through 1000000 elements");
}
