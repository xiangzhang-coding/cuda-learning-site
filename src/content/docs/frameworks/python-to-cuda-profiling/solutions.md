---
title: 'P07 解答：已关联工作与两个保留窗口'
description: 解析给定启动关系，推导两个 profiler 窗口与回调边界，修复追踪缺失、测量和产物保管声明。
pairId: p07-solutions
counterpart: /en/frameworks/python-to-cuda-profiling/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P07-SOLUTIONS
prerequisites: [P07-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p07-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/python-to-cuda-profiling/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P07-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/python-to-cuda-profiling/solutions/" lang="en">Read the English counterpart</a>

## 解答边界

先尝试 [P07 练习](/frameworks/python-to-cuda-profiling/exercises/)，直接先修项为 `[P07-EXERCISES]`。这些原创纸面解答使用 PyTorch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**，原生 Linux x86_64 作为源码合同，没有采集追踪、输出或计时。所有证据数组仍为空；**依赖 GPU 的行为保持待硬件验证（Pending Hardware Verification）**。

## 解答 1：启动图决定归属

给定链为 `F-A -> H-A1 -> C-X -> K-A1`、`F-A -> H-A2 -> C-Y -> K-A2`、`F-C -> H-C1 -> C-Z -> K-C1`。F-A 在设备 0、流 3 上有**两个**核函数；F-B 根据明确完整、只处理元数据的题设有**零个**；F-C 在设备 0、流 7 上有**一个**。K-U 仍为**未解析**，因为没有给出连接或设备/流身份。

共享“elementwise”显示标签不能把 K-A2 接到 F-C，或把 K-C1 接到 F-A。主机异步提交工作，所以 K-A1 可以在 CPU 的 F-A 范围结束后才执行，显式启动链仍然有效。最近范围或时间包含都不能替代关系。阶段标注分组工作，不会重命名核函数或规定完成时机。

实际追踪需要进程/线程/窗口内的逐次 CPU 身份、运行时启动与外部关联（external correlation）关系，以及已关联设备活动的设备/流身份。关联是一种归属，不是无关流之间的同步边。流 3 与流 7 同在设备 0，不能确立跨流顺序或已观察重叠。

只有本工作表明确声明 F-B 的关系列表完整且仅处理元数据。不完整真实采集中，看不到核函数也可能来自 CUPTI 路径缺失、窗口错误、不支持的采集或活动丢失。声明零工作之前先检查完整性。表格没有实测时长、设备利用率、正确性、累加器精度或瓶颈。

## 解答 2：记录六个迭代，保存两个窗口

周期长度为 `1+1+3=5`，两个周期需要十个迭代。初始 step 为 0，每次迭代之后前进一步，动作如下：

| 迭代索引 | 动作 | 保存的工作负载窗口 | 随后边界处的回调 |
| --- | --- | --- | --- |
| `0` | `NONE` | 无 | 无 |
| `1` | `WARMUP` | 无 | 无 |
| `2` | `RECORD` | `W1` | 无 |
| `3` | `RECORD` | `W1` | 无 |
| `4` | `RECORD_AND_SAVE` | `W1` | `5` |
| `5` | `NONE` | 无 | 无 |
| `6` | `WARMUP` | 无 | 无 |
| `7` | `RECORD` | `W2` | 无 |
| `8` | `RECORD` | `W2` | 无 |
| `9` | `RECORD_AND_SAVE` | `W2` | `10` |

活动集合为 **`[2,3,4]`** 与 **`[7,8,9]`**，共六个迭代。预测**两次**回调，在迭代 4 与 9 的工作结束后，分别位于步号 **5 与 10**。按声明的十迭代会话，第十次 step 后退出上下文不会再增加第三个记录窗口。这些是推导动作，不是已观察回调日志。

W1 必须保留 2-4 的三个工作负载标签，W2 保留 7-9 的三个标签，均在 `on_trace_ready` 内导出到不同目标。每次写入有独立成功/错误记录与产物身份。等待、预热的工作负载标签不属于活动成员；profiler 记账不是额外应用迭代。上下文前的工作负载预热不同于 profiler 的 WARMUP 动作。

仅在上下文后导出一次的方案只保留最后周期，丢失 W1。共享目标的方案即使回调两次，也可能用 W2 覆盖 W1。默认 `acc_events=False` 让摘要事件保持周期局部；`acc_events=True` 允许累积 FunctionEvents，却不能恢复先前未保存的时间线。回调次数不等于保留产物数量。

漏掉一个边界 step，会让 profiler 逻辑迭代与应用迭代脱节，索引到窗口的预测不再成立。若完全不调用 step，本调度将停留在初始 NONE 动作，而不是自动记录十个迭代。`prof.step()` 表示前进，并可能触发采集转移，但不是通用 CUDA 完成保证。计时仍需要 P04 的明确边界。

## 解答 3：拒绝无依据声明，保留有用诊断

| 假设报告声明 | 处置 | 必须修复的内容 |
| --- | --- | --- |
| 支持活动与 CUDA 表格时间证明 JSON 核函数 | 拒绝 | 检查实际活动窗口的 CPU、运行时、核函数记录及可用关联；调查可能的回退 |
| 系统 Toolkit 版本标识已加载 CUPTI 与驱动 | 拒绝 | 保留确切选定产物，以及实际加载库/驱动身份 |
| 形状记录时的复用延迟证明无插桩分配器生命周期 | 拒绝 | 把持有张量的插桩与无 profiler 生命周期实验分开 |
| 核函数时长总和就是应用延迟 | 拒绝 | 独立测量匹配的无 profiler 墙钟/设备边界，考虑重叠和嵌套聚合 |
| Nsight 与 torch.profiler 嵌套自动有效 | 拒绝 | 分开 CUPTI 客户端会话，检查兼容性/订阅者诊断 |
| Root 与公开原始栈是默认修复 | 拒绝 | 诊断精确权限边界，取得授权，只共享审核后的脱敏副本 |

没有核函数的 JSON 不证明 CUDA 工作从未执行。固定 profiler 支持一种回退：表格有 CUDA 计时，但没有导出的 CUDA 核函数活动；窗口错误、已加载库缺失/不兼容、采集不完整也都有可能。追踪声明保持受阻，直到冒烟检查保留框架/用户范围、运行时启动记录、实际核函数和至少一条有依据的启动链。仅在声明窗口内包含传输工作时，才要求传输记录。

环境清单（Environment Manifest）需要 GPU 型号/受控身份、计算能力、显存/数量、选定设备/拓扑；OS/发行版/内核/架构/glibc/CPU 与容器身份；解释器版本/来源及构建/编译器；确切 torch wheel/哈希/提交与完整依赖；驱动、构建 CUDA、系统 Toolkit/编译器或声明缺失，以及相关延迟加载后实际加载的 CUDA Runtime/cuDNN/CUPTI 身份。选定的是构建 CUDA 12.8、Runtime/CUPTI 12.8.90、cuDNN 9.19.0.56，不是这些库已经加载的证据。

还须保留工作负载修订、输入来源/种子、形状/步幅/dtype、正确性标准/结果、设备/流政策、原生分配器配置与实测后端、精度/确定性标志；profiler/构建身份、请求/支持活动、工作负载预热、调度、精确 step 边界、形状/栈/内存标志、回调/产物、完整性与错误；独立计时范围、完成、重复次数、原始样本、时钟/功耗/温度条件及其他负载。每个缺失坐标保持未知，不从计划目标抄成实测。

采用三个不同目的：正确性检查确立已验收结果，最小定向性能分析确立关系，匹配的无 profiler 计时确立指定时长分布。形状采集可能持有张量引用并引入复制，所以其中的分配器行为不是无扰动基线。若测量插桩开销，必须单独报告，不能用猜测常数扣除。表格不能通过累加重叠工作决定墙钟时间。

记录主机/容器权限政策与任何经管理员批准的变更。活动追踪不是硬件计数器采集；先检查实际故障，不一律要求提权或关闭安全措施。其他 CUPTI 客户端可能违反选定的单订阅者合同，所以将 torch.profiler 与 Nsight 隔离。无法得到授权采集时，继续标记受阻。

原始追踪/栈/日志与标识路径保持私有，控制访问并记录哈希。使用中性标签与合成输入；共享前审核脱敏副本、其哈希、删改内容、审核批准与保留/删除政策。保留窗口与关联一致性，不暴露秘密、源码路径、用户名、主机名或机密输入。若脱敏破坏了要证明的关系，应缩小公开声明或改用非敏感数据重新采集，不能用虚构标识符补齐后冒充真实证据。

## 合法替代与取舍

仅 CPU 的 profile 若明确标注，可以回答刻意限定的 CPU 问题，但不能满足 CUDA 关联要求。表格可按聚合运算排序以便后续调查；逐次发生与时间关系则需要保留时间线。经过独立兼容性审查的另一场授权 Nsight 会话，可以回答恰当的应用或核函数问题，但不是嵌套订阅者的理由。

不记录形状/栈的最小采集能减少扰动与披露。独立标注的形状采集运行可以帮助区分工作负载，前提是承认它的成本与生命周期影响。无法安全共享数据时，可用审核后的聚合支持更窄声明，或让采集保持私有。两种替代都不允许公开私有路径或声称未观察的核函数。

## 常见错误

- 用显示名称、CPU 包含或最近时间戳替代启动关系，错误归属异步工作。
- 把连接缺失变成零核函数，忽略采集完整性。
- 用 supported activities 或 CUDA 时间列证明 CUPTI 核函数追踪，混淆预检与证据。
- 调度会话结束后只保存一次，或覆盖同一个目标，丢失早期窗口。
- 把回调放在最后一个活动迭代之前，产生调度偏一错误。
- 视形状采集为被动观察，忽略被保留的张量引用。
- 把重叠或父子包含时间相加得到延迟，改变了测量问题。
- 上传原始栈或一律授予 root，既违反隐私/权限边界，也没有诊断缺失层。

返回 [P07](/frameworks/python-to-cuda-profiling/)与 [PB-R5-007](/practice/#pb-r5-007)。来源为 [SRC-CUDA-080](/sources-and-versions/#src-cuda-080)与 [SRC-CUDA-083](/sources-and-versions/#src-cuda-083)，复核于 **2026-09-12**。这些答案不声称已保留运行证据或性能结果。
