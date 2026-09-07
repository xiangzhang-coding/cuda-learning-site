---
title: 'L11 解答：候选失败时仍保留契约'
description: 通过原创推导解决 BHSD 字节算术、有界拒绝案例、源码标签下的路由区别和证据不足声明，不提供 cuDNN 执行结果。
pairId: l11-solutions
counterpart: /en/libraries/attention-backend-dispatch/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L11-SOLUTIONS
prerequisites: [L11-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'SRC-CUDA-071: cuDNN backend release notes'
    url: 'https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/release-notes.html#cudnn-9-24-0'
    version: 'Backend 9.24.0'
    platform: 'Native Linux policy; versioned support and known issues, not runtime evidence'
    accessDate: '2026-09-07'
  - title: 'SRC-CUDA-072: cuDNN frontend release and immutable source'
    url: 'https://github.com/NVIDIA/cudnn-frontend/releases/tag/v1.27.0'
    version: 'Frontend 1.27.0; f77fbc3d21be3f24cd0286b9b368105f7c518b8a'
    platform: 'Pinned SDPA descriptors, representation gates, plans, and Python routing; source inspection only'
    accessDate: '2026-09-07'
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l11-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/attention-backend-dispatch/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L11-EXERCISES }
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
  - tag: meta
    attrs: { name: 'cuda:source-count', content: '2' }
  - tag: meta
    attrs: { name: 'cuda:source-versions', content: '9.24.0,1.27.0' }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/attention-backend-dispatch/solutions/" lang="en">Read the English counterpart</a>

## 阅读解答前

