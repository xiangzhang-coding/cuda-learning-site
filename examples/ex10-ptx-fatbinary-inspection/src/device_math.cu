// SPDX-License-Identifier: Apache-2.0

extern "C" __device__ float ex10_device_scale(float value) {
  return value * 3.0F + 1.0F;
}
