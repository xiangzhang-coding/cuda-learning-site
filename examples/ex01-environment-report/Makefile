# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
HOST_CXX ?= c++
DIALECT ?= c++17
CUDART ?= shared
BUILD_DIR ?= build

ifneq ($(DIALECT),c++17)
$(error DIALECT must be c++17)
endif

ifeq ($(CUDART),shared)
else ifeq ($(CUDART),static)
else
$(error CUDART must be shared or static)
endif

NVCC_FLAGS := --std=$(DIALECT) --compiler-bindir="$(HOST_CXX)" -Iinclude -DEX01_CUDART_LINKAGE='"$(CUDART)"'
NVCC_LINK_FLAGS := --std=$(DIALECT) --compiler-bindir="$(HOST_CXX)" --cudart=$(CUDART)
HOST_FLAGS := -std=$(DIALECT) -Wall -Wextra -Wpedantic -Iinclude

.PHONY: all build clean preprocess compile link host-test FORCE

all: build

build: link

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

preprocess: $(BUILD_DIR)/environment_report.ii

$(BUILD_DIR)/environment_report.ii: FORCE src/environment_report.cu include/environment_report.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/environment_report.cu -o $@

compile: $(BUILD_DIR)/environment_report.o

$(BUILD_DIR)/environment_report.o: FORCE src/environment_report.cu include/environment_report.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/environment_report.cu -o $@

link: $(BUILD_DIR)/ex01-environment-report

$(BUILD_DIR)/ex01-environment-report: $(BUILD_DIR)/environment_report.o
	$(NVCC) $(NVCC_LINK_FLAGS) $< -o $@

host-test: $(BUILD_DIR)/report_contract_test
	$(BUILD_DIR)/report_contract_test

$(BUILD_DIR)/report_contract_test: FORCE tests/report_contract_test.cpp include/environment_report.hpp | $(BUILD_DIR)
	$(HOST_CXX) $(HOST_FLAGS) tests/report_contract_test.cpp -o $@

FORCE:

clean:
	rm -rf $(BUILD_DIR)
