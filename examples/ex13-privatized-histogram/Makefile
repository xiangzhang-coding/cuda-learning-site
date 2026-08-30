# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
DIALECT ?= c++17
BUILD_DIR ?= build

NVCC_ARCH := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
NVCC_FLAGS := --std=$(DIALECT) $(NVCC_ARCH) -Iinclude
HOST_FLAGS := -Wall -Wextra -Wpedantic -Iinclude

.PHONY: all clean preprocess compile link inspect host-test

all: link

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

preprocess: $(BUILD_DIR)/privatized_histogram.ii

$(BUILD_DIR)/privatized_histogram.ii: src/privatized_histogram.cu include/privatized_histogram_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/privatized_histogram.cu -o $@

compile: $(BUILD_DIR)/privatized_histogram.o

$(BUILD_DIR)/privatized_histogram.o: src/privatized_histogram.cu include/privatized_histogram_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/privatized_histogram.cu -o $@

link: $(BUILD_DIR)/ex13-privatized-histogram

$(BUILD_DIR)/ex13-privatized-histogram: $(BUILD_DIR)/privatized_histogram.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

inspect: $(BUILD_DIR)/ex13-privatized-histogram
	cuobjdump --list-elf $< > $(BUILD_DIR)/cubin-list.txt
	cuobjdump --dump-ptx $< > $(BUILD_DIR)/ptx-dump.txt
	grep -Eq 'sm_75' $(BUILD_DIR)/cubin-list.txt
	grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' $(BUILD_DIR)/ptx-dump.txt

host-test: $(BUILD_DIR)/host_reference_test
	$(BUILD_DIR)/host_reference_test

$(BUILD_DIR)/host_reference_test: tests/host_reference_test.cpp include/privatized_histogram_reference.hpp | $(BUILD_DIR)
	$(CXX) --std=$(DIALECT) $(HOST_FLAGS) tests/host_reference_test.cpp -o $@

clean:
	rm -rf $(BUILD_DIR)
