---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-09-12'
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
      content: '2026-09-12'
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

最近完成的聚合静态发布复核仍是 2026-09-10 的 R4。模式版本 5 的 `src/r4-release-manifest.json` 继续生成冻结的 `/release.json`：75 个学习单元、277 个双语发布对（Publication Pair）、554 条源路由，以及包含 82 道题、196 个词条和 92 条来源的 401 条目录记录。`/publication.json` 则记录当前新增 Python 桥接后的清单，最近完成阶段仍为 R4，下一阶段 R5 的聚合复核待完成。R1-R3 保留精确历史快照；R3 仍包含 232 个发布对、464 条源路由、347 条目录记录、61 组练习、61 组独立参考解答与十道 Nsight 报告分析题。

Issue #31 的严格图新增 `A12<-[M01,M02]`与 `A13<-[A12,A08]`。[Issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33)在滚动 R4 发布中新增 [L01](/libraries/library-primitive-dsl-custom-kernel/)与 [L02](/libraries/thrust-algorithm-vocabulary/)；[issue #34](https://github.com/xiangzhang-coding/cuda-learning-site/issues/34)发布 [L03：CUB Device Primitives](/libraries/cub-device-primitives/)、[L04：CUB Warp 与 Block Primitives](/libraries/cub-warp-block-primitives/)、[EX17：CUB Device Reduction and Scan](/examples/cub-device-reduction-scan/)和 [LAB11：比较自定义归约与 CUB](/labs/compare-custom-reduction-with-cub/)，随后发布严格依赖 M05、M13 与 M19 的 [L05：libcu++ 同步抽象](/libraries/libcu-plus-plus-synchronization/)。[Issue #36](https://github.com/xiangzhang-coding/cuda-learning-site/issues/36)新增 [L06：cuBLAS GEMM](/libraries/cublas-gemm/)`<-[A08,Q01]`、[L07：cuBLASLt Matmul](/libraries/cublaslt-matmul/)`<-[L06,Q05]`、[EX18](/examples/cublas-gemm/)`<-[L06]`与 [LAB12](/labs/compare-gemm-with-cublas/)`<-[Q13,L06]`。

