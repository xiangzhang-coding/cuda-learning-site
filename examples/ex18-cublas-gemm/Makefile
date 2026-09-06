# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
READELF ?= readelf
LDD ?= ldd
DIALECT ?= c++17
BUILD_DIR ?= build
EXPECTED_CUBLAS_VERSION ?=

VERSION_PARTS := $(subst ., ,$(EXPECTED_CUBLAS_VERSION))
NVCC_ARCH := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
NVCC_FLAGS := --std=$(DIALECT) $(NVCC_ARCH) -Iinclude \
	-DEX18_EXPECTED_CUBLAS_MAJOR=$(word 1,$(VERSION_PARTS)) \
	-DEX18_EXPECTED_CUBLAS_MINOR=$(word 2,$(VERSION_PARTS)) \
	-DEX18_EXPECTED_CUBLAS_PATCH=$(word 3,$(VERSION_PARTS)) \
	-DEX18_EXPECTED_CUBLAS_BUILD=$(word 4,$(VERSION_PARTS))
LINK_FLAGS := -lcublas
HOST_FLAGS := -Wall -Wextra -Wpedantic -Iinclude
CUDA_CONFIG_STAMP := $(BUILD_DIR)/.cuda-build-config
HOST_CONFIG_STAMP := $(BUILD_DIR)/.host-build-config

.NOTPARALLEL:
.PHONY: all clean check-cublas-config check-cuda-build-config check-host-build-config preprocess compile link inspect host-test
all: link

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

check-cublas-config:
	@test "$(DIALECT)" = c++17 || { printf 'EX18 declares only c++17\n' >&2; exit 2; }
	@printf '%s\n' "$(EXPECTED_CUBLAS_VERSION)" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$$' || \
		{ printf 'EXPECTED_CUBLAS_VERSION must have four decimal components\n' >&2; exit 2; }

check-cuda-build-config: | $(BUILD_DIR)
	@tmp="$(CUDA_CONFIG_STAMP).tmp"; \
	printf '%s\n' "NVCC=$(NVCC)" "NVCC_FLAGS=$(NVCC_FLAGS)" "LINK_FLAGS=$(LINK_FLAGS)" > "$$tmp"; \
	if [ -r "$(CUDA_CONFIG_STAMP)" ] && cmp -s "$$tmp" "$(CUDA_CONFIG_STAMP)"; then \
		rm -f "$$tmp"; \
	else \
		rm -f $(BUILD_DIR)/cublas_gemm.ii $(BUILD_DIR)/cublas_gemm.o \
			$(BUILD_DIR)/ex18-cublas-gemm $(BUILD_DIR)/dynamic-section.txt $(BUILD_DIR)/dynamic-linkage.txt; \
		mv "$$tmp" "$(CUDA_CONFIG_STAMP)"; \
	fi

check-host-build-config: | $(BUILD_DIR)
	@test "$(DIALECT)" = c++17 || { printf 'EX18 declares only c++17\n' >&2; exit 2; }
	@tmp="$(HOST_CONFIG_STAMP).tmp"; \
	printf '%s\n' "CXX=$(CXX)" "DIALECT=$(DIALECT)" "HOST_FLAGS=$(HOST_FLAGS)" > "$$tmp"; \
	if [ -r "$(HOST_CONFIG_STAMP)" ] && cmp -s "$$tmp" "$(HOST_CONFIG_STAMP)"; then \
		rm -f "$$tmp"; \
	else \
		rm -f $(BUILD_DIR)/host_reference_test; \
		mv "$$tmp" "$(HOST_CONFIG_STAMP)"; \
	fi

preprocess: check-cublas-config check-cuda-build-config $(BUILD_DIR)/cublas_gemm.ii
$(BUILD_DIR)/cublas_gemm.ii: src/cublas_gemm.cu include/cublas_gemm_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/cublas_gemm.cu -o $@

compile: check-cublas-config check-cuda-build-config $(BUILD_DIR)/cublas_gemm.o
$(BUILD_DIR)/cublas_gemm.o: src/cublas_gemm.cu include/cublas_gemm_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/cublas_gemm.cu -o $@

link: check-cublas-config check-cuda-build-config $(BUILD_DIR)/ex18-cublas-gemm
$(BUILD_DIR)/ex18-cublas-gemm: $(BUILD_DIR)/cublas_gemm.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< $(LINK_FLAGS) -o $@

inspect: check-cublas-config check-cuda-build-config $(BUILD_DIR)/ex18-cublas-gemm
	$(READELF) -d $(BUILD_DIR)/ex18-cublas-gemm > $(BUILD_DIR)/dynamic-section.txt
	grep -Eq 'NEEDED.*\[libcublas\.so\.' $(BUILD_DIR)/dynamic-section.txt
	$(LDD) $(BUILD_DIR)/ex18-cublas-gemm > $(BUILD_DIR)/dynamic-linkage.txt
	grep -Eq 'libcublas\.so\.[0-9]+ => /' $(BUILD_DIR)/dynamic-linkage.txt
	! grep -q 'not found' $(BUILD_DIR)/dynamic-linkage.txt

host-test: check-host-build-config $(BUILD_DIR)/host_reference_test
	$(BUILD_DIR)/host_reference_test
$(BUILD_DIR)/host_reference_test: tests/host_reference_test.cpp include/cublas_gemm_reference.hpp | $(BUILD_DIR)
	$(CXX) --std=$(DIALECT) $(HOST_FLAGS) tests/host_reference_test.cpp -o $@

clean:
	rm -rf $(BUILD_DIR)
