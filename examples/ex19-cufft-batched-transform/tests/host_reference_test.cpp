// SPDX-License-Identifier: Apache-2.0
#include "cufft_batched_reference.hpp"

#include <iostream>
#include <limits>
#include <stdexcept>

void require(bool condition, const char* message) {
  if (!condition) throw std::runtime_error(message);
}

int main() {
  try {
    using ex19::Values;
    const Values input{{1, 1}, {2, -1}, {-1, 2}, {3, 0}, {0, 0}, {2, -1}, {0, 0}, {0, 0}};
    const Values forward{{5, 2}, {1, 0}, {-5, 4}, {3, -2}, {2, -1}, {-1, -2}, {-2, 1}, {1, 2}};
    const Values inverse{{5, 2}, {3, -2}, {-5, 4}, {1, 0}, {2, -1}, {1, 2}, {-2, 1}, {-1, -2}};
    require(ex19::matches(forward, ex19::dft(input, -1)), "literal forward sign/batch result");
    require(ex19::matches(inverse, ex19::dft(input, 1)), "literal inverse sign/batch result");
    require(ex19::matches(input, ex19::fixtures()[0].input), "first fixture uses independent input");
    require(ex19::matches(forward, ex19::fixtures()[0].forward), "first fixture uses literal spectrum");
    const Values tones{{1, 0}, {0, 1}, {-1, 0}, {0, -1}, {2, 0}, {0, -2}, {-2, 0}, {0, 2}};
    const Values tone_spectrum{{0, 0}, {4, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {0, 0}, {8, 0}};
    require(ex19::matches(tone_spectrum, ex19::dft(tones, -1)), "opposite complex tones");
    require(ex19::matches(tones, ex19::fixtures()[1].input), "new-input reuse fixture");
    require(ex19::matches(tone_spectrum, ex19::fixtures()[1].forward), "literal tone spectrum");
    const Values scaled{{4, 4}, {8, -4}, {-4, 8}, {12, 0}, {0, 0}, {8, -4}, {0, 0}, {0, 0}};
    const auto roundtrip = ex19::dft(forward, 1);
    require(ex19::matches(scaled, roundtrip), "inverse is unnormalized N times input");
    auto normalized = roundtrip;
    for (auto& value : normalized) value /= 4.0;
    require(ex19::matches(input, normalized), "explicit inverse scale 1/N");
    const int input_offsets[]{0, 2, 4, 6, 11, 13, 15, 17};
    const int output_offsets[]{0, 3, 6, 9, 16, 19, 22, 25};
    for (int i = 0; i < 8; ++i) {
      require(ex19::input_index(i / 4, i % 4) == input_offsets[i], "literal input layout");
      require(ex19::output_index(i / 4, i % 4) == output_offsets[i], "literal output layout");
    }
    require(ex19::kInputCount == 22 && ex19::kOutputCount == 32, "padded buffer extents");
    const double nan = std::numeric_limits<double>::quiet_NaN();
    const double infinity = std::numeric_limits<double>::infinity();
    for (const auto bad : {nan, infinity, -infinity}) {
      for (int i = 0; i < 8; ++i) {
        auto candidate = forward;
        candidate[i] = {bad, 0};
        require(!ex19::matches(forward, candidate), "nonfinite real at every output");
        candidate[i] = {0, bad};
        require(!ex19::matches(forward, candidate), "nonfinite imaginary at every output");
        require(!ex19::matches(candidate, forward), "nonfinite oracle rejected");
      }
    }
    for (int i = 0; i < 8; ++i) {
      auto candidate = forward;
      candidate[i] += std::complex<double>(1, -1);
      require(!ex19::matches(forward, candidate), "every output participates in tolerance");
    }
    Values zeros(8), candidate(8);
    candidate[7] = {0.125, 0};
    require(ex19::matches(zeros, candidate, 0.125, 0), "inclusive absolute boundary");
    candidate[7] = {0.126, 0};
    require(!ex19::matches(zeros, candidate, 0.125, 0), "outside absolute boundary");
    Values large(8, {8, 0});
    candidate = large;
    candidate[7] = {9, 0};
    require(ex19::matches(large, candidate, 0, 0.125), "inclusive relative boundary");
    candidate[7] = {9.01, 0};
    require(!ex19::matches(large, candidate, 0, 0.125), "outside relative boundary");
    for (double bad : {-1.0, nan, infinity}) {
      require(!ex19::matches(forward, forward, bad, 0), "invalid absolute tolerance");
      require(!ex19::matches(forward, forward, 0, bad), "invalid relative tolerance");
    }
    require(!ex19::matches({}, {}), "empty comparison is not success");
    require(!ex19::matches(forward, Values(7)), "short output rejected");
    require(!ex19::matches(forward, Values(9)), "oversized output rejected");
    for (const auto& invalid : {Values{}, Values(7), Values(9), Values(8, {nan, 0})}) {
      bool rejected = false;
      try { ex19::dft(invalid, -1); } catch (const std::invalid_argument&) { rejected = true; }
      require(rejected, "invalid DFT input rejected");
    }
    for (int direction : {0, -2, 2}) {
      bool rejected = false;
      try { ex19::dft(input, direction); } catch (const std::invalid_argument&) { rejected = true; }
      require(rejected, "invalid DFT direction rejected");
    }
    std::cout << "host-reference: pass\n";
    return 0;
  } catch (const std::exception& error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}
