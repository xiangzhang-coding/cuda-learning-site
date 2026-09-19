# SPDX-License-Identifier: Apache-2.0
CXX ?= c++
CUDA_HOME ?= /usr/local/cuda
NCCL_HOME ?= /usr
BUILD_DIR ?= build
DIALECT ?= c++17
FLAGS = -std=$(DIALECT) -Wall -Wextra -Werror -O2 -Iinclude
SDK = -I$(CUDA_HOME)/include -I$(NCCL_HOME)/include
LIBS = -L$(CUDA_HOME)/lib64 -L$(NCCL_HOME)/lib/x86_64-linux-gnu -Wl,-rpath,$(CUDA_HOME)/lib64 -Wl,-rpath,$(NCCL_HOME)/lib/x86_64-linux-gnu -lcudart -lnccl -pthread
.PHONY: all preprocess compile link inspect host-test
all: link
$(BUILD_DIR):
	mkdir -p "$@"
preprocess: | $(BUILD_DIR)
	$(CXX) $(FLAGS) $(SDK) -E src/all_reduce.cpp -o $(BUILD_DIR)/all_reduce.ii
compile: | $(BUILD_DIR)
	$(CXX) $(FLAGS) $(SDK) -c src/all_reduce.cpp -o $(BUILD_DIR)/all_reduce.o
link: compile
	$(CXX) $(BUILD_DIR)/all_reduce.o $(LIBS) -o $(BUILD_DIR)/ex24-nccl-all-reduce
inspect: link
	readelf -d $(BUILD_DIR)/ex24-nccl-all-reduce > $(BUILD_DIR)/dynamic-section.txt
	ldd $(BUILD_DIR)/ex24-nccl-all-reduce > $(BUILD_DIR)/dynamic-linkage.txt
	grep -q 'libnccl.so' $(BUILD_DIR)/dynamic-section.txt
	! grep -q 'not found' $(BUILD_DIR)/dynamic-linkage.txt
host-test: | $(BUILD_DIR)
	$(CXX) $(FLAGS) tests/host.cpp -o $(BUILD_DIR)/host-test
	$(BUILD_DIR)/host-test
