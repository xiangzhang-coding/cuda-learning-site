# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
DIALECT ?= c++17
BUILD_DIR ?= build

NVCC_ARCH := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
NVCC_FLAGS := --std=$(DIALECT) $(NVCC_ARCH) -Iinclude
HOST_FLAGS := --std=$(DIALECT) -Wall -Wextra -Wpedantic -Iinclude

.PHONY: all clean preprocess compile link inspect host-test

all: link

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

preprocess: $(BUILD_DIR)/vector_add.ii

$(BUILD_DIR)/vector_add.ii: src/vector_add.cu include/vector_add_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/vector_add.cu -o $@

compile: $(BUILD_DIR)/vector_add.o

$(BUILD_DIR)/vector_add.o: src/vector_add.cu include/vector_add_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/vector_add.cu -o $@

link: $(BUILD_DIR)/ex02-vector-addition

$(BUILD_DIR)/ex02-vector-addition: $(BUILD_DIR)/vector_add.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

inspect: $(BUILD_DIR)/ex02-vector-addition
	cuobjdump --list-elf $< > $(BUILD_DIR)/cubin-list.txt
	cuobjdump --dump-ptx $< > $(BUILD_DIR)/ptx-dump.txt
	grep -Eq 'sm_75' $(BUILD_DIR)/cubin-list.txt
	grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' $(BUILD_DIR)/ptx-dump.txt

host-test: $(BUILD_DIR)/host_reference_test
	$(BUILD_DIR)/host_reference_test

$(BUILD_DIR)/host_reference_test: tests/host_reference_test.cpp include/vector_add_reference.hpp | $(BUILD_DIR)
	$(CXX) $(HOST_FLAGS) tests/host_reference_test.cpp -o $@

clean:
	rm -rf $(BUILD_DIR)
