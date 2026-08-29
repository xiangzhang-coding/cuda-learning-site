# SPDX-License-Identifier: Apache-2.0
NVCC ?= nvcc
HOST_CXX ?= g++
DIALECT ?= c++17
BUILD_DIR ?= build

TARGET_FLAGS := --generate-code=arch=compute_75,code=sm_75 \
	--generate-code=arch=compute_75,code=compute_75
NVCC_FLAGS := --compiler-bindir=$(HOST_CXX) --std=$(DIALECT) $(TARGET_FLAGS)
RDC_OBJECTS := $(BUILD_DIR)/device_math.o $(BUILD_DIR)/caller.o
PRIMARY_ARTIFACT_NAMES := artifact_kernel.ii artifact_kernel.ptx artifact_kernel.cubin \
	artifact_kernel.fatbin device_math.o caller.o device_link.o ex10-ptx-fatbinary-inspection
PRIMARY_ARTIFACTS := $(addprefix $(BUILD_DIR)/,$(PRIMARY_ARTIFACT_NAMES))

.PHONY: all clean preprocess standalone-ptx cubin fatbin relocatable-compile device-link host-link inspect artifact-test

all: artifact-test

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# [ex10-artifact-pipeline-start]
preprocess: $(BUILD_DIR)/artifact_kernel.ii

$(BUILD_DIR)/artifact_kernel.ii: src/artifact_kernel.cu | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --preprocess $< -o $@

standalone-ptx: $(BUILD_DIR)/artifact_kernel.ptx

$(BUILD_DIR)/artifact_kernel.ptx: src/artifact_kernel.cu | $(BUILD_DIR)
	$(NVCC) --compiler-bindir=$(HOST_CXX) --std=$(DIALECT) --gpu-architecture=compute_75 --ptx $< -o $@

cubin: $(BUILD_DIR)/artifact_kernel.cubin

$(BUILD_DIR)/artifact_kernel.cubin: src/artifact_kernel.cu | $(BUILD_DIR)
	$(NVCC) --compiler-bindir=$(HOST_CXX) --std=$(DIALECT) --gpu-architecture=sm_75 --cubin $< -o $@

fatbin: $(BUILD_DIR)/artifact_kernel.fatbin

$(BUILD_DIR)/artifact_kernel.fatbin: src/artifact_kernel.cu | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) --fatbin $< -o $@

relocatable-compile: $(RDC_OBJECTS)

$(BUILD_DIR)/device_math.o: src/device_math.cu | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -dc $< -o $@

$(BUILD_DIR)/caller.o: src/caller.cu | $(BUILD_DIR)
	$(NVCC) $(NVCC_FLAGS) -dc $< -o $@

device-link: $(BUILD_DIR)/device_link.o

$(BUILD_DIR)/device_link.o: $(RDC_OBJECTS)
	$(NVCC) $(NVCC_FLAGS) --device-link $^ -o $@

host-link: $(BUILD_DIR)/ex10-ptx-fatbinary-inspection

$(BUILD_DIR)/ex10-ptx-fatbinary-inspection: $(RDC_OBJECTS) $(BUILD_DIR)/device_link.o
	$(NVCC) --compiler-bindir=$(HOST_CXX) --std=$(DIALECT) --no-device-link $^ -o $@

$(BUILD_DIR)/artifact-sha256.txt: $(PRIMARY_ARTIFACTS)
	cd $(BUILD_DIR) && sha256sum $(PRIMARY_ARTIFACT_NAMES) > artifact-sha256.txt

$(BUILD_DIR)/cuobjdump-ptx-list.txt: $(BUILD_DIR)/ex10-ptx-fatbinary-inspection
	cuobjdump --list-ptx $< > $@

$(BUILD_DIR)/cuobjdump-elf-list.txt: $(BUILD_DIR)/ex10-ptx-fatbinary-inspection
	cuobjdump --list-elf $< > $@

$(BUILD_DIR)/cuobjdump-ptx.txt: $(BUILD_DIR)/artifact_kernel.fatbin
	cuobjdump --dump-ptx $< > $@

$(BUILD_DIR)/cuobjdump-sass.txt: $(BUILD_DIR)/artifact_kernel.cubin
	cuobjdump --dump-sass $< > $@

$(BUILD_DIR)/cuobjdump-elf.txt: $(BUILD_DIR)/artifact_kernel.cubin
	cuobjdump --dump-elf $< > $@

$(BUILD_DIR)/cuobjdump-symbols.txt: $(BUILD_DIR)/artifact_kernel.cubin
	cuobjdump --dump-elf-symbols $< > $@

$(BUILD_DIR)/symbol-link-ledger.txt: $(RDC_OBJECTS) $(BUILD_DIR)/device_link.o $(BUILD_DIR)/ex10-ptx-fatbinary-inspection
	{ \
		printf '%s\n' '== device_math.o: CUDA ELF symbols =='; \
		cuobjdump --dump-elf-symbols $(BUILD_DIR)/device_math.o; \
		printf '%s\n' '== caller.o: CUDA ELF symbols =='; \
		cuobjdump --dump-elf-symbols $(BUILD_DIR)/caller.o; \
		printf '%s\n' '== device_link.o: CUDA ELF symbols =='; \
		cuobjdump --dump-elf-symbols $(BUILD_DIR)/device_link.o; \
		printf '%s\n' '== host symbols before and after link =='; \
		nm -C $(BUILD_DIR)/device_math.o $(BUILD_DIR)/caller.o $(BUILD_DIR)/device_link.o $(BUILD_DIR)/ex10-ptx-fatbinary-inspection; \
	} > $@

inspect: $(BUILD_DIR)/artifact-sha256.txt \
	$(BUILD_DIR)/cuobjdump-ptx-list.txt \
	$(BUILD_DIR)/cuobjdump-elf-list.txt \
	$(BUILD_DIR)/cuobjdump-ptx.txt \
	$(BUILD_DIR)/cuobjdump-sass.txt \
	$(BUILD_DIR)/cuobjdump-elf.txt \
	$(BUILD_DIR)/cuobjdump-symbols.txt \
	$(BUILD_DIR)/symbol-link-ledger.txt

artifact-test: inspect
	bash scripts/artifact-test.sh $(BUILD_DIR)
# [ex10-artifact-pipeline-end]

clean:
	rm -rf $(BUILD_DIR)
