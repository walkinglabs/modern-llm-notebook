# Modern LLM Notebook

**从零实现大语言模型核心组件的完整教程 — 27 个 Jupyter Notebook，手写核心算法，从 Tokenizer 到 LLM 服务部署。**

---

## 这是什么？

这不是另一份「调用 GPT API」的教程。这是一份**从零实现大模型核心组件**的实战指南。

每个 Part 遵循 **直觉理解 -> 手算验证 -> 代码实现 -> 实验观察** 的教学循环。你会亲手写出 BPE Tokenizer、Multi-Head Attention、MoE Router、RLHF PPO、Speculative Decoding、VLM Cross-Attention、模型量化。

## 学习路径

```
                     Modern LLM Full Stack
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌──────────┐          ┌──────────────┐          ┌──────────────┐
│ Part 1   │          │  Part 2       │          │  Part 3       │
│ Foundation│ ───────>│  Training     │ ───────>│  Inference    │
│ 01-07    │          │  08-19        │          │  20-26        │
└──────────┘          └──────────────┘          └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  Part 4       │
                      │  Frontiers    │
                      │  27-31        │
                      └──────────────┘
```

## 快速开始

```bash
git clone https://github.com/sanbuphy/modern-llm-notebook.git
cd modern-llm-notebook
pip install -r requirements.txt
jupyter notebook notebooks/part1-foundation/01-tokenizer-basics.ipynb
```

**要求**: Python 3.9+, PyTorch 2.0+, 16GB RAM。

每个 Notebook 都是**自包含**的 — 可以按需跳转到任何 Part，不依赖前序 Notebook 的运行时状态。

## 4 个学习阶段

| Part | 范围 | 你会写出 |
|:---|:---|:---|
| **Part 1 — Foundation** | 01-07 | Tokenizer, BPE, Embedding, Position Encoding, Transformer Block, Mini-GPT, BERT |
| **Part 2 — Training** | 08-19 | 现代语言模型架构演进, 语言模型的预训练与微调, KV Cache 及架构演进, 分布式训练：工业界的标准工具链, 从 dense 到 MoE, Scaling Laws, 数据工程, LoRA 低秩微调, 从大模型到小模型, 从对话到工具, 从偏好到对齐 |
| **Part 3 — Inference** | 20-26 | 生成与解码, 推理开销, 量化, 投机解码, 推理系统, 评测, 部署与服务化 |
| **Part 4 — Frontiers** | 27-31 | 长上下文 (YaRN), 推理链与 CoT, VLM, 高效 Attention, 在线策略蒸馏 |

## 教学特色

- **手算验证** — 每个核心算法先用具体数字手动计算，再用代码实现
- **从零实现** — 只依赖 PyTorch，不用 `transformers` 等封装库
- **实验驱动** — 改变温度看分布变化、调整 RoPE 频率看外推效果

## 覆盖论文

Attention Is All You Need, BERT, LLaMA, Scaling Laws, Chinchilla, LoRA, RLHF/PPO, DPO, FlashAttention, vLLM, PagedAttention, Speculative Decoding, RoPE, YaRN, Chain-of-Thought, DeepSeek-R1, Flamingo, LLaVA, RAGAS, LLM-as-Judge, Knowledge Distillation, On-Policy Distillation, GPTQ, AWQ 等 20+ 篇核心论文。

---

*每个 Notebook 页面顶部都有 **Open in Colab** 按钮，一键在云端运行。*
