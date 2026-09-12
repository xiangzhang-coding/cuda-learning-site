---
title: 'P03 练习：审查产物与错误接口'
description: 修复无需 GPU 的构建方案，为 NVRTC 状态与 nvJitLink 异常分别设计具有精确所有权的处理流程。
pairId: p03-exercises
counterpart: /en/python/runtime-compilation-linking/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: P03-EXERCISES
prerequisites: [P03]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Stable NVRTC binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvrtc.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Status-first compiler contract; static review'
    accessDate: '2026-09-12'
  - title: 'Stable nvJitLink binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvjitlink.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Exception and writable-output linker contract; static review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/python/runtime-compilation-linking/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P03 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-bindings-13.4.1 } }
---

<a class="locale-pair" data-locale-counterpart href="/en/python/runtime-compilation-linking/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [P03](/python/runtime-compilation-linking/)，严格为 `[P03]`。这些原创纸面练习（Exercise）不需要 GPU 或编译器执行，四个证据数组保持为空。前置链为 `P03 -> P03-EXERCISES -> P03-SOLUTIONS`。

## 提交要求

阅读[解答](/python/runtime-compilation-linking/solutions/)前提交产物表和错误流程表。使用唯一配置中的 core 1.2.0、bindings 13.4.1 与原生 NVRTC/nvJitLink 13.3.33。下文日志大小、状态场景和产物描述都不是观察到的运行。

## 练习 1：保持无需 GPU 的边界

**目标：** 修复构建方案，同时保留显式 PTX 到 cubin 链接阶段。

**约束：** 构建机拥有选定 Python 包与原生编译器/链接器库，但没有 GPU。方案查询 `Device(0).arch`，以 `compute_75` 编译源码，从这个虚拟目标编译中直接提取 cubin，调用 `ObjectCode.load()`，最后因为没有启动核函数就把 EX21 标成无需运行验证（Runtime-Not-Applicable）。另一方案用 `sm_75` 直接编译成 cubin，称之为“显式 nvJitLink”，仅以入口名称缓存结果。

**预期提交证据：** 将第一方案改成兼容 `build --arch 75` 的阶段/输入/输出表，逐项指出被拒绝的步骤，另列未来运行责任。准确对照直接 cubin 替代方案，不误命名。为假设产物缓存定义最低身份字段，并解释为何保持函数名但修改源码必须使旧条目失效。

**验收标准：** 构建目标显式给出，不查询设备。PTX 编译用虚拟目标及可重定位设备代码；`Linker(ptx, options=...)` 针对实际目标链接，确认后端为 nvJitLink。不向构建加入查找、设备初始化、启动或同步。非空产物检查不证明加载或正确性。缓存设计不带来未经测量的加速或全面跨设备兼容声明。

<details><summary>提示 1：列生成者，不只列文件名</summary>NVRTC 生成选定 PTX，显式 Linker 生成 cubin。文件扩展名不能补上缺失的生成阶段。</details>

<details><summary>提示 2：哪些变化必须改变缓存键</summary>考虑源码字节、编译器和链接器身份、选项、目标与后端。从字节重建 ObjectCode 不等于加载。</details>

## 练习 2：一个包装器不能解包两套 API

**目标：** 制定保留首个错误、资源恰好取得/销毁一次、输出存储类型正确的错误处理。

**约束：** 通用包装器总按 `(status, value)` 解包，以一个参数调用 `nvrtcCreateProgram(source)`，为 nvJitLink 输出传不可变 `bytes(size)`，还先销毁链接器再尝试读取错误日志。审查三个假设场景：A，NVRTC 编译返回 `NVRTC_ERROR_COMPILATION`，日志长度查询也失败；B，nvJitLink create 在返回句柄前抛异常；C，create 成功、complete 抛异常、错误日志长度查询返回 17 字节、读取日志成功，但 destroy 也抛异常。没有给出具体诊断文本。

**预期提交证据：** 修正两套 API 的创建签名与返回形状、成功输出路径、逐场景主/次诊断账本，以及哪些清理/日志调用合法。解释 core 编译成功时日志流与编译失败时异常携带诊断的区别。

**验收标准：** 检查每个 NVRTC 状态，不把 nvJitLink 值当状态元组。有效链接器使用查询长度的 `bytearray` 输出，并在 finally 路径恰好销毁一次。场景 B 不能查询日志或销毁未取得句柄；场景 C 即使清理失败，也以 complete 失败为主。缺失库与 Python 参数错误另行分类。不要虚构日志文本，不导入 core 私有错误类。

<details><summary>提示 1：列出实际返回形状</summary>NVRTC compile 返回单元素元组。nvJitLink create 返回整数，complete 返回 None，version 返回两个版本数而没有状态。</details>

<details><summary>提示 2：持有者还存在时读取诊断</summary>有效但失败的链接器仍可能拥有日志。按查询长度分配可写存储，保留原始异常，将报告或清理过程中的失败视为次要问题。</details>

## 下一步

对照[解答](/python/runtime-compilation-linking/solutions/)和 [PB-R5-003](/practice/#pb-r5-003)。来源：[SRC-CUDA-077](/sources-and-versions/#src-cuda-077)、[SRC-CUDA-078](/sources-and-versions/#src-cuda-078)与 [SRC-CUDA-079](/sources-and-versions/#src-cuda-079)，核对于 **2026-09-12**。[EX21](/examples/cuda-python-launch/) 保持待硬件验证（Pending Hardware Verification）；这些场景不授予编译或运行证据。
