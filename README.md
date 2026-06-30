# Modern LLM Notebook

<p align="center">
  <strong>Build modern LLMs from scratch through 26 runnable Jupyter Notebooks.</strong>
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a>
  ·
  <a href="README-CN.md"><strong>中文文档</strong></a>
  ·
  <a href="https://walkinglabs.github.io/modern-llm-notebook/"><strong>Read Online</strong></a>
  ·
  <a href="https://colab.research.google.com/github/walkinglabs/modern-llm-notebook/blob/main/notebooks-en/part1-foundation/01-tokenizer-basics.ipynb"><strong>Start in Colab</strong></a>
  ·
  <a href="https://discord.gg/XU7DQmpqk"><strong>Join Discord</strong></a>
</p>

<p align="center">
  <a href="https://github.com/walkinglabs/modern-llm-notebook/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/walkinglabs/modern-llm-notebook?style=social">
  </a>
  <a href="https://github.com/walkinglabs/modern-llm-notebook/actions/workflows/quality.yml">
    <img alt="Quality checks" src="https://github.com/walkinglabs/modern-llm-notebook/actions/workflows/quality.yml/badge.svg">
  </a>
  <a href="https://github.com/walkinglabs/modern-llm-notebook/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-blue">
  </a>
  <img alt="Python" src="https://img.shields.io/badge/Python-3.9%2B-3776AB">
  <img alt="PyTorch" src="https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C">
  <img alt="Notebooks" src="https://img.shields.io/badge/Notebooks-32-orange">
  <img alt="Languages" src="https://img.shields.io/badge/Languages-English%20%7C%20Chinese-2ea44f">
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#what-you-will-build">What You Will Build</a> ·
  <a href="#why-this-project">Why</a> ·
  <a href="#what-is-included">What Is Included</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#project-status">Status</a> ·
  <a href="#curriculum">Curriculum</a> ·
  <a href="#quality-bar">Quality Bar</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

<p align="center">
  <strong>Case-based LLM learning: course map -> concrete notebook -> runnable experiment.</strong>
</p>

<p align="center">
  <img src="assets/readme/home-en.png" alt="Modern LLM Notebook English home page" width="920">
</p>

<p align="center">
  <em>Start from the full bilingual course map, then choose a focused path through foundations,
  training, inference, frontiers, and production topics.</em>
</p>

<p align="center">
  <img src="assets/readme/notebook-reader-en.png" alt="Modern LLM Notebook English notebook reader" width="920">
</p>

<p align="center">
  <em>Each case keeps the learning loop visible: intuition, hand calculation, implementation,
  experiment, outline navigation, and one-click Colab access.</em>
</p>

## Overview

Modern LLM Notebook is a hands-on course for building modern LLM systems from the ground up in
PyTorch. Instead of treating the model as a black box, you implement the core pieces yourself:
tokenizers, embeddings, attention, Transformer blocks, training loops, MoE, LoRA, RLHF, decoding,
KV Cache, long context, VLMs, evaluation, distillation, and on-policy distillation.

The repository ships with a full English notebook mirror under `notebooks-en/`. The web viewer
supports language switching from the home page and the notebook sidebar (or via `?lang=en` in the
URL), so both the curriculum and the browsing experience stay bilingual end to end.

The project is designed as an **educational reference implementation**. It is not a model zoo, not
a production serving framework, and not a wrapper around hosted APIs. Its purpose is to make the
internal machinery of LLMs legible to engineers who want to reason from first principles.

Each notebook follows the same learning contract:

```text
intuition -> hand calculation -> implementation -> experiment
```

That contract matters. A reader should not only know that BPE merges frequent pairs, or that KV
Cache speeds up generation. They should be able to trace the numbers, write the minimal code, and
explain why the behavior appears.

## What You Will Build

By the end, you will have implemented a compact version of the systems that power modern LLMs:

