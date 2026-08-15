# Modern LLM Notebook

<p align="center">
  <strong>A from-scratch, notebook-first course for understanding modern LLM systems.</strong>
</p>

<p align="center">
  Build the core components yourself—from Tokenizer and Transformer to training,
  inference, alignment, and production.
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
  <img alt="Notebooks" src="https://img.shields.io/badge/Notebooks-30%2B-orange">
  <img alt="Languages" src="https://img.shields.io/badge/Languages-English%20%7C%20Chinese-2ea44f">
</p>

<p align="center">
  <a href="#course-preview">Preview</a> ·
  <a href="#overview">Overview</a> ·
  <a href="#design-principles">Principles</a> ·
  <a href="#curriculum">Curriculum</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#project-status">Status</a> ·
  <a href="#contributing">Contributing</a>
</p>

> [!NOTE]
> Modern LLM Notebook is under active development. The Chinese course is the source edition;
> the English mirror is being updated alongside it. Corrections, suggestions, and focused pull
> requests are welcome.

## Course Preview

<p align="center">
  <img src="assets/readme/home-en.png" alt="Modern LLM Notebook course map" width="920">
</p>

<p align="center">
  <em>A bilingual course map connects foundations, training, inference, frontier topics,
  and production systems.</em>
</p>

<p align="center">
  <img src="assets/readme/notebook-reader-en.png" alt="Modern LLM Notebook reader" width="920">
</p>

<p align="center">
  <em>Every notebook keeps the learning loop visible: intuition, hand calculation,
  implementation, and experiment.</em>
</p>

## Overview

Modern LLM Notebook is an open, hands-on course for engineers who want to understand large
language models by rebuilding their essential machinery in PyTorch.

Instead of treating an LLM as a black box, the course follows the complete path from raw text to a
working model system. You will implement Tokenizer, Embedding, Self-Attention, Transformer blocks,
training objectives, MoE, LoRA, RLHF, decoding, KV Cache, long-context techniques, VLM components,
evaluation, and distillation through small, runnable notebooks.

The goal is not to reproduce a production framework line by line. The goal is to build a durable
mental model: what each component does, why it exists, how the numbers flow through it, and what
changes when you run an experiment.

Each notebook follows the same learning path:

```text
intuition -> hand calculation -> implementation -> experiment
```

This makes the repository useful both as a structured course and as an educational reference you
can return to when reading papers or production code.

## Design Principles

The course is organized around six teaching principles:

1. **Motivation before mechanics.** Every topic starts with the problem it solves.
2. **Intuition before notation.** Concrete examples prepare the ground for formulas.
3. **Hand calculation before abstraction.** Core algorithms are verified with small numbers before
   they become code.
4. **Readable implementations over black boxes.** Important components stay explicit and
   inspectable.
5. **Experiments explain behavior.** Printed observations, plots, and controlled comparisons turn
   outputs into conclusions.
6. **One concept at a time.** Notebooks progress in small steps and remain independently runnable.

## Who This Course Is For

Modern LLM Notebook is designed for:

- Software engineers who know Python and want to move into LLM engineering.
- Machine learning practitioners who use model libraries but want to understand what happens
  underneath them.
- Students and researchers preparing to read modern LLM papers and source code.
- Self-learners who prefer concrete examples and runnable experiments before dense derivations.

Recommended background:

- Comfortable with basic Python.
- Familiar with arrays, functions, classes, and simple matrix operations.
- Basic calculus, probability, and PyTorch are helpful, but not required on day one.

No prior knowledge of Tokenizer, Embedding, Self-Attention, or Transformer internals is assumed.

## Learning Outcomes

After completing the course, you should be able to:

- Trace the full data flow from raw text to tokens, hidden states, logits, and generated text.
- Implement and explain a compact GPT-style language model from first principles.
- Connect Cross-Entropy, gradients, batching, data quality, and scaling laws to training behavior.
- Explain how modern architectures use RoPE, RMSNorm, SwiGLU, GQA, MLA, and MoE.
- Compare adaptation and alignment methods such as LoRA, reward modeling, PPO, and DPO.
- Reason about generation quality, latency, memory, KV Cache, and speculative decoding.
- Build small experiments for long context, reasoning, VLMs, evaluation, and distillation.
- Read production libraries and research papers with a clearer model of the systems underneath.

