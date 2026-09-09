---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-09-08'
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
      content: '2026-09-08'
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

已完成的 R3 聚合发布复核是不可变快照，固定为 232 个 Publication Pairs、464 条 source routes 与 347 条 catalog records。它包含 61 组 Exercises、61 组独立 reviewed solutions，以及 10 个 Nsight report-analysis Practice Bank 条目；R1/R2 继续作为历史坐标，R4 聚合复核仍待完成。

Issue #31 的严格图新增 `A12<-[M01,M02]`与 `A13<-[A12,A08]`。[Issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33)在滚动 R4 发布中新增 [L01](/libraries/library-primitive-dsl-custom-kernel/)与 [L02](/libraries/thrust-algorithm-vocabulary/)；[issue #34](https://github.com/xiangzhang-coding/cuda-learning-site/issues/34)发布 [L03：CUB Device Primitives](/libraries/cub-device-primitives/)、[L04：CUB Warp 与 Block Primitives](/libraries/cub-warp-block-primitives/)、[EX17：CUB Device Reduction and Scan](/examples/cub-device-reduction-scan/)和 [LAB11：比较自定义归约与 CUB](/labs/compare-custom-reduction-with-cub/)，随后发布严格依赖 M05、M13 与 M19 的 [L05：libcu++ 同步抽象](/libraries/libcu-plus-plus-synchronization/)。[Issue #36](https://github.com/xiangzhang-coding/cuda-learning-site/issues/36)新增 [L06：cuBLAS GEMM](/libraries/cublas-gemm/)`<-[A08,Q01]`、[L07：cuBLASLt Matmul](/libraries/cublaslt-matmul/)`<-[L06,Q05]`、[EX18](/examples/cublas-gemm/)`<-[L06]`与 [LAB12](/labs/compare-gemm-with-cublas/)`<-[Q13,L06]`。

[Issue #37](https://github.com/xiangzhang-coding/cuda-learning-site/issues/37)新增 [L08：张量核心（Tensor Core）精度与架构合同](/libraries/tensor-core-precision-contracts/)`<-[Q02,L06,F06]`和 [L09：CUTLASS C++ GEMM 结构](/libraries/cutlass-cpp-gemm-structure/)`<-[A08,L06,M17]`，以上分别是两者完整的有序直接先修项。[L08 练习](/libraries/tensor-core-precision-contracts/exercises/)与[独立解答](/libraries/tensor-core-precision-contracts/solutions/)、[L09 练习](/libraries/cutlass-cpp-gemm-structure/exercises/)与[独立解答](/libraries/cutlass-cpp-gemm-structure/solutions/)均可直接进入。

[Issue #38](https://github.com/xiangzhang-coding/cuda-learning-site/issues/38)新增 [L10：cuDNN 图与计划](/libraries/cudnn-graphs-and-plans/)`<-[A07,L01,Q05]`和 [L11：注意力后端分派](/libraries/attention-backend-dispatch/)`<-[A11,L10,L08]`，分别关联 L11 与 VIS18，不改变旧先修。[L10 练习](/libraries/cudnn-graphs-and-plans/exercises/)与[独立解答](/libraries/cudnn-graphs-and-plans/solutions/)、[L11 练习](/libraries/attention-backend-dispatch/exercises/)与[独立解答](/libraries/attention-backend-dispatch/solutions/)同步发布。

[Issue #39](https://github.com/xiangzhang-coding/cuda-learning-site/issues/39)新增 [L12：cuFFT 计划、布局与启动](/libraries/cufft-plans-layouts-startup/)`<-[Q05,M07]`、[L12 练习](/libraries/cufft-plans-layouts-startup/exercises/)`<-[L12]`、[独立解答](/libraries/cufft-plans-layouts-startup/solutions/)`<-[L12-EXERCISES]`和 [EX19：cuFFT 批量变换](/examples/cufft-batched-transform/)`<-[L12]`，共四个双语发布对、八条路由；R4 库路线仅 L13 仍待发布。

当前滚动发布有 74 个学习单元、19 个可运行示例（EX01-EX19）、12 个实验（LAB01-LAB12）、19 项可视化讲解（独立 VIS01-VIS14/VIS18，加上内嵌 VIS19-VIS22）、80 个[练习题库](/practice/)条目、194 项[术语表](/glossary/)词条和 90 项[来源记录](/sources-and-versions/)，共 395 条资源目录记录；公开源文件形成 273 个双语发布对（Publication Pair）和 546 条源路由，包含 73 组练习与 73 组独立参考解答。

**发布清单与导航更新：2026-09-08。** 页面日期仅对应本次发布清单更新，不重新核查既有 CUDA API 事实；技术来源保留各自访问与复核日期。

Q06-Q13、A10-A14 与 L01-L12 的四个证据数组均为空，不授予证据状态（Evidence Status）。L03-L05 只链接和复述精确的上游源码及测试合同；API 存在与上游测试不是本站编译或运行证据。EX17/LAB11、EX18/LAB12 与 EX19 的编译证据和实际观察记录为空，运行保持待硬件验证（Pending Hardware Verification）；没有计时、加速比或赢家记录，L07 的发布也不提供 Lt 选择的运行证据。选定的 CCCL v3.4.2 坐标独立于 Toolkit 标签，只用于 12.9.2/13.3.1 评估，并排除 11.8。19 项可视化讲解仍是无 CUDA 证据的浏览器模型。

L08 区分输入转换、累加、输出转换与 WMMA 架构合同；L09 的结构阅读固定为 CUTLASS C++ v4.7.0、提交 `dcf215af68a2d08d305076c152a06f201728cd53`，不承诺 DSL 或可执行支持。两者没有本地编译、真实指令观察、CUDA 运行或性能结果。VIS12 模型保持不变，其 instruction panel 仍是源码层标量运算位置，不是真实 Tensor Core 指令。

L10/L11 独立固定 cuDNN backend 9.24.0 与 frontend 1.27.0、提交 `f77fbc3d21be3f24cd0286b9b368105f7c518b8a`，只作来源阅读。后端 EULA 与前端逐文件 Apache/MIT 许可分开记录，没有复制实现或资产；源码/测试审查不形成编译、GPU、实际分派、类型或基准证据。

L12 使用归档的 12.9.2 cuFFT 教学基线和访问于 2026-09-08 的当前 13.3 参考；精确的 13.3.1 API 与发布说明归档不可用。EX19 声明同样三条固定工具包通道（Toolkit Lane），仅使用 C++17，分别搭配捆绑的 cuFFT 10.9.0.58 / 11.4.1.4 / 12.3.0.29。其 FP32 C2C 示例不包含回调（callback）、低精度、多 GPU 执行或计时；源码身份和构建检查不提供 GPU 证据。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面发布清单核对日期为 **2026-09-08**。
