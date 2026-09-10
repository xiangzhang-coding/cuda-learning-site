// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>
#include <cusparse.h>

#include <cstdio>
#include <iostream>
#include <stdexcept>
#include <string>

#include "cusparse_spmv_reference.hpp"

#if !defined(EX20_EXPECTED_CUSPARSE_MAJOR) || !defined(EX20_EXPECTED_CUSPARSE_MINOR) || \
    !defined(EX20_EXPECTED_CUSPARSE_PATCH) || !defined(EX20_EXPECTED_CUSPARSE_BUILD)
#error "EX20 requires an explicit four-part cuSPARSE component version"
#endif
#if !defined(CUSPARSE_VER_MAJOR) || !defined(CUSPARSE_VER_MINOR) || \
    !defined(CUSPARSE_VER_PATCH) || !defined(CUSPARSE_VER_BUILD)
#error "EX20 requires all four cuSPARSE header version macros"
#endif
#if CUSPARSE_VER_MAJOR != EX20_EXPECTED_CUSPARSE_MAJOR || CUSPARSE_VER_MINOR != EX20_EXPECTED_CUSPARSE_MINOR || \
    CUSPARSE_VER_PATCH != EX20_EXPECTED_CUSPARSE_PATCH || CUSPARSE_VER_BUILD != EX20_EXPECTED_CUSPARSE_BUILD
#error "EX20 cuSPARSE headers do not match the selected component profile"
#endif
#if !defined(CUSPARSE_VERSION) || \
    CUSPARSE_VERSION != CUSPARSE_VER_MAJOR * 1000 + CUSPARSE_VER_MINOR * 100 + CUSPARSE_VER_PATCH
#error "EX20 requires CUSPARSE_VERSION = major*1000 + minor*100 + patch"
#endif

namespace {

bool report(cudaError_t status, const char* operation) noexcept {
  if (status == cudaSuccess) return true;
  std::fprintf(stderr, "%s: %s (%d)\n", operation, cudaGetErrorString(status), static_cast<int>(status));
  return false;
}

bool report(cusparseStatus_t status, const char* operation) noexcept {
  if (status == CUSPARSE_STATUS_SUCCESS) return true;
  std::fprintf(stderr, "%s: %s (%d)\n", operation, cusparseGetErrorString(status), static_cast<int>(status));
  return false;
}

void check(cudaError_t status, const char* operation) {
  if (!report(status, operation)) throw std::runtime_error(operation);
}

void check(cusparseStatus_t status, const char* operation) {
  if (!report(status, operation)) throw std::runtime_error(operation);
}

struct Resources {
  cudaStream_t stream = nullptr;
  cusparseHandle_t handle = nullptr;
  cusparseSpMatDescr_t matrix = nullptr;
  cusparseDnVecDescr_t vector_x = nullptr, vector_y = nullptr;
  std::int32_t* offsets = nullptr;
  std::int32_t* columns = nullptr;
  float* values = nullptr;
  float* x = nullptr;
  float* y = nullptr;
  void* workspace = nullptr;
  std::size_t workspace_bytes = 0;

  Resources() = default;
  Resources(const Resources&) = delete;
  Resources& operator=(const Resources&) = delete;

  // [ex20-descriptors-workspace-start]
  void initialize() {
    check(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking), "create EX20 stream");
    check(cusparseCreate(&handle), "create cuSPARSE handle");
    check(cusparseSetStream(handle, stream), "associate EX20 stream");
    check(cusparseSetPointerMode(handle, CUSPARSE_POINTER_MODE_HOST), "set host scalar pointer mode");
    check(cudaMalloc(reinterpret_cast<void**>(&offsets), (ex20::kRows + 1) * sizeof(std::int32_t)), "allocate offsets");
    check(cudaMalloc(reinterpret_cast<void**>(&columns), ex20::kNnz * sizeof(std::int32_t)), "allocate columns");
    check(cudaMalloc(reinterpret_cast<void**>(&values), ex20::kNnz * sizeof(float)), "allocate values");
    check(cudaMalloc(reinterpret_cast<void**>(&x), ex20::kColumns * sizeof(float)), "allocate x");
    check(cudaMalloc(reinterpret_cast<void**>(&y), ex20::kRows * sizeof(float)), "allocate y");
    // Mutable descriptors are supported by all three lanes, including CUDA 11.8.
    check(cusparseCreateCsr(&matrix, ex20::kRows, ex20::kColumns, ex20::kNnz,
                           offsets, columns, values, CUSPARSE_INDEX_32I, CUSPARSE_INDEX_32I,
                           CUSPARSE_INDEX_BASE_ZERO, CUDA_R_32F), "create CSR descriptor");
    check(cusparseCreateDnVec(&vector_x, ex20::kColumns, x, CUDA_R_32F), "create x descriptor");
    check(cusparseCreateDnVec(&vector_y, ex20::kRows, y, CUDA_R_32F), "create y descriptor");
  }

