---
title: 'L08 解答：逐段证明精度与安全合同'
description: 推导两次舍入的影响，修正 WMMA 类型和架构判断，并为完整线程束的尾部分块给出存储与同步证明。
pairId: l08-solutions
counterpart: /en/libraries/tensor-core-precision-contracts/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L08-SOLUTIONS
prerequisites: [L08-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l08-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/tensor-core-precision-contracts/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-07' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L08-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/tensor-core-precision-contracts/solutions/" lang="en">Read the English counterpart</a>

## 复核前

先完成 [L08 练习](/libraries/tensor-core-precision-contracts/exercises/)。本页按 [L08](/libraries/tensor-core-precision-contracts/) 与 [SRC-CUDA-069](/sources-and-versions/#src-cuda-069) 作 C++17 阅读和原创静态推导，不要求 GPU。没有复制代码、CUDA 编译、指令检查、运行或计时；四个证据数组为空，不授予或继承证据状态（Evidence Status）。

## 解答一：同一输出转换下的两份参考

在 2 处，FP16 向上间距为 `2^-9`。`2+2^-10` 恰在 2 与 `2+2^-9` 中间；2 的末位有效位为偶，故最近偶数舍入（round-to-nearest-even）选择 2。其余 A/B 值可精确表示，转换后 `a=[2,2],b=[1,-1]`。原点积为 `2^-10`，已转换输入的代数点积为 0；即使精确累加也不能恢复输入小量。

| 原输入 | 存储输入 | 实际乘数 | 累加器 | 收尾操作（epilogue） | D 存储 |
| --- | --- | --- | --- | --- | --- |
| 题设 FP32 A/B/C | A/B 为 FP16，C 保持 FP32 | 已舍入 half 值；FP16 WMMA 乘法至少单精度 | FP32 累加器类型（Accumulator Type） | FP32 的 `alpha=1/4,beta=1` 与 C | 显式最近偶数转换为 FP16 |

把缩放和 C 相加纳入每份参考，得到 `U_original=(1/4)*2^-10+1+2^-11=1+3*2^-12`，而 `U_stored=(1/4)*0+1+2^-11=1+2^-11`。这里的有限二进制分数和参考中间量均可由 FP32/FP64 精确表示；一般 double 参考仍不是精确实数。两份参考应独立从各自输入求值，不能复用被审查实现的索引或归约顺序。

在 1 处，FP16 向上间距为 `2^-10`。原参考位于间隔的四分之三处，故 `R_original=1+2^-10`；已转换输入参考恰在中点，取末位为偶的 `R_stored=1`。存储前差为 `U_stored-U_original=-2^-12`，存储后差为 `R_stored-R_original=-2^-10`。输出转换位移分别为 `R_original-U_original=2^-12` 与 `R_stored-U_stored=-2^-11`，两种误差阶段不能合并归因给累加器。

理想的已转换输入答案与原问题存储参考相差 `2^-10 > 2^-11`，不满足题设验收。它可以精确符合已转换输入的参考，却仍不符合原应用。这里没有实际 `got`；实际结果相对 `R_stored` 的差异仍需检查乘法、累加、收尾和转换。非有限值单独拒绝，其他数据范围、K 或消去程度另定容差。

合法设计先用零初始化的 float 片段（fragment）计算点积，将其用 `store_matrix_sync` 写入满足对齐、步长与容量条件的 float 暂存区，再按逻辑坐标做 FP32 收尾与显式 half 转换。不能直接把 float 片段存入 `__half*`；一般 `alpha,beta` 也不是 `mma_sync` 自动完成的工作。该设计不承诺实际 WMMA 的归约顺序或与标量循环逐位一致。

## 解答二：按合同层级修正提案

下表是 C++ WMMA 线程束（warp）分块合同，不是全部底层 MMA 指令形状；历史最低目标也不是当前编译成功记录。

| 路径 | A/B 片段元素类型 | C/D 片段元素类型 | 全部 WMMA 分块 | API/PTX 最低目标 |
| --- | --- | --- | --- | --- |
| FP16 | 都为 `__half` | `float` 或 `__half` | `16x16x16`、`32x8x16`、`8x32x16` | `sm_70` |
| BF16 | 都为 `__nv_bfloat16` | `float` | `16x16x16`、`32x8x16`、`8x32x16` | `sm_80` |
| TF32 | 都为 `nvcuda::wmma::precision::tf32` | `float` | `16x16x8` | `sm_80` |
| FP64 | 都为 `double` | `double` | `8x8x4` | `sm_80` |
| INT8 | 都为 `signed char`，或都为 `unsigned char` | `int` | `16x16x16`、`32x8x16`、`8x32x16` | `sm_72` |

1. BF16 的 CC 8.0 不能使 half 累加片段合法，须改用 float 累加。若最终存窄类型，另声明输出转换。
2. TF32 提案同时错在目标、输入准备、片段类型和形状。改用经当前工具链检查且具有所需能力的 CC 8.0 或更新的已列目标，用 `__float_to_tf32` 转换 float 输入，以 TF32 片段配合 float 累加和 `16x16x8`。转换参数、结果和存储仍为 float；不因此变成普通 FP32 乘数，也不定义通用的 19 位 C++ 打包类型或未给出的舍入模式。
3. double 类型与 `8x8x4` 符合所列接口合同，但 `8.6 >= 8.0` 不能证明原生 FP64 张量核心（Tensor Core）加速。2026-09-07 核对的表只列 **CC 8.0、9.0、10.0**；未在 8.6、8.7、8.9、10.3、11.0、12.x 列出。拒绝该原生能力声明，不臆测编译器如何降级，也不宣称接口必然编译失败。
4. INT8 两个输入必须有相同的显式有符号性，不用普通 `char` 猜测。`sm_72` 是历史接口下界，低于本站 CC 7.5 基础门槛，也不是 CUDA 13 的代码生成目标。未来实现另选有效目标，先用宽整数证明 32 位累加不溢出；最终 INT8 输出需要独立的比例、零点、舍入与限幅合同，不能将 int 片段直接视为 INT8 数组。

原生类型表在已列 CC 7.5 及之后各行列有 FP16/INT8，BF16/TF32 从 CC 8.0 开始；它不是所有未来 CC 的承诺。未来编译需记录确切工具链和目标，生成物检查才回答产生了哪些指令，运行与独立参考才回答实际结果和验收，性能还需另行测量。这些步骤都未在本页发生；原生 Linux 仍是唯一受支持环境（Supported Environment）。

## 解答三：先证明完整存储，再允许集体访问

原始三个起点的元素偏移均为 `16*24+16=400`。A/B 的字节偏移为 `400*2=800`，D 为 `400*4=1600`，模 32 都为 0。half 步长 24 是 8 的倍数，float 步长 24 是 4 的倍数。起点和步长虽然通过，原尾部仍不能直接承受完整 `16x16` 访问：A 只有 `3x7` 有效输入，B 只有 `7x5`，D 只有 `3x5` 输出。

备选 half 暂存起点加 8 元素产生 `8*2=16` 字节偏移，模 32 为 16；它的 `ldm=24` 合法并不能修复起点。float 输出 `ldm=18` 不是 4 的倍数，即使基址对齐也非法。`ldm` 的单位始终是元素，32 字节起点条件与 16 字节步长粒度是两项检查；不把 half/float 规则外推为所有类型的规则。

一种完整方案为 A、B 各提供独立 32 字节对齐的 `16x16` half 暂存区，输出提供同样对齐的 `16x16` float 暂存区，三者均用 `ldm=16`。每区最大元素偏移 `15*16+15=255`，故两个 half 区各需 512 字节，float 区需 1024 字节。最后一步只从原 A 的行 16 至 18、K 16 至 22，以及原 B 的 K 16 至 22、列 16 至 20 读取；其余输入槽全部填零。最终只复制 D 的行 16 至 18、列 16 至 20，普通内存坐标决定复制位置，不推测 `fragment.x[i]`。

1. 消费线程束在首个 K 步前将累加器清零一次，之后保留跨步累加。生产者按有效坐标搬运并定义所有补零槽；所有线程都保留参与后续线程块屏障的资格。
2. 两个线程束共同执行线程块范围的发布屏障，之后完整消费线程束用一致参数执行加载与乘加。边界条件只选择搬运的数据，不剔除消费通道（lane）。
3. 消费者完成本步读取与乘加后，两个线程束共同经过复用屏障，生产者才能覆盖同一输入暂存区。重复处理各 K 步，不在尾步重置累加器。
4. 最终由完整消费线程束将 float 片段存到完整输出暂存区；两个线程束经过发布屏障后协作复制有效输出，再经过最后读取屏障才复用输出存储。所有屏障都必须由整个线程块一致到达。

这些阶段要求写入完成并发布后再读取，全部消费者读取完成后再复用存储。WMMA 只同步参与的线程束，不能单独发布另一线程束的写入，也不能证明主机可读。未来运行仍需完成与错误检查及独立数值验收，不能把纸面设计称为已观察的内存安全。

## 合法替代

- 练习一：保留原输入的普通非 Tensor Core FP32 SIMT 路径，并保持题设 FP16 输出转换进行对照；这是不同数值算法，不是精确实数预言机或逐位等价回退。仅扩大累加器不能补救输入损失。
- 练习二：需要原生 FP64 时，仅从已列能力且工具链可用的设备中选择；否则明确放弃原生加速要求并另定双精度实现。不提供未测量的速度判断。
- 练习三：可将整个问题显式补齐到 `32x32x32`，零填输入，保持有效区域结果并只复制 `19x21` 输出；或将边缘交给另一个边界安全的实现并重新验证数值合同。两者都需独立证明容量、所有权与同步。

## 常见错误

- 把 `R_stored` 符合度当成原问题通过；把 `U_original` 与 `R_stored` 混比；为隐藏转换损失放宽题设阈值。
- 把 float 存储等同于 FP32 乘数，把历史 `sm_72` 当 CUDA 13 目标，把 `sm_80` 下界当原生 FP64 的递增白名单。
- 仅凭起点对齐就加载尾部，让部分通道提前退出，拿 WMMA 代替跨线程束屏障，或用片段下标代替逻辑坐标。

继续复核 [PB-R4-009](/practice/#pb-r4-009) 与 [SRC-CUDA-069](/sources-and-versions/#src-cuda-069)。复核日期 **2026-09-07**；以上只有原创推导，没有编译、运行、指令选择或性能结果。
