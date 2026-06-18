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
│ 01-07    │          │  08-17        │          │  18-21        │
└──────────┘          └──────────────┘          └──────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
             ┌──────────────┐   ┌──────────────┐
             │  Part 4       │   │  Part 5       │
             │  Frontiers    │   │  Production   │
             │  22-24        │   │  25-28        │
             └──────────────┘   └──────────────┘
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

## 5 个学习阶段

| Part | 范围 | 你会写出 |
|:---|:---|:---|
| **Part 1 — Foundation** | 01-07 | Tokenizer, BPE, Embedding, Position Encoding, Transformer Block, Mini-GPT, BERT |
| **Part 2 — Training** | 08-17 | 现代架构演进, MoE, 训练循环, Scaling Laws, 分布式训练, 数据工程, LoRA, 函数调用, RLHF |
| **Part 3 — Inference** | 18-21 | 解码策略, KV Cache + FlashAttention, 模型量化, 投机解码 |
| **Part 4 — Frontiers** | 22-24 | 长上下文外推 (YaRN), 推理链与思维模型, 视觉语言模型 |
| **Part 5 — Production** | 25-28 | 评测方法论, 知识蒸馏, 在线策略蒸馏, LLM 服务部署 |

## 教学特色

- **手算验证** — 每个核心算法先用具体数字手动计算，再用代码实现
- **从零实现** — 只依赖 PyTorch，不用 `transformers` 等封装库
- **实验驱动** — 改变温度看分布变化、调整 RoPE 频率看外推效果

## 覆盖论文

Attention Is All You Need, BERT, LLaMA, Scaling Laws, Chinchilla, LoRA, RLHF/PPO, DPO, FlashAttention, vLLM, PagedAttention, Speculative Decoding, RoPE, YaRN, Chain-of-Thought, DeepSeek-R1, Flamingo, LLaVA, RAGAS, LLM-as-Judge, Knowledge Distillation, On-Policy Distillation, GPTQ, AWQ 等 20+ 篇核心论文。

---

*每个 Notebook 页面顶部都有 **Open in Colab** 按钮，一键在云端运行。*
