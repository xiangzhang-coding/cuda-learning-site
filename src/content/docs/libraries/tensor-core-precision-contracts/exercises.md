---
title: 'L08 练习：数值链、架构门槛与线程束安全'
description: 用三道原创静态练习区分输入与输出舍入、WMMA 接口与原生能力，以及尾部分块的参与和内存条件。
pairId: l08-exercises
counterpart: /en/libraries/tensor-core-precision-contracts/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L08-EXERCISES
prerequisites: [L08]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l08-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/tensor-core-precision-contracts/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: L08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L08 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/tensor-core-precision-contracts/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [L08](/libraries/tensor-core-precision-contracts/)，其直接先修保持为 `Q02, L06, F06`；本练习集只直接依赖 `[L08]`。本页采用 C++17 阅读口径，只要求纸面推导与合同审查，不要求 GPU、编译或完整 CUDA 实现。

## 提交要求

按 [SRC-CUDA-069](/sources-and-versions/#src-cuda-069) 中于 2026-09-07 复核的当前 13.3、12.9.2 归档与 PTX 合同作答。应提交证据指推导和审查记录，不是运行观察。四个证据数组为空，不授予证据状态（Evidence Status）；不得填入假设的 GPU 输出、指令或速度。完成后再看[独立解答](/libraries/tensor-core-precision-contracts/solutions/)。

## 练习一：两次舍入之间发生了什么

**目标：** 为一个 GEMM 输出建立完整数值链，区分输入转换、累加、收尾操作（epilogue）和最终存储的责任。

**约束：** 原始 FP32 行 `a=[2+2^-10,2]`、列 `b=[1,-1]`，`alpha=1/4,beta=1,C=1+2^-11`。候选路径先将 A/B 按最近偶数舍入（round-to-nearest-even）转成 FP16，使用 FP32 累加器类型（Accumulator Type），在 FP32 中计算缩放与 C 相加，最后按最近偶数舍入存成 FP16 D。不启用饱和。仅为构造参考，点积先按精确代数求值；这不规定 WMMA 累加顺序。应用预先要求有限输出满足 `abs(got-R_original) <= 2^-11`，不得放宽。

**应提交证据：** 原输入、存储输入、实际乘数、累加器、收尾与 D 的六栏记录；分别由原输入和已转换输入推导存储前的 `U_original/U_stored`，再对两者应用同一输出转换，得到 `R_original/R_stored`。计算两阶段各自的参考差与输出舍入位移；写出合法的 float 片段（fragment）存储及显式转换路径，并判断理想的已转换输入答案是否满足原问题验收。

**验收条件：** 明确两个舍入中点的取舍依据，不先计算原点积再冒充输入转换；C 保持题设 FP32 值。将输入损失与输出转换影响分开，解释为什么宽累加器不能恢复先前信息；保留原问题与已转换输入两份独立参考。有限值阈值不推广为通用 GEMM 误差界，非有限值单独拒绝，不声称得到任何实际 `got`。

<details><summary>提示一：先定位相邻可表示数</summary>FP16 在 2 附近向上的间距与在 1 附近不同。写出相邻两数，再检查题设输入是否恰在中点；最近偶数中的“偶”指保留的有效位。</details>

<details><summary>提示二：给参考加上阶段标签</summary>先保留缩放与 C 相加后的两个 U，再分别转换为 R。比较输入影响时，不要把一个存储前数值与另一个存储后数值相减。</details>

## 练习二：接口许可不是原生能力证明

**目标：** 制作可审计的 WMMA 类型与架构决策表，拆开历史 API/PTX 最低目标、当前编译目标、原生张量核心（Tensor Core）能力与实际指令证据。

**约束：** 为 FP16、BF16、TF32、FP64、INT8 五条 C++ WMMA 路径分别填写 A/B 类型、C/D 累加片段类型、全部合法 `M x N x K` 分块与 API/PTX 最低目标。另审查四项提案：BF16 在 CC 8.0 上使用 half 累加；TF32 在 CC 7.5 上直接加载未转换的 float，使用普通 float 输入片段和 `16x16x16`；double 在 CC 8.6 上使用 `8x8x4` 并仅凭 CC 数值大小宣称原生 FP64 加速；INT8 混用 signed/unsigned 输入，并因历史接口门槛而建议 CUDA 13 生成 `sm_72`。

**应提交证据：** 完整五行合同表及四项提案的逐项修正；当前表中原生 FP64 的明确 CC 集合；TF32 的存储、转换和片段类型关系；整数最终输出的独立转换义务；仍需由未来编译、指令检查和运行分别补足的证据清单。

**验收条件：** 不用笼统的“支持 Tensor Core”代替类型和形状，不混淆 C++ WMMA 与所有底层 MMA 形状，不将 API 下界当原生 FP64 白名单或当前工具链承诺。区分 INT8 的历史下界与本站 CC 7.5 基础门槛；既不臆测未检查目标的降级方式，也不从表格推导性能。

<details><summary>提示一：一行配置可以有多种错误</summary>依次检查输入类型、累加类型、形状和目标。修正其中一格后，其余格不会自动合法。</details>

<details><summary>提示二：分开两个架构问题</summary>“接口从哪里开始允许”是下界问题；“当前原生类型表列了哪些 CC”是成员资格问题。再单列编译器接受情况，不把历史目标写成推荐命令。</details>

## 练习三：对齐的尾部仍然可能越界

**目标：** 为 FP16 WMMA `16x16x16` 的最后一个 K 步证明线程束（warp）参与、地址、完整存储和复用同步均安全。

**约束：** `D=A*B`，`M=19,N=21,K=23`。A/B 为行主序 half，D 为行主序 float，三个行步长均为 24 个元素，基址分别 32 字节对齐。检查 `(m0,n0,k0)=(16,16,16)`。原提案直接加载未填充的尾部；没有合法输出坐标的通道（lane）提前退出。备选暂存区（staging storage）基址也均 32 字节对齐，却为 half 加 8 元素偏移并传 `ldm=24`，为 float 输出传 `ldm=18`。一个两线程束的线程块中，生产线程束填共享暂存区，消费线程束做 WMMA；提案仅靠 WMMA 同步就允许生产者覆盖，并用 `fragment.x[i]` 推定输出坐标。不得改变逻辑问题。

**应提交证据：** 原 A/B 加载和 D 存储起点的元素偏移、字节偏移及模 32 余数；备选起点与步长的独立判定；最后一步 A/B/D 的有效范围；完整暂存区容量、补零与有效输出复制方案；跨线程束发布、最后读取与复用的有序阶段。

**验收条件：** 用范围证明而非基址对齐替代完整分块安全。所有消费通道参与匹配的集体调用，不靠提前退出或片段坐标猜测处理边界。分别检查 half/float 步长单位和规则，不外推到所有类型；累加器跨 K 步保留。同步证明包含生产和消费线程束，且不将线程束同步视为主机完成或实际无竞争证据。

<details><summary>提示一：分别证明起点和范围</summary>行主序偏移为 `row*ld+column`；half 与 float 的元素字节数不同。起点通过模 32 检查之后，再问整个分块访问的最后一行、最后一列是否存在。</details>

<details><summary>提示二：无效数据不等于不参与的线程</summary>先把完整输入分块的每个位置定义好，再考虑集体加载。为共享存储分别画出“写完才能读”和“读完才能覆盖”的边，不只画出 WMMA 调用。</details>

## 下一步

对照[独立解答](/libraries/tensor-core-precision-contracts/solutions/)，再完成 [PB-R4-009](/practice/#pb-r4-009)。来源为 [L08](/libraries/tensor-core-precision-contracts/) 与 [SRC-CUDA-069](/sources-and-versions/#src-cuda-069)，复核日期 **2026-09-07**。情景与推导均为原创，没有复制上游代码，也不继承任何可运行示例或实验的证据。
