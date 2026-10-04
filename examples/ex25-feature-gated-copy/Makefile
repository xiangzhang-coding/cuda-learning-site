# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
DIALECT ?= c++17
TARGET ?= portable
BUILD_DIR ?= build/$(TARGET)
VALID_TARGETS := portable 90 100f 103f 110f 120f 121f
ifeq ($(filter $(TARGET),$(VALID_TARGETS)),)
$(error Unsupported TARGET)
endif
BASE := $(patsubst %f,%,$(TARGET))
FLAGS := -std=$(DIALECT) -O2 -lineinfo -Iinclude
PORTABLE_FLAGS := -gencode arch=compute_75,code=[sm_75,compute_75]
ifeq ($(TARGET),portable)
SPECIAL_SOURCE := src/unavailable.cu
SPECIAL_FLAGS := $(PORTABLE_FLAGS)
else
SPECIAL_SOURCE := src/specialized.cu
SPECIAL_FLAGS := -gencode arch=compute_$(TARGET),code=[sm_$(TARGET),compute_$(TARGET)]
PORTABLE_FLAGS += -gencode arch=compute_$(BASE),code=sm_$(BASE)
endif
.PHONY: all preprocess compile link inspect host-test
all: link
$(BUILD_DIR):
	mkdir -p "$@"
host-test: | $(BUILD_DIR)
	$(CXX) -std=$(DIALECT) -Wall -Wextra -Werror -Iinclude tests/host_test.cpp -o $(BUILD_DIR)/host-test
	$(BUILD_DIR)/host-test
preprocess: | $(BUILD_DIR)
	$(NVCC) $(FLAGS) $(SPECIAL_FLAGS) -E $(SPECIAL_SOURCE) -o $(BUILD_DIR)/specialized.ii
$(BUILD_DIR)/portable.o: src/portable.cu include/contract.hpp include/launch.hpp | $(BUILD_DIR)
	$(NVCC) $(FLAGS) $(PORTABLE_FLAGS) -c $< -o $@
$(BUILD_DIR)/specialized.o: $(SPECIAL_SOURCE) include/contract.hpp include/launch.hpp | $(BUILD_DIR)
	$(NVCC) $(FLAGS) $(SPECIAL_FLAGS) -c $< -o $@
$(BUILD_DIR)/main.o: src/main.cu include/contract.hpp include/launch.hpp | $(BUILD_DIR)
	$(NVCC) $(FLAGS) $(PORTABLE_FLAGS) -DEX25_TARGET='"$(TARGET)"' -c $< -o $@
compile: $(BUILD_DIR)/portable.o $(BUILD_DIR)/specialized.o $(BUILD_DIR)/main.o
link: compile
	$(NVCC) $(FLAGS) $(BUILD_DIR)/main.o $(BUILD_DIR)/portable.o $(BUILD_DIR)/specialized.o -o $(BUILD_DIR)/ex25-copy
inspect: link
	cuobjdump --list-elf $(BUILD_DIR)/ex25-copy
	cuobjdump --dump-ptx $(BUILD_DIR)/ex25-copy
