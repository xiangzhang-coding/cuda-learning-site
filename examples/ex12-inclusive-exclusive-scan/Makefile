# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
DIALECT ?= c++17
BUILD_DIR ?= build

NVCC_ARCH := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
NVCC_FLAGS := --std=$(DIALECT) $(NVCC_ARCH) -Iinclude
HOST_WARNINGS := -Wall -Wextra -Wpedantic

.PHONY: all clean preprocess compile link inspect host-test

all: link

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

preprocess: $(BUILD_DIR)/inclusive_exclusive_scan.ii

$(BUILD_DIR)/inclusive_exclusive_scan.ii: src/inclusive_exclusive_scan.cu include/inclusive_exclusive_scan_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/inclusive_exclusive_scan.cu -o $@

compile: $(BUILD_DIR)/inclusive_exclusive_scan.o

$(BUILD_DIR)/inclusive_exclusive_scan.o: src/inclusive_exclusive_scan.cu include/inclusive_exclusive_scan_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/inclusive_exclusive_scan.cu -o $@

link: $(BUILD_DIR)/ex12-inclusive-exclusive-scan

$(BUILD_DIR)/ex12-inclusive-exclusive-scan: $(BUILD_DIR)/inclusive_exclusive_scan.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

inspect: $(BUILD_DIR)/ex12-inclusive-exclusive-scan
	cuobjdump --list-elf $< > $(BUILD_DIR)/cubin-list.txt
	cuobjdump --dump-ptx $< > $(BUILD_DIR)/ptx-dump.txt
	grep -Eq 'sm_75' $(BUILD_DIR)/cubin-list.txt
	grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' $(BUILD_DIR)/ptx-dump.txt

host-test: $(BUILD_DIR)/host_reference_test
	$(BUILD_DIR)/host_reference_test

$(BUILD_DIR)/host_reference_test: tests/host_reference_test.cpp include/inclusive_exclusive_scan_reference.hpp | $(BUILD_DIR)
	$(CXX) -std=$(DIALECT) $(HOST_WARNINGS) -Iinclude tests/host_reference_test.cpp -o $@

clean:
	rm -rf $(BUILD_DIR)
