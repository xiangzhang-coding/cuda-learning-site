---
title: 'L09 解答：推导所有权并限定证据边界'
description: 用原创静态推导解决层级计数、填充偏移、两阶段复用依赖，以及缺乏依据的 API、工具链和许可结论。
pairId: l09-solutions
counterpart: /en/libraries/cutlass-cpp-gemm-structure/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L09-SOLUTIONS
prerequisites: [L09-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l09-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cutlass-cpp-gemm-structure/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L09-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cutlass-cpp-gemm-structure/solutions/" lang="en">Read the English counterpart</a>

## 复核前

先完成 [L09 练习](/libraries/cutlass-cpp-gemm-structure/exercises/)。本页按 [L09](/libraries/cutlass-cpp-gemm-structure/) 与 [SRC-CUDA-070](/sources-and-versions/#src-cuda-070) 作原创 C++17 源码分析和纸面推导，不要求 GPU。没有复制上游示例或代码，没有 CUTLASS 实例化、CUDA 编译、生成物检查、执行或计时；四个证据数组保持为空，不授予或继承证据状态（Evidence Status）。

## 解答一：九个输出所有者，而非二十七个

| 保留的层级 | 在本模型中的责任 |
| --- | --- |
| Device | 面向主机的类型化句柄：参数、资格检查、工作区、初始化、启动与状态 |
| Kernel | 分配本线程块（threadblock）的输出分块，并将主循环与收尾操作（epilogue）组合 |
| Threadblock | 遍历 K 切片，协调共享存储的暂存与复用 |
| Warp | 组织输出子块、寄存器片段（fragment）及重复的乘加工作 |
| Instruction | 通过所选封装请求具体操作，不报告实际执行的硬件指令 |

输出网格为 `ceil(137/64) x ceil(77/32)=3x3`，所以有 9 个线程块；每块在内部遍历 `ceil(35/16)=3` 个 K 切片，不是 27 个独立 D 写入者。不沿 K 划分时，每块有 `(64/32)*(32/16)=4` 个输出线程束（warp）分块。右下角起点为 `(128,64)`，剩余 `137-128=9` 行、`77-64=13` 列，即 `9x13` 个有效输出。最后切片为 `k=32..34`，只有三个有效 K 位置。

一个完整线程束切片的几何覆盖为 `(32/16)*(16/8)*(16/8)=8` 次指令层操作。尾部补零不会把模型变成已生成或执行的计数。累加器只清零一次；完成 s 个切片后，仅含 `0 <= k < min(16*s,35)` 的贡献。三个切片全部完成后，所有者线程块才为每个有效输出执行一次 `2*acc-0.5*C`。各切片独立收尾会覆盖先前贡献，若将这些收尾结果相加，又会把 C 应用三次。该贡献不变量不规定浮点归约顺序。

模板支持、布局资格、指令生成、调度和占用率仍未证明。[VIS12](/visuals/gemm-tiling-hierarchy/) 保持不变，仍是源码层标量 `1x1x1` 槽位，不是 FMA、MMA、WMMA、SASS 或实测 CUTLASS 执行。它承担空间关系教学，不因此获得另行讨论的 `16x8x8` 封装几何。

## 解答二：地址证明与两种独立许可

| 全局操作数 | 元素偏移 | 最后逻辑偏移 | 分配元素数 |
| --- | --- | --- | --- |
| A | `i*40+k` | `136*40+34=5474` | `137*40=5480` |
| B | `k*80+j` | `34*80+76=2796` | `35*80=2800` |
| C 和 D，各自 | `i*80+j` | `136*80+76=10956` | `137*80=10960` |

最后逻辑偏移均小于对应容量；`row*77+column` 既没有使用 A 的物理步长，也没有使用其他矩阵的步长。在 `(m0,n0,k0)=(128,64,32)`，有效 A 为 `9x3`，B 为 `3x13`，D 为 `9x13`。即使地址位于已分配的行填充内，也未必包含逻辑操作数或零。全局映射既不揭示共享内存布局，也不揭示寄存器片段组织，更不证明子视图的对齐资格。

一个理想阶段含 `(64*16+16*32)*2=3072` 字节 FP16 A/B 载荷，两个阶段含 `2*3072=6144` 字节；这不计布局填充、流水线（pipeline）管理信息和其他内核存储。每个阶段只在行与 K 坐标有效时读取 A，只在 K 与列坐标有效时读取 B，其余输入槽显式补零。最后切片有十三个无效 K 位置，不代表可以多读十三个物理元素。一次收尾后只存储有效 D 坐标。

1. 阶段 0 的第 0 代接收 `k=0..15`。生产者完成并发布写入后消费者才能读；全部消费者完成阶段 0 的读取后，该代次才可释放。
2. 阶段 1 的第 0 代接收 `k=16..31`，独立满足写入完成并发布后再读取、全部消费者读取完成后再复用存储的要求。阶段 1 就绪不能替阶段 0 的读者释放其存储。
3. 阶段 0 的第 1 代只能在第 0 代释放后接收 `k=32..34` 和显式补零。新内容先发布再供消费者读取，保留已有累加贡献，并在任何后续复用前完成消费。

一种保守纸面调度要求所有生产与消费线程在填槽后共同经过线程块范围的发布屏障，消费后共同经过复用屏障，每个切片一致重复。没有有效边缘数据的线程仍须参与。这满足依赖模型，不假设重叠，也不声称复现固定源码的指令调度。两个缓冲区自身不提供顺序，`can_implement` 不证明范围或生命周期；由此推不出具体共享或寄存器映射、采用 `cuda::pipeline`，或已观察到无竞争。

## 解答三：把断言改成有边界的审计记录

以下 CUTLASS 坐标均指 SRC-CUDA-070 记录的 C++ v4.7.0，提交为 `dcf215af68a2d08d305076c152a06f201728cd53`。组件清单有自己的版本身份，不属于该源码 SHA。

| 审计项 | 修正结论与阅读坐标 |
| --- | --- |
| API 代际 | 保留的 2.x 风格 API 位于 4.7.0 内部。3.x 路径为 Device -> Kernel -> Collective -> Tiled MMA/Copy -> Atom；collective 协调协作线程及依赖，atom 描述原语操作，不是单线程。内核组合 collective 主循环与收尾，adapter 仍面向主机。见 `media/docs/cpp/gemm_api_3x.md:83-195` 与 `include/cutlass/gemm/device/gemm_universal_adapter.h:123-137`。 |
| 构建环境 | 实际 CMake 下界是 3.19，而非 Quickstart 的 3.18；显式选择 C++17，并取 CUTLASS、Toolkit、主机与目标要求的交集。README 最低要求不认证配置的任意组合。见 `CMakeLists.txt:29-108`；按 SRC-CUDA-070 链接的 `redistrib_13.3.1.json` 清单，区分 Toolkit 13.3.1、NVCC 13.3.73 与 Runtime 13.3.29。 |
| 架构 | `Sm50` 是实现标签，不是 CUDA 13 生成 `sm_50` 的许可。普通 SM75 路径不需要 `a` 后缀；`90a` PTX 是架构专用目标，不是通用未来回退。见 `CMakeLists.txt:174-208` 与来源清单的 M17 目标规则；实际虚拟与真实编译目标须另行记录。 |
| 证据 | 所选封装请求内联 PTX，不是已检查的 SASS：`include/cutlass/arch/mma_sm75.h:142-200`。测试保护条件和豁免不可省略：`test/unit/gemm/device/testbed.h:256-347` 可因共享内存不足而豁免并返回 true。`include/cutlass/gemm/kernel/gemm.h:151-198` 检查布局相关的张量引用对齐，不检查通用 M/N/K 整除、范围、数值、原生加速或完成。假设的成功不免除调用者责任。 |
| 许可 | CuTe C++ 不要求 CuTe Python DSL。固定提交的 `LICENSE.txt` 明确排除 `python/CuTeDSL`；`media/docs/pythonDSL/license.rst` 是日期为 2025 年 5 月 8 日的独立 NVIDIA 协议，不是 BSD。继续排除 DSL 实现、示例、包和生成物。未来任何获准的 C++ 改编都须保留确切逐文件声明、条件与免责条款，满足二进制声明要求，并避免未经授权的背书；本站内容许可不能替代这些条款。 |

尚未验证的候选目标为 **原生 Linux x86-64、Ubuntu 24.04、Toolkit 13.3.1、NVCC 13.3.73、Runtime 13.3.29、GCC 13.3.0、显式 C++17、普通 `sm_75`**，CMake 满足 3.19 下界。GCC 13.3.0 落在已复核的 13.3 主机策略范围内，但在线 13.3 指南不是 13.3.1 归档。该资格与 changelog 推荐都不证明构建。原生 Linux 仍是唯一受支持环境（Supported Environment）；此可选路径不自动加入核心编译矩阵。

1. 未来编译：保留确切源码 SHA 与特化、操作系统和编译器及组件版本、CMake 版本、方言、虚拟与真实目标标志、命令、生成物哈希、诊断和退出状态。声明编译已检查（Compile-Checked）前，还要核对保护条件与跳过的配置。
2. 未来生成物检查：检查已标识的实际生成物，并为指令声明保留工具版本与反汇编。源码可见 PTX 不是生成的 PTX/SASS 证据，单独检查也不证明执行或速度。
3. 未来运行：声明基准环境（Reference Environment）和含 GPU、计算能力（CC）、数量与驱动的环境清单（Environment Manifest），审查测试豁免，检查完成与错误，并在预先声明的数值条件下用独立参考比较实际输出。记录实际验收结果；性能需要另行测量并明确边界。本练习没有提供这些记录。

## 合法替代

- 练习一：可枚举互不重叠的输出矩形来核对九个所有者，不必只用向上取整算式。split-K 需要新的合并与 C 只应用一次的证明，不满足题设非 split-K 约束。
- 练习二：可显式分配补齐到 `192x96x48` 的问题，将逻辑区域外的 A/B 补零，保留有效 C，定义填充 C，并只回写 `137x77` 输出。重新计算物理步长和容量，保留发布与复用证明；填充本身不是同步。
- 练习三：保留普通非张量核心（Tensor Core）FP32 SIMT 路径，A/B/C/D、累加器与收尾计算均为 FP32，明确尾部和缩放。本站硬件支持从 CC 7.5 开始，问题限定在 8 GB 以下，不从更早的实现标签起算。将 FP16 输入改为 FP32 会改变数值算法，不是逐位等价回退或精确实数预言机，也推不出速度结论。

## 常见错误

- 将 K 切片数乘进独立输出所有权，每片重置累加，或重复应用 C。
- 把已分配填充当作已初始化操作数，把全局行主序（RowMajor）当作全部内部映射，把就绪当作覆盖许可，或把载荷大小当作占用率。
- 将 API 代际等同于发布版本，将源码标签等同于编译器目标，将测试返回值等同于执行，或把根目录许可文字当作复制被排除 DSL 的许可。

继续复核 [PB-R4-010](/practice/#pb-r4-010) 与 [SRC-CUDA-070](/sources-and-versions/#src-cuda-070)。复核日期 **2026-09-07**；以上只有原创推导，没有编译、运行、指令选择或性能结果。