  void prepare_workspace(const ex20::Fixture& fixture) {
    std::size_t required = 0;
    check(cusparseSpMV_bufferSize(handle, CUSPARSE_OPERATION_NON_TRANSPOSE, &fixture.alpha,
                                 matrix, vector_x, &fixture.beta, vector_y, CUDA_R_32F,
                                 CUSPARSE_SPMV_CSR_ALG2, &required), "query SpMV workspace");
    constexpr std::size_t fixed_bytes =
        (ex20::kRows + 1 + ex20::kNnz) * sizeof(std::int32_t) +
        (ex20::kNnz + ex20::kColumns + ex20::kRows) * sizeof(float);
    if (required > 8000000000ULL - fixed_bytes)
      throw std::runtime_error("workspace exceeds EX20 problem-memory budget");
    // Previous work has completed before workspace replacement or reuse.
    if (required != workspace_bytes) {
      if (workspace != nullptr) {
        check(cudaFree(workspace), "free previous workspace");
        workspace = nullptr;
      }
      workspace_bytes = 0;
      if (required != 0) check(cudaMalloc(&workspace, required), "allocate caller workspace");
      workspace_bytes = required;
    }
    std::cout << fixture.id << " rows=4 columns=5 nnz=7 index_base=0 index_type=int32 precision=FP32"
              << " operation=NON_TRANSPOSE algorithm=CUSPARSE_SPMV_CSR_ALG2 pointer_mode=HOST"
              << " alpha=" << fixture.alpha << " beta=" << fixture.beta
              << " fixed_device_bytes=" << fixed_bytes << " workspace_bytes=" << required << '\n';
  }
  // [ex20-descriptors-workspace-end]

  // [ex20-stream-lifecycle-start]
  void execute(const ex20::Fixture& fixture, std::vector<float>& host_output) {
    check(cudaMemcpyAsync(offsets, fixture.row_offsets.data(), (ex20::kRows + 1) * sizeof(std::int32_t),
                          cudaMemcpyHostToDevice, stream), "offsets H2D");
    check(cudaMemcpyAsync(columns, fixture.column_indices.data(), ex20::kNnz * sizeof(std::int32_t),
                          cudaMemcpyHostToDevice, stream), "columns H2D");
    check(cudaMemcpyAsync(values, fixture.values.data(), ex20::kNnz * sizeof(float),
                          cudaMemcpyHostToDevice, stream), "values H2D");
    check(cudaMemcpyAsync(x, fixture.x.data(), ex20::kColumns * sizeof(float),
                          cudaMemcpyHostToDevice, stream), "x H2D");
    // Reset y from this fixture, not from a previous SpMV result, even when beta=0.
    check(cudaMemcpyAsync(y, fixture.y.data(), ex20::kRows * sizeof(float),
                          cudaMemcpyHostToDevice, stream), "reset y H2D");
    check(cudaStreamSynchronize(stream), "inputs ready before workspace query");
    prepare_workspace(fixture);
    check(cusparseSpMV(handle, CUSPARSE_OPERATION_NON_TRANSPOSE, &fixture.alpha,
                       matrix, vector_x, &fixture.beta, vector_y, CUDA_R_32F,
                       CUSPARSE_SPMV_CSR_ALG2, workspace), "execute SpMV");
    check(cudaMemcpyAsync(host_output.data(), y, ex20::kRows * sizeof(float),
                          cudaMemcpyDeviceToHost, stream), "y D2H");
    check(cudaStreamSynchronize(stream), "SpMV completion before validation/reuse");
  }

