// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime_api.h>

#include <array>
#include <cerrno>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <iostream>
#include <ostream>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

#include "environment_report.hpp"

#ifndef EX01_CUDART_LINKAGE
#error "EX01_CUDART_LINKAGE must be selected by the build contract"
#endif

namespace {

constexpr int kInvalidCliExitCode = 2;
constexpr int kIncompleteObservationExitCode = 3;
constexpr std::string_view kUuidEncoding =
    "lowercase hexadecimal; two characters per raw byte; byte order preserved; no separators";

struct NvccCoordinate {
  int major;
  int minor;
  int build;
};

struct HostCompilerCoordinate {
  std::string family;
  int major;
  int minor;
  int patch;
  std::string version_string;
};

struct VersionQueries {
  ex01::Observation<ex01::DecodedVersion> driver_supported_api;
  ex01::Observation<ex01::DecodedVersion> runtime;
};

struct DevicePropertiesValue {
  std::string name;
  std::string uuid_hex;
  std::size_t uuid_byte_count;
  std::uint64_t global_memory_bytes;
};

struct DeviceObservation {
  int ordinal;
  ex01::Observation<DevicePropertiesValue> properties;
  ex01::Observation<std::string> pci_bus_id;
  ex01::Observation<int> compute_capability_major;
  ex01::Observation<int> compute_capability_minor;
};

struct DeviceInventory {
  ex01::Observation<int> visible_device_count;
  std::vector<DeviceObservation> devices;
};

template <typename T>
ex01::Observation<T> cuda_failure(const char* api, cudaError_t status) {
  const char* name = cudaGetErrorName(status);
  const char* message = cudaGetErrorString(status);
  ex01::ObservationError issue{
      api,
      name == nullptr ? "unknown CUDA error" : name,
      static_cast<int>(status),
      message == nullptr ? "unknown CUDA error" : message,
  };
  if (status == cudaErrorNoDevice || status == cudaErrorInsufficientDriver) {
    return ex01::Observation<T>::unavailable(std::move(issue));
  }
  return ex01::Observation<T>::failed(std::move(issue));
}

ex01::Observation<std::string> query_utc_time() {
  const auto now = std::chrono::system_clock::now();
  const std::time_t time = std::chrono::system_clock::to_time_t(now);
  std::tm utc{};
  errno = 0;
#if defined(_WIN32)
  const bool converted = gmtime_s(&utc, &time) == 0;
#else
  const bool converted = gmtime_r(&time, &utc) != nullptr;
#endif
  if (!converted) {
    return ex01::Observation<std::string>::failed({
        "system UTC clock",
        "utcConversionFailed",
        errno,
        "could not convert the system clock to UTC",
    });
  }

  std::array<char, 32> timestamp{};
  const int written = std::snprintf(
      timestamp.data(),
      timestamp.size(),
      "%04d-%02d-%02dT%02d:%02d:%02dZ",
      utc.tm_year + 1900,
      utc.tm_mon + 1,
      utc.tm_mday,
      utc.tm_hour,
      utc.tm_min,
      utc.tm_sec);
  if (written != 20) {
    return ex01::Observation<std::string>::failed({
        "system UTC clock",
        "utcFormattingFailed",
        written,
        "could not format the UTC timestamp",
    });
  }
  return ex01::Observation<std::string>::available(timestamp.data());
}

NvccCoordinate nvcc_coordinate() {
  return {__CUDACC_VER_MAJOR__, __CUDACC_VER_MINOR__, __CUDACC_VER_BUILD__};
}

HostCompilerCoordinate host_compiler_coordinate() {
#if defined(__clang__)
  return {"Clang", __clang_major__, __clang_minor__, __clang_patchlevel__, __clang_version__};
#elif defined(__GNUC__)
  return {"GCC", __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__, __VERSION__};
#elif defined(_MSC_VER)
  return {
      "MSVC",
      _MSC_VER / 100,
      _MSC_VER % 100,
      _MSC_FULL_VER % 100000,
      std::to_string(_MSC_FULL_VER),
  };
#else
  return {"unknown", 0, 0, 0, "unidentified host compiler"};
#endif
}

ex01::EnvironmentVariable query_environment_variable(const char* name) {
  return ex01::capture_environment_variable(std::getenv(name));
}

// [ex01-version-query-start]
VersionQueries query_cuda_versions() {
  int driver_encoded = 0;
  const cudaError_t driver_status = cudaDriverGetVersion(&driver_encoded);
  auto driver = driver_status == cudaSuccess
      ? ex01::Observation<ex01::DecodedVersion>::available(
            ex01::decode_cuda_version(driver_encoded))
      : cuda_failure<ex01::DecodedVersion>("cudaDriverGetVersion", driver_status);

  int runtime_encoded = 0;
  const cudaError_t runtime_status = cudaRuntimeGetVersion(&runtime_encoded);
  auto runtime = runtime_status == cudaSuccess
      ? ex01::Observation<ex01::DecodedVersion>::available(
            ex01::decode_cuda_version(runtime_encoded))
      : cuda_failure<ex01::DecodedVersion>("cudaRuntimeGetVersion", runtime_status);

  return {std::move(driver), std::move(runtime)};
}
// [ex01-version-query-end]

// [ex01-device-inventory-start]
DeviceInventory query_device_inventory() {
  int device_count = 0;
  const cudaError_t count_status = cudaGetDeviceCount(&device_count);
  if (count_status != cudaSuccess) {
    return {cuda_failure<int>("cudaGetDeviceCount", count_status), {}};
  }

  DeviceInventory inventory{
      ex01::Observation<int>::available(device_count),
      {},
  };
  inventory.devices.reserve(static_cast<std::size_t>(device_count));

  for (int ordinal = 0; ordinal < device_count; ++ordinal) {
    cudaDeviceProp properties{};
    const cudaError_t properties_status = cudaGetDeviceProperties(&properties, ordinal);
    auto properties_observation = properties_status == cudaSuccess
        ? ex01::Observation<DevicePropertiesValue>::available({
              ex01::bounded_string(properties.name, sizeof(properties.name)),
              ex01::bytes_to_lower_hex(
                  reinterpret_cast<const unsigned char*>(properties.uuid.bytes),
                  sizeof(properties.uuid.bytes)),
              sizeof(properties.uuid.bytes),
              static_cast<std::uint64_t>(properties.totalGlobalMem),
          })
        : cuda_failure<DevicePropertiesValue>("cudaGetDeviceProperties", properties_status);

    std::array<char, 32> pci_bus_id{};
    const cudaError_t pci_status = cudaDeviceGetPCIBusId(
        pci_bus_id.data(), static_cast<int>(pci_bus_id.size()), ordinal);
    auto pci_observation = pci_status == cudaSuccess
        ? ex01::Observation<std::string>::available(
              ex01::bounded_string(pci_bus_id.data(), pci_bus_id.size()))
        : cuda_failure<std::string>("cudaDeviceGetPCIBusId", pci_status);

    int major = 0;
    const cudaError_t major_status = cudaDeviceGetAttribute(
        &major, cudaDevAttrComputeCapabilityMajor, ordinal);
    auto major_observation = major_status == cudaSuccess
        ? ex01::Observation<int>::available(major)
        : cuda_failure<int>("cudaDeviceGetAttribute", major_status);

    int minor = 0;
    const cudaError_t minor_status = cudaDeviceGetAttribute(
        &minor, cudaDevAttrComputeCapabilityMinor, ordinal);
    auto minor_observation = minor_status == cudaSuccess
        ? ex01::Observation<int>::available(minor)
        : cuda_failure<int>("cudaDeviceGetAttribute", minor_status);

    inventory.devices.push_back({
        ordinal,
        std::move(properties_observation),
        std::move(pci_observation),
        std::move(major_observation),
        std::move(minor_observation),
    });
  }

  return inventory;
}
// [ex01-device-inventory-end]

void write_json_string(std::ostream& output, std::string_view value) {
  output << ex01::json_quote(value);
}

void write_issue(std::ostream& output, const ex01::ObservationError& issue) {
  output << "{\"source\":";
  write_json_string(output, issue.source);
  output << ",\"name\":";
  write_json_string(output, issue.name);
  output << ",\"code\":" << issue.code << ",\"message\":";
  write_json_string(output, issue.message);
  output << '}';
}

template <typename T, typename ValueWriter>
void write_observation(
    std::ostream& output,
    const ex01::Observation<T>& observation,
    ValueWriter write_value) {
  output << "{\"status\":";
  write_json_string(output, ex01::observation_status_name(observation.status));
  if (ex01::is_available(observation)) {
    output << ",\"value\":";
    write_value(*observation.value);
  } else if (observation.issue.has_value()) {
    output << ",\"error\":";
    write_issue(output, *observation.issue);
  }
  output << '}';
}

void write_version(std::ostream& output, const ex01::DecodedVersion& version) {
  output << "{\"encoded\":" << version.encoded
         << ",\"major\":" << version.major
         << ",\"minor\":" << version.minor << '}';
}

void write_environment_variable(
    std::ostream& output,
    const ex01::EnvironmentVariable& variable) {
  if (!variable.present) {
    output << "{\"status\":\"absent\"}";
    return;
  }
  output << "{\"status\":\"present\",\"value\":";
  write_json_string(output, variable.value);
  output << '}';
}

void write_properties(std::ostream& output, const DevicePropertiesValue& properties) {
  output << "{\"name\":";
  write_json_string(output, properties.name);
  output << ",\"uuid\":{\"encoding\":";
  write_json_string(output, kUuidEncoding);
  output << ",\"byteCount\":" << properties.uuid_byte_count << ",\"hex\":";
  write_json_string(output, properties.uuid_hex);
  output << "},\"globalMemoryBytes\":" << properties.global_memory_bytes << '}';
}

void write_device(std::ostream& output, const DeviceObservation& device) {
  output << "{\"ordinal\":" << device.ordinal << ",\"properties\":";
  write_observation(output, device.properties, [&output](const DevicePropertiesValue& value) {
    write_properties(output, value);
  });
  output << ",\"pciBusId\":";
  write_observation(output, device.pci_bus_id, [&output](const std::string& value) {
    write_json_string(output, value);
  });
  output << ",\"computeCapability\":{\"major\":";
  write_observation(output, device.compute_capability_major, [&output](int value) {
    output << value;
  });
  output << ",\"minor\":";
  write_observation(output, device.compute_capability_minor, [&output](int value) {
    output << value;
  });
  output << "}}";
}

bool report_is_complete(
    const ex01::Observation<std::string>& utc_time,
    const VersionQueries& versions,
    const DeviceInventory& inventory) {
  if (!ex01::is_available(utc_time) ||
      !ex01::is_available(versions.driver_supported_api) ||
      !ex01::is_available(versions.runtime) ||
      !ex01::is_available(inventory.visible_device_count)) {
    return false;
  }
  for (const DeviceObservation& device : inventory.devices) {
    if (!ex01::is_available(device.properties) ||
        !ex01::is_available(device.pci_bus_id) ||
        !ex01::is_available(device.compute_capability_major) ||
        !ex01::is_available(device.compute_capability_minor)) {
      return false;
    }
  }
  return true;
}

void write_report(
    std::ostream& output,
    const ex01::Observation<std::string>& utc_time,
    const NvccCoordinate& nvcc,
    const HostCompilerCoordinate& host_compiler,
    const ex01::EnvironmentVariable& visible_devices,
    const ex01::EnvironmentVariable& device_order,
    const VersionQueries& versions,
    const DeviceInventory& inventory) {
  output << "{\"schemaVersion\":1,\"generatedAtUtc\":";
  write_observation(output, utc_time, [&output](const std::string& value) {
    write_json_string(output, value);
  });
  output << ",\"build\":{\"languageStandard\":\"c++17\",\"cplusplus\":"
         << __cplusplus << ",\"nvcc\":{\"major\":" << nvcc.major
         << ",\"minor\":" << nvcc.minor << ",\"build\":" << nvcc.build
         << "},\"hostCompiler\":{\"family\":";
  write_json_string(output, host_compiler.family);
  output << ",\"major\":" << host_compiler.major
         << ",\"minor\":" << host_compiler.minor
         << ",\"patch\":" << host_compiler.patch << ",\"versionString\":";
  write_json_string(output, host_compiler.version_string);
  output << "},\"cudartLinkage\":";
  write_json_string(output, EX01_CUDART_LINKAGE);
  output << "},\"environment\":{\"CUDA_VISIBLE_DEVICES\":";
  write_environment_variable(output, visible_devices);
  output << ",\"CUDA_DEVICE_ORDER\":";
  write_environment_variable(output, device_order);
  output << "},\"cuda\":{\"driverSupportedApiVersion\":";
  write_observation(output, versions.driver_supported_api, [&output](const ex01::DecodedVersion& value) {
    write_version(output, value);
  });
  output << ",\"runtimeVersion\":";
  write_observation(output, versions.runtime, [&output](const ex01::DecodedVersion& value) {
    write_version(output, value);
  });
  output << ",\"visibleDeviceCount\":";
  write_observation(output, inventory.visible_device_count, [&output](int value) {
    output << value;
  });
  output << ",\"devices\":[";
  for (std::size_t index = 0; index < inventory.devices.size(); ++index) {
    if (index != 0U) output << ',';
    write_device(output, inventory.devices[index]);
  }
  output << "]}}\n";
}

void write_usage(std::ostream& output) {
  output << "Usage:\n"
         << "  ex01-environment-report --format=json\n"
         << "  ex01-environment-report --help\n";
}

}  // namespace

int main(int argc, char** argv) {
  if (argc == 2 && std::string_view(argv[1]) == "--help") {
    write_usage(std::cout);
    return 0;
  }
  if (argc != 2 || std::string_view(argv[1]) != "--format=json") {
    std::cerr << "Invalid command line. Use --help for usage.\n";
    return kInvalidCliExitCode;
  }

  const auto utc_time = query_utc_time();
  const NvccCoordinate nvcc = nvcc_coordinate();
  const HostCompilerCoordinate host_compiler = host_compiler_coordinate();
  const ex01::EnvironmentVariable visible_devices =
      query_environment_variable("CUDA_VISIBLE_DEVICES");
  const ex01::EnvironmentVariable device_order =
      query_environment_variable("CUDA_DEVICE_ORDER");
  const VersionQueries versions = query_cuda_versions();
  const DeviceInventory inventory = query_device_inventory();

  write_report(
      std::cout,
      utc_time,
      nvcc,
      host_compiler,
      visible_devices,
      device_order,
      versions,
      inventory);
  return report_is_complete(utc_time, versions, inventory)
      ? 0
      : kIncompleteObservationExitCode;
}
