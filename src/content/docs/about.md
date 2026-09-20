---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure:
  - purpose
  - scope
  - author
  - feedback
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: about
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-09-19'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'purpose,scope,author,feedback'
---

<a class="locale-pair" data-locale-counterpart href="/en/about/" lang="en">Read the English counterpart</a>

## 为什么做这个学习站

CUDA 学习站（Learning Site）是一套公开、双语的 CUDA 与 GPU 编程自学课程。它优先服务作者自己的系统学习，也希望让其他认真学习 CUDA 的读者获得一条清楚、可核对的路线。

## 当前范围

本站维护按先修关系组织的稳定课程（Stable Curriculum），并搭配可运行示例（Runnable Example）、实验（Lab）、练习（Exercise）、可视化讲解（Visual Explainer）和术语表（Glossary）。只有完整材料会进入导航。本网站保持静态，不提供账号、进度跟踪、服务端应用、API 或浏览器内 CUDA 执行。

稳定课程的 R3 发布已在 [issue #32](https://github.com/xiangzhang-coding/cuda-learning-site/issues/32) 完整双语复核 O01-O08、F01-F08、M01-M19、A01-A14 和 Q01-Q13，共 62 个学习单元（Learning Unit）。[A12](/algorithms/sparse-formats-spmv/)建立 COO/CSR、storage 与 SpMV 合同，[A13](/algorithms/sparse-matrix-multiplication-preprocessing/)建立 SpMM、descriptor、workspace 与 preprocessing 决策边界。

最近完成的聚合静态发布复核是 2026-09-19 的 R5。模式版本 6 的 `src/r5-release-manifest.json` 生成 `/release.json`：95 个学习单元、345 个双语发布对（Publication Pair）、690 条源路由与 453 条目录记录，包括 102 道题、207 个术语和 108 条来源。`/publication.json` 记录最近完成阶段 R5，下一阶段 R6 待复核。P01-P12 与 T01-T08 已完整发布；其中 17 道既有题组成 PyTorch 和 Triton 子集。[Issue #51](https://github.com/xiangzhang-coding/cuda-learning-site/issues/51) 单独记录动态验收。R1-R4 保留精确历史快照。[发布复核](/sources-and-versions/#r5-aggregate-review)汇总独立环境、38 个待硬件验证对象与单 GPU 边界。

Issue #31 的严格图新增 `A12<-[M01,M02]`与 `A13<-[A12,A08]`。[Issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33)在滚动 R4 发布中新增 [L01](/libraries/library-primitive-dsl-custom-kernel/)与 [L02](/libraries/thrust-algorithm-vocabulary/)；[issue #34](https://github.com/xiangzhang-coding/cuda-learning-site/issues/34)发布 [L03：CUB Device Primitives](/libraries/cub-device-primitives/)、[L04：CUB Warp 与 Block Primitives](/libraries/cub-warp-block-primitives/)、[EX17：CUB Device Reduction and Scan](/examples/cub-device-reduction-scan/)和 [LAB11：比较自定义归约与 CUB](/labs/compare-custom-reduction-with-cub/)，随后发布严格依赖 M05、M13 与 M19 的 [L05：libcu++ 同步抽象](/libraries/libcu-plus-plus-synchronization/)。[Issue #36](https://github.com/xiangzhang-coding/cuda-learning-site/issues/36)新增 [L06：cuBLAS GEMM](/libraries/cublas-gemm/)`<-[A08,Q01]`、[L07：cuBLASLt Matmul](/libraries/cublaslt-matmul/)`<-[L06,Q05]`、[EX18](/examples/cublas-gemm/)`<-[L06]`与 [LAB12](/labs/compare-gemm-with-cublas/)`<-[Q13,L06]`。

[Issue #37](https://github.com/xiangzhang-coding/cuda-learning-site/issues/37)新增 [L08：张量核心（Tensor Core）精度与架构合同](/libraries/tensor-core-precision-contracts/)`<-[Q02,L06,F06]`和 [L09：CUTLASS C++ GEMM 结构](/libraries/cutlass-cpp-gemm-structure/)`<-[A08,L06,M17]`，以上分别是两者完整的有序直接先修项。[L08 练习](/libraries/tensor-core-precision-contracts/exercises/)与[独立解答](/libraries/tensor-core-precision-contracts/solutions/)、[L09 练习](/libraries/cutlass-cpp-gemm-structure/exercises/)与[独立解答](/libraries/cutlass-cpp-gemm-structure/solutions/)均可直接进入。

[Issue #38](https://github.com/xiangzhang-coding/cuda-learning-site/issues/38)新增 [L10：cuDNN 图与计划](/libraries/cudnn-graphs-and-plans/)`<-[A07,L01,Q05]`和 [L11：注意力后端分派](/libraries/attention-backend-dispatch/)`<-[A11,L10,L08]`，分别关联 L11 与 VIS18，不改变旧先修。[L10 练习](/libraries/cudnn-graphs-and-plans/exercises/)与[独立解答](/libraries/cudnn-graphs-and-plans/solutions/)、[L11 练习](/libraries/attention-backend-dispatch/exercises/)与[独立解答](/libraries/attention-backend-dispatch/solutions/)同步发布。

[Issue #39](https://github.com/xiangzhang-coding/cuda-learning-site/issues/39)新增 [L12：cuFFT 计划、布局与启动](/libraries/cufft-plans-layouts-startup/)`<-[Q05,M07]`、[L12 练习](/libraries/cufft-plans-layouts-startup/exercises/)`<-[L12]`、[独立解答](/libraries/cufft-plans-layouts-startup/solutions/)`<-[L12-EXERCISES]`和 [EX19：cuFFT 批量变换](/examples/cufft-batched-transform/)`<-[L12]`，共四个双语发布对、八条路由。

[Issue #40](https://github.com/xiangzhang-coding/cuda-learning-site/issues/40)新增 [L13：cuSPARSE 描述符、SpMV 与 SpMM](/libraries/cusparse-descriptors-spmv-spmm/)`<-[A12,A13,L01]`、[L13 练习](/libraries/cusparse-descriptors-spmv-spmm/exercises/)`<-[L13]`、[独立解答](/libraries/cusparse-descriptors-spmv-spmm/solutions/)`<-[L13-EXERCISES]`和 [EX20：cuSPARSE SpMV](/examples/cusparse-spmv/)`<-[L13]`，再增加四个双语发布对、八条路由。L01-L13 均纳入 R4；聚合复核不再增加页面或资源条目。

[Issue #42](https://github.com/xiangzhang-coding/cuda-learning-site/issues/42)在当前发布中加入 [P01：CUDA Python 桥接](/python/cuda-python-bridge/)、[P02：设备、上下文与启动](/python/devices-contexts-launches/)和 [P03：运行时编译与链接](/python/runtime-compilation-linking/)，有序直接先修分别为 `[F04,M07]`、`[P01,F07]`和 `[P02,M15,M16]`。每个单元有练习和独立解答；共用的 [EX21：CUDA Python 显式启动](/examples/cuda-python-launch/)仅依赖 `[P02]`，独立记录 Python、包与原生 Toolkit 配置，仍待硬件验证（Pending Hardware Verification）。本次增加十个发布对、二十条路由，不改写 R4 历史或发布框架、Triton 占位入口。

截至 **2026-09-20**，当前发布有 103 个学习单元、24 个可运行示例（EX01-EX24）、18 个实验（LAB01-LAB18）、21 项可视化讲解、113 个[练习题库（Practice Bank）](/practice/)条目、207 个[术语表](/glossary/)词条、116 条[来源记录](/sources-and-versions/)，共 475 条资源目录记录、373 个双语发布对、746 条源路由，含 102 组练习与 102 组独立参考解答。[G08](/multi-gpu/nccl-graph-capture/)增加集合捕获、重放、生命周期与独立门禁的注册路径。共 41 个主体待硬件验证，G08 外部场景也尚未观察；R5 冻结复核不变，R6 待复核。

Issue #44 增加 [P08](/frameworks/first-custom-operator/)，先修 `[O04,F04,Q01,P04]`；[P09](/frameworks/operator-registration/)，先修 `[P08,Q01]`；[P10](/frameworks/operator-packaging/)，先修 `[P08,M18]`。[EX22](/examples/adjacent-energy/)和 [LAB13](/labs/build-custom-operator/)依赖 `[P08,P09]`，原创相邻能量算子有 CPU/CUDA 路径和独立固定的扩展 Toolkit。两者编译/已记录观察为空，运行待硬件验证（Pending Hardware Verification）。

[Issue #43](https://github.com/xiangzhang-coding/cuda-learning-site/issues/43)保留 [P04](/frameworks/queued-work-timing/) `[M07,Q05]`、[P05](/frameworks/streams-and-storage-lifetime/) `[P04,M08]`、[P06](/frameworks/mixed-precision-contracts/) `[Q02,P04,L08]`、[P07](/frameworks/python-to-cuda-profiling/) `[P04,Q07,Q08]`，含完整练习/解答和空证据数组。[独立 eager 配置](/sources-and-versions/#src-cuda-080)不需要系统 Toolkit。Issue #44 增加独立扩展工具链；另行固定版本的 Triton 路径现已完整发布至 T08。

**R4 聚合静态复核：2026-09-10。** 技术来源保留各自访问与复核日期，当时的检索有单独的[聚合复核结论](/sources-and-versions/#r4-aggregate-review)，不覆盖当前 Python 桥接增量。[Issue #41](https://github.com/xiangzhang-coding/cuda-learning-site/issues/41) 只在 CI、Preview、生产部署和远程冒烟检查结果实际产生后记录动态验收。R4 不表示框架或 Triton 路线已完成，也不为它们发布占位入口。

当前 113 道练习题库题目包括 PB-R5-001 至 PB-R5-020 以及 PB-R6-001 至 PB-R6-011。R4 八道库与算法选择题、R3 十道 Nsight 报告分析题不变。只有 EX02、EX10、LAB02 编译已检查（Compile-Checked），EX10 无需运行验证（Runtime-Not-Applicable）。其余 23 个示例和全部 18 个实验共 41 个主体待硬件验证（Pending Hardware Verification）。P01-P12、T01-T08 和 G01-G08 四个证据数组为空。EX21-EX24 编译/已记录观察为空，主机检查不授予 GPU 证据。运行已验证（Runtime-Verified）、社区已观察（Community-Observed）、基准环境（Reference Environment）、性能观察均为零。六份分析器计划只有预期内容，LAB18 时间线及 G07 诊断 fixture 为合成数据。

Q06-Q13、A10-A14 与 L01-L13 的四个证据数组均为空，不授予证据状态（Evidence Status）。L03-L05 只链接和复述精确的上游源码及测试合同；API 存在与上游测试不是本站编译或运行证据。EX17/LAB11、EX18/LAB12、EX19 与 EX20 的编译证据和实际观察记录为空，运行保持待硬件验证（Pending Hardware Verification）；没有计时、加速比或赢家记录，L07 的发布也不提供 Lt 选择的运行证据。选定的 CCCL v3.4.2 坐标独立于 Toolkit 标签，只用于 12.9.2/13.3.1 评估，并排除 11.8。20 项可视化讲解仍是无 CUDA 证据的浏览器模型。

L08 区分输入转换、累加、输出转换与 WMMA 架构合同；L09 的结构阅读固定为 CUTLASS C++ v4.7.0、提交 `dcf215af68a2d08d305076c152a06f201728cd53`，不承诺 DSL 或可执行支持。两者没有本地编译、真实指令观察、CUDA 运行或性能结果。VIS12 模型保持不变，其 instruction panel 仍是源码层标量运算位置，不是真实 Tensor Core 指令。

L10/L11 独立固定 cuDNN backend 9.24.0 与 frontend 1.27.0、提交 `f77fbc3d21be3f24cd0286b9b368105f7c518b8a`，只作来源阅读。后端 EULA 与前端逐文件 Apache/MIT 许可分开记录，没有复制实现或资产；源码/测试审查不形成编译、GPU、实际分派、类型或基准证据。

L12 使用归档的 12.9.2 cuFFT 教学基线和访问于 2026-09-08 的当前 13.3 参考；精确的 13.3.1 API 与发布说明归档不可用。EX19 声明同样三条固定工具包通道（Toolkit Lane），仅使用 C++17，分别搭配捆绑的 cuFFT 10.9.0.58 / 11.4.1.4 / 12.3.0.29。其 FP32 C2C 示例不包含回调（callback）、低精度、多 GPU 执行或计时；源码身份和构建检查不提供 GPU 证据。

L13 使用归档的 12.9.2 cuSPARSE 教学基线，并与精确的 11.8.0 和 13.3.1 归档比较。[SRC-CUDA-075/076 复核](/sources-and-versions/#src-cuda-075)于 2026-09-09 记录了可访问的 API 与发布说明归档，包括 13.3.1，不改写 EX19 较早的归档访问失败记录。EX20 声明三项 C++17 非执行构建门槛，Toolkit/cuSPARSE 组合为 11.8.0/11.7.5.86、12.9.2/12.5.10.65 与 13.3.1/12.8.2.51，不授予保留的编译证据或 GPU 结果。NVIDIA 头文件仍受链接的 [libcusparse 专有许可](https://developer.download.nvidia.com/compute/cuda/redist/libcusparse/LICENSE.txt)约束，没有复制或改编上游材料。EX20 原创软件采用 Apache-2.0，原创教学文字采用 CC BY 4.0。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。当前发布摘要核对日期为 **2026-09-19**；这不改变 R4 聚合复核和各项技术来源的历史日期。