| Stage | You build | Why it matters |
|:---|:---|:---|
| Text to tokens | Character, word, and BPE tokenizers | See exactly how raw text becomes model input |
| Tokens to vectors | Token embeddings and position encodings | Understand what the model can compute over |
| Transformer core | Self-Attention, Multi-Head Attention, Transformer blocks, Mini-GPT | Reconstruct the core forward pass |
| Training system | Cross-Entropy, batching, gradient flow, scaling-law intuition | Connect loss curves to real model behavior |
| Adaptation | LoRA, continued pretraining, reward modeling, PPO/DPO style objectives | Learn how base models become useful assistants |
| Inference system | Sampling, beam search, KV Cache, speculative decoding | Understand why serving is a systems problem |
| Frontiers | Long context, CoT experiments, VLM patch embeddings and cross-attention | Turn newer papers into small runnable examples |
| Production loop | Evaluation, win-rate matrices, distillation, OPD | Measure, compress, and improve model behavior |

```text
raw text -> tokens -> embeddings -> attention -> Transformer -> Mini-GPT
         -> training -> alignment -> inference -> evaluation -> distillation
```

## Why This Project

LLM education often falls into two extremes.

Some resources are mathematically precise but difficult to enter: they introduce formulas before
the reader understands the problem being solved. Other resources are easy to run but heavily
abstracted: the important ideas disappear behind a library call.

Modern LLM Notebook takes the middle path. It treats modern LLMs as systems that can be decomposed,
tested, and rebuilt piece by piece. The goal is not to replace papers or production libraries. The
goal is to give you the mental model needed to read those papers and use those libraries with
judgment.

Use this project if you want to:

- Understand the data flow from raw text to logits.
- Build a small GPT-style model without treating the architecture as a black box.
- See how training objectives, data quality, and scaling laws connect.
- Learn why inference systems need KV Cache, batching, memory planning, and speculative decoding.
- Connect recent research topics such as MoE, long context, CoT, VLMs, RLHF, DPO, and distillation
  back to small runnable examples.

## What Is Included

| Area | Topics | Reference implementations |
|:---|:---|:---|
| Foundations | Tokenization, BPE, embeddings, position encoding | `CharTokenizer`, `WordTokenizer`, `BPETokenizer`, `TokenEmbedding` |
| Transformer core | Self-Attention, Multi-Head Attention, Transformer block | `MultiHeadAttention`, `TransformerBlock`, `MiniGPT` |
| GPT-2 to modern models | RMSNorm, SwiGLU, RoPE, GQA, QK-Norm, MLA, MoE | `RMSNorm`, `SwiGLU`, `RoPE`, `GroupedQueryAttention`, `MultiHeadLatentAttention`, `MoELayer` |
| Training | Loss, optimization, scaling laws, data engineering, MTP, FIM | Training loop, gradient accumulation, MinHash deduplication, Multi-Token Prediction, Fill-in-the-Middle |
| Adaptation and alignment | LoRA, reward modeling, PPO, DPO | `LoraLinear`, reward model loss, PPO clip, DPO loss |
| Inference | Sampling, beam search, KV Cache, speculative decoding | Top-k, Top-p, beam search, `AttentionWithKVCache` |
| Frontiers | Long context, reasoning traces, VLM, Sliding Window Attention | RoPE extrapolation, Self-Consistency, Cross-Attention, Sliding Window mask |
| Production concepts | Evaluation, distillation, on-policy distillation | Win-rate matrices, soft labels, KL estimators |

## What This Project Is Not

This repository intentionally avoids several things so the learning path stays clear:

- It is not a production LLM framework.
- It is not optimized for maximum throughput or distributed training.
- It does not provide pretrained model weights.
- It does not use `transformers` as a shortcut for core implementations.
- It does not assume the reader already knows the terminology.

Some dependencies such as `transformers` and `datasets` may appear in the environment for
comparison or utility work, but the teaching path keeps the core algorithms explicit.

## Quick Start

### Python notebooks

```bash
git clone https://github.com/walkinglabs/modern-llm-notebook.git
cd modern-llm-notebook

# Create an isolated Python environment instead of installing into the system Python.
python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m ipykernel install --user \
  --name modern-llm-notebook \
  --display-name "Python (modern-llm-notebook)"

jupyter notebook notebooks-en/part1-foundation/01-tokenizer-basics.ipynb
```

If `jupyter: command not found` appears, the virtual environment is probably not active. Run:

```bash
source .venv/bin/activate
```

Or call Jupyter directly from the environment:

```bash
.venv/bin/jupyter notebook notebooks-en/part1-foundation/01-tokenizer-basics.ipynb
```

Language note:

