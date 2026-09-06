// SPDX-License-Identifier: Apache-2.0
#include <cuda_runtime.h>
#include <cublas_v2.h>

#include <cstdio>
#include <exception>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <vector>

#include "cublas_gemm_reference.hpp"

#if !defined(EX18_EXPECTED_CUBLAS_MAJOR) || !defined(EX18_EXPECTED_CUBLAS_MINOR) || \
    !defined(EX18_EXPECTED_CUBLAS_PATCH) || !defined(EX18_EXPECTED_CUBLAS_BUILD)
#error "EX18 requires an explicit four-part cuBLAS component version"
#endif
#if !defined(CUBLAS_VER_MAJOR) || !defined(CUBLAS_VER_MINOR) || \
    !defined(CUBLAS_VER_PATCH) || !defined(CUBLAS_VER_BUILD)
#error "EX18 requires all four cuBLAS header version macros"
#endif
#if CUBLAS_VER_MAJOR != EX18_EXPECTED_CUBLAS_MAJOR || \
    CUBLAS_VER_MINOR != EX18_EXPECTED_CUBLAS_MINOR || \
    CUBLAS_VER_PATCH != EX18_EXPECTED_CUBLAS_PATCH || \
    CUBLAS_VER_BUILD != EX18_EXPECTED_CUBLAS_BUILD
#error "EX18 cuBLAS headers do not match the selected component profile"
#endif

namespace {

bool report(cudaError_t status, const char* operation) noexcept {
  if (status == cudaSuccess) return true;
  std::fprintf(stderr, "%s: %s (%d)\n", operation, cudaGetErrorString(status),
               static_cast<int>(status));
  return false;
}

bool report(cublasStatus_t status, const char* operation) noexcept {
  if (status == CUBLAS_STATUS_SUCCESS) return true;
  std::fprintf(stderr, "%s: cuBLAS status %d\n", operation, static_cast<int>(status));
  return false;
}

void check(cudaError_t status, const char* operation) {
  if (!report(status, operation)) throw std::runtime_error(operation);
}

void check(cublasStatus_t status, const char* operation) {
  if (!report(status, operation)) throw std::runtime_error(operation);
}

// [ex18-stream-lifecycle-start]
struct Resources {
  cudaStream_t stream = nullptr;
  cublasHandle_t handle = nullptr;
  float* a = nullptr;
  float* b = nullptr;
  float* c = nullptr;

  Resources() = default;
  Resources(const Resources&) = delete;
  Resources& operator=(const Resources&) = delete;

  void initialize(std::size_t a_count, std::size_t b_count, std::size_t c_count) {
    check(cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking), "create stream");
    check(cublasCreate(&handle), "create cuBLAS handle");
    // Set the stream before any workspace configuration: this resets its pool.
    // EX18 retains the library-owned default workspace, not a user buffer.
    check(cublasSetStream(handle, stream), "set cuBLAS stream");
    check(cublasSetPointerMode(handle, CUBLAS_POINTER_MODE_HOST), "set host scalars");
    check(cublasSetMathMode(handle, CUBLAS_DEFAULT_MATH), "set default math mode");
    check(cudaMalloc(reinterpret_cast<void**>(&a), a_count * sizeof(float)), "allocate A");
    check(cudaMalloc(reinterpret_cast<void**>(&b), b_count * sizeof(float)), "allocate B");
    check(cudaMalloc(reinterpret_cast<void**>(&c), c_count * sizeof(float)), "allocate C");
  }

  bool close() noexcept {
    bool ok = true;
    // Even partial submission failures must drain before buffer lifetimes end.
    // Do not short-circuit: try every release and report every failure.
    if (stream != nullptr) ok = report(cudaStreamSynchronize(stream), "cleanup stream sync") && ok;
    if (handle != nullptr) {
      ok = report(cublasDestroy(handle), "destroy cuBLAS handle") && ok;
      handle = nullptr;
    }
    for (float** pointer : {&c, &b, &a}) {
      if (*pointer != nullptr) {
        ok = report(cudaFree(*pointer), "free device matrix") && ok;
        *pointer = nullptr;
      }
    }
    if (stream != nullptr) {
      ok = report(cudaStreamDestroy(stream), "destroy stream") && ok;
      stream = nullptr;
    }
    return ok;
  }

  ~Resources() noexcept { close(); }
};
// [ex18-stream-lifecycle-end]

}  // namespace

