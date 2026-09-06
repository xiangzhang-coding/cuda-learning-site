---
title: 'L06 解答：布局、类型与完成边界'
description: 逐项复核转置表、行主序交换操作数和异步资源归属，列出合法替代与常见错误，不提供第二份 CUDA 实现。
pairId: l06-solutions
counterpart: /en/libraries/cublas-gemm/solutions/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L06-SOLUTIONS
prerequisites: [L06-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l06-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cublas-gemm/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-06' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L06-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cublas-gemm/solutions/" lang="en">Read the English counterpart</a>

## 复核前

先完成 [L06 练习](/libraries/cublas-gemm/exercises/)。以下数值由形状和地址公式推导，不是 GPU 输出。依据 [L06](/libraries/cublas-gemm/)与 [SRC-CUDA-067](/sources-and-versions/#src-cuda-067)的 12.9.2 合同；没有代码导入、编译或运行，四个证据数组为空。

## 解答一：先形状，后地址

所有组合都保持 `m=4,n=3,k=5`，且 `ldc >= 4`。

| 标志 | A 存储 | B 存储 | `lda` 下界 | `ldb` 下界 |
| --- | --- | --- | --- | --- |
| N,N | `4 x 5` | `5 x 3` | 4 | 5 |
| N,T | `4 x 5` | `3 x 5` | 4 | 3 |
| N,C | `4 x 5` | `3 x 5` | 4 | 3 |
| T,N | `5 x 4` | `5 x 3` | 5 | 5 |
| T,T | `5 x 4` | `3 x 5` | 5 | 3 |
| T,C | `5 x 4` | `3 x 5` | 5 | 3 |
| C,N | `5 x 4` | `5 x 3` | 5 | 5 |
| C,T | `5 x 4` | `3 x 5` | 5 | 3 |
| C,C | `5 x 4` | `3 x 5` | 5 | 3 |

重点 T,C 组合的 `7,5,6` 均合法。完整存储分别覆盖 `7*4=28`、`5*5=25`、`6*3=18` 个元素；最后有效偏移分别为 `4+3*7=25`、`2+4*5=22`、`3+2*6=15`。分配量不是最后偏移加一，因为每个物理列还可含尾部填充。

实数 B 的 C 标志等价于 T；复数还要共轭每个读取值。一起点位置 3 对应 `(3-1)*2=4`，不能直接索引元素 3。GEMM 始终从合法起始指针配合零起点地址式解释。子矩阵起点改变后，父矩阵的物理列间距仍未改变。

## 解答二：转置问题，不转置字节

原问题的普通转置为 `C_out^T = 1.25*B^T*A^T - 0.5*C_in^T`。把 B 的行主序字节解释成列主序 `5 x 2`，把 A 解释成列主序 `2 x 3`，C 解释成列主序 `5 x 3`。调用参数计划为第一个操作数 B、第二个 A，`m'=5,n'=3,k'=2`，两项标志 N，`lda'=8,ldb'=4,ldc'=7`。

例如原问题 `(i,j)=(1,4)` 的双精度参考是 `1.25*(double(A[4])*double(B[4]) + double(A[5])*double(B[12])) - 0.5*double(C_in[11])`。这里 A/B/C 的索引分别来自原始行步长 4、8、7，不是从交换后的调用还原。该参考值对应结果缓冲区偏移 11，也等于列主序 `C^T` 的 `4+1*7`。

为每个逻辑输出独立计算参考，验证输入与输出有限，再按 `abs(got-ref) <= 1e-4 + 2e-5*abs(ref)` 检查本练习采用的有界 FP32 数据。保留一份原 C；每次验证都使用同一输入。填充可作为越界写检查的哨兵，但不参与乘法或误差统计。数值判据需要随未来更大数据范围重新论证，不能靠放宽阈值修布局。

这份推广只是一道纸面任务。EX18 的固定合同并不因此获得填充、非零 beta 或所有转置组合的运行覆盖。

## 解答三：状态与数据分开管理

先给 h 设置 S，再设置 W，避免 `cublasSetStream` 重置用户工作区。主机标量方案显式使用主机指针模式和 `float` 对象，输入标量在 GEMM 返回后可结束生命。设备方案则分配设备端 `float`，在 GEMM 前有序生成其值，并保留且不改写直到 GEMM 完成。A/B 改成 FP16 而 C 与计算保持 FP32 的支持组合，标量仍为 `float`。

S 中按顺序提交输入复制、必要的 C 初始化、GEMM，再记录事件 E。T 等待 E 后才消费 C。输入、W 和设备标量至少活到各自最后一次使用完成；C 活到 T 的消费者结束，主机读取还要等待相应结果复制完成。保守方案可在最终消费者和结果复制全部完成后统一回收。主机异步复制缓冲区也需保留到复制结束。

所有库调用都检查 `cublasStatus_t`；复制、事件、同步与清理检查 CUDA 状态。设置阶段失败就不进入提交，执行或同步失败就不读取旧结果。句柄创建、配置、分配和销毁属于独立主机或端到端成本，不放入声称只测 GEMM 的区间。12.9 文档说明销毁句柄会隐式同步，但那不是提前读取结果的许可，也不是清晰计时的替代。

## 合法替代

- 练习二在取消“无需数据转置”约束后，可显式打包成列主序再调用，但需增加转换正确性、内存与计时范围，不能称其为零复制方案。
- 练习三可将消费者移入 S，靠同一流顺序建立依赖；若仍使用 T，则保留事件边。全设备同步能正确但更宽泛地建立完成边界，无法修复错误标量类型或失效的工作区配置。
- 不要求自管工作区时可选择 cuBLAS 默认池，但不能继续把 W 的设置或容量当作执行条件。任何改动都应重新说明资源合同。

## 常见错误

- 让 `lda` 随逻辑转置自动变化，或把它写成字节数。
- 行主序交换 A/B 后忘记交换 `m/n`，或又把两个标志改成 T。
- 用同一错误布局映射同时生成参考和库参数，得到虚假的一致性。
- 只测方阵、零输入或 `beta=0`，便宣布任意布局和累加正确。
- 把设备指针模式理解成“矩阵在设备上”，忽略它实际约束缩放标量的位置。
- 把调用返回、句柄销毁或网页检查当作已完成的数值验证。

复核日期：**2026-09-06**。所有答案是静态推导，不产生证据状态。
