---
title: 'L10 解答：候选尚未被排除，不等于计划已经执行'
description: 复核张量坐标、独立候选门槛、缓存失效和数值/计时协议，给出合法替代与明确的证据边界。
pairId: l10-solutions
counterpart: /en/libraries/cudnn-graphs-and-plans/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L10-SOLUTIONS
prerequisites: [L10-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l10-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cudnn-graphs-and-plans/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L10-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cudnn-graphs-and-plans/solutions/" lang="en">Read the English counterpart</a>

## 复核之前

先完成 [L10 练习](/libraries/cudnn-graphs-and-plans/exercises/)。解答采用后端 **9.24.0** 与前端 **1.27.0**，前端提交为 `f77fbc3d21be3f24cd0286b9b368105f7c518b8a`，依据见 [L10](/libraries/cudnn-graphs-and-plans/)、[SRC-CUDA-071](/sources-and-versions/#src-cuda-071)和 [SRC-CUDA-072](/sources-and-versions/#src-cuda-072)。所有候选数据都是假设。本页没有编译代码，没有运行官方测试或 GPU 工作，四个证据数组全部为空。

## 解答 1：追踪坐标与所有权

图包含三个操作：1x1 互相关（cross-correlation）产生虚拟张量（virtual tensor）T；加通道偏置产生虚拟 U；ReLU 产生可观察的 Y。填充为零，步长和膨胀均为一，因此输出高宽仍为 `2,3`；三个滤波器给出 `K=3`。数学意图是 `Y[0,k,h,w] = ReLU(sum over c=0,1 of X[0,c,h,w]*W[k,c,0,0] + bias[0,k,0,0])`，输出按 FP16 存储。旧 Y 不参与计算。中间值/计算 FP32 与输入输出 FP16 是不同声明。

通道变化最快的元素映射为：X 偏移 `12*n+c+6*h+2*w`；R/S 为单元素维度时，W 偏移 `2*k+c`；bias 偏移 `k`；Y 偏移 `18*n+k+9*h+3*w`。所以 `X[0,1,0,2]` 对应元素 5、字节 10；`Y[0,2,1,1]` 对应元素 14、字节 28。若错误地按紧密 NCHW 读取 X，第一个检查会读到元素 8。

对于正步幅，逻辑存储范围为 `1 + sum((dimension-1)*stride)` 个元素。X、W、bias 和 Y 分别需要 12、6、3、18 个 FP16 元素，即 **24、12、6、36 字节**，尚未计入分配器的填充或对齐开销。这是张量范围，不是执行工作区需求。维度和步幅既不会分配内存，也不能证明实际地址满足引擎对齐要求。

为张量分配不同 UID，执行时绑定当前 X/W/bias/Y 设备缓冲区。T 和 U 保持为内部虚拟边，不作为应用输出绑定；可观察的 Y 则保持非虚拟。证明输入输出分配独立、范围足够、实际地址对齐、先初始化后使用、执行完成后再读取/复用/释放。执行工作区（workspace）要另行查询和管理。虚拟中间值不保证特定内核数量，也不保证无需临时存储。

主机参考通过独立推导的坐标映射读取实际 FP16 值，提升类型后用 FP64 累加两个乘积，加上正确通道的偏置，再做 ReLU，并考虑 FP16 输出舍入。选择有限、有界、各通道不同的输入；预先声明容差，例如采用 `abs(actual-reference) <= atol + rtol*abs(reference)`，并解释 `atol,rtol` 的依据，而不是编造通用保证。非有限结果要单独报告。这是准确性参考，并不要求设备 FP32 计算与 FP64 算术逐位相同。

描述正确后，仍要经过验证、候选发现、策略/支持/构建检查、实际缓冲区合法性检查、执行完成和数值验收。这个小形状刻意用于坐标练习，不是声称融合引擎支持它。

## 解答 2：让每道门槛保持独立

构造列表得到以下决策：

| 候选 | 后端 + 前端 MiB | 决策 |
| --- | --- | --- |
| C0 | `2 + 2 = 4` | 即使内存足够，也按 `NONDETERMINISTIC` 排除 |
| C1 | `9 + 2 = 11` | 后端 9 超过上限 8；总计也超过预算 |
| C2 | `7 + 2 = 9` | 后端 7 通过上限 8；总计 9 超过预算 8 |
| C3 | `4 + 2 = 6` | 符合预算和实际分配；题设构建失败仍使这次尝试被拒绝 |
| C4 | `5 + 2 = 7` | 符合预算 8，超过实际分配 6；支持检查/构建尚未尝试 |

C4 **不是已观察到的成功**，不是选中的引擎，也不是实测优胜者。它仍需要至少 7 MiB 的合法实际分配、成功的支持检查/构建、针对实际计划成功的总大小查询、有效绑定和生命周期、执行完成，以及独立数值验收。表中给出的大小不等于取得了真实查询结果或已构建计划。带错误返回的查询若失败，不能假定工作区为零。

分阶段流程是 `validate -> build_operation_graph -> create_execution_plans -> application filters -> check_support -> build_plans`，每一步都检查错误。发现阶段收集配置，数值/行为筛选和后端工作区筛选限制候选。在选定的后端版本下，`check_support` 找到可接受配置就停止；成功不证明整个列表都可用，也不阻止题设中的 C3 构建失败。`HEURISTICS_CHOICE` 在首个构建成功处停止；`ALL` 继续尝试其他候选。两者都不测量或验证数值，而且这个实现拒绝多线程构建。

若继续调查 C4，应证明分配成功和容量足够，而不只是改一个偏好值。总临时空间预算之外还要留内存余量。先前工作仍在使用旧分配时，不能释放或挪作他用；没有顺序约束的执行不能共享可写临时空间。计划实际存在后，要检查带错误返回的总工作区查询，而不只检查后端上限。先构建了计划，也不允许用不足的存储去执行。

列表为空时，不读取元素零。记录图、版本、策略和分阶段诊断，在不改变语义/策略的前提下尝试 FALLBACK、另行验证的分解路径，或报告不支持。FALLBACK 不保证存在引擎，也不保证性能好。不能通过省掉偏置或放松确定性/精度来制造成功。执行或同步失败需要诊断和受控清理，不能在可能已出错的设备上下文中盲目继续尝试候选。

只有通过正确性验收后，采用可比较边界的冷/热测量才有意义。确定性（determinism）筛选不是 FP32 参考测试，`TENSOR_CORE` 也不等价于 `NONDETERMINISTIC`。

## 解答 3：重新核验产物，再做测量

应用图/计划缓存保存已构建选择和应用验收条件。后端默认内核缓存按设备序号保存已编译 CUBIN，在句柄/计划之间共享；文档规定默认 100 MB，采用 LRU。显式自定义内核缓存由调用者持有，保存同类已编译内核资源，但不会自动继承默认容量和淘汰策略。关闭默认缓存，不会关闭已附加的自定义缓存。它们都不能提供当前数值结果或实测优胜者。

保守的应用键/记录包括图语义及全部操作属性、张量类型/形状/步幅/对齐、数值和工作区策略、精确前端/后端版本及构建标识、目标硬件和相关设备属性。记录旁还要保留驱动/Toolkit 和测量条件。图哈希可以作为其中一部分，但不能代替整份记录；动态形状图会有意从哈希输入中省略维度和步幅。

| 独立变化 | 安全决策 |
| --- | --- |
| 仅改变同一约定下的输入内容/指针 | 检查当前范围、对齐、设备、别名、容量和生命周期后才可能复用；绑定新指针，仍检查执行和输出 |
| 预算从 8 MiB 降到 6 MiB | 记录的总需求 7 MiB 不再合格，即使旧分配仍足够大 |
| 后端版本/构建标识改变 | 复核目标约定和问题记录；保守地重新构建/验证，不能由 API 兼容推断产物有效 |
| 目标硬件改变 | 不能盲目恢复旧设备计划；优先遵守硬件匹配的序列化规则，并在目标设备重新查询启发式 |
| 覆盖形状/步幅后动态键仍命中 | 键命中不够；先确认覆盖支持，再于分配前按实际运行形状/步幅查询总工作区；记录后端 9.23.0 查询门槛 |
| 序列化 `NCHW_VECT_C` | 在 9.24.0 已知问题范围内避免这种布局的序列化，不推广到所有布局 |

图 JSON v2 恢复结构。执行 UBJSON 保存选中计划及执行元数据，并可用 `serialize_structure=false` 省略结构。带句柄的恢复重建一个计划，因此原来非零的选中索引可能变成零。它既不恢复原候选列表，也不会让旧索引成为可移植的引擎身份。模式不匹配可能使产物失效，并且硬件必须匹配。重新检查策略与工作区、绑定缓冲区；操作安全和计时都要考虑默认 `run_warmup=true`。

拟议环境清单（Environment Manifest）应记录 Native Linux 发行版/版本、编译器/C++ 方言、GPU 型号/计算能力/数量/内存、驱动、Toolkit、编译与加载的后端身份、前端 SHA，以及组件/构建细节。后端 9.24.0 的 CUDA 13.x 包列出 CUDA 13.0-13.3，Linux 驱动至少为 **580.65.06**；静态链接目标为 13.3。前端 C++ 配置要求 CMake 至少 3.23 和 C++17。这些是软件兼容性事实，不是安装完成，也不会自动加入工具包通道（Toolkit Lane）。后端包哈希、实际分配和结果都仍未建立。

计时前先规定独立参考的构造、绝对/相对误差与有限值检查，以及同条件下单独的重复性测试。每次试验之间恢复相同的可变输入。冷启动记录逐项说明主机图设置、启发式、构建/运行时编译、分配、恢复预热和首次完成工作是否计入。热执行记录说明准备、预热/重复策略、执行流事件区间和完成检查。应用计划、默认/自定义内核缓存、序列化产物的状态分别记录。实际测量前，耗时、误差和观察结果都留空；题目没有提供这些数据。

## 合法替代

- 本题已知前端临时空间固定为 2 MiB，因此应用可以用更紧的 6 MiB 后端上限，为 8 MiB 总预算做提前筛选。最终仍须检查总需求、实际分配和全部状态；这不是临时空间未知时可以自动相减的通用规则。
- 卷积、偏置和 ReLU 可以分解执行，但必须保留操作顺序、广播轴、类型和中间舍入约定，并独立验证。若将内部结果实体化为 FP16，就改变了题设要求 FP32 中间值的问题。后续端到端测量应计入增加的分配、流量和启动，但现在不能预测成本。
- 若能简化所有权和失效处理，可以不保留持久计划缓存，按需重建；也可以只持久化图结构，到目标设备重新规划。本练习没有证明任何一种方案具有性能优势。

## 常见错误

- 按紧密 NCHW 读取通道变化最快的字节，沿错误轴广播偏置，或用计算类型为错误存储声明辩护。
- 把虚拟张量当作无需工作区或只用一个内核的保证，或者把 cuDNN 运算图与 CUDA Graph 重放混为一谈。
- 把 `create_execution_plans` 当作构建完成，把 `check_support` 当作所有候选都受支持，或把 `ALL` 当作基准测试。
- 漏算前端临时空间，把预算当成实际分配，或在 C3 失败后直接宣布 C4 成功。
- 把内核缓存开关当成应用计划失效机制，或当成显式自定义缓存的淘汰策略。
- 在未复核的版本/设备间恢复序列化计划，忽略恢复预热，或把图键当成完整的支持/策略身份。
- 把确定性等同于准确性，或将官方测试阅读、拟议兼容性、历史已修复问题、假设候选写成当前执行证据。

复核日期：**2026-09-07**。继续完成 [PB-R4-011](/practice/#pb-r4-011)并阅读相关的 [L11](/libraries/attention-backend-dispatch/)，不为 L10 新增先修项或运行主张。