  bool close() noexcept {
    bool ok = true;
    // Drain partial submissions while fixtures, scalars, and transfer buffers live.
    // Attempt every release, even if synchronization or another release fails.
    if (stream != nullptr) ok = report(cudaStreamSynchronize(stream), "cleanup stream sync") && ok;
    for (auto* descriptor : {&vector_y, &vector_x}) {
      if (*descriptor != nullptr) {
        ok = report(cusparseDestroyDnVec(*descriptor), "destroy dense vector descriptor") && ok;
        *descriptor = nullptr;
      }
    }
    if (matrix != nullptr) {
      ok = report(cusparseDestroySpMat(matrix), "destroy CSR descriptor") && ok;
      matrix = nullptr;
    }
    if (handle != nullptr) {
      ok = report(cusparseDestroy(handle), "destroy cuSPARSE handle") && ok;
      handle = nullptr;
    }
    if (workspace != nullptr) {
      ok = report(cudaFree(workspace), "free caller workspace") && ok;
      workspace = nullptr;
    }
    workspace_bytes = 0;
    for (auto* pointer : {&y, &x, &values}) {
      if (*pointer != nullptr) {
        ok = report(cudaFree(*pointer), "free FP32 device buffer") && ok;
        *pointer = nullptr;
      }
    }
    for (auto* pointer : {&columns, &offsets}) {
      if (*pointer != nullptr) {
        ok = report(cudaFree(*pointer), "free CSR index buffer") && ok;
        *pointer = nullptr;
      }
    }
    if (stream != nullptr) {
      ok = report(cudaStreamDestroy(stream), "destroy EX20 stream") && ok;
      stream = nullptr;
    }
    return ok;
  }

  ~Resources() noexcept { close(); }
  // [ex20-stream-lifecycle-end]
};

}  // namespace

int main() {
  try {
    // These owners outlive cleanup, including exceptions during partial enqueue.
    const auto fixtures = ex20::fixtures();
    std::vector<float> host_output(ex20::kRows);
    Resources resources;
    int exit_status = 0;
    try {
      int count = 0;
      check(cudaGetDeviceCount(&count), "device count");
      if (count < 1) throw std::runtime_error("one CUDA device is required");
      check(cudaSetDevice(0), "select device 0");
      cudaDeviceProp device{};
      check(cudaGetDeviceProperties(&device, 0), "device properties");
      if (device.major * 10 + device.minor < 75)
        throw std::runtime_error("EX20 requires compute capability 7.5 or newer");
      int driver = 0, runtime = 0;
      check(cudaDriverGetVersion(&driver), "driver CUDA API level");
      check(cudaRuntimeGetVersion(&runtime), "runtime CUDA API level");
      std::cout << "device=" << device.name << " cc=" << device.major << '.' << device.minor
                << " visible_devices=" << count << " selected_device=0"
                << " driver_cuda_api_level=" << driver << " runtime_cuda_api_level=" << runtime
                << " cudart_header_api_level=" << CUDART_VERSION
                << " package_versions=record-separately-in-environment-manifest\n";
      resources.initialize();
      int major = 0, minor = 0, patch = 0, raw_version = 0;
      check(cusparseGetProperty(MAJOR_VERSION, &major), "loaded cuSPARSE major");
      check(cusparseGetProperty(MINOR_VERSION, &minor), "loaded cuSPARSE minor");
      check(cusparseGetProperty(PATCH_LEVEL, &patch), "loaded cuSPARSE patch");
      check(cusparseGetVersion(resources.handle, &raw_version), "loaded cuSPARSE raw version");
      std::cout << "cuSPARSE headers=" << CUSPARSE_VER_MAJOR << '.' << CUSPARSE_VER_MINOR << '.'
                << CUSPARSE_VER_PATCH << '.' << CUSPARSE_VER_BUILD << " header_raw=" << CUSPARSE_VERSION
                << " loaded=" << major << '.' << minor << '.' << patch << " loaded_raw=" << raw_version
                << " comparison_granularity=major.minor.patch loaded_build=not-exposed-by-API\n";
      if (major != CUSPARSE_VER_MAJOR || minor != CUSPARSE_VER_MINOR || patch != CUSPARSE_VER_PATCH)
        throw std::runtime_error("loaded cuSPARSE version differs from header profile");

      for (const auto& fixture : fixtures) {
        const auto reference = ex20::spmv(fixture);
        if (!ex20::matches(fixture.expected, reference))
          throw std::runtime_error("CPU CSR oracle disagrees with literal result");
        resources.execute(fixture, host_output);
        const std::vector<double> actual(host_output.begin(), host_output.end());
        if (!ex20::matches(reference, actual))
          throw std::runtime_error(std::string(fixture.id) + " finite full-output SpMV tolerance failure");
        std::cout << fixture.id << " checked_outputs=4 correctness: pass\n";
      }
    } catch (const std::exception& error) {
      std::cerr << "EX20 failed: " << error.what() << '\n';
      exit_status = 1;
    }
    if (!resources.close()) exit_status = 1;
    return exit_status;
  } catch (const std::exception& error) {
    std::cerr << "EX20 host allocation failure: " << error.what() << '\n';
    return 1;
  }
}
