// SPDX-License-Identifier: Apache-2.0
#include <array>
#include <iostream>
#include <string>

#include "environment_report.hpp"

namespace {

bool check(bool condition, const char* message) {
  if (!condition) std::cerr << "report-contract failure: " << message << '\n';
  return condition;
}

}  // namespace

int main() {
  bool passed = true;

  const ex01::DecodedVersion cuda_11_8 = ex01::decode_cuda_version(11080);
  passed = check(
      cuda_11_8.encoded == 11080 && cuda_11_8.major == 11 && cuda_11_8.minor == 8,
      "CUDA 11.8 version decoding") && passed;
  const ex01::DecodedVersion cuda_13_3 = ex01::decode_cuda_version(13030);
  passed = check(
      cuda_13_3.encoded == 13030 && cuda_13_3.major == 13 && cuda_13_3.minor == 3,
      "CUDA 13.3 version decoding") && passed;

  std::string json_input = "\"\\\b\f\n\r\t";
  json_input.push_back('\x01');
  json_input += "\xe2\x98\x83";
  passed = check(
      ex01::json_quote(json_input) == "\"\\\"\\\\\\b\\f\\n\\r\\t\\u0001\xe2\x98\x83\"",
      "JSON escaping and valid UTF-8 preservation") && passed;
  const std::string invalid_utf8(1U, static_cast<char>(0xff));
  passed = check(
      ex01::json_quote(invalid_utf8) == "\"\\u00ff\"",
      "invalid UTF-8 byte escaping") && passed;

  const ex01::EnvironmentVariable absent = ex01::capture_environment_variable(nullptr);
  const ex01::EnvironmentVariable empty = ex01::capture_environment_variable("");
  const ex01::EnvironmentVariable selected = ex01::capture_environment_variable("0,2");
  passed = check(!absent.present, "absent environment variable") && passed;
  passed = check(empty.present && empty.value.empty(), "present empty environment variable") && passed;
  passed = check(
      selected.present && selected.value == "0,2",
      "present environment variable value") && passed;

  constexpr std::array<unsigned char, 5> bytes{0x00U, 0x0fU, 0x10U, 0xabU, 0xffU};
  passed = check(
      ex01::bytes_to_lower_hex(bytes.data(), bytes.size()) == "000f10abff",
      "lowercase UUID byte encoding") && passed;

  const auto available = ex01::Observation<int>::available(0);
  passed = check(
      ex01::is_available(available) && *available.value == 0,
      "zero remains an available observation") && passed;

  if (!passed) return 1;
  std::cout << "report-contract: pass\n";
  return 0;
}
