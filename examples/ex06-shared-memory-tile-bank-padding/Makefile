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

preprocess: $(BUILD_DIR)/shared_memory_tile_bank_padding.ii

$(BUILD_DIR)/shared_memory_tile_bank_padding.ii: src/shared_memory_tile_bank_padding.cu include/shared_memory_tile_bank_padding_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/shared_memory_tile_bank_padding.cu -o $@

compile: $(BUILD_DIR)/shared_memory_tile_bank_padding.o

$(BUILD_DIR)/shared_memory_tile_bank_padding.o: src/shared_memory_tile_bank_padding.cu include/shared_memory_tile_bank_padding_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/shared_memory_tile_bank_padding.cu -o $@

link: $(BUILD_DIR)/ex06-shared-memory-tile-bank-padding

$(BUILD_DIR)/ex06-shared-memory-tile-bank-padding: $(BUILD_DIR)/shared_memory_tile_bank_padding.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

inspect: $(BUILD_DIR)/ex06-shared-memory-tile-bank-padding
	cuobjdump --list-elf $< > $(BUILD_DIR)/cubin-list.txt
	cuobjdump --dump-ptx $< > $(BUILD_DIR)/ptx-dump.txt
	grep -Eq 'sm_75' $(BUILD_DIR)/cubin-list.txt
	grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' $(BUILD_DIR)/ptx-dump.txt

host-test: $(BUILD_DIR)/host_reference_test
	$(BUILD_DIR)/host_reference_test

$(BUILD_DIR)/host_reference_test: tests/host_reference_test.cpp include/shared_memory_tile_bank_padding_reference.hpp | $(BUILD_DIR)
	$(CXX) $(HOST_FLAGS) tests/host_reference_test.cpp -o $@

clean:
	rm -rf $(BUILD_DIR)