## What You Will Build

| Stage | You build | Why it matters |
|:---|:---|:---|
| Text to tokens | Character, word, and BPE tokenizers | See exactly how raw text becomes model input |
| Tokens to vectors | Token Embedding and position encodings | Understand the representation the model computes over |
| Transformer core | Self-Attention, Multi-Head Attention, Transformer blocks, Mini-GPT | Reconstruct the core forward pass |
| Training system | Cross-Entropy, batching, gradient flow, scaling-law experiments | Connect loss curves to model behavior |
| Modern architectures | RMSNorm, SwiGLU, RoPE, GQA, MLA, MoE | Understand how current models extend the original Transformer |
| Adaptation and alignment | LoRA, reward modeling, PPO, DPO | See how base models become specialized and aligned |
| Inference system | Sampling, beam search, KV Cache, speculative decoding | Understand why serving is also a systems problem |
| Frontier experiments | Long context, reasoning, VLM components, efficient attention | Turn recent ideas into small runnable examples |
| Production loop | Evaluation, distillation, deployment concepts | Measure, compress, and serve model behavior |

```text
raw text -> tokens -> embeddings -> attention -> Transformer -> Mini-GPT
         -> training -> alignment -> inference -> evaluation -> deployment
```

## Curriculum

The curriculum is organized into four progressive parts. Each notebook is self-contained, so you
can follow the full sequence or jump directly to a topic.

| Part | Focus | Main topics |
|:---|:---|:---|
| I. Foundations | Build the model core | Tokenizer, BPE, Embedding, position encoding, Self-Attention, Transformer, GPT from scratch, BERT |
| II. Training | Learn how models improve | Modern architecture evolution, configuration, pretraining and fine-tuning, KV cache evolution, distributed training, MoE, scaling laws, data engineering, LoRA, distillation, function calling, RLHF |
| III. Inference | Generate, evaluate, and deploy | Decoding strategies, inference acceleration, quantization, speculative decoding, inference systems, evaluation, deployment |
| IV. Frontiers | Explore newer capabilities | Long context, CoT and reasoning, VLMs, efficient attention, on-policy distillation |

### Recommended Learning Path

1. Start with Tokenizer and BPE to see how text becomes model input.
2. Build Embedding, position encoding, and Self-Attention before assembling Mini-GPT.
3. Study training loss and data engineering before moving to scaling and distributed training.
4. Learn LoRA and alignment only after the base training loop is clear.
5. Continue with generation, KV Cache, and speculative decoding to connect modeling with systems.
6. Treat frontier and production notebooks as extensions once the core path feels comfortable.

## Quick Start

### Read Online

The easiest way to explore the course is through the published reader:

