// SPDX-License-Identifier: Apache-2.0
export const collectiveCopy = {
  en: {
    title: 'Follow a collective message', controls: 'Model controls', collective: 'Collective', ranks: 'Rank count', topology: 'Logical topology',
    notice: 'Synthetic store-and-forward model. No CUDA runs, hardware topology, NCCL algorithm selection or measured time.',
    instruction: 'Use Tab to reach controls, arrow keys to select, and Enter or Space on step buttons. Each step is one logical hop, not a time interval.',
    ring: 'Directed ring', star: 'Star through rank 0', previous: 'Previous hop', next: 'Next hop', reset: 'Reset model',
    hop: 'Hop', gather: 'Gather contribution', distribute: 'Distribute result', payload: 'Payload',
    rank: 'Rank', input: 'Input', output: 'Expected final output', static: 'Static four-rank diagrams',
    fallback: 'Ring: 0 → 1 → 2 → 3 → 0. Star: 1 ↔ 0 ↔ 2 and 0 ↔ 3. For all-reduce, inputs 1, 2, 3, 4 sum to 10 on every rank. Broadcast from rank 0 yields 1; all-gather yields [1, 2, 3, 4].',
    boundary: 'This ledger gathers at rank 0 then distributes, except broadcast. The directed ring is a route constraint, not the optimized ring all-reduce algorithm. A physical NVLink/PCIe graph and NCCL transport choice require separate evidence.',
  },
  'zh-CN': {
    title: '沿消息路径理解集合通信', controls: '模型控件', collective: '集合通信（Collective）', ranks: 'Rank 数量', topology: '逻辑拓扑（Topology）',
    notice: '合成的存储转发模型。不运行 CUDA，不表示硬件拓扑、NCCL 算法选择或实测时间。',
    instruction: '用 Tab 定位控件、方向键选择，用 Enter 或空格操作步进按钮。一步表示一次逻辑跳转，不代表时间间隔。',
    ring: '有向环', star: '经过 rank 0 的星形', previous: '上一步', next: '下一步', reset: '重置模型',
    hop: '跳转', gather: '收集贡献', distribute: '分发结果', payload: '载荷',
    rank: 'Rank', input: '输入', output: '预期最终输出', static: '四 rank 静态图',
    fallback: '环：0 → 1 → 2 → 3 → 0。星形：1 ↔ 0 ↔ 2，另有 0 ↔ 3。全归约（All-reduce）把输入 1、2、3、4 相加，每个 rank 得到 10。从 rank 0 广播得到 1；全收集（All-gather）得到 [1, 2, 3, 4]。',
    boundary: '除广播外，这份步骤表先在 rank 0 收集，再分发。有向环只是路由约束，不是优化后的 ring all-reduce 算法。物理 NVLink／PCIe 图和 NCCL 传输选择需要另外的证据。',
  },
} as const;
