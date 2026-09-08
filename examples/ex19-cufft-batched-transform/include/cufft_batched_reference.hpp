// SPDX-License-Identifier: Apache-2.0
#ifndef EX19_CUFFT_BATCHED_REFERENCE_HPP
#define EX19_CUFFT_BATCHED_REFERENCE_HPP

#include <array>
#include <cmath>
#include <complex>
#include <stdexcept>
#include <vector>

namespace ex19 {

inline constexpr int kLength = 4;
inline constexpr int kBatch = 2;
inline constexpr int kInputStride = 2;
inline constexpr int kInputDistance = 11;
inline constexpr int kOutputStride = 3;
inline constexpr int kOutputDistance = 16;
inline constexpr int kInputCount = kBatch * kInputDistance;
inline constexpr int kOutputCount = kBatch * kOutputDistance;
inline constexpr double kAbsoluteTolerance = 0.0001;
inline constexpr double kRelativeTolerance = 0.00002;
using Values = std::vector<std::complex<double>>;

constexpr int input_index(int batch, int element) {
  return batch * kInputDistance + element * kInputStride;
}

constexpr int output_index(int batch, int element) {
  return batch * kOutputDistance + element * kOutputStride;
}

struct Fixture {
  const char* id;
  Values input;
  Values forward;
};

inline std::array<Fixture, 2> fixtures() {
  return {{
    {"signed-impulse",
     {{1, 1}, {2, -1}, {-1, 2}, {3, 0}, {0, 0}, {2, -1}, {0, 0}, {0, 0}},
     {{5, 2}, {1, 0}, {-5, 4}, {3, -2}, {2, -1}, {-1, -2}, {-2, 1}, {1, 2}}},
    {"opposite-tones",
     {{1, 0}, {0, 1}, {-1, 0}, {0, -1}, {2, 0}, {0, -2}, {-2, 0}, {0, 2}},
     {{0, 0}, {4, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {8, 0}}},
  }};
}

// [ex19-cpu-reference-start]
// Logical batch-major data only: the oracle does not use the cuFFT strides.
// Both directions are unnormalized. Inverse(forward(x)) = kLength * x.
inline Values dft(const Values& input, int direction) {
  if (input.size() != kBatch * kLength || (direction != -1 && direction != 1))
    throw std::invalid_argument("DFT requires two length-4 batches and direction -1 or +1");
  for (const auto value : input) {
    if (!std::isfinite(value.real()) || !std::isfinite(value.imag()))
      throw std::invalid_argument("DFT input must be finite");
  }
  Values output(input.size());
  const double pi = std::acos(-1.0);
  for (int b = 0; b < kBatch; ++b) {
    for (int k = 0; k < kLength; ++k) {
      std::complex<double> sum{};
      for (int n = 0; n < kLength; ++n) {
        const double angle = direction * 2.0 * pi * k * n / kLength;
        sum += input[b * kLength + n] * std::complex<double>(std::cos(angle), std::sin(angle));
      }
      output[b * kLength + k] = sum;
    }
  }
  return output;
}

inline bool matches(const Values& expected, const Values& actual,
                    double absolute = kAbsoluteTolerance, double relative = kRelativeTolerance) {
  if (expected.size() != kBatch * kLength || actual.size() != expected.size() ||
      !std::isfinite(absolute) || !std::isfinite(relative) || absolute < 0 || relative < 0)
    return false;
  bool all_match = true;
  for (std::size_t i = 0; i < expected.size(); ++i) {
    if (!std::isfinite(expected[i].real()) || !std::isfinite(expected[i].imag()) ||
        !std::isfinite(actual[i].real()) || !std::isfinite(actual[i].imag())) return false;
    const double error = std::abs(actual[i] - expected[i]);
    const double allowed = absolute + relative * std::abs(expected[i]);
    if (!std::isfinite(error) || !std::isfinite(allowed) || error > allowed) all_match = false;
  }
  return all_match;
}
// [ex19-cpu-reference-end]

}  // namespace ex19
#endif
