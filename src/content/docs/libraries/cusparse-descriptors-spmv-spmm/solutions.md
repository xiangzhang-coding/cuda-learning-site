---
title: 'L13 解答：稀疏计算与预处理所有权'
description: 核对 CSR 与稠密布局的精确推导、带条件的格式和复用决策，以及遵守完成依赖和版本限制的工作区设计。
pairId: l13-solutions
counterpart: /en/libraries/cusparse-descriptors-spmv-spmm/solutions/
factCheckDate: '2026-09-09'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L13-SOLUTIONS
prerequisites: [L13-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'cuSPARSE archived API reference, CUDA 11.8.0'
    url: 'https://docs.nvidia.com/cuda/archive/11.8.0/cusparse/index.html'
    version: 'Toolkit 11.8.0; cuSPARSE 11.7.5.86'
    platform: 'Historical Generic API and preprocessing contract; no execution'
    accessDate: '2026-09-09'
  - title: 'cuSPARSE archived API reference, CUDA 12.9.2'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cusparse/index.html'
    version: 'Toolkit 12.9.2; cuSPARSE 12.5.10.65'
    platform: 'Baseline descriptors, SpMV, SpMM, ownership and algorithm contract'
    accessDate: '2026-09-09'
  - title: 'cuSPARSE archived API reference, CUDA 13.3.1'
    url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cusparse/index.html'
    version: 'Toolkit 13.3.1; cuSPARSE 12.8.2.51'
    platform: 'Exact archive comparison; not backported to the baseline'
    accessDate: '2026-09-09'
  - title: 'CUDA 11.8.0 release notes'
    url: 'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html'
    version: 'Toolkit 11.8.0'
    platform: 'cuSPARSE history and first-use SM90 PTX overhead'
    accessDate: '2026-09-09'
  - title: 'CUDA 12.9.2 release notes'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-toolkit-release-notes/index.html'
    version: 'Toolkit 12.9.2'
    platform: 'cuSPARSE preprocessing history and scoped known issues'
    accessDate: '2026-09-09'
  - title: 'CUDA 13.3.1 release notes'
    url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-toolkit-release-notes/index.html'
    version: 'Toolkit 13.3 Update 1'
    platform: 'Architecture removals, deprecations and issue history'
    accessDate: '2026-09-09'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l13-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/libraries/cusparse-descriptors-spmv-spmm/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-09' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L13-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L13-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '6' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '11.8.0,12.9.2,13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cusparse-descriptors-spmv-spmm/solutions/" lang="en">Read the English counterpart</a>

## 复核解答

先独立完成[练习](/libraries/cusparse-descriptors-spmv-spmm/exercises/)。以下是精确纸面推导、题设成本假定和依据文档所做的设计审查，不是库查询、执行日志或基准测量。四个证据数组均保持为空。唯一直接先修为 `L13-EXERCISES`；底层契约见 [L13](/libraries/cusparse-descriptors-spmv-spmm/)。

## 解答 1：空行仍有旧输出

压缩稀疏行格式（CSR）的三个行区间为 `[0,2)`、`[2,2)` 和 `[2,4)`。因此 A 的逻辑行为 `[[2,0,-1,0],[0,0,0,0],[0,3,0,1]]`。三行对应四个偏移，首项为零、末项为 nnz=4，且单调不减。每个列索引都在 `[0,4)` 内，每行的列索引有序且唯一。重复偏移表示空行，不表示矩阵非法或矩阵维度为零。

| 对象 | 描述符（descriptor）契约 | 调用方拥有的存储 |
| --- | --- | --- |
| A | `cusparseCreateCsr`；`3 x 4`，nnz=4；偏移和列索引均为 `CUSPARSE_INDEX_32I`；`CUSPARSE_INDEX_BASE_ZERO`；`CUDA_R_32F` | 四个设备偏移、四个设备列索引、四个设备数值 |
| X | `cusparseCreateDnVec`；长度 4；`CUDA_R_32F` | 四个设备浮点数 |
| Y | `cusparseCreateDnVec`；长度 3；`CUDA_R_32F` | 从 Y0 初始化的三个设备浮点数 |
| B | `cusparseCreateDnMat`；`4 x 2`；`ld=2`；`CUSPARSE_ORDER_ROW`；`CUDA_R_32F` | 八个设备浮点数 |
| C | `cusparseCreateDnMat`；`3 x 2`；`ld=2`；`CUSPARSE_ORDER_ROW`；`CUDA_R_32F` | 从 C0 初始化的六个设备浮点数 |

对稀疏矩阵向量乘法（SpMV），另行设置 FP32 计算、`CUSPARSE_OPERATION_NON_TRANSPOSE`、`CUSPARSE_SPMV_CSR_ALG2`、指向主机 alpha/beta 的指针，以及句柄（handle）要使用的流（stream）。稀疏矩阵与稠密矩阵乘法（SpMM）须从 12.9.2 的 SpMM 支持表中选择自己的算法，不能使用 SpMV 枚举。通用接口（Generic API）描述符描述已有分配：创建过程既不上传数值，也不转换索引宽度。`cusparseSpMatSetValues` 只重新绑定指针，不复制内容。销毁接口释放描述符，不释放这些数组。检查创建状态，并让数据和对象保留到最后一次设备使用完成。

| 逻辑行 | B 的元素偏移 | C 的元素偏移 |
| --- | --- | --- |
| 0 | `0,1` | `0,1` |
| 1 | `2,3` | `2,3` |
| 2 | `4,5` | `4,5` |
| 3 | `6,7` | 没有这一行 |

行主序（row-major）偏移遵循 `row*2+column`；B 和 C 分别需要 32、24 字节。列主序（column-major）的最小主维度（leading dimension）分别为 B 的 4 和 C 的 3，不是 2。只改存储顺序枚举会重新解释数组，而不会重排数据。描述符仍记录转置前的存储形状。另行计算 `A^T:4 x 3` 的 SpMV 时，X 长度应为 3，Y 长度应为 4；原向量描述符不适用于这个操作。

三个点积分别为 `2*1-1*2=0`、空求和得到零、`3*2+1*(-5)=1`。所以 `A*X=[0,0,1]`，`2*A*X-Y0=[-1,2,-2]`。特别是空行给出 `0-(-2)=2`，不是零。

B 的第一列就是 X。第二列得到 `2*4-1*1=7`、零、`3*1+1*5=8`，因此 `A*B=[[0,7],[0,0],[1,8]]`。对旧 C 的每个元素应用 beta，得到 `2*A*B-C0=[[-1,14],[2,-3],[-2,17]]`。中间行是 C0 中间行的相反数。只检查稀疏乘积或第一列，都不足以验证整个更新。

每次独立试验之前恢复 Y0 和 C0，并让恢复操作先于执行完成。否则下一次调用算的是 `2*A*X-Y1` 或 `2*A*B-C1`，变成了另一条递推。未来的检查须先拒绝输出或参考中的非有限值，再对每个元素应用 `abs(actual-reference) <= 1e-6+1e-5*abs(reference)`。参考为零时仍有 `1e-6` 的绝对误差限，不能跳过该元素，也不能用零作除数。

文档对 CSR ALG2 的逐位确定性（bitwise determinism）保证受非转置和固定条件限制，不承诺与 CPU 逐位一致、转置操作具有确定性，或跨 GPU、算法、库版本一致。以上精确纸面参考既不是已观察的确定性运行，也不是放宽数值验收的理由。

## 解答 2：先数表示字节，再计算重复成本

规则矩阵有 `1024/4=256` 个块行和 256 个完整块。每块有十六个数值，所以块稀疏行格式（BSR）存储 `256*16=4096` 个数值，块内没有填充。

| 表示 | 字节推导 | 总字节数 |
| --- | --- | --- |
| CSR | `8*4096+4*1025=36868` | 36868 |
| 坐标格式（COO） | `12*4096=49152` | 49152 |
| 块大小为 4 的 BSR | `4096*4+256*4+257*4=18436` | 18436 |

CSR 的系数 8 来自一个 4 字节数值和一个 4 字节列索引；1025 个偏移包括末尾偏移。COO 为每个数值同时保存行、列索引。BSR 只保存 256 个块列索引和 257 个块行偏移，但不会压缩块内的十六个数值。这些总量不包含其他分配，也不是设备流量测量。

非规则矩阵的 CSR 和 COO 总量相同，但没有已占用块数，就无法得到它的 BSR 总量。若有 K 个已占用 `4 x 4` 块，连同填充零在内，需要 `16*K*4+K*4+257*4` 字节。例如，4096 个已占用块各只有一个非零元时，需要 279556 字节。这只是另一种分布的说明，不是对题目未指定矩阵的断言。行负载不均衡和切片 ELL 格式（SELL）的填充量也无法仅由全局 nnz 推出。

CSR 是普通非转置 SpMV 和 CSR SpMM 的基准候选。COO 仍适合组装，但应计入规范化与转换成本。规则情形值得进一步核查块格式候选，不表示它已经可执行或更快。Generic BSR SpMV 在 CUDA 13.0 Update 1 才加入，不能仅因字节总量较小，就把它选作 12.9.2 的 Generic SpMV 路径。必须组合检查精确操作、格式、索引类型、存储/计算/标量类型、转置、稠密布局、算法与架构。

存在压缩稀疏列格式（CSC）描述符，不代表任意 CSC SpMM 可用。SELL 需要操作支持，并需要合适的切片内行长分布；Blocked-ELL 除了可接受的填充量，还须满足操作对应的块、类型、布局和架构限制。cuSPARSELt 是独立依赖，有自己的结构化模式、形状、对齐、类型、设备和软件门槛，还涉及检查、压缩和工作区（workspace）生命周期。普通稀疏或稠密 BSR 块不会自动满足这些条件。为满足条件而剪枝，会改变问题，需要单独验收。

计时题设与存储表是两件事。在题设假定的微秒单位下，`T_direct=40*R`，`T_prepared=200+30*R`。严格更优要求 `200+30*R < 40*R`，所以 `R>20`。R 为整数时，第一个满足条件的次数为 21。R=20 时两者均为 800 微秒，是持平而非更优。R=21 时两者分别为 830 和 840 微秒，但这只是在给定模型下的结果。

若每次执行都改变稀疏模式并重新完成所有准备，则 `T_prepared=(200+30)*R=230*R`，对任何正 R 都大于 `40*R`。若只改数值，兼容的预处理（preprocessing）状态可能保留，但仍需遵守操作规则和完成顺序；数值上传与输出恢复成本也必须按相同边界计入。题设成本不能证明实际工作区大小、预处理加速或 BSR 性能。

## 解答 3：保留内容，也保留分配

在同一 matA 上依次完成 P0、P1 预处理后，**只有 P1 是活动缓冲区（active buffer）**。P0 的分配可以仍然有效，但对该描述符已经不处于活动状态。兼容的 SpMV 调用可以使用 P0，只是不享受预处理加速；传入 P0 不会让两份状态同时活动，也不允许覆盖任何仍在使用的缓冲区。

并发独占工作区需要 `4096+4096=8192` 字节，超过题设的 6144 字节预算，应拒绝这个并发设计。让两个工作者都用 P1 并不是节省内存的修正，因为它们对工作区的使用会重叠。若明确增加预算，独立预处理工作者应分别拥有稀疏描述符、工作区、可写操作数，并安全管理各自的句柄和流。只有在分配保持不变且仍然有效时，才能共享不可变索引等数据。不要让句柄的流/指针模式设置或描述符状态发生竞争。

显式串行需要 `max(4096,4096)=4096` 字节，符合题设预算。这里两个工作者的结构与配置兼容，所以一个描述符和一份内容完整的活动缓冲区可以供顺序调用使用；先前使用完成后，再做契约允许的操作数变更。也可以让普通不预处理调用串行执行。即便执行已经完成，把同一临时分配用于另一项预处理也可能破坏旧准备内容；需要旧状态时应重新建立，不能声称两份缓存状态都保留下来了。容量计算既不分配内存，也不证明真实查询会返回 4096。

| 拟做变更 | 复用判断 |
| --- | --- |
| 改 alpha/beta、X/Y 内容或兼容指针 | 兼容 SpMV 预处理契约允许；须保持形状/类型并建立执行顺序 |
| 改矩阵数值或重新绑定数值指针 | 存储兼容时允许；显式上传，保留旧存储到最后一次使用完成，避免并发修改描述符 |
| 改一个列索引，但 nnz 不变 | 结构已经变化；不能因容量仍够，就沿用旧准备状态 |
| 改形状、表示、操作、计算类型或算法 | 重新核对支持范围、查询新配置；需要预处理加速时重新准备 |
| 清空、覆盖、释放活动缓冲区，或借给无关操作 | 不能再假定准备状态保留；既要考虑执行完成，也要考虑未来依赖准备状态的调用 |

实际实现中，应检查对象创建和精确大小查询，分配所需设备工作区，并设置预定流和标量指针模式。有序数据路径为 `H2D initialization -> optional supported preprocessing -> SpMV -> D2H result copy -> checked completion -> result inspection`，即主机到设备初始化、可选且受支持的预处理、SpMV、设备到主机结果复制、检查完成状态，最后读取结果。主机传输存储、设备操作数、工作区、描述符和句柄都要保留到最后一次使用完成。同一流的提交顺序提供设备执行顺序；跨流则在生产者最后一次相关使用之后记录事件（event），让消费者流等待，或建立经过检查的主机完成边界。主机 API 成功返回本身不能证明这些完成依赖成立。

重新配置或清理之前，须为每个受影响资源建立最后一次使用的完成边界。部分提交后出错时，停止新工作，保留首个错误，尝试等待已提交工作结束，只清理确实取得的资源。检查完成和清理失败，不用成功结果覆盖原始错误。若无法确定已完成，不能按正常成功路径的假设释放可能仍在传输的主机存储，也不能把它读成有效结果。销毁描述符本身不会等待所有设备消费者，也不释放调用方数组。

| 精确归档 | SpMV 预处理 | SpMM 预处理及边界 |
| --- | --- | --- |
| 11.8.0 | 没有 `cusparseSpMV_preprocess`；它在 CUDA 12.4 引入 | 已有 `cusparseSpMM_preprocess`；可能加速 CSR ALG1/ALG3 |
| 12.9.2 | 可选；可能加速 CSR ALG1/ALG2；每个 matA 只有一个活动缓冲区 | 可选；可能加速 CSR ALG1/ALG3，而非 CSR ALG2；保持兼容的稀疏结构和稠密形状/布局 |
| 13.3.1 | 仍需遵守该操作的兼容状态契约；不是向 11.8 回移的功能 | 指南明确将预处理限定为 CSR，并放在图捕获（graph capture）之前；不能把这段措辞反向套到基准版 |

SpMM 使用 B 和 C，不是 X/Y。它的标量和操作数更新要遵守自己的版本契约；新版文字中出现 `matX/matY` 的笔误，不是新的 API 签名。SpMM CSR ALG3 要求 A 非转置，不允许 B 共轭转置，也不支持批处理（batching）。其确定性声明还需要下面的发布问题核对。图的讨论只是纸面边界，不是已实现或已验证的捕获路径。

| 待审说法 | 保留限定条件后的结论 |
| --- | --- |
| 12.9 的混合精度 SpMV/SpMM 已无问题 | 不成立：CUSPARSE-2349 记录了可能出现错误结果。全 FP32 练习不测试混合精度，也不证明混合精度无问题。 |
| SpMM CSR ALG3 在整个 13.0 期间都有确定性 | 不成立：13.0 记录缺陷，13.1 通过 CUSPARSE-2612 记录修复。一般 API 保证不能抹去这段缺陷历史。 |
| 13.3 Update 1 的修复验证了这里的工作负载 | 不成立：5975307 针对罕见的 CSC 或转置 CSR SpMV 错误，不是这里非转置 CSR 的实际执行观察。 |

下列记录应等到真正取得证据后再填写。零是一个数值，不能代替缺失的测量。

| 记录 | 未来所需字段 | 当前观察 |
| --- | --- | --- |
| 环境清单（Environment Manifest） | GPU、计算能力（compute capability，CC）、显存、GPU 数量、驱动、Toolkit、头文件版本、包身份、实际加载库路径/哈希及 API 版本、系统/编译器 | 未记录 |
| 准备过程 | 稀疏和稠密布局、类型、算法、复用次数、查询字节数、分配状态、转换/预处理边界 | 未记录 |
| 正确性与完成 | 初始输出、独立参考、有限值/容差检查、流依赖、API 与清理日志 | 未记录 |
| 性能 | 主机准备、首次使用、缓存/预热条件、预热后的设备事件区间、重复次数及输入恢复/传输政策 | 未记录 |

获取软件包时的清单或头文件构建号，不能证明实际加载了哪个二进制文件。`cusparseGetProperty` 报告主、次、补丁版本，不会独立报告第四段包版本。区分首次使用和预热后的执行；11.8 的 SM90 PTX 即时编译（JIT）说明提醒我们记录这些边界，不是实测启动开销。静态阅读不需要 GPU。未来基准运行要求原生 Linux、单张 CC 7.5+ GPU，且问题规模能放入 8 GB；这一门槛不授权所有格式、精度或结构化稀疏路径。

## 合法替代方案

可以把 B 重排为 `[1,2,2,-5,4,1,1,5]`，使用 `ld=4`，把 C0 重排为 `[1,-2,4,0,3,-1]`，使用 `ld=3`，再核查算法支持和工作区，以构成列主序 SpMM 方案。这样保持逻辑乘积不变，但不是只改枚举。对 B 的每列循环执行 SpMV 也可以是另一个受支持设计，前提是保留各列的旧 C 和相应依赖；数学等价不能证明算术顺序、临时空间或速度相同。

普通不预处理 SpMV 路径在三个配置中仍然合法，也是 [EX20](/examples/cusparse-spmv/) 的范围。若明确增加预算，可以选择独立描述符和独占缓冲区。当前预算内可以串行执行，但须满足最后一次使用和准备内容保留要求。选择这些替代方案中的任何一个，都不是性能结论。

## 常见错误

- 删除重复的 CSR 偏移会丢失空行并改变维度；跳过该行的 beta 项会得到错误输出。
- 声明不同的索引类型或稠密顺序，不会转换底层字节；创建成功也不会验证这些字节。
- 用 SpMV 的 X/Y 规则或算法替代 SpMM 的 B/C 规则，混淆了不同操作的契约。
- 把标量 CSR 索引数当成 BSR 块索引数，或漏掉末尾偏移，会使存储比较失效。
- 把 R=20 称为严格更优，或在每轮索引都变化时只计一次准备，误用了题设成本模型。
- 把有效临时分配等同于活动准备内容，会漏掉状态失效；主机返回后立即释放，又会漏掉异步生命周期。
- 把 beta 为零时 Compute Sanitizer 可能出现的竞争误报，当作忽略任何诊断的许可，会掩盖真实竞争和内存错误。应匹配文档条件，并保留独立正确性检查。
- 把纸面答案标成编译已检查（Compile-Checked）或运行已验证（Runtime-Verified），是在没有构建或运行时升级证据；这些页面不作此声明。

返回 [L13](/libraries/cusparse-descriptors-spmv-spmm/) 和 [EX20](/examples/cusparse-spmv/)。来源为 [SRC-CUDA-075](/sources-and-versions/#src-cuda-075)、[SRC-CUDA-076](/sources-and-versions/#src-cuda-076)，核查于 **2026-09-09**。文字、情景和推导均为原创，没有改编上游练习或示例。EX20 的编译证据独立，其运行仍为待硬件验证（Pending Hardware Verification）。