- Chinese notebooks live in `notebooks/`
- English notebooks live in `notebooks-en/` (complete 26/26 translation coverage)

Recommended environment:

- Python 3.9+
- PyTorch 2.0+
- NumPy, Matplotlib, Jupyter
- 16GB RAM

Most notebooks run on CPU. Larger training experiments are easier with a GPU.

### Web viewer

The repository also includes a React / Vite reader for a course-like browsing experience.
The reader imports the `.ipynb` files directly and renders them in the browser, without a generated
web content copy.

```bash
cd web
npm install
npm run dev
```

Build and preview the static site:

```bash
cd web
npm run build
npm run preview
```

### Executing notebooks in restricted environments

Some sandboxed environments disallow opening local sockets, which breaks the standard Jupyter
kernel protocol (and tools like `nbclient` / `nbconvert --execute`). For those cases we ship a
no-kernel executor that runs code cells via plain Python and writes outputs back into the English
notebooks:

```bash
python scripts/execute_notebooks_en_no_kernel.py
```

## Project Status

| Area | Status |
|:---|:---|
| Chinese notebooks | Complete 32/32 (added 29-MLA, 30-inference-systems, 31-linear-attention, 32-sparse-attention) |
| English notebooks | Complete 26/26 with executed outputs; renumber pending |
| Web reader | React / Vite app with language switching |
| Static site | Published through GitHub Pages |
| Quality checks | English coverage, syntax, output-language checks, and web build |
| Next focus | CS336/CME295-inspired depth, smoother writing, reproducible pretraining, and stronger eval benchmarks |

### Near-Term Roadmap

1. Incorporate more material inspired by CS336 and CME295, especially around data, training, systems, and evaluation.
2. Polish the flow of the existing notebooks so the explanations read more naturally from intuition to code.
3. Add a reproducible 0-to-1 pretraining workflow inspired by SmolLM, from data preparation to a small trained model.
4. Make the eval benchmark chapter more detailed, including benchmark design, metrics, judge prompts, result aggregation, and failure analysis.

## Curriculum

The curriculum is organized as five parts and 26 self-contained notebooks.

```text
Modern LLM Notebook
│
├── Part 1: Foundation
│   ├── Tokenizer basics
│   ├── BPE tokenizer
│   ├── Embedding and position encoding
│   ├── Attention and Transformer block
│   ├── Mini-GPT
│   └── BERT encoder
│
├── Part 2: Training
│   ├── From GPT-2 to modern models
│   ├── Model config
│   ├── Mixture of Experts
│   ├── Training and loss
│   ├── Scaling laws
│   ├── Data engineering
│   ├── LoRA
│   ├── Mid-training and continued pretraining
│   └── RLHF alignment
│
├── Part 3: Inference
│   ├── Generation
│   ├── Inference acceleration
│   └── Speculative decoding
│
├── Part 4: Frontiers
│   ├── Long context
│   ├── CoT and thinking
│   └── Vision-language models
│
└── Part 5: Production
    ├── Evaluation
    ├── Distillation
    ├── On-policy distillation
    └── vLLM & SGLang deployment
```

Each notebook is designed to be runnable on its own. You can follow the full sequence or jump to a
topic without depending on hidden runtime state from earlier notebooks.

## Notebook Index

### Part 1: Foundation

| # | Notebook | Primary question | Implementation focus |
|:---:|:---|:---|:---|
| 01 | [Tokenizer Basics](notebooks-en/part1-foundation/01-tokenizer-basics.ipynb) | Why do models need tokenizers? | Character and word tokenizers |
| 02 | [BPE Tokenizer](notebooks-en/part1-foundation/02-bpe-tokenizer.ipynb) | How does BPE learn a vocabulary? | Merge rules, encode, decode |
| 03 | [Embedding](notebooks-en/part1-foundation/03-embedding.ipynb) | How do IDs become vectors? | Token embedding, distributed representation |
| 04 | [Position Encoding](notebooks-en/part1-foundation/04-position-encoding.ipynb) | How does the model know word order? | Sinusoidal encoding, input assembly |
| 05 | [Attention & Transformer Block](notebooks-en/part1-foundation/05-transformer-block.ipynb) | How does attention move information? | MHA, residuals, normalization |
| 06 | [Mini-GPT](notebooks-en/part1-foundation/06-mini-gpt.ipynb) | How does a GPT-style model fit together? | Decoder-only model, LM head |
| 07 | [BERT Encoder](notebooks-en/part1-foundation/07-bert-encoder.ipynb) | Why can encoder-only models read bidirectionally? | MiniBERT, MLM head |

