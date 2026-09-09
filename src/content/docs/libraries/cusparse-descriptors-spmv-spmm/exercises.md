---
title: 'L13 练习：稀疏描述符、格式成本与安全复用'
description: 独立推导 SpMV 与 SpMM 结果，比较稀疏存储和成本摊销，并修正预处理流水线，不编造 GPU 证据。
pairId: l13-exercises
counterpart: /en/libraries/cusparse-descriptors-spmv-spmm/exercises/
factCheckDate: '2026-09-09'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L13-EXERCISES
prerequisites: [L13]
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
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l13-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/libraries/cusparse-descriptors-spmv-spmm/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-09' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L13-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L13 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '6' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '11.8.0,12.9.2,13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cusparse-descriptors-spmv-spmm/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [L13](/libraries/cusparse-descriptors-spmv-spmm/)。这些是纸面练习（Exercise），不是实验（Lab），不要求 GPU 或 CUDA 执行。四个证据数组均保持为空。先修链为 `L13 -> L13-EXERCISES -> L13-SOLUTIONS`。

## 提交要求

先提交描述符（descriptor）表、计算过程、支持范围核对和完成依赖，再阅读[独立解答](/libraries/cusparse-descriptors-spmv-spmm/solutions/)。以精确的 12.9.2 归档为基准，单独标明 11.8.0 与 13.3.1 的差异。FP32 数值和 32 位索引各占 4 字节。以下矩阵与成本数字均为原创题设，不是 EX20 的测试输入或实测结果。浏览器从不执行 CUDA。

## 练习 1：让描述符与公式对应起来

**目标：** 为同一稀疏矩阵描述稀疏矩阵向量乘法（SpMV）和稀疏矩阵与稠密矩阵乘法（SpMM），独立推导能检出空行、beta 和稠密布局错误的参考结果。

**约束：** 使用零基压缩稀疏行格式（CSR），`A:3 x 4`，`nnz=4`，行偏移为 `[0,2,2,4]`，列索引为 `[0,2,1,3]`，数值为 `[2,-1,3,1]`。SpMV 使用 `X=[1,2,2,-5]` 和初始 `Y0=[1,-2,4]`。SpMM 的逻辑行为 `B=[[1,4],[2,1],[2,1],[-5,5]]`，初始 `C0=[[1,0],[-2,3],[4,-1]]`。两个操作均采用 `alpha=2`、`beta=-1`，存储、计算和标量全部为 FP32，均不转置。B 与 C 分别分配，采用紧密排列的行主序（row-major）。SpMV 候选为 `CUSPARSE_SPMV_CSR_ALG2`，使用 `CUSPARSE_POINTER_MODE_HOST`；不得从这个枚举推断 SpMM 算法。

**预期提交证据：** 还原 A 的逻辑行。记录稀疏矩阵尺寸、偏移与索引类型、索引基数、向量长度、稠密矩阵形状、主维度（leading dimension），以及调用方拥有的数组。列出 B、C 的行主序元素偏移，并给出列主序（column-major）替代方案的最小主维度。推导 `A*X`、`2*A*X-Y0`、`A*B` 和 `2*A*B-C0`。另行说明对 A 做转置 SpMV 时的向量长度，以及重复试验时的输入恢复规则。

**验收标准：** 验证每个 CSR 偏移和列索引，包括空行；本课程的输入规则拒绝重复坐标，不假定库会自动合并。创建描述符不会分配、上传或转换数据，也不证明内容合法。主机指针模式（host pointer mode）只涉及 alpha/beta，不涉及矩阵或向量存储。主维度以元素计。未来的数值检查应要求输出与参考均为有限值，并对每个逻辑元素满足 `abs(actual-reference) <= 1e-6+1e-5*abs(reference)`，包括参考为零的元素。区分这项容差检查与文档对非转置 CSR ALG2 的确定性（determinism）保证；两者都不是已观察到的 GPU 结果。

<details><summary>提示 1：沿着每行的半开区间计算</summary>第 i 行使用 rowOffsets[i] 到 rowOffsets[i+1]-1 的存储项。相邻偏移相等时没有乘积贡献，但 beta 仍会乘上旧输出。对 B 的每一列分别使用这条规则。</details>

<details><summary>提示 2：把逻辑坐标与存储地址分开</summary>行主序偏移为 row*ld+column，列主序偏移为 column*ld+row。B 的第一列就是 X，可以交叉核对乘积；但 C0 有自己的第二列，不能用 Y0 代替整个 C0。</details>

## 练习 2：结合存储和复用次数选择格式

**目标：** 比较坐标格式（COO）、CSR 和块表示，不把更小的存储容量或假设的成本模型当作实测优势。

**约束：** 另一矩阵为 `1024 x 1024`，含 4096 个不重复的 FP32 非零元。规则情形下，每个块行恰好有一个完全占满的 `4 x 4` 块，因此共存储 256 个块，块内无需填零。所有索引和偏移均为 32 位。只统计表示数组，不计向量、工作区（workspace）、分配开销和库资源。与它比较的非规则矩阵具有相同形状和 nnz，但块占用与行长分布未给定。另有一个假设的受支持预处理路径：转换加预处理（preprocessing）一次共需 200 微秒，每次执行 30 微秒；直接路径每次执行 40 微秒。两条路径在相同数值标准和计时边界下求解同一问题。这些是模型输入，不是 cuSPARSE 计时或 BSR 基准测量。

