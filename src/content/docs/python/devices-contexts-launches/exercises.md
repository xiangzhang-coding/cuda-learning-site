---
title: 'P02 练习：证明 ABI 与最后一次使用'
description: 为非整块输入推导启动和标量合同，修复部分提交后的清理，不破坏共享上下文状态。
pairId: p02-exercises
counterpart: /en/python/devices-contexts-launches/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: P02-EXERCISES
prerequisites: [P02]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Core Buffer ownership and copy implementation'
    url: 'https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/cuda/core/_memory/_buffer.pyx'
    version: 'cuda-core 1.2.0'
    platform: 'Static buffer, copy, scalar and lifetime review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/python/devices-contexts-launches/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P02 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/en/python/devices-contexts-launches/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [P02](/python/devices-contexts-launches/)，严格为 `[P02]`。纸面练习（Exercise）不需要 GPU，四个证据数组均为空。前置链为 `P02 -> P02-EXERCISES -> P02-SOLUTIONS`。

## 提交要求

打开[解答](/python/devices-contexts-launches/solutions/)前，提交参数/存储账本、启动几何证明，以及成功/失败生命周期图。不要实际执行故意非法的访问。本工作纸提出一个变体，不是第二份规范 EX21，也不要求修改其源码。

## 练习 1：位宽是函数签名的一部分

**目标：** 为假设核函数 `out[i]=a[i]+alpha*b[i]` 制定安全主机合同，其参数为 `(const float*, const float*, float*, unsigned int n, float alpha)`。

**约束：** n=769，block=256，三个独立设备数组和三个页锁定主机数组，alpha=0.5。a/b 前五项为 `[1,-2,0,8,0.25]` 与 `[2,4,-4,0,-0.5]`，其余为有限、可被二进制精确表示的小数。错误方案为每个数组只分配 769 字节，传普通 Python `769` 与 `0.5`，设置 grid 为 `n//256`，调用 `d_out.copy_to(stream=s)` 后直接用返回的 Buffer 创建 CPU 视图。要求计数为 uint32 可表示的正数；不能依赖 ctypes 转换回绕。

**预期提交证据：** 修复每项字节数、指针/标量表示、启动维度、复制目标与视图所有权。求前五项输出、有效/尾部线程数，以及按存储位置区分的载荷总数。分别说明 n=0、负 n 和超出 uint32 范围的处理。

**验收标准：** 每个逻辑索引恰好有一个写线程，尾部不访问数组。传输双方 Buffer 等长且主机目标明确。只在主机可访问、持有者仍存活的存储上创建视图。不能把普通 Python 标量封送当成签名匹配。`s.sync()` 后比较每个有限输出，不能用五个样本匹配替代全量运行判定。

<details><summary>提示 1：区分元素、字节与标量表示</summary>float32 每元素四字节。Python 值的类型不会自动根据 CUDA C++ 声明推断。</details>

<details><summary>提示 2：覆盖最后一个逻辑索引</summary>先求索引 768 所在的块，再数未使用线程。省略复制目标所返回的 Buffer 可能仍来自设备内存资源。</details>

## 练习 2：修复部分提交后的清理

**目标：** 在不虚构销毁 API 的前提下，规定安全的成功和失败路径。

**约束：** 独立进程先 `dev=Device(0)`，再 `ctx=dev.set_current()`。它拥有流 s 与六个 Buffer，主机视图借用页锁定 Buffer。H2D 与启动已提交，D2H 调用抛出异常，随后尝试的同步也抛出异常。错误清理先关闭 s，再对 Kernel/ObjectCode/Device 调用 `close()`，用 `cuModuleUnload` 卸载 `ObjectCode.handle`，释放 Buffer 原始地址并重置主上下文。兜底捕获最后因为先前 CPU 参考计算通过而打印成功。这是假设轨迹，没有观察到真实故障。

**预期提交证据：** 分类已取得、借用与共享资源，纠正 ctx 的含义，画正常完成路径及完成失败路径。指出应保留的原始错误和次要诊断。说明哪些资源有公开 close、何时可调用，以及为何清理不能在完成失败后建立有效结果。

**验收标准：** 不先于依赖流的 Buffer 释放关闭流，不用原始句柄重复释放，不卸载 core 拥有的库，不重置共享主状态。用 `sync()`，不用 `synchronize()`。保留失败并非零退出；清理警告和失败等待不能转换为验收通过。不能假设 `del` 保证立即销毁原生资源。

<details><summary>提示 1：拥有包装对象与借用句柄不同</summary>默认 `set_current()` 返回 None。查询 `dev.context` 是查看共享主上下文，不是取得销毁权限。</details>

<details><summary>提示 2：报告错误的 API 不一定是原因</summary>D2H 调用可能报告之前的异步启动错误。尝试后续清理时仍保留首次观察到的失败；同步再失败不应抹掉它。</details>

## 下一步

阅读[解答](/python/devices-contexts-launches/solutions/)和 [PB-R5-002](/practice/#pb-r5-002)。[SRC-CUDA-077](/sources-and-versions/#src-cuda-077)提供精确的标量、Buffer、上下文与库生命周期来源，复核于 **2026-09-12**。原创工作纸数据与诊断场景不是上游测试，也不是观察到的 [EX21](/examples/cuda-python-launch/) 结果。
