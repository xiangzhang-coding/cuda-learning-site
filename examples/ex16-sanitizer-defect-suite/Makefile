# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
DIALECT ?= c++17
BUILD_DIR ?= build

NVCC_ARCH := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
NVCC_FLAGS := --std=$(DIALECT) $(NVCC_ARCH) -lineinfo -Iinclude
HOST_FLAGS := -std=$(DIALECT) -Wall -Wextra -Wpedantic -Iinclude

SOURCE_STEMS := \
	memcheck_defect \
	memcheck_corrected \
	racecheck_defect \
	racecheck_corrected \
	initcheck_defect \
	initcheck_corrected \
	synccheck_defect \
	synccheck_corrected
BINARY_NAMES := $(subst _,-,$(SOURCE_STEMS))
PREPROCESSED := $(addprefix $(BUILD_DIR)/,$(addsuffix .ii,$(SOURCE_STEMS)))
OBJECTS := $(addprefix $(BUILD_DIR)/,$(addsuffix .o,$(SOURCE_STEMS)))
BINARIES := $(addprefix $(BUILD_DIR)/,$(BINARY_NAMES))

.PHONY: all clean preprocess compile link inspect host-test

all: link

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

preprocess: $(PREPROCESSED)

$(BUILD_DIR)/%.ii: src/%.cu include/cuda_error.hpp include/sanitizer_suite_contract.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E $< -o $@

compile: $(OBJECTS)

$(BUILD_DIR)/%.o: src/%.cu include/cuda_error.hpp include/sanitizer_suite_contract.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile $< -o $@

link: $(BINARIES)

$(BUILD_DIR)/memcheck-defect: $(BUILD_DIR)/memcheck_defect.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

$(BUILD_DIR)/memcheck-corrected: $(BUILD_DIR)/memcheck_corrected.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

$(BUILD_DIR)/racecheck-defect: $(BUILD_DIR)/racecheck_defect.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

$(BUILD_DIR)/racecheck-corrected: $(BUILD_DIR)/racecheck_corrected.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

$(BUILD_DIR)/initcheck-defect: $(BUILD_DIR)/initcheck_defect.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

$(BUILD_DIR)/initcheck-corrected: $(BUILD_DIR)/initcheck_corrected.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

$(BUILD_DIR)/synccheck-defect: $(BUILD_DIR)/synccheck_defect.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

$(BUILD_DIR)/synccheck-corrected: $(BUILD_DIR)/synccheck_corrected.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) $< -o $@

inspect: $(BINARIES)
	@set -eu; for binary in $(BINARY_NAMES); do \
		cuobjdump --list-elf "$(BUILD_DIR)/$$binary" > "$(BUILD_DIR)/$$binary-cubin-list.txt"; \
		cuobjdump --dump-ptx "$(BUILD_DIR)/$$binary" > "$(BUILD_DIR)/$$binary-ptx-dump.txt"; \
		grep -Eq 'sm_75' "$(BUILD_DIR)/$$binary-cubin-list.txt"; \
		grep -Eq '(arch = sm_75|\.target[[:space:]]+sm_75)' "$(BUILD_DIR)/$$binary-ptx-dump.txt"; \
	done

host-test: $(BUILD_DIR)/host_utility_test
	$(BUILD_DIR)/host_utility_test

$(BUILD_DIR)/host_utility_test: tests/host_utility_test.cpp include/sanitizer_suite_contract.hpp | $(BUILD_DIR)
	$(CXX) $(HOST_FLAGS) tests/host_utility_test.cpp -o $@

clean:
	rm -rf $(BUILD_DIR)