[Issue #37](https://github.com/xiangzhang-coding/cuda-learning-site/issues/37)新增 [L08：张量核心（Tensor Core）精度与架构合同](/libraries/tensor-core-precision-contracts/)`<-[Q02,L06,F06]`和 [L09：CUTLASS C++ GEMM 结构](/libraries/cutlass-cpp-gemm-structure/)`<-[A08,L06,M17]`，以上分别是两者完整的有序直接先修项。[L08 练习](/libraries/tensor-core-precision-contracts/exercises/)与[独立解答](/libraries/tensor-core-precision-contracts/solutions/)、[L09 练习](/libraries/cutlass-cpp-gemm-structure/exercises/)与[独立解答](/libraries/cutlass-cpp-gemm-structure/solutions/)均可直接进入。

[Issue #38](https://github.com/xiangzhang-coding/cuda-learning-site/issues/38)新增 [L10：cuDNN 图与计划](/libraries/cudnn-graphs-and-plans/)`<-[A07,L01,Q05]`和 [L11：注意力后端分派](/libraries/attention-backend-dispatch/)`<-[A11,L10,L08]`，分别关联 L11 与 VIS18，不改变旧先修。[L10 练习](/libraries/cudnn-graphs-and-plans/exercises/)与[独立解答](/libraries/cudnn-graphs-and-plans/solutions/)、[L11 练习](/libraries/attention-backend-dispatch/exercises/)与[独立解答](/libraries/attention-backend-dispatch/solutions/)同步发布。

[Issue #39](https://github.com/xiangzhang-coding/cuda-learning-site/issues/39)新增 [L12：cuFFT 计划、布局与启动](/libraries/cufft-plans-layouts-startup/)`<-[Q05,M07]`、[L12 练习](/libraries/cufft-plans-layouts-startup/exercises/)`<-[L12]`、[独立解答](/libraries/cufft-plans-layouts-startup/solutions/)`<-[L12-EXERCISES]`和 [EX19：cuFFT 批量变换](/examples/cufft-batched-transform/)`<-[L12]`，共四个双语发布对、八条路由。

[Issue #40](https://github.com/xiangzhang-coding/cuda-learning-site/issues/40)新增 [L13：cuSPARSE 描述符、SpMV 与 SpMM](/libraries/cusparse-descriptors-spmv-spmm/)`<-[A12,A13,L01]`、[L13 练习](/libraries/cusparse-descriptors-spmv-spmm/exercises/)`<-[L13]`、[独立解答](/libraries/cusparse-descriptors-spmv-spmm/solutions/)`<-[L13-EXERCISES]`和 [EX20：cuSPARSE SpMV](/examples/cusparse-spmv/)`<-[L13]`，再增加四个双语发布对、八条路由。L01-L13 均纳入 R4；聚合复核不再增加页面或资源条目。

[Issue #42](https://github.com/xiangzhang-coding/cuda-learning-site/issues/42)在当前发布中加入 [P01：CUDA Python 桥接](/python/cuda-python-bridge/)、[P02：设备、上下文与启动](/python/devices-contexts-launches/)和 [P03：运行时编译与链接](/python/runtime-compilation-linking/)，有序直接先修分别为 `[F04,M07]`、`[P01,F07]`和 `[P02,M15,M16]`。每个单元有练习和独立解答；共用的 [EX21：CUDA Python 显式启动](/examples/cuda-python-launch/)仅依赖 `[P02]`，独立记录 Python、包与原生 Toolkit 配置，仍待硬件验证（Pending Hardware Verification）。本次增加十个发布对、二十条路由，不改写 R4 历史或发布框架、Triton 占位入口。

截至 **2026-09-12**，当前滚动发布有 82 个学习单元、21 个可运行示例（EX01-EX21）、12 个实验（LAB01-LAB12）、19 项可视化讲解（独立 VIS01-VIS14/VIS18，加上内嵌 VIS19-VIS22）、89 个[练习题库（Practice Bank）](/practice/)条目、204 个[术语表](/glossary/)词条和 99 条[来源记录](/sources-and-versions/)，共 423 条资源目录记录；公开源文件形成 299 个双语发布对和 598 条源路由，包含 81 组练习与 81 组独立参考解答。

[Issue #43](https://github.com/xiangzhang-coding/cuda-learning-site/issues/43) 新增 [P04](/frameworks/queued-work-timing/)，有序先修 `[M07,Q05]`；[P05](/frameworks/streams-and-storage-lifetime/)，先修 `[P04,M08]`；[P06](/frameworks/mixed-precision-contracts/)，先修 `[Q02,P04,L08]`；[P07](/frameworks/python-to-cuda-profiling/)，先修 `[P04,Q07,Q08]`。相关边依次为 `[P05,P06,P07]`、`[P04]`、`[P04,P07]`、`[P05,P06]`。各单元练习只依赖本单元，独立解答只依赖对应练习集，恰好十二对，不新增可运行示例或实验。四个证据数组均为空。[独立 eager 配置](/sources-and-versions/#src-cuda-080)选择 PyTorch 2.11.0+cu128、CPython 3.12.14、CUDA 元包 12.8.1、runtime/CUPTI 12.8.90、cuDNN 9.19.0.56 及 native 分配器，不要求系统 Toolkit，也不继承 GPU 证据。P08、EX22、LAB13 与 Triton 目的地仍不存在。

**R4 聚合静态复核：2026-09-10。** 技术来源保留各自访问与复核日期，当时的检索有单独的[聚合复核结论](/sources-and-versions/#r4-aggregate-review)，不覆盖当前 Python 桥接增量。[Issue #41](https://github.com/xiangzhang-coding/cuda-learning-site/issues/41) 只在 CI、Preview、生产部署和远程冒烟检查结果实际产生后记录动态验收。R4 不表示框架或 Triton 路线已完成，也不为它们发布占位入口。

当前 89 道练习题库（Practice Bank）题目包含 Python 桥接题 `PB-R5-001/002/003` 与 PyTorch 审查题 `PB-R5-004/005/006/007`，并保留八道 R4 库与算法选择题：`PB-R4-001`、`PB-R4-002`、`PB-R4-003`、`PB-R4-004`、`PB-R4-008`、`PB-R4-011`、`PB-R4-012` 和 `PB-R4-016`；R3 十道 Nsight 报告分析题保持不变。只有 EX02、EX10 与 LAB02 具有编译已检查（Compile-Checked）证据；EX10 无需运行验证（Runtime-Not-Applicable）。其余 20 个示例和全部 12 个实验共 32 个主体仍待硬件验证（Pending Hardware Verification）。P01-P07 的四个证据数组均为空；EX21 的编译证据和实际观察记录为空，Python 主机测试不授予 CUDA 编译或运行证据。运行已验证（Runtime-Verified）、社区已观察（Community-Observed）、基准环境（Reference Environment）和性能观察的数量均为零。六份分析器计划都只有预期内容；来源复核不是 GPU 证据。

Q06-Q13、A10-A14 与 L01-L13 的四个证据数组均为空，不授予证据状态（Evidence Status）。L03-L05 只链接和复述精确的上游源码及测试合同；API 存在与上游测试不是本站编译或运行证据。EX17/LAB11、EX18/LAB12、EX19 与 EX20 的编译证据和实际观察记录为空，运行保持待硬件验证（Pending Hardware Verification）；没有计时、加速比或赢家记录，L07 的发布也不提供 Lt 选择的运行证据。选定的 CCCL v3.4.2 坐标独立于 Toolkit 标签，只用于 12.9.2/13.3.1 评估，并排除 11.8。19 项可视化讲解仍是无 CUDA 证据的浏览器模型。

L08 区分输入转换、累加、输出转换与 WMMA 架构合同；L09 的结构阅读固定为 CUTLASS C++ v4.7.0、提交 `dcf215af68a2d08d305076c152a06f201728cd53`，不承诺 DSL 或可执行支持。两者没有本地编译、真实指令观察、CUDA 运行或性能结果。VIS12 模型保持不变，其 instruction panel 仍是源码层标量运算位置，不是真实 Tensor Core 指令。

L10/L11 独立固定 cuDNN backend 9.24.0 与 frontend 1.27.0、提交 `f77fbc3d21be3f24cd0286b9b368105f7c518b8a`，只作来源阅读。后端 EULA 与前端逐文件 Apache/MIT 许可分开记录，没有复制实现或资产；源码/测试审查不形成编译、GPU、实际分派、类型或基准证据。

L12 使用归档的 12.9.2 cuFFT 教学基线和访问于 2026-09-08 的当前 13.3 参考；精确的 13.3.1 API 与发布说明归档不可用。EX19 声明同样三条固定工具包通道（Toolkit Lane），仅使用 C++17，分别搭配捆绑的 cuFFT 10.9.0.58 / 11.4.1.4 / 12.3.0.29。其 FP32 C2C 示例不包含回调（callback）、低精度、多 GPU 执行或计时；源码身份和构建检查不提供 GPU 证据。

L13 使用归档的 12.9.2 cuSPARSE 教学基线，并与精确的 11.8.0 和 13.3.1 归档比较。[SRC-CUDA-075/076 复核](/sources-and-versions/#src-cuda-075)于 2026-09-09 记录了可访问的 API 与发布说明归档，包括 13.3.1，不改写 EX19 较早的归档访问失败记录。EX20 声明三项 C++17 非执行构建门槛，Toolkit/cuSPARSE 组合为 11.8.0/11.7.5.86、12.9.2/12.5.10.65 与 13.3.1/12.8.2.51，不授予保留的编译证据或 GPU 结果。NVIDIA 头文件仍受链接的 [libcusparse 专有许可](https://developer.download.nvidia.com/compute/cuda/redist/libcusparse/LICENSE.txt)约束，没有复制或改编上游材料。EX20 原创软件采用 Apache-2.0，原创教学文字采用 CC BY 4.0。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。当前发布摘要核对日期为 **2026-09-12**；这不改变 R4 聚合复核和各项技术来源的历史日期。
