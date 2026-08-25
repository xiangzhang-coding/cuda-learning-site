// SPDX-License-Identifier: Apache-2.0
#ifndef CUDA_LEARNING_SITE_EX01_ENVIRONMENT_REPORT_HPP_
#define CUDA_LEARNING_SITE_EX01_ENVIRONMENT_REPORT_HPP_

#include <cstddef>
#include <optional>
#include <string>
#include <string_view>
#include <utility>

namespace ex01 {

// [ex01-observation-model-start]
enum class ObservationStatus {
  kAvailable,
  kUnavailable,
  kError,
};

struct ObservationError {
  std::string source;
  std::string name;
  int code;
  std::string message;
};

template <typename T>
struct Observation {
  ObservationStatus status;
  std::optional<T> value;
  std::optional<ObservationError> issue;

  static Observation available(T observed_value) {
    return {ObservationStatus::kAvailable, std::move(observed_value), std::nullopt};
  }

  static Observation unavailable(ObservationError observed_issue) {
    return {ObservationStatus::kUnavailable, std::nullopt, std::move(observed_issue)};
  }

  static Observation failed(ObservationError observed_issue) {
    return {ObservationStatus::kError, std::nullopt, std::move(observed_issue)};
  }
};

inline const char* observation_status_name(ObservationStatus status) {
  switch (status) {
    case ObservationStatus::kAvailable:
      return "available";
    case ObservationStatus::kUnavailable:
      return "unavailable";
    case ObservationStatus::kError:
      return "error";
  }
  return "error";
}

template <typename T>
inline bool is_available(const Observation<T>& observation) {
  return observation.status == ObservationStatus::kAvailable && observation.value.has_value();
}

struct DecodedVersion {
  int encoded;
  int major;
  int minor;
};

inline DecodedVersion decode_cuda_version(int encoded) {
  return {encoded, encoded / 1000, (encoded % 1000) / 10};
}

struct EnvironmentVariable {
  bool present;
  std::string value;
};

inline EnvironmentVariable capture_environment_variable(const char* raw_value) {
  return raw_value == nullptr
      ? EnvironmentVariable{false, {}}
      : EnvironmentVariable{true, raw_value};
}
// [ex01-observation-model-end]

namespace detail {

inline bool is_utf8_continuation(unsigned char byte) {
  return byte >= 0x80U && byte <= 0xbfU;
}

inline std::size_t valid_utf8_sequence_length(std::string_view value, std::size_t index) {
  const auto byte = [&value](std::size_t position) {
    return static_cast<unsigned char>(value[position]);
  };
  const unsigned char lead = byte(index);
  const std::size_t remaining = value.size() - index;

  if (lead <= 0x7fU) return 1U;
  if (lead >= 0xc2U && lead <= 0xdfU && remaining >= 2U &&
      is_utf8_continuation(byte(index + 1U))) {
    return 2U;
  }
  if (lead == 0xe0U && remaining >= 3U && byte(index + 1U) >= 0xa0U &&
      byte(index + 1U) <= 0xbfU && is_utf8_continuation(byte(index + 2U))) {
    return 3U;
  }
  if (((lead >= 0xe1U && lead <= 0xecU) || (lead >= 0xeeU && lead <= 0xefU)) &&
      remaining >= 3U && is_utf8_continuation(byte(index + 1U)) &&
      is_utf8_continuation(byte(index + 2U))) {
    return 3U;
  }
  if (lead == 0xedU && remaining >= 3U && byte(index + 1U) >= 0x80U &&
      byte(index + 1U) <= 0x9fU && is_utf8_continuation(byte(index + 2U))) {
    return 3U;
  }
  if (lead == 0xf0U && remaining >= 4U && byte(index + 1U) >= 0x90U &&
      byte(index + 1U) <= 0xbfU && is_utf8_continuation(byte(index + 2U)) &&
      is_utf8_continuation(byte(index + 3U))) {
    return 4U;
  }
  if (lead >= 0xf1U && lead <= 0xf3U && remaining >= 4U &&
      is_utf8_continuation(byte(index + 1U)) && is_utf8_continuation(byte(index + 2U)) &&
      is_utf8_continuation(byte(index + 3U))) {
    return 4U;
  }
  if (lead == 0xf4U && remaining >= 4U && byte(index + 1U) >= 0x80U &&
      byte(index + 1U) <= 0x8fU && is_utf8_continuation(byte(index + 2U)) &&
      is_utf8_continuation(byte(index + 3U))) {
    return 4U;
  }
  return 0U;
}

inline void append_hex_escape(std::string& output, unsigned char byte) {
  constexpr char kHex[] = "0123456789abcdef";
  output += "\\u00";
  output.push_back(kHex[(byte >> 4U) & 0x0fU]);
  output.push_back(kHex[byte & 0x0fU]);
}

}  // namespace detail

inline std::string json_quote(std::string_view value) {
  std::string output;
  output.reserve(value.size() + 2U);
  output.push_back('"');

  for (std::size_t index = 0; index < value.size();) {
    const unsigned char byte = static_cast<unsigned char>(value[index]);
    switch (byte) {
      case '"':
        output += "\\\"";
        ++index;
        continue;
      case '\\':
        output += "\\\\";
        ++index;
        continue;
      case '\b':
        output += "\\b";
        ++index;
        continue;
      case '\f':
        output += "\\f";
        ++index;
        continue;
      case '\n':
        output += "\\n";
        ++index;
        continue;
      case '\r':
        output += "\\r";
        ++index;
        continue;
      case '\t':
        output += "\\t";
        ++index;
        continue;
      default:
        break;
    }

    if (byte < 0x20U) {
      detail::append_hex_escape(output, byte);
      ++index;
      continue;
    }
    if (byte < 0x80U) {
      output.push_back(static_cast<char>(byte));
      ++index;
      continue;
    }

    const std::size_t sequence_length = detail::valid_utf8_sequence_length(value, index);
    if (sequence_length == 0U) {
      detail::append_hex_escape(output, byte);
      ++index;
    } else {
      output.append(value.substr(index, sequence_length));
      index += sequence_length;
    }
  }

  output.push_back('"');
  return output;
}

inline std::string bytes_to_lower_hex(const unsigned char* bytes, std::size_t byte_count) {
  constexpr char kHex[] = "0123456789abcdef";
  std::string output(byte_count * 2U, '0');
  for (std::size_t index = 0; index < byte_count; ++index) {
    output[index * 2U] = kHex[(bytes[index] >> 4U) & 0x0fU];
    output[index * 2U + 1U] = kHex[bytes[index] & 0x0fU];
  }
  return output;
}

inline std::string bounded_string(const char* value, std::size_t capacity) {
  std::size_t length = 0U;
  while (length < capacity && value[length] != '\0') ++length;
  return std::string(value, length);
}

}  // namespace ex01

#endif  // CUDA_LEARNING_SITE_EX01_ENVIRONMENT_REPORT_HPP_