### Part 2: Training

| # | Notebook | Primary question | Implementation focus |
|:---:|:---|:---|:---|
| 08 | [From GPT-2 to Modern Models](notebooks-en/part2-training/08-gpt2-to-modern-models.ipynb) | What changed architecturally after GPT-2? | RMSNorm, SwiGLU, RoPE, GQA, QK-Norm, MLA |
| 09 | [Model Config](notebooks-en/part2-training/09-model-config.ipynb) | What does each field in a real config.json mean? | vocab_size, hidden_size, layers, heads |
| 10 | [Mixture of Experts](notebooks-en/part2-training/10-moe.ipynb) | How does sparse expert routing work? | Router gate, top-k experts, aux-free load balancing |
| 11 | [Training & Loss](notebooks-en/part2-training/11-training-loss.ipynb) | How does a language model learn from prediction errors? | Training loop, loss, gradients, Multi-Token Prediction |
| 12 | [Scaling Laws](notebooks-en/part2-training/12-scaling-laws.ipynb) | How do model size, data, and compute trade off? | FLOPs estimates, Chinchilla intuition |
| 13 | [Distributed Training](notebooks-en/part2-training/13-distributed-training.ipynb) | How do we shard memory and compute across GPUs? | DDP, ZeRO Stage 1/2/3, FSDP, DeepSpeed, Accelerate |
| 14 | [Data Engineering](notebooks-en/part2-training/14-data-engineering.ipynb) | Why does data quality dominate model behavior? | Cleaning, filtering, MinHash, FIM |
| 15 | [LoRA](notebooks-en/part2-training/15-lora.ipynb) | Why does low-rank adaptation work? | `LoraLinear`, merge for inference |
| 16 | [Mid-Training & CPT](notebooks-en/part2-training/16-midtraining-cpt.ipynb) | How does continued pretraining adapt a model? | Data mixing, loss observation |
| 17 | [RLHF Alignment](notebooks-en/part2-training/17-rlhf-alignment.ipynb) | How do preference signals become objectives? | Reward model, PPO, DPO |

### Part 3: Inference

| # | Notebook | Primary question | Implementation focus |
|:---:|:---|:---|:---|
| 17 | [Generation](notebooks-en/part3-inference/17-generation.ipynb) | How do decoding strategies change model behavior? | Greedy, top-k, top-p, beam search |
| 18 | [Inference Acceleration](notebooks-en/part3-inference/18-inference-acceleration.ipynb) | Why is generation memory-bound? | KV Cache, FlashAttention, PagedAttention |
| 19 | [Speculative Decoding](notebooks-en/part3-inference/19-speculative-decoding.ipynb) | How can a small model accelerate a large one? | Draft-then-verify acceptance |

### Part 4: Frontiers

| # | Notebook | Primary question | Implementation focus |
|:---:|:---|:---|:---|
| 20 | [Long Context](notebooks-en/part4-frontiers/20-long-context.ipynb) | How do models extend beyond their training context length? | RoPE extrapolation, YaRN, Sliding Window Attention |
| 21 | [CoT & Thinking](notebooks-en/part4-frontiers/21-cot-thinking.ipynb) | Why can reasoning traces improve answers? | Self-Consistency, reward design |
| 22 | [Vision-Language Models](notebooks-en/part4-frontiers/22-vlm.ipynb) | How does visual information enter a language model? | Patch embedding, cross-attention |

### Part 5: Production

| # | Notebook | Primary question | Implementation focus |
|:---:|:---|:---|:---|
| 23 | [Evaluation](notebooks-en/part5-production/23-evaluation.ipynb) | How do we tell whether a model is better? | Win-rate matrices, RAGAS, judge metrics |
| 24 | [Distillation](notebooks-en/part5-production/24-distillation.ipynb) | How does a small model learn from a large one? | Soft labels, temperature, logit distillation |
| 25 | [On-Policy Distillation](notebooks-en/part5-production/25-opd.ipynb) | How can distillation reduce exposure bias? | OPSD, KL estimator taxonomy |
| 26 | [LLM Deployment](notebooks-en/part5-production/26-llm-deployment.ipynb) | How do you turn a trained model into a callable service? | vLLM, SGLang, custom architecture registration |