**[walkinglabs.github.io/modern-llm-notebook](https://walkinglabs.github.io/modern-llm-notebook/)**

You can also open the first English notebook directly in
[Google Colab](https://colab.research.google.com/github/walkinglabs/modern-llm-notebook/blob/main/notebooks-en/part1-foundation/01-tokenizer-basics.ipynb).

### Run the Notebooks Locally

Requirements:

- Python 3.9+
- PyTorch 2.0+
- Jupyter Notebook
- 16 GB RAM recommended

```bash
git clone https://github.com/walkinglabs/modern-llm-notebook.git
cd modern-llm-notebook

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m ipykernel install --user \
  --name modern-llm-notebook \
  --display-name "Python (modern-llm-notebook)"

jupyter notebook notebooks-en/part1-foundation/01-tokenizer-basics.ipynb
```

If `jupyter: command not found` appears, reactivate the virtual environment:

```bash
source .venv/bin/activate
```

Most notebooks run on CPU. Experiments involving larger training workloads are easier with a GPU.

Language layout:

- Chinese source notebooks: `notebooks/`
- English notebook mirror: `notebooks-en/`

### Run the Web Reader Locally

The React/Vite reader renders the original `.ipynb` files directly, so the website and notebooks
stay in sync.

```bash
npm install
npm run dev
```

Build and preview the static site:

```bash
npm run build
npm run preview
```

## Project Status

This repository is active courseware. Content is expanded and refined with an emphasis on clear
explanations, runnable examples, and a stable learning path.

| Area | Current status |
|:---|:---|
| Chinese course | Source edition with 30+ notebooks across the complete learning path |
| English course | Bilingual mirror available; translation and numbering continue to be synchronized |
| Web reader | React/Vite course reader with language switching and direct Notebook rendering |
| Static site | Published through GitHub Pages |
| Quality checks | Notebook coverage, syntax, output-language checks, and web build |

### Roadmap

- Deepen the data, training, systems, and evaluation material.
- Continue polishing the progression from intuition to implementation.
- Add a reproducible, end-to-end small-model pretraining workflow.
- Expand evaluation coverage with benchmark design, judge prompts, aggregation, and failure
  analysis.

## Educational Scope

Modern LLM Notebook is intentionally an educational reference implementation.

It is not:

- A production LLM training or serving framework.
- A model zoo or a collection of pretrained weights.
- A wrapper around hosted model APIs.
- A substitute for optimized libraries used in large-scale production.
- A shortcut that hides core implementations behind `transformers` imports.

Dependencies such as `transformers` and `datasets` may appear for comparison or supporting tasks,
but the teaching path keeps the important algorithms explicit.

## Quality Bar

Course material follows a consistent standard:

- Concepts begin with motivation and a plain-language definition.
- Core algorithms include a concrete example or hand calculation.
- Code cells stay small, readable, and observable.
- Comments explain why an operation exists and what its values or shapes mean.
- Randomized experiments use fixed seeds when appropriate.
- Visualizations use English labels for reliable rendering across environments.
- Every notebook is self-contained and does not depend on hidden state from earlier notebooks.
- Each notebook ends with a checklist that helps learners verify their understanding.

## Papers and Systems

The course connects readable implementations to influential papers and production systems:

| Paper or system | Concepts covered |
|:---|:---|
| Attention Is All You Need | Multi-Head Attention, position encoding |
| BERT | Encoder-only models, masked language modeling |
| LLaMA | RMSNorm, SwiGLU, RoPE, Pre-Norm |
| DeepSeek-V2 / DeepSeek-V3 | MLA, Multi-Token Prediction, MoE load balancing |
| Mixtral / Qwen | MoE, shared experts, efficient attention patterns |
| Scaling Laws / Chinchilla | Parameter, data, and compute trade-offs |
| LoRA | Parameter-efficient adaptation |
| RLHF / PPO / DPO | Preference alignment |
| Code Llama / DeepSeek-Coder | Fill-in-the-Middle |
| FlashAttention / vLLM | Inference acceleration and memory management |
| Speculative Decoding | Draft-and-verify generation |
| RoPE / YaRN | Long-context extrapolation |
| Chain-of-Thought | Reasoning traces and Self-Consistency |
| Flamingo / LLaVA | Vision-language modeling |
| Knowledge Distillation / OPD | Model compression and behavior transfer |

## Repository Structure

```text
modern-llm-notebook/
├── notebooks/           # Chinese source notebooks
│   ├── part1-foundation/
│   ├── part2-training/
│   ├── part3-inference/
│   ├── part4-frontiers/
├── notebooks-en/        # English notebook mirror
├── assets/              # README and course assets
├── web/                 # React/Vite course reader
├── scripts/             # Notebook maintenance and verification scripts
├── requirements.txt
├── package.json
├── README.md
└── README-CN.md
```

## Contributing

Contributions are welcome when they make the course clearer, more accurate, easier to reproduce,
or easier to navigate.

Good contributions include:

- Correcting conceptual errors, formulas, broken cells, links, or typos.
- Improving explanations without hiding the underlying algorithm.
- Adding focused, reproducible experiments or exercises.
- Improving bilingual coverage and terminology consistency.
- Proposing a well-scoped notebook for an important architecture, training method, or system.

Please keep pull requests focused and read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting one.

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

If Modern LLM Notebook helps your research, teaching, or work, please cite:

```bibtex
@misc{modern_llm_notebook,
  title        = {Modern LLM Notebook: Building Modern LLM Systems from Scratch},
  author       = {WalkingLabs},
  year         = {2025},
  howpublished = {\url{https://github.com/walkinglabs/modern-llm-notebook}},
  note         = {Open courseware repository}
}
```

## License

This course is released under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](LICENSE).

---

<p align="center">
  <sub>
    Built for engineers who want to understand LLM systems from the inside.
    <br>
    Maintained by <a href="https://github.com/walkinglabs">WalkingLabs</a>.
  </sub>
</p>
