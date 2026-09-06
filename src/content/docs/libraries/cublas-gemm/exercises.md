---
title: 'L06 练习：推导库调用而不是猜参数'
description: 审核九种转置组合、带填充的行主序映射与流生命周期，提交目标、约束、证据和验收条件明确的三份纸面记录。
pairId: l06-exercises
counterpart: /en/libraries/cublas-gemm/exercises/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L06-EXERCISES
prerequisites: [L06]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l06-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cublas-gemm/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-06' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L06 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cublas-gemm/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

只需先完成 [L06](/libraries/cublas-gemm/)。三题均为静态推导，不要求 GPU，不显示或执行完整 CUDA 代码，四个证据数组保持空。

## 提交要求

每题先写数学语义，再写存储和生命周期。明确区分推导值、准备实施的检查和真实观察；本题只有前两种。使用 L06 固定的 12.9.2 API 合同，写完后再打开[独立解答](/libraries/cublas-gemm/solutions/)。

## 练习一：列主序与九种转置

**目标：** 为 `m=4,n=3,k=5` 的列主序 GEMM 推导全部 N/T/C 组合的 A、B 存储形状与主维度（leading dimension）下界，并识别索引边界。

**约束：** C 的输出始终为 `4 x 3`。重点审核 `transa=T, transb=C, lda=7, ldb=5, ldc=6`，允许填充但不能修改参数来躲过分析。给出实数与复数中 C 标志的区别。另设合法非空向量、`incx=2`，索引例程返回一起点位置 3，推导其主机端零起点元素偏移。

**应提交证据：** 九行形状/下界表；重点组合的三份完整存储元素数、最后一个逻辑元素偏移；返回位置转换公式；一条子矩阵保留父级步长的解释。

**验收条件：** `m,n,k` 不随转置改写，主维度按存储形状而不是运算后形状确定；分配量与最后有效偏移分开；GEMM 地址不为 BLAS 一起点约定留空槽；共轭不能在复数情况下被忽略。没有观测输出或性能结论。

<details><summary>提示一：先还原形状</summary>目标 A 在运算后是 4 行、5 列；若输入要先转置，分配时哪一边是 5？对 B 独立做同样推导。</details>

<details><summary>提示二：再检查跨度</summary>列主序分配量按主维度乘存储列数计算，最后一个有效元素按“最后一行加最后一列乘步长”计算，两者一般不同。</details>

## 练习二：带填充的行主序对照

**目标：** 为行主序 `C_out = 1.25*A*B - 0.5*C_in` 写出无需数据转置的 cuBLAS 参数计划，并建立独立参考。

**约束：** A 为 `3 x 2`、行步长 4；B 为 `2 x 5`、行步长 8；C 为 `3 x 5`、行步长 7。全部 FP32，计算选择 `CUBLAS_COMPUTE_32F_PEDANTIC`，使用主机标量。保留原 C，不改变 `alpha,beta`，不把填充当作逻辑元素。

**应提交证据：** 转置后的等式；传给 cuBLAS 的操作数顺序、`m,n,k`、两项标志与三个主维度；至少一个输出坐标的双精度参考式；覆盖非方阵、不同初始 C 和填充的验证计划。

**验收条件：** 列主序输出与应用行主序输出共享同一正确字节解释；参考从原始逻辑坐标独立计算，不复用待验证的交换映射。写明有限性检查及 L06/EX18 的 `atol=1e-4, rtol=2e-5` 有界测试合同。EX18 本身有非零 beta 测试数据，但不因此声称已实现本题的具体填充布局，也不能从纸面推导获得运行证据。

<details><summary>提示一：转置整个等式</summary>普通转置改变乘法顺序，但不改变两个实数缩放系数。先写 C 的转置，再决定哪个指针排在前面。</details>

<details><summary>提示二：步长跟着分配走</summary>交换的是矩阵角色，不是每块存储的物理行间距。CPU 参考仍可用原问题的行主序坐标逐项累加。</details>

## 练习三：修复类型与生命周期计划

**目标：** 修复下列审查情景，指出每处独立错误，而不是以一次全设备同步掩盖所有问题。

**约束：** 已选择同一设备上的专用句柄 h、流 S 和足够容量且 256 字节对齐的用户工作区 W。提案先给 h 设置 W，再设置 S；设设备指针模式却把栈上的 `float alpha,beta` 传入；提交输入复制和 GEMM 后，立即让无等待边的流 T 消费 C，同时释放 W；主机以库调用返回为依据读取结果，并把句柄销毁也算进“内核时间”。另一个变体把 A/B 改为 FP16、C/计算仍为 FP32，却也把标量改为 FP16。

**应提交证据：** 修复后的设置顺序；主机/设备两种合法标量方案；S 到 T 的依赖边；输入、输出、标量和 W 的最后使用点；库状态与异步错误检查位置；混合精度变体的标量类型解释。

**验收条件：** 解释 `SetStream` 会重置用户工作区；设备模式不接受栈指针；跨流消费者在显式依赖后启动；回收、主机观察均在对应完成之后；销毁与设置开销不冒充 GEMM 设备时间。混合精度标量仍按支持表为 `float`。若不能安全执行则停止，不读取旧输出，不虚构修复后的运行成功。

<details><summary>提示一：分开四类问题</summary>配置被覆盖、标量位置错误、缺少执行依赖、计时边界错误，不是同一件事。同步只能解决其中一部分。</details>

<details><summary>提示二：沿最后使用者回溯</summary>W 的最后使用者是 GEMM，C 还被 T 消费；设备标量与主机标量的存活终点也不同。可保守地统一等待最终消费者完成再回收。</details>

## 下一步

对照[解答与常见错误](/libraries/cublas-gemm/solutions/)，再审核 [PB-R4-007](/practice/#pb-r4-007)。可运行工作只链接 [EX18](/examples/cublas-gemm/)和 [LAB12](/labs/compare-gemm-with-cublas/)。依据为 [L06](/libraries/cublas-gemm/)及 [SRC-CUDA-067](/sources-and-versions/#src-cuda-067)，复核日期 **2026-09-06**。