## Quality Bar

The repository follows a small set of standards to keep the notebooks useful as learning material:

- Concepts are introduced by motivation before notation.
- New terminology is defined before it is used heavily.
- Core algorithms include at least one concrete hand calculation or toy example.
- Code cells are kept small and observable.
- Randomized experiments use fixed seeds where appropriate.
- Each notebook is self-contained and does not rely on variables from previous notebooks.
- Markdown explanations are written for patient beginners, while the code remains close to the
  real algorithmic structure.

## Papers and Systems

The course connects implementation details to influential papers and production systems:

| Paper or system | Concepts covered |
|:---|:---|
| Attention Is All You Need | Multi-Head Attention, position encoding |
| BERT | Encoder-only models, masked language modeling |
| LLaMA | RMSNorm, SwiGLU, RoPE, Pre-Norm |
| DeepSeek-V2 / DeepSeek-V3 | MLA, Multi-Token Prediction, aux-free MoE load balancing |
| Mixtral / Qwen3 | Sliding Window Attention, MoE with shared experts |
| Scaling Laws / Chinchilla | Parameter, data, and compute trade-offs |
| LoRA | Low-rank adaptation |
| RLHF / PPO / DPO | Preference alignment |
| Code Llama / DeepSeek-Coder | Fill-in-the-Middle (FIM) |
| FlashAttention / vLLM | Inference acceleration and memory management |
| Speculative Decoding | Draft-then-verify generation |
| RoPE / YaRN | Long-context extrapolation |
| Chain-of-Thought | Reasoning traces and Self-Consistency |
| Flamingo / LLaVA | Vision-language models |
| Knowledge Distillation / OPD | Compression and distillation |

## Repository Structure

```text
modern-llm-notebook/
├── notebooks/           # Chinese source notebooks
│   ├── part1-foundation/
│   ├── part2-training/
│   ├── part3-inference/
│   ├── part4-frontiers/
│   └── part5-production/
├── notebooks-en/        # English mirror notebooks
│   ├── part1-foundation/
│   ├── part2-training/
│   ├── part3-inference/
│   ├── part4-frontiers/
│   └── part5-production/
├── external/            # Upstream references (e.g. karpathy nanoGPT/minGPT)
├── karpathy_models.py   # Thin import wrapper used by a few notebooks
├── web/                 # React / Vite web viewer
├── docs/                # Static site build output
├── scripts/             # Notebook conversion scripts
├── requirements.txt
├── package.json
├── README.md
└── README-CN.md
```

## Contributing

Contributions are welcome when they improve clarity, correctness, or coverage.

Good contributions include:

- Fixing incorrect explanations, broken cells, or outdated APIs.
- Improving hand-calculation sections and visualizations.
- Adding focused exercises with assertions.
- Translating or improving bilingual documentation.
- Proposing new notebooks for important model architectures or training methods.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Star History

<a href="https://www.star-history.com/#walkinglabs/modern-llm-notebook&Date">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://api.star-history.com/svg?repos=walkinglabs/modern-llm-notebook&type=Date&theme=dark"
    >
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://api.star-history.com/svg?repos=walkinglabs/modern-llm-notebook&type=Date"
    >
    <img
      alt="Star history chart"
      src="https://api.star-history.com/svg?repos=walkinglabs/modern-llm-notebook&type=Date"
    >
  </picture>
</a>

## Citation

If Modern LLM Notebook helps your research or work, please cite:

```bibtex
@misc{modern-llm-notebook,
  title   = {Modern LLM Notebook: Build Modern LLMs from Scratch},
  author  = {WalkingLabs},
  year    = {2025},
  url     = {https://github.com/walkinglabs/modern-llm-notebook},
  note    = {GitHub repository, accessed 2026}
}
```

## License

This project is released under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](LICENSE).

---

<p align="center">
  <sub>
    Built for engineers who want to understand LLM systems from the inside.
    <br>
    Maintained by <a href="https://github.com/walkinglabs">walkinglabs</a>.
  </sub>
</p>