先完成 [L11 练习（Exercises）](/libraries/attention-backend-dispatch/exercises/)。以下原创推导采用 [L11](/libraries/attention-backend-dispatch/)、**backend 9.24.0** 和 **frontend 1.27.0**，提交为 **`f77fbc3d21be3f24cd0286b9b368105f7c518b8a`**。[SRC-CUDA-071](/sources-and-versions/#src-cuda-071) 与 [SRC-CUDA-072](/sources-and-versions/#src-cuda-072) 记录 **2026-09-07** 的复核及逐文件权利。上游资料仅链接与转述，没有复制或改编。没有安装、编译、运行上游测试、执行 CUDA 或计时。四个证据数组为空，不授予或继承证据状态（Evidence Status）。

## 解答一：范围正确不证明映射正确

在 `B=1,H=2,S=128,D=128` 时，Q/K/V/O 形状均为 `[1,2,128,128]`。由深度步长一向外推导，得到元素步长（element stride）`[H*S*D,S*D,D,1] = [32768,16384,128,1]`。一般偏移为 `b*32768 + h*16384 + s*128 + d`。

| 量 | 推导结果 |
| --- | --- |
| 真实 BF16 的字节步长 | `[65536,32768,256,2]` |
| 每个张量的元素数 | `1*2*128*128=32768` |
| 每个张量的容量 | `32768*2=65536 B` |
| 四份独立张量容量 | `4*65536=262144 B`，不含工作区（workspace）或其他分配 |
| 最后逻辑偏移 | `(0,1,127,127)` 对应 `16384+16256+127=32767` |
| 最后元素的字节范围 | `65534..65535`，位于各自 65536 字节分配之内 |
| 缩放系数（scale） | `1/sqrt(128)=1/(8*sqrt(2))`，存储为 FP32 舍入之前约为 `0.08838834764831845` |
| 正确的 `(0,1,0,0)` 偏移 | `16384` 个元素，即 `32768` 字节 |
| 提案的 `(0,1,0,0)` 偏移 | `128` 个元素，即 `256` 字节 |

提案的 `[32768,128,256,1]` 步长，在逻辑 BHSD 维度下描述另一种紧凑 BSHD 布局（layout）。其最后坐标同样到达 `128+127*256+127=32767`。通过相同的最后偏移范围检查，不会使两种映射相等。对未改变的 BHSD 字节，应恢复 `[32768,16384,128,1]`；声称已经重新打包，不会真的移动缓冲区内的值。

前端 K 描述符（descriptor）仍为 `[B,H,S,D]`；`K^T` 描述分数计算中的收缩，不是对此描述符进行外部转置。`generate_stats=false` 不请求 Stats 输出，因此答案中不应加入 Stats 输出分配或绑定。这不表示实现无需内部逐行统计量或临时存储。FP32 计算与中间类型不会把 BF16 张量分配变成四字节存储。[固定提交的前向源码](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/samples/cpp/sdpa/fp16_fwd.cpp#L32-L104)提供描述符约定；这里的数值不是复制的示例输出。

对照 L11 的 D=64 模型：元素步长为 `[16384,8192,64,1]`，每个张量 16384 元素、32768 B，总计 131072 B，最后偏移为 16383，缩放系数恰为 `0.125`。D 加倍使这些张量容量加倍，不说明未知计划工作区会怎样变化。两个模型都不证明真实指针对齐、支持或构建成功、引擎选择或数值结果。

## 解答二：拒绝候选，不改变数学目标

| 案例 | 正确分类与行动 | 仍然未知的内容 |
| --- | --- | --- |
| A：SM75 | 在 SM80 之前的资格条件处拒绝这条 SDPA 路径；后端一般 SM75 支持比 SDPA 更广 | 另选参考或应用替代路径是否具有合格环境与实现；本地没有运行 |
| B：FP32 加 UNIFIED | 显式 UNIFIED 拒绝 FLOAT Q/K/V/O。COMPOSITE/AUTO 可能允许 FP32，但位于 L11 接受的 FP16/BF16 契约之外，需要另行审查 | 是否存在支持引擎及符合策略的已构建计划；不能静默降低精度 |
| C：必需因果掩码 | 请求位于无掩码教学子集之外。拒绝删除掩码的提案；在另行具备能力的参考中保留完整请求，否则报告不支持 | 该精确带掩码请求是否受支持；删除掩码或扩大课程都不是已证明的解决方案 |
| D：总临时存储超限 | 只检查后端工作区上限不足。即使 `W_backend <= W_cap`，也应在该总预算下拒绝 | 是否有其他合格候选能容纳；没有提供工作区大小、分配或执行 |
| E：可重复性策略 | 过滤带 `NONDETERMINISTIC` 的候选，再按全部策略检查剩余项 | 是否仍有可接受候选，以及其真实输出能否满足独立准确性标准 |
| F：图（graph）与执行计划（execution plan）构建 | 即使有实际记录，也最多证明这些假设中的阶段；不报告已执行后端或框架选择 | 完成调用所用的真实计划、输出验收和完整运行记录 |

A 与 B 依据 [`sdpa_support_surface.h:347-369,435-481`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/node/sdpa_support_surface.h#L347-L369)及 [`test_sdpa_fp32_rejected.py:87-143`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/test/python/test_sdpa_fp32_rejected.py#L87-L143)。上游测试可能跳过不支持的引擎，本单元没有运行它们。C 首先是课程范围拒绝，不表示所有因果注意力都不受支持。D 依据[最终工作区求和](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/graph_interface.h#L1129-L1135)。E 依据[后端数值说明](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/api/cudnn-graph-library.html#cudnnbackendnumericalnote-t)，不是假定使用张量核心（Tensor Core）就意味着非确定性。

对于 D，`W_total = W_backend + W_frontend` 必须同时适合总临时存储策略和所提供的工作区分配。Q/K/V/O 及其他存活分配另计，因此临时存储总量能容纳也不证明全部设备内存需求能容纳。可检查错误的大小查询、成功分配、正确绑定和持续至完成的生命周期是独立的调用者责任。不要根据描述符容量或 VIS18 编造工作区数值。

普通的稳定 FP32 分解仍可作为其真正实现的请求的语义与参考替代方案。比较候选之前，固定公式、输入来源、缩放系数、特性、输出比较策略和具体教学输入的容差（tolerance）。对于低精度输入候选，把同一份已表示输入提升到 FP32 后计算的参考，与全精度原始输入参考回答不同问题。明确区分两种用途并保留原始数据；两者都不是精确实数运算。替代方案若缺少 C 所需的掩码，必须报告不支持，不能静默替换成无掩码注意力。这些纸面替代方案都不是已提供的可运行回退（fallback）。

可重复性与准确性相互独立。过滤 `NONDETERMINISTIC` 不提供参考比较，也不保证跨版本、跨计划或跨架构逐位相等。反过来，一个数值上可接受的结果本身也不证明满足重复性要求。候选失败不能成为放宽判定基准（oracle）或容差的理由。

## 解答三：源码契约不是已观察的分派器

以下全部前端坐标采用 **1.27.0**，SHA 为 **`f77fbc3d21be3f24cd0286b9b368105f7c518b8a`**；后端问题陈述采用 **9.24.0**，不是预览页或历史发布小节。

| 声明 | 修正陈述与来源坐标 |
| --- | --- |
| 算法与可视化 | A11 的 FlashAttention 参考支持 IO 感知算法历史，不支持 cuDNN 资格或选择。[VIS18](/visuals/attention-memory-traffic/) 保持 FP32、四字节逻辑元素模型。两条轨道不是 UNIFIED/COMPOSITE 或后端轨迹；另一个候选采用 BF16 不允许把总数减半 |
| 表示 | [`graph_properties.h:2298-2312`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/graph_properties.h#L2298-L2312)中的 AUTO 先检查 UNIFIED 特性支持，再检查 COMPOSITE。这是在后端规划前选择前端表示（frontend representation），不是基准测试或通用运行恢复机制 |
| Python 路由 | [`router.py:41-77`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/python/cudnn/engines/router.py#L41-L77)混合并排列提案与条目；索引与 `engine_id` 不同。`_pygraph.py:1117-1139,1346-1403` 区分可选严格选择与未固定的构建遍历。这不是普通 C++ 后端规划 |
| 硬件 | SDPA 支持面拒绝 SM80 之前架构，尽管后端 SM75 矩阵更广。C++ [`sm100_sdpa_prefill_engine.h:36-41`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/experimental/sm100_sdpa_prefill_engine.h#L36-L41)要求恰好 SM100，不是 SM103 或全部 Blackwell GPU。该限制不拒绝 SM103 上全部其他 cuDNN 路径 |
| 版本与问题范围 | `Attention.md:16` 仍将矩阵标为 9.18.1。应采用精确源码与测试条件及当前 [9.24.0 说明](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/release-notes.html#cudnn-9-24-0)：解码加因果掩码（causal mask）加 Q 与 K/V 头数不等可能产生不匹配或 NaN；反向 KV 长度为一不受支持。这不是全部前向失败。9.25 的混合长度形式与 Hopper ordered-dQ 反向条件仍在本契约之外；该发布页明确写着开发者预览（Developer Preview） |
| 观察 | 图名称、成功验证和已构建计划都不识别真实执行内容。[确定性（determinism）说明](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/developer/misc.html#reproducibility-determinism)不保证参考准确性或跨架构相等。框架真实 API 分派（dispatch）留给后续独立审查的单元；未建立确切框架行为 |

VIS18 默认 `N=8,d=4,Br=Bc=4`，有 `Tr=ceil(8/4)=2`。物化（materialization）计数为 `4Nd+6N^2 = 4*8*4+6*8*8 = 512` 元素，即 **2048 B**。查询外层分块模型计 `2Nd+2TrNd = 2*8*4+2*2*8*4 = 192` 元素，即 **768 B**。差值为 **1280 B**。归一化传输计零不代表运算量为零。这些数值都不是 cuDNN 流量、张量容量、工作区、实测带宽或已观察后端结果；融合表示不证明采用了该驻留方式或循环顺序。

三种规划描述必须分开：

1. **普通 C++ 后端路径：** 验证、将运算图转换为后端表示（lowering）、用 `create_execution_plans` 发现候选配置、应用工作区与数值过滤、检查支持、构建计划。启发式（heuristics）是建议，不是测量；成功构建的候选仍需要正确绑定、分配、执行与验收。
2. **未固定的 Python 构建路由（routing）：** [固定提交的构建遍历](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/python/cudnn/_pygraph.py#L1346-L1403)遇到 `NotImplementedError` / `cudnnGraphNotSupportedError` 时可以尝试后续排名候选。其他异常不作为普通拒绝而被静默吞掉。已编译 Python 计划的工作区在大小已知时检查。这不是任意执行错误的恢复机制。
3. **可选严格 Python 选择：** [`select_plan(i)`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/python/cudnn/_pygraph.py#L1117-L1139)固定列表位置；该候选拒绝时抛错，不继续尝试后项。位置不是引擎身份，严格性不提供支持、数值或性能证据。

上游对限定解码问题的规避建议，是在受影响情况中不使用因果掩码，并通过填充掩码（padding mask）提供实际长度。它不允许删除练习二中必需的掩码。相等头数、非解码、无掩码前向课程排除了该组合及反向长度一请求，但不宣称自身子集无缺陷。历史 9.10.0/9.10.1 及特定 9.14.0 保护条件不是新归于 9.24 的缺陷。

缺失的运行记录至少应包含下列内容，并填写真实值，而不是虚构报告中的结论：

- 声明的基准环境（Reference Environment）与环境清单（Environment Manifest），包括 GPU、架构、数量、操作系统、驱动、Toolkit 与组件身份、后端包与构建身份，以及固定前端源码。
- 精确请求与存储记录：Q/K/V/O 形状、步长、类型和真实分配，缩放、统计量、特性、输入来源、工作区及数值策略，以及实际所选计划与引擎身份，而非只有排名位置或图名称。
- 检查后的绑定与工作区要求、实际启动及完成和错误记录，以及足以覆盖本次执行的存储生命周期。已构建图不提供完成记录。
- 独立参考方法、预先声明的具体教学输入容差与非有限值策略、真实输出与比较，以及验收记录。此清单没有结果，也不作性能声明。

## 合理替代方案

- 练习一：枚举嵌套 BHSD 坐标来推导步长，而非直接用乘积公式。显式 BSHD 重新打包可以作为另一候选审查，但必须真实改变数据映射、保留逻辑值，并重新检查布局、对齐及计划要求。只改描述符不满足缓冲区不变的约束。
- 练习二：可以拒绝整个请求，而不做语义妥协。若完整语义、输入转换策略和输出边界明确，另行具备能力的稳定 FP32 参考也可成立；它不是逐位等价或自动可用的运行时回退。
- 练习三：可以用五层证据账本替代声明表，但必须修正每项声明，并保持普通 C++、未固定 Python 路由和可选严格选择相互独立。不使用严格选择也是合理方案；该接口的存在不要求新增可执行 Python 或固定框架 API。

## 常见错误

- 因计算为 FP32 而给 BF16 分配使用四字节，将元素步长当作字节步长，或只证明最后偏移而漏查头与序列的映射。
- 将 UNIFIED 拒绝 FP32 扩大为整个 cuDNN 拒绝 FP32，把 SM80 当作所有未来架构的保证，或把一个限定 SM100 的引擎扩大到全部 Blackwell GPU。
- 将 AUTO 表示选择等同于后端选择、排名位置等同于引擎身份，或将构建拒绝等同于任意运行失败的恢复。
- 拒绝后删除必需掩码、重写参考输入或放宽容差；把确定性当作准确性，或把图构建当作已执行调用。
- 将 VIS18 四字节账本重标为 cuDNN 流量，按本站许可复制上游资料，或将源码与测试阅读当作运行证据。

继续完成 [PB-R4-012](/practice/#pb-r4-012)，并查阅 [SRC-CUDA-071](/sources-and-versions/#src-cuda-071) 和 [SRC-CUDA-072](/sources-and-versions/#src-cuda-072)。复核日期 **2026-09-07**。原生 Linux 仍是唯一受支持环境（Supported Environment）；这些纸面解答不新增实验（Lab）、可运行示例（Runnable Example）、CUDA 运行或所选后端结果。
