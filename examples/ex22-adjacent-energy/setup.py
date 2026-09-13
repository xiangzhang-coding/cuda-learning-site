# SPDX-License-Identifier: Apache-2.0
import os
import platform
import subprocess
import sys
from pathlib import Path

import torch
from setuptools import setup
from torch.utils.cpp_extension import BuildExtension, CUDAExtension, CUDA_HOME

if sys.version_info[:3] != (3, 12, 14) or platform.system() != "Linux" or platform.machine() != "x86_64":
    raise RuntimeError("EX22 requires CPython 3.12.14 on Linux x86_64")
if torch.__version__ != "2.11.0+cu128" or torch.version.cuda != "12.8":
    raise RuntimeError("EX22 requires torch 2.11.0+cu128 (CUDA 12.8)")
if not CUDA_HOME:
    raise RuntimeError("Set CUDA_HOME to the independently installed Toolkit 12.8.1")
nvcc = subprocess.check_output([str(Path(CUDA_HOME) / "bin/nvcc"), "--version"], text=True)
if "release 12.8," not in nvcc or "V12.8.93" not in nvcc:
    raise RuntimeError("EX22 requires Toolkit 12.8.1 / nvcc 12.8.93")
compiler = subprocess.check_output([os.environ.get("CXX", "g++"), "-dumpfullversion"], text=True).strip()
if compiler != "13.3.0":
    raise RuntimeError("EX22 requires GCC/G++ 13.3.0")
if os.environ.get("TORCH_CUDA_ARCH_LIST") != "8.0+PTX":
    raise RuntimeError("Set TORCH_CUDA_ARCH_LIST=8.0+PTX explicitly, even without a GPU")

# [ex22-build-start]
setup(
    name="cuda-learning-ops",
    version="0.1.0",
    packages=["cuda_learning_ops"],
    python_requires="==3.12.14",
    install_requires=["torch==2.11.0+cu128"],
    license="Apache-2.0",
    ext_modules=[CUDAExtension(
        "cuda_learning_ops._C",
        ["csrc/operator.cpp", "csrc/kernel.cu"],
        extra_compile_args={"cxx": ["-O2", "-std=c++17"],
                            "nvcc": ["-O2", "-std=c++17", "--fmad=false"]},
    )],
    cmdclass={"build_ext": BuildExtension.with_options(use_ninja=False)},
)
# [ex22-build-end]