int main() {
  try {
    // Capacities cover all three fixtures; these host buffers outlive Resources.
    std::vector<float> a(1024), b(1085), initial(1155), actual(1155);
    std::vector<double> expected(1155);
    Resources resources;
    int exit_status = 0;
    try {
      int major = 0, minor = 0, patch = 0, raw_version = 0;
      check(cublasGetProperty(MAJOR_VERSION, &major), "loaded cuBLAS major");
      check(cublasGetProperty(MINOR_VERSION, &minor), "loaded cuBLAS minor");
      check(cublasGetProperty(PATCH_LEVEL, &patch), "loaded cuBLAS patch");
      check(cublasGetVersion(nullptr, &raw_version), "loaded cuBLAS raw version");
      std::cout << "cuBLAS headers=" << CUBLAS_VER_MAJOR << '.' << CUBLAS_VER_MINOR
                << '.' << CUBLAS_VER_PATCH << '.' << CUBLAS_VER_BUILD
                << " loaded=" << major << '.' << minor << '.' << patch
                << " loaded_raw=" << raw_version << " loaded_build=not-exposed-by-API\n";
      if (major != CUBLAS_VER_MAJOR || minor != CUBLAS_VER_MINOR || patch != CUBLAS_VER_PATCH)
        throw std::runtime_error("loaded cuBLAS version differs from header profile");

      int count = 0;
      check(cudaGetDeviceCount(&count), "device count");
      if (count < 1) throw std::runtime_error("one CUDA device is required");
      check(cudaSetDevice(0), "select device 0");
      cudaDeviceProp device{};
      check(cudaGetDeviceProperties(&device, 0), "device properties");
      if (device.major * 10 + device.minor < 75)
        throw std::runtime_error("EX18 requires compute capability 7.5 or newer");
      int driver = 0, runtime = 0;
      check(cudaDriverGetVersion(&driver), "driver version");
      check(cudaRuntimeGetVersion(&runtime), "runtime version");
      std::cout << "device=" << device.name << " cc=" << device.major << '.' << device.minor
                << " driver=" << driver << " runtime=" << runtime
                << " matrices=CUDA_R_32F compute=CUBLAS_COMPUTE_32F_PEDANTIC"
                << " math=CUBLAS_DEFAULT_MATH pointer_mode=host\n";
      resources.initialize(a.size(), b.size(), initial.size());

      for (const ex18::Fixture& fixture : ex18::kFixtures) {
        const auto shape = fixture.shape;
        std::size_t na = 0, nb = 0, nc = 0;
        if (!ex18::matrix_counts(shape, &na, &nb, &nc) ||
            na > a.size() || nb > b.size() || nc > initial.size() ||
            shape.m > static_cast<std::size_t>(std::numeric_limits<int>::max()) ||
            shape.k > static_cast<std::size_t>(std::numeric_limits<int>::max()) ||
            shape.n > static_cast<std::size_t>(std::numeric_limits<int>::max()))
          throw std::runtime_error("fixture exceeds allocated capacity or cuBLAS int extents");
        if (!ex18::make_fixture(fixture.id, a.data(), na, b.data(), nb, initial.data(), nc) ||
            !ex18::gemm_reference(a.data(), na, b.data(), nb, initial.data(), nc,
                                  shape, fixture.alpha, fixture.beta, expected.data(), nc))
          throw std::runtime_error("invalid CPU fixture/reference");
        if (fixture.id == "2x3x2-hand" &&
            (expected[0] != 22 || expected[1] != 28 || expected[2] != 49 || expected[3] != 64))
          throw std::runtime_error("CPU reference failed literal hand case");

        check(cudaMemcpyAsync(resources.a, a.data(), na * sizeof(float),
                              cudaMemcpyHostToDevice, resources.stream), "copy A H2D");
        check(cudaMemcpyAsync(resources.b, b.data(), nb * sizeof(float),
                              cudaMemcpyHostToDevice, resources.stream), "copy B H2D");
        // Restore the original C before EVERY GEMM, including beta != 0.
        check(cudaMemcpyAsync(resources.c, initial.data(), nc * sizeof(float),
                              cudaMemcpyHostToDevice, resources.stream), "copy initial C H2D");

        // [ex18-gemm-call-start]
        const int m = static_cast<int>(shape.m);
        const int k = static_cast<int>(shape.k);
        const int n = static_cast<int>(shape.n);
        const float alpha = fixture.alpha;
        const float beta = fixture.beta;
        // Row-major C = alpha*A*B + beta*C is column-major
        // C^T = alpha*B^T*A^T + beta*C^T on the SAME bytes, without copies.
        // cuBLAS dimensions: (n,m,k); first B has ld=n, second A has ld=k.
        check(cublasGemmEx(
                  resources.handle, CUBLAS_OP_N, CUBLAS_OP_N, n, m, k,
                  &alpha, resources.b, CUDA_R_32F, n,
                  resources.a, CUDA_R_32F, k,
                  &beta, resources.c, CUDA_R_32F, n,
                  CUBLAS_COMPUTE_32F_PEDANTIC, CUBLAS_GEMM_DEFAULT),
              "cublasGemmEx");
        // [ex18-gemm-call-end]

        check(cudaMemcpyAsync(actual.data(), resources.c, nc * sizeof(float),
                              cudaMemcpyDeviceToHost, resources.stream), "copy C D2H");
        check(cudaStreamSynchronize(resources.stream), "GEMM completion before CPU check");
        const auto result = ex18::verify_tolerance(
            expected.data(), nc, actual.data(), nc, shape.m, shape.n,
            ex18::kAbsoluteTolerance, ex18::kRelativeTolerance);
        if (!result.valid) throw std::runtime_error("invalid/nonfinite GEMM output");
        if (!result.matches) {
          std::cerr << fixture.id << " mismatch row=" << result.row
                    << " column=" << result.column << " cpu=" << result.reference
                    << " gpu=" << result.candidate << " error=" << result.absolute_error
                    << " allowed=" << result.allowed_error << '\n';
          throw std::runtime_error("GEMM tolerance failure");
        }
        std::cout << fixture.id << " alpha=" << alpha << " beta=" << beta
                  << " checked=" << nc << " correctness: pass\n";
      }
    } catch (const std::exception& error) {
      std::cerr << "EX18 failed: " << error.what() << '\n';
      exit_status = 1;
    }
    if (!resources.close()) exit_status = 1;
    return exit_status;
  } catch (const std::exception& error) {
    std::cerr << "EX18 host allocation failure: " << error.what() << '\n';
    return 1;
  }
}
