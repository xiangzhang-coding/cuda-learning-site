---
title: 'L07 解答：可行配置不等于实测赢家'
description: 复核描述符字段、候选过滤、偏置重映射与缓存失效，给出合法替代和常见错误，并保持无运行证据的边界。
pairId: l07-solutions
counterpart: /en/libraries/cublaslt-matmul/solutions/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L07-SOLUTIONS
prerequisites: [L07-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l07-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cublaslt-matmul/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cublaslt-matmul/solutions/" lang="en">Read the English counterpart</a>

## 复核前

先完成 [L07 练习](/libraries/cublaslt-matmul/exercises/)。本页引用 [L07](/libraries/cublaslt-matmul/)与 [SRC-CUDA-068](/sources-and-versions/#src-cuda-068)的 12.9.2 合同。候选情景完全是假设，不是保存的启发式输出；没有代码导入、编译、GPU 运行或实测赢家，四个证据数组为空。

## 解答一：按责任分配字段

用 `cublasLtCreate` 创建句柄；用 `cublasLtMatmulDescCreate` 指定 FP32 pedantic 计算和 `CUDA_R_32F` 缩放类型。运算属性设置 A 为 T、B/C 为 N、主机指针模式、默认收尾操作（epilogue）。两个缩放对象是主机 `float`，不是 `double`。

四个布局分别记录 FP32 与 `A:(2,3,4)`、`B:(2,5,7)`、`C:(3,5,6)`、`D:(3,5,8)`，括号依次表示存储行、存储列、主维度（leading dimension）；每个布局都显式设 ROW。`op(A)[1,0] = A[0,1]`，所以来自偏移 `0*4+1=1`。它不是偏移 4，也不需要一次数据搬运。

C/D 不重叠且同类型、同形状、同批大小、同顺序，主维度不同是允许的。若改为原位，则同时复用同一数据指针和同一布局描述符对象，不能只检查二者字段相同。C 的 `TRANSC` 保持 N；若要数学上的 C 转置，需要重新组织问题，不能在本合同中随意设置 T。

偏好独立创建，预算与对齐按实际资源设置；用各属性对应类型及字节数调用 setter 并检查状态。流作为 `cublasLtMatmul` 参数传递；数据初始化先于运算，结果读取与回收晚于完成。保守地保留描述对象到完成，再用 `cublasLtMatmulPreferenceDestroy`、各 `cublasLtMatrixLayoutDestroy`、`cublasLtMatmulDescDestroy` 与 `cublasLtDestroy` 回收；矩阵和工作区单独回收。销毁一个布局并不释放它描述的矩阵。

## 解答二：先修查询条件，再谈候选

题设只写入 0、1、2 三项，第 3 项不可读。第 0 项失败，只用它的状态解释排除，不能依据其算法或工作区字段。第 1 项需求 2 MiB 虽在 4 MiB 搜索预算内，却超过实际 1 MiB；若不增加合法分配就不能提交。

第 2 项的 512 KiB 容量要求合适，但搜索对四个矩阵的 256 字节声明是假的，不能直接判它可执行。把四个最小对齐属性都设为可保证的 64 字节，并将预算改成目前实际可用的 1 MiB，再查询。若应用确实愿意分配更多，可在重新确认分配与对齐之后选择更大预算，而不是只增大偏好数字。

新的查询仍须逐项检查返回状态、数量和条目状态，再比较工作区和算法限制；对复用或修改配置用 `AlgoCheck`。该检查只审核描述与设备兼容性，实际地址、异步错误和数值正确性仍需独立验证。数值通过以后，才可以在统一的预热、输入恢复、重复次数与设备事件区间下比较时间。任何新返回编号和耗时都不能在这道静态题中预填。

零候选时记录配置并选择语义相同的替代；默认收尾的普通 FP32 可转回 L06 的传统库对照。带收尾的扩展若回退成普通 GEMM，则必须补齐正确后处理。不支持状态需保留原因，不把 `algo=nullptr` 当必胜修复。设备执行或同步失败时停止，避免消费旧数据或在已失效上下文中继续筛选。所有资源在最后使用者完成或受控错误清理后回收。

## 解答三：五个偏置对应哪一维

12.9.2 下拒绝原行主序 D 加 `RELU_BIAS`。重新描述 `D=Y^T`，逐元素满足 `D[j,i] = max((B^T*A^T)[j,i] + bias[j], 0)`。本题两个输入都是未转置的行主序矩阵，故它们的字节可直接解释成转置后的列主序布局。

| Lt 角色 | 使用原指针 | 列主序存储行列 | 主维度 | 操作 |
| --- | --- | --- | --- | --- |
| 第一个乘法输入 | B | `5 x 2` | 8 | N |
| 第二个乘法输入 | A | `2 x 3` | 4 | N |
| C/D | Y | `5 x 3` | 7 | C 为 N |

可使用同一 Y 指针和同一布局描述符作为 C/D，并明确 `beta=0`，给出有效输出存储；为简化首次验证，也可初始化 Y。`alpha=1`。D 行数为 5，紧密五元素偏置向每一列广播，刚好对应原 Y 的五个特征列；输出字节偏移 `j+i*7` 等于原行主序 `i*7+j`。

运算设 `RELU_BIAS`，偏置属性 setter 接收保存设备 `bias` 地址的主机指针变量的地址和指针大小。偏置设备存储活到运算完成。CPU 参考独立按原 A、B 行步长求每个逻辑乘积，加 `bias[j]` 后取最大值；选互不相同的偏置与非方阵，并设置有界 FP32 数据与数值验收规则。该描述符合这里审核的方向与布局规则，但不保证存在候选，仍需资源、查询、执行与数值检查。

复用键包括设备/资源配置、组件版本、全部存储布局、转置、类型、缩放/指针模式、收尾/偏置属性、C/D 别名、工作区和对齐保证，以及数值与搜索政策。只换同合同的数据内容可复用配置，前提是本次指针范围、对齐和生命期重新成立。改变主维度、缩小工作区、降低对齐或升级组件，先失效并重新检查/查询；不跨版本盲用算法对象。内部启发式缓存只省查询工作，不记住本应用的数值验收，也不接管这些失效条件。

## 合法替代

- 保留行主序 Y，执行默认收尾的合法 GEMM，再单独按 `bias[j]` 加偏置和 ReLU；新增后处理必须进入端到端成本与正确性检查，不能被当成已经融合。
- 使用真正的列主序输出中间矩阵，再转换布局。需同时证明偏置方向正确；原 Y 行偏置与列偏置不是同一任务。
- 对固定且实测收益不足的工作负载，只保留正确传统 GEMM 加后处理，而不实现应用级算法缓存。简单方案可以更合适，但本题没有时间数据支持性能选择。

## 常见错误

- 创建 A 布局时填写 `op(A)` 的形状，随后又设置 T。
- 认为设置 4 MiB 工作区偏好已经分配设备内存，或宣称 allocator 的基地址对齐会自动传给所有子视图。
- 把查询成功、条目成功、`AlgoCheck` 成功、执行完成与数值通过混成一个状态。
- 直接使用结果 0，或把启发式顺序、`wavesCount` 和算法 ID 当实测排名。
- 给行主序 D 直接设置受限收尾；只翻转 D 的顺序枚举，未重新解释输入、输出和偏置维度。
- 用 `m,n,k` 三个整数作为全部缓存键，或认为内部缓存能让跨版本算法对象安全复用。
- 将已修复的算法 66 特定问题描述成所有版本都受影响，或以“最新”代替独立验证。

复核日期：**2026-09-06**。配置推导与假设情景都不产生运行或性能证据。
