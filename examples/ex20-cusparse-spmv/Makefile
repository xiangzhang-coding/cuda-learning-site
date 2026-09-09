# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
CXX ?= c++
READELF ?= readelf
LDD ?= ldd
DIALECT ?= c++17
BUILD_DIR ?= build
EXPECTED_CUSPARSE_VERSION ?=

ifneq ($(DIALECT),c++17)
$(error EX20 declares only c++17)
endif
ifneq ($(filter-out host-test clean,$(or $(MAKECMDGOALS),all)),)
ifneq ($(filter-out 11.7.5.86 12.5.10.65 12.8.2.51,$(EXPECTED_CUSPARSE_VERSION)),)
$(error EXPECTED_CUSPARSE_VERSION must be one declared four-part component version: 11.7.5.86, 12.5.10.65, 12.8.2.51)
endif
ifneq ($(words $(EXPECTED_CUSPARSE_VERSION)),1)
$(error EXPECTED_CUSPARSE_VERSION must name exactly one component version)
endif
endif

VERSION_PARTS := $(subst ., ,$(EXPECTED_CUSPARSE_VERSION))
NVCC_ARCH := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
NVCC_FLAGS := --std=$(DIALECT) $(NVCC_ARCH) -Iinclude \
	-DEX20_EXPECTED_CUSPARSE_MAJOR=$(word 1,$(VERSION_PARTS)) \
	-DEX20_EXPECTED_CUSPARSE_MINOR=$(word 2,$(VERSION_PARTS)) \
	-DEX20_EXPECTED_CUSPARSE_PATCH=$(word 3,$(VERSION_PARTS)) \
	-DEX20_EXPECTED_CUSPARSE_BUILD=$(word 4,$(VERSION_PARTS))
LINK_FLAGS := -lcusparse
HOST_FLAGS := -Wall -Wextra -Wpedantic -Iinclude

.NOTPARALLEL:
.DELETE_ON_ERROR:
.PHONY: all clean cuda-config host-config preprocess compile link inspect host-test
all: link

$(BUILD_DIR):
	mkdir -p "$(BUILD_DIR)"

cuda-config: | $(BUILD_DIR)
	@tmp="$(BUILD_DIR)/.cuda-build-config.tmp"; \
	printf '%s\n' "NVCC=$(NVCC)" "NVCC_FLAGS=$(NVCC_FLAGS)" "LINK_FLAGS=$(LINK_FLAGS)" > "$$tmp"; \
	if [ -r "$(BUILD_DIR)/.cuda-build-config" ] && cmp -s "$$tmp" "$(BUILD_DIR)/.cuda-build-config"; then \
		rm -f "$$tmp"; \
	else \
		rm -f "$(BUILD_DIR)/cusparse_spmv.ii" "$(BUILD_DIR)/cusparse_spmv.o" \
			"$(BUILD_DIR)/ex20-cusparse-spmv" "$(BUILD_DIR)/dynamic-section.txt" "$(BUILD_DIR)/dynamic-linkage.txt"; \
		mv "$$tmp" "$(BUILD_DIR)/.cuda-build-config"; \
	fi

host-config: | $(BUILD_DIR)
	@tmp="$(BUILD_DIR)/.host-build-config.tmp"; \
	printf '%s\n' "CXX=$(CXX)" "DIALECT=$(DIALECT)" "HOST_FLAGS=$(HOST_FLAGS)" > "$$tmp"; \
	if [ -r "$(BUILD_DIR)/.host-build-config" ] && cmp -s "$$tmp" "$(BUILD_DIR)/.host-build-config"; then \
		rm -f "$$tmp"; \
	else \
		rm -f "$(BUILD_DIR)/host_reference_test"; \
		mv "$$tmp" "$(BUILD_DIR)/.host-build-config"; \
	fi

preprocess: cuda-config $(BUILD_DIR)/cusparse_spmv.ii
$(BUILD_DIR)/cusparse_spmv.ii: src/cusparse_spmv.cu include/cusparse_spmv_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -E src/cusparse_spmv.cu -o "$@"

compile: cuda-config $(BUILD_DIR)/cusparse_spmv.o
$(BUILD_DIR)/cusparse_spmv.o: src/cusparse_spmv.cu include/cusparse_spmv_reference.hpp | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --compile src/cusparse_spmv.cu -o "$@"

link: cuda-config $(BUILD_DIR)/ex20-cusparse-spmv
$(BUILD_DIR)/ex20-cusparse-spmv: $(BUILD_DIR)/cusparse_spmv.o
	$(NVCC) --std=$(DIALECT) $(NVCC_ARCH) "$<" $(LINK_FLAGS) -o "$@"

inspect: cuda-config $(BUILD_DIR)/ex20-cusparse-spmv
	$(READELF) -d "$(BUILD_DIR)/ex20-cusparse-spmv" > "$(BUILD_DIR)/dynamic-section.txt"
	grep -Eq 'NEEDED.*\[libcusparse\.so\.' "$(BUILD_DIR)/dynamic-section.txt"
	$(LDD) "$(BUILD_DIR)/ex20-cusparse-spmv" > "$(BUILD_DIR)/dynamic-linkage.txt"
	grep -Eq 'libcusparse\.so\.[0-9]+ => /' "$(BUILD_DIR)/dynamic-linkage.txt"
	! grep -q 'not found' "$(BUILD_DIR)/dynamic-linkage.txt"

host-test: host-config $(BUILD_DIR)/host_reference_test
	"$(BUILD_DIR)/host_reference_test"
$(BUILD_DIR)/host_reference_test: tests/host_reference_test.cpp include/cusparse_spmv_reference.hpp | $(BUILD_DIR)
	$(CXX) --std=$(DIALECT) $(HOST_FLAGS) tests/host_reference_test.cpp -o "$@"

clean:
	rm -rf -- "$(BUILD_DIR)"
