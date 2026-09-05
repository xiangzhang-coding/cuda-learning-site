# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
CUOBJDUMP ?= cuobjdump
DIALECT ?= c++17
BUILD_DIR ?= build
COMPONENT_MODE ?= bundled
EXPECTED_CUB_VERSION ?=
CCCL_ROOT ?=
BUNDLED_INCLUDE_ROOT ?= /usr/local/cuda/include

NVCC_ARCH := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
SELECTED_INCLUDE_FLAGS := -I$(CCCL_ROOT)/cub -I$(CCCL_ROOT)/thrust \
	-I$(CCCL_ROOT)/libcudacxx/include
BUNDLED_INCLUDE_FLAGS := -I$(BUNDLED_INCLUDE_ROOT)
COMPONENT_INCLUDE_FLAGS = $(if $(filter selected,$(COMPONENT_MODE)),$(SELECTED_INCLUDE_FLAGS),$(BUNDLED_INCLUDE_FLAGS))
NVCC_FLAGS := --std=$(DIALECT) $(NVCC_ARCH) -Iinclude \
	$(COMPONENT_INCLUDE_FLAGS) -DEX17_EXPECTED_CUB_VERSION=$(EXPECTED_CUB_VERSION)
HOST_FLAGS := -Wall -Wextra -Wpedantic -Iinclude
CONFIG_STAMP := $(BUILD_DIR)/.build-config

.NOTPARALLEL:
.PHONY: all clean check-build-config check-cub-config preprocess compile link inspect host-test

all: link

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

check-build-config: | $(BUILD_DIR)
	@tmp="$(CONFIG_STAMP).tmp"; \
	{ \
		printf '%s\n' "NVCC=$(NVCC)" "CXX=$(CXX)" "DIALECT=$(DIALECT)"; \
		printf '%s\n' "COMPONENT_MODE=$(COMPONENT_MODE)" "EXPECTED_CUB_VERSION=$(EXPECTED_CUB_VERSION)"; \
		printf '%s\n' "CCCL_ROOT=$(CCCL_ROOT)" "BUNDLED_INCLUDE_ROOT=$(BUNDLED_INCLUDE_ROOT)"; \
		printf '%s\n' "NVCC_FLAGS=$(NVCC_FLAGS)" "NVCC_ARCH=$(NVCC_ARCH)" "HOST_FLAGS=$(HOST_FLAGS)"; \
	} > "$$tmp"; \
	if [ -r "$(CONFIG_STAMP)" ] && cmp -s "$$tmp" "$(CONFIG_STAMP)"; then \
		rm -f "$$tmp"; \
	else \
		rm -f $(BUILD_DIR)/cub_device_reduction_scan.ii \
			$(BUILD_DIR)/cub_device_reduction_scan.o \
			$(BUILD_DIR)/ex17-cub-device-reduction-scan \
			$(BUILD_DIR)/host_reference_test; \
		mv "$$tmp" "$(CONFIG_STAMP)"; \
	fi

check-cub-config:
	@case "$(EXPECTED_CUB_VERSION)" in \
		''|*[!0-9]*) printf 'EXPECTED_CUB_VERSION must be a decimal CUB_VERSION value\n' >&2; exit 2 ;; \
	esac
	@if [ "$(COMPONENT_MODE)" = selected ]; then \
		if [ -z "$(CCCL_ROOT)" ]; then \
			printf 'CCCL_ROOT is required when COMPONENT_MODE=selected\n' >&2; exit 2; \
		fi; \
		for root in "$(CCCL_ROOT)/cub" "$(CCCL_ROOT)/thrust" "$(CCCL_ROOT)/libcudacxx/include"; do \
			if [ ! -d "$$root" ]; then printf 'Missing selected CCCL include root: %s\n' "$$root" >&2; exit 2; fi; \
		done; \
	elif [ "$(COMPONENT_MODE)" = bundled ]; then \
		if [ ! -d "$(BUNDLED_INCLUDE_ROOT)" ]; then \
			printf 'Missing bundled CUDA include root: %s\n' "$(BUNDLED_INCLUDE_ROOT)" >&2; exit 2; \
		fi; \
	else \
		printf 'COMPONENT_MODE must be bundled or selected: %s\n' "$(COMPONENT_MODE)" >&2; exit 2; \
	fi

preprocess: check-cub-config check-build-config $(BUILD_DIR)/cub_device_reduction_scan.ii

$(BUILD_DIR)/cub_device_reduction_scan.ii: src/cub_device_reduction_scan.cu include/cub_device_reduction_scan_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/cub_device_reduction_scan.cu -o $@

compile: check-cub-config check-build-config $(BUILD_DIR)/cub_device_reduction_scan.o

$(BUILD_DIR)/cub_device_reduction_scan.o: src/cub_device_reduction_scan.cu include/cub_device_reduction_scan_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/cub_device_reduction_scan.cu -o $@

link: check-cub-config check-build-config $(BUILD_DIR)/ex17-cub-device-reduction-scan

$(BUILD_DIR)/ex17-cub-device-reduction-scan: $(BUILD_DIR)/cub_device_reduction_scan.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

inspect: check-cub-config check-build-config $(BUILD_DIR)/ex17-cub-device-reduction-scan
	$(CUOBJDUMP) --list-elf $< > $(BUILD_DIR)/cubin-list.txt
	$(CUOBJDUMP) --dump-ptx $< > $(BUILD_DIR)/ptx-dump.txt
	grep -Eq 'sm_75' $(BUILD_DIR)/cubin-list.txt
	grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' $(BUILD_DIR)/ptx-dump.txt

host-test: check-build-config $(BUILD_DIR)/host_reference_test
	$(BUILD_DIR)/host_reference_test

$(BUILD_DIR)/host_reference_test: tests/host_reference_test.cpp include/cub_device_reduction_scan_reference.hpp | $(BUILD_DIR)
	$(CXX) --std=$(DIALECT) $(HOST_FLAGS) tests/host_reference_test.cpp -o $@

clean:
	rm -rf $(BUILD_DIR)