**预期提交证据：** 推导规则情形下 COO、CSR 和 `4 x 4` 块稀疏行格式（BSR）的字节总量，包含正确数量的行偏移。说明非规则情形下有哪些结论无法推导。对正整数复用次数 R 求解严格盈亏平衡不等式，说明相等时的含义；若每次执行都改变稀疏模式并重新准备，再做一次成本核算。推荐基准版可考虑的格式，并列出 BSR、压缩稀疏列格式（CSC）、切片 ELL 格式（SELL）、Blocked-ELL 和独立 cuSPARSELt 方案仍需核对的支持条件。

**验收标准：** 区分 BSR 的块列索引与 CSR 的标量列索引，不遗漏末尾偏移。存储字节更少，不是实际访存流量或加速比证据。不能把通用接口（Generic API）的 BSR SpMV 支持反向套到 12.9.2，也不能因存在 `cusparseCreateCsc` 就认定任意 CSC SpMM 可用。格式转换必须保持数学矩阵不变。规则块或一张计算能力（compute capability，CC）为 7.5 的 GPU，都不能单独证明符合 cuSPARSELt 要求。所有盈亏平衡结论都须注明：依赖题设成本和准备状态的复用契约。

<details><summary>提示 1：分别统计不同用途的索引</summary>COO 为每个存储标量保存两个索引。CSR 为每个标量保存一个列索引，另有 rows+1 个偏移。BSR 为每个稠密块保存一个块列索引，另有 blockRows+1 个偏移；每个块仍须存满十六个数值。</details>

<details><summary>提示 2：先写总成本，再解不等式</summary>比较一次准备加 R 次准备后执行，与 R 次直接执行。相等并不算严格更优。如果每轮索引都改变，先把准备成本放进重复项，再判断复用是否还能摊销它。</details>

## 练习 3：修正两个工作者的预处理方案

**目标：** 说明哪些状态能复用、哪个工作区处于活动状态，以及重新配置或清理之前必须完成哪些工作。

**约束：** 在 12.9.2 上，两个工作者使用相同的不可变索引，但各有独立 X/Y 数组和流（stream），执行配置兼容的全 FP32、非转置 CSR ALG2 SpMV。题设假定每个工作者的外部缓冲区需求为 4096 字节，外部缓冲区预算共 6144 字节。这些是假设的查询结果。在同一 matA 上，P0 和随后的 P1 预处理已依次完成。一份方案声称两个缓冲区都处于活动状态，让两个工作者都使用 P1 启动，并在主机成功提交后释放存储。它还打算在两轮之间不经等待就修改矩阵数值指针或某个列索引。比较独立并发工作者与显式串行方案；不执行任何图。

**预期提交证据：** 指出活动缓冲区（active buffer），以及满足其他有效性要求的 P0 还可如何使用。计算并发与串行工作区容量。画出初始化、执行、结果复制、完成、复用和清理的依赖，包含部分提交后失败的处理。区分数值、标量、向量变化与索引、算法变化。按版本列出 SpMV 和 SpMM 预处理的可用性及可能加速的算法范围，并说明 13.3.1 的图捕获（graph capture）边界。审查三项说法：12.9 的混合精度 SpMV/SpMM 已无问题；SpMM CSR ALG3 在整个 13.0 期间都有确定性；13.3 Update 1 的 CSC/转置 CSR 修复验证了这里的非转置 CSR 工作负载。列出未来运行所需记录，但不填写观察值。

**验收标准：** 一个 matA 不能保留两个活动预处理缓冲区。有效但非活动的 SpMV 缓冲区可以用于不享受预处理加速的调用；任何缓冲区都不能仅因主机提交返回，就被释放或供重叠操作共用。除了分配的生命周期，还须保持活动内容不变。并发的独立准备状态需要各自的描述符和缓冲区，并安全管理句柄（handle）状态。串行复用临时分配，不等于自动保留了两份独立准备状态。检查每次查询、分配、提交、完成和清理的状态；完成失败不能变成正确性通过。版本身份、文档保证和未来测量必须分开。

<details><summary>提示 1：容量和已缓存状态是两个问题</summary>重叠工作者的独占工作区需求相加，有序复用则取最大值。随后检查每份准备状态归哪个描述符所有。字节数足够，既不能保证缓冲区内容仍在，也不能让第一份缓冲区重新成为活动缓冲区。</details>

<details><summary>提示 2：画出最后一次使用，而非最后一次主机返回</summary>数值指针设置接口不会上传数据，也不会等待先前的读取者。应在重新绑定或释放旧存储之前标明完成依赖。SpMV 预处理在 CUDA 12.4 才出现；SpMM 的历史更早，可能受益的算法编号也不同。</details>

## 下一步

对照[解答](/libraries/cusparse-descriptors-spmv-spmm/solutions/)，再做 [PB-R4-015](/practice/#pb-r4-015)、[PB-R4-016](/practice/#pb-r4-016)，并阅读规范可运行示例（Runnable Example）[EX20](/examples/cusparse-spmv/)。来源为 [SRC-CUDA-075](/sources-and-versions/#src-cuda-075) 和 [SRC-CUDA-076](/sources-and-versions/#src-cuda-076)，核查于 **2026-09-09**。这些原创纸面练习不增加可执行 SpMM 或预处理，也不升级 EX20 的独立证据状态；其运行仍为待硬件验证（Pending Hardware Verification）。
