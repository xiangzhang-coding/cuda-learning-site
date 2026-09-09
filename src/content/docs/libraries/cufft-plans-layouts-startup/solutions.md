---
title: 'L12 解答：存储证明与完成依赖'
description: 核对实数和复数布局的精确计算、独立 DFT 数值、工作区容量决策和按版本限定的回调排除条件。
pairId: l12-solutions
counterpart: /en/libraries/cufft-plans-layouts-startup/solutions/
factCheckDate: '2026-09-08'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L12-SOLUTIONS
prerequisites: [L12-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'cuFFT storage and plan contract'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cufft/index.html'
    version: 'Toolkit 12.9.2 archive; cuFFT 11.4.1.4'
    platform: 'Static reasoning, not CUDA execution'
    accessDate: '2026-09-08'
  - title: 'cuFFT 13.3 Update 1 known issue'
    url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html#cufft-release-13-3-update-1'
    version: 'Live 13.3 Update 1; cuFFT 12.3.0.29'
    platform: 'Real-side LTO callback exclusion, not a reproduced failure'
    accessDate: '2026-09-08'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l12-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/libraries/cufft-plans-layouts-startup/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-08' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L12-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cufft-plans-layouts-startup/solutions/" lang="en">Read the English counterpart</a>

## 复核解答

先独立完成[练习](/libraries/cufft-plans-layouts-startup/exercises/)。以下数字是精确纸面推导或题目假设的工作区容量，不是 cuFFT 查询值、执行日志或性能观察。四个证据数组仍为空。

## 解答 1：一份分配，两种元素类型

`K=floor(10/2)+1=6`，因此每批需要 `2*K=12` 个实数槽位。三个批次需要 `3*12=36` 个浮点数，即 `36*4=144` 字节。逻辑 N 仍为 10，不是 12。嵌入数组（embedding）表达物理实数行长度 12 和复数行长度 6，元素步长保持 1。

| 方向 | 输入距离 | 输出距离 | 分配浮点数 | 字节 |
| --- | --- | --- | --- | --- |
| `R2C` | 12 | 6 | 36 | 144 |
| `C2R` | 6 | 12 | 36 | 144 |

实数起点 `0,12,24` 乘以 4 字节，复数起点 `0,6,12` 乘以 8 字节，均得到 `0,48,96`。每个实数行的槽位 10 和 11 是存储填充。把 K 乘以 4 而非 8 会使频谱容量不足。

存储的频率为 k=0 到 5。对于实数输入，省略的 k=6..9 由共轭对称确定；直流 k=0 和奈奎斯特 k=5 的虚部为零。C2R 要求厄米对称（Hermitian symmetry），不是任意六个复数。往返结果是原样本的十倍，只应用一次 `1/10` 缩放；1/12 和 1/30 都不对。

C2R 可以覆盖输入频谱，非原位（out-of-place）C2R 也不例外。后续消费者需要原频谱时，应在逆变换前保存副本，或之后重新构造；必须建立完成依赖并保持保存的分配有效。子数组基地址发生偏移时，还应重新检查复数类型的对齐要求。

## 解答 2：地址不同，DFT 定义不变

| 批次 | 输入偏移 | 输出偏移 |
| --- | --- | --- |
| 0 | `0,2,4,6` | `0,3,6,9` |
| 1 | `11,13,15,17` | `16,19,22,25` |

最小触及范围为 `1+11+3*2=18` 和 `1+16+3*3=26` 个复数。题目指定的分配更大：输入 `22*8=176` 字节，输出 `32*8=256` 字节。两份独立分配共 432 字节，尚不包括临时空间和库资源。这里互不重叠的逻辑偏移证明了批次分离，仅证明容量足够还不够。

正向单位根为 `[1,-i,-1,i]`。对 `[1,2,3,4]`，直流为 10；频率 1 为 `1-2i-3+4i=-2+2i`；频率 2 为 `1-2+3-4=-2`；频率 3 与频率 1 共轭。正向频谱因此为 `[10,-2+2i,-2,-2-2i]`。脉冲批次得到 `[1,-i,-1,i]`。不归一化逆变换分别为 `[4,8,12,16]` 和 `[0,4,0,0]`，乘以 `1/4` 恢复输入。这些精确值是独立参考，不是 EX19 的实际运行输出。

空嵌入数组会丢弃高级步长解释。交换设备指针也不对：计划仍按步长 2、批间距 11 读取，而已有输出按步长 3、批间距 16 存储。完成后先提取逻辑频谱，再按规定输入布局重新打包，才能复用原计划进行逆变换。EX19 对它自己另外一组字面测试数据采用这个策略。即使往返通过，也应独立检查符号、输入保存和输出。

## 解答 3：容量取决于执行是否重叠

并发独占工作区（workspace）需要 `4096+6144=10240` 字节，超过 8192 字节预算，应拒绝这个并发设计。显式串行执行可以共享一份充分对齐的 `max(4096,6144)=6144` 字节分配，符合预算。两种计算都不能证明实际分配成功，也不能证明库没有内部显存需求。

在预定设备和上下文创建各计划（plan），规划前关闭自动分配，检查最终大小查询，分配足够空间并绑定。串行化所需依赖是：A 最后一次使用工作区**完成之后**，B 才开始使用。主机等待，或正确记录事件并在 B 的流中等待，都能建立该依赖。无关流之间的主机提交顺序不能。保持独立可写输入输出，不得并发修改共享计划状态。

部分初始化失败时，只释放已经取得的资源。部分提交后，先等待关联流结束，再释放传输缓冲区、工作区、计划和流；检查完成错误并继续尝试其余清理，不把原始失败改成成功。之后出现合法缓冲区，也不能修复已经失败的执行。

| 独立记录表 | 未来所需记录 | 当前观察 |
| --- | --- | --- |
| 主机规划 | 主机时钟；初始化、分配和规划边界 | 未填写 |
| 缓存状态 | 驱动与包身份、缓存控制、容量及冷状态方法 | 未填写 |
| 第一次执行 | 完成边界、传输和输入恢复 | 未填写 |
| 热变换 | 显式预热、正确流上的设备事件、重复次数和原始结果 | 未填写 |

新进程可能复用持久化驱动缓存。环境清单（Environment Manifest）应记录驱动包、Toolkit、完整 cuFFT 包、实际加载库路径与哈希、GPU、系统与编译器和缓存控制。`cufftGetProperty` 仅暴露已加载主次补丁版本，不要拼上头文件的构建号后声称它是观察值。需要运行验证的首次调用和热执行测量仍为待硬件验证（Pending Hardware Verification）。

对 FP32 实数侧 LTO 回调，`17554=2*67*131` 是偶数、大于 8192、最大质因数为 131，满足 13.3 Update 1 尚未解决问题的全部条件，必须排除。`8192=2^13` 满足长度阈值，但不满足最大质因数条件。它不命中这一条警告，**不等于已经验证或普遍受支持**。EX19 使用不带回调的 C2C，两个回调案例都不执行。FP64 的警告阈值为 4096，偶数和质因数条件相同。

## 合法替代方案

可以单独创建第二个 C2C 逆变换计划，按步长 3、批间距 16 读，按步长 2、批间距 11 写，但必须重新证明嵌入、容量与生命周期。这样无需主机重新打包，却增加一个计划和可能的工作区；没有测量不能推导性能收益。明确修改预算后，也可以使用独立工作区。非原位实数布局是另一种设计，不能照搬原位距离表。

## 常见错误

- 把实数存储填充当作信号补零，会改变数学问题。
- 按字节填写距离，或让实数和复数侧使用相同数值距离，会移动批次边界。
- 只检查直流、一个批次或一次往返，会漏掉符号和布局错误。
- 主机提交后、设备完成前就共享工作区，会造成所有权冲突。
- 把 13.3.1 当成所有回调问题的修复版本，会忽视其明确的已知问题章节。

返回 [L12](/libraries/cufft-plans-layouts-startup/) 与 [EX19](/examples/cufft-batched-transform/)。来源为 [SRC-CUDA-073](/sources-and-versions/#src-cuda-073)、[SRC-CUDA-074](/sources-and-versions/#src-cuda-074)，核查于 **2026-09-08**。未改编上游练习或示例。
