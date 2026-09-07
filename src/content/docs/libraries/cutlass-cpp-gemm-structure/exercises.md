---
title: 'L09 练习：层级计数、阶段所有权与源码审计'
description: 推导非整齐 GEMM，证明布局与两阶段存储安全，并在不要求 GPU 的前提下审计 API 代际、工具链、许可和证据声明。
pairId: l09-exercises
counterpart: /en/libraries/cutlass-cpp-gemm-structure/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L09-EXERCISES
prerequisites: [L09]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l09-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cutlass-cpp-gemm-structure/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-07' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L09 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cutlass-cpp-gemm-structure/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [L09](/libraries/cutlass-cpp-gemm-structure/)，其有序直接先修保持为 `A08, L06, M17`；本练习集只直接依赖 `[L09]`。按 C++17 阅读口径进行纸面推导，不要求 GPU、安装 CUTLASS、编译或完整 CUDA 实现。

## 提交要求

采用 [SRC-CUDA-070](/sources-and-versions/#src-cuda-070) 中于 2026-09-07 复核的 CUTLASS C++ v4.7.0，提交为 `dcf215af68a2d08d305076c152a06f201728cd53`。应提交证据指推导与源码审查记录，不是运行观察。四个证据数组保持为空，不授予或继承证据状态（Evidence Status）。不复制上游示例、测试或代码，完成后再看[独立解答](/libraries/cutlass-cpp-gemm-structure/solutions/)。

## 练习一：先数所有者，再数工作量

**目标：** 重建保留的 Device/Kernel/Threadblock/Warp/Instruction 各层责任，区分输出所有权与归约工作。

**约束：** 原创模型 `D=2*A*B-0.5*C`，`M=137,N=77,K=35`。A/B 为 FP16；C/D、累加和收尾操作（epilogue）计算均为 FP32。候选线程块（threadblock）分块为 `64x32x16`，线程束（warp）分块为 `32x16x16`，指令封装层采用所选 SM75 `16x8x8` 几何。使用普通非 split-K 输出分块，线程束不沿 K 划分。这只是几何模型，不是已证明合法的模板特化。一份审查笔记将三个向上取整计数相乘作为独立输出线程块数，并为每个 K 切片分别执行收尾。

**应提交证据：** 五行层级责任表、输出网格尺寸与线程块数、K 切片数、每块输出线程束分块数、右下角起点与有效范围、最后有效 K 区间，以及每个线程束分块在一个完整 K 切片内的指令层几何覆盖次数。写出累加器不变量，修正收尾所有权，并限定与 [VIS12](/visuals/gemm-tiling-hierarchy/) 对照的范围。

**验收条件：** 每个有效输出只归一个线程块所有，完整归约 K 后才执行一次 `2*acc-0.5*C`。几何操作计数不等于生成或执行的指令数、调度或占用率。VIS12 保持不变，仍是源码层标量 `1x1x1` 槽位，不是 FMA、MMA、WMMA、SASS 或实测 CUTLASS 执行。

<details><summary>提示一：将输出平面与归约轴分开</summary>先沿 M 和 N 分块，再问每个已有输出所有者需要累加多少 K 工作，不要为每个切片重新分配一个输出所有者。</details>

<details><summary>提示二：分母必须处于对应层级</summary>计算线程束内的指令几何时，用线程束各维尺寸除以对应指令尺寸。K 的比值计算归约工作，不增加输出线程束分块数。</details>

## 练习二：谁可以读，谁可以覆盖

**目标：** 独立于共享内存与寄存器布局证明全局地址和边缘范围，再建立两阶段发布与复用安全条件。

**约束：** 保持练习一的问题。全部全局矩阵使用行主序（RowMajor），A 步长为 40，B/C/D 步长为 80 个元素；分配覆盖完整物理行，但填充位置的值未指定。候选方案对所有操作数使用 `row*77+column`，把 RowMajor 当作共享内存和寄存器映射，并让没有有效边缘输出的线程退出。其两阶段流水线（pipeline）在阶段 0 首批内容发布后就用第三个 K 切片覆盖该阶段，不等待最后读者。没有实际调用或结果。

**应提交证据：** 各操作数的偏移公式、最后逻辑偏移与分配容量；右下角线程块最后 K 切片的 A/B/D 有效范围；一个和两个阶段的理想 FP16 A/B 载荷字节数，不计布局填充和其他存储。提交检查边界的复制、补零与存储方案，并在时间线上标出生产者写入、发布、全部消费者的最后读取及各槽位的复用许可。

**验收条件：** 同时证明逻辑边界与物理范围，已分配的行填充不自动等于零。区分全局布局、共享布局与寄存器片段（fragment）组织，不编造内部映射或对齐保证。发布先于读取，全部旧读者完成后才能覆盖；所有必要参与者保留同步资格，累加跨切片保持。两个缓冲区或 `can_implement` 都不能代替这些证明，载荷字节数也不证明占用率或重叠。

<details><summary>提示一：给每个操作数写出两个坐标</summary>A 用输出行与 K 索引，B 用 K 与输出列索引。使用各矩阵的物理步长，并将最后逻辑元素与它自己的分配比较，而不是都与 D 的分配比较。</details>

<details><summary>提示二：给槽位的每次使用标上代次</summary>第一和第三切片占用阶段 0 的不同代次。旧代次已就绪不表示消费者已释放它；在下一次生产者写入前画出最后读取的依赖边。</details>

## 练习三：审计一份自信但证据不足的发布说明

**目标：** 区分 API 代际、工具链资格、许可与源码声明，以及编译、指令和运行证据。

**约束：** 对照 L09 与固定提交的来源清单审查以下五项虚构声明。修正声明，不安装 CUTLASS、不复制代码、不引入 Python DSL，也不授予证据状态。

| 声明 | 待审计的提案结论 |
| --- | --- |
| API 代际 | 保留的 2.x 需要另装 2.x；3.x 中 collective 就是 warp，atom 就是 thread，device adapter 由 GPU 线程调用 |
| 构建环境 | CMake 3.18 与编译器默认方言已经足够；Toolkit 13.3.1、NVCC 和 Runtime 的版本都为 13.3.1；README 最低要求认证所有配置 |
| 架构 | 源码 `Sm50` 标签允许 CUDA 13 生成 `sm_50`；SM75 路径需要 `a` 后缀；`90a` PTX 是通用的未来 GPU 回退 |
| 证据 | 内联 PTX 封装就是已检查的 SASS；上游测试返回 true 就证明执行；假设的 `can_implement` 成功证明范围、整除、正确性与完成 |
| 许可 | CuTe C++ 需要 CuTe Python DSL，因此根目录 BSD 许可允许按本站内容许可复制 DSL 示例 |

**应提交证据：** 五行修正后的审计记录，并引用 SRC-CUDA-070 中固定提交的阅读坐标；明确的原生 Linux 候选工具链，分别列出组件版本、方言与目标；相互独立的未来编译、生成物检查和运行清单。保留普通全 FP32 非张量核心（Tensor Core）SIMT 替代方案，不称其逐位等价或精确参考。

**验收条件：** 区分 4.7.0 发布版本与其保留的 API 代际，3.x 协作层级不是逐词改名。取构建、Toolkit、主机编译器与目标要求的交集，不把资格变成构建成功。检查测试保护条件与豁免，保留检查函数之后的调用者责任，并排除 Python DSL 材料。源码表格与候选配置都不证明原生加速或速度。

<details><summary>提示一：为每项声明找出依据及其边界</summary>将构建配置要求与文字说明对照，并区分实现标签与编译器目标。记录哪份确切文件或组件清单能回答各问题。</details>

<details><summary>提示二：沿着缺失的证据链检查</summary>声明操作在生成物之前，生成物又在执行证据之前。解释测试返回值前先检查是否可能豁免，假定全仓采用同一条款前先检查许可例外。</details>

## 下一步

对照[独立解答](/libraries/cutlass-cpp-gemm-structure/solutions/)，再完成 [PB-R4-010](/practice/#pb-r4-010)。来源为 [L09](/libraries/cutlass-cpp-gemm-structure/) 与 [SRC-CUDA-070](/sources-and-versions/#src-cuda-070)，复核日期 **2026-09-07**。情景与推导均为原创，没有复制上游示例或代码，也不继承任何可运行示例或实验的证据。
