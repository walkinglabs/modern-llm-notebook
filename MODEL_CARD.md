# Small-Model Cards

[中文](MODEL_CARD-CN.md) · [Back to README](README.md)

This card records the small language models in the repository, their architectures, and the available training results. Numbers were checked against current code, saved notebook outputs, and experiment reports on 2026-09-30.

## Models and experiments

| Model / experiment | Architecture and size | Recorded training results | Entry point and status |
|:---|:---|:---|:---|
| Character-level nanoGPT | GPT-2-style Dense; 2 layers, hidden size 64, 2 attention heads; **108,352 total parameters** | Tiny Shakespeare, 500 steps; final recorded train loss **2.2472**, validation loss **2.2906** | [Mini-GPT notebook](notebooks-en/part1-foundation/06-mini-gpt.ipynb); training outputs available in the [source edition](notebooks/part1-foundation/06-mini-gpt.ipynb) |
| FirstLLM 64M-class Dense | 8 layers, hidden size 768, 8Q / 4KV, FFN 2304; **about 61.55M reported parameters** | mini-tier PT loss **8.93 → 2.74**; PT validation PPL **18.30 / 18.03**; SFT loss **about 2.3 → 1.65** | [Training configuration](llm_train/configs/firstllm_64m_exp24.yaml) and [report](llm_train/reports/exp24_repro_mini_seed42_report.md); seed 42 results available |
| Compact Dense short run | 4 layers, hidden size 384, 6Q / 2KV, FFN 1152; **about 9.34M reported parameters** | 150 steps each of PT and SFT; PT 10-step mean **7.4355 → 2.2707** | [Historical report](llm_train/reports/station2_pt_sft_report.md); no standalone configuration currently provided |
| MoE teaching implementation | Top-k routing and expert FFNs; configurable expert and activation counts for demonstrations | No complete small-MoE pretraining results yet | [MoE notebook](notebooks-en/part2-training/13-moe.ipynb); full model recipe and parameter count pending |

A Dense model uses the same network parameters for every token. MoE selects a subset of experts for each token. Hypothetical parameter budgets in the MoE exercises are not trained models released by this repository.

## FirstLLM: a modern 64M-class Dense baseline

This is the small-model training path with a formal configuration, pretraining and SFT scripts, and an evaluation report. “64M” names a size class; the report records **about 61.55M parameters**. `mini` and `full` are data and training-budget tiers of the same architecture.

### Architecture

| Setting | Current implementation / configuration |
|:---|:---|
| Model type | Decoder-only, autoregressive next-token prediction; pretrained from random weights |
| Transformer layers / hidden size | 8 / 768 |
| Attention | GQA: 8 query heads, 4 KV heads; head dimension 96 |
| Position encoding | RoPE, `theta = 10000` |
| Normalization | Pre-Norm RMSNorm; additional Q/K RMSNorm with learnable scaling |
| FFN | SwiGLU, intermediate size 2304; three bias-free projections |
| Vocabulary / weight sharing | 6,400; tied token embedding and output LM head |
| Training sequence length / precision | 512 / BF16 |
| Inference cache | Current FirstLLM uses `use_cache=False` and recomputes the full input sequence during generation |
| Sources | [modeling_firstllm.py](llm_train/modeling_firstllm.py) · [YAML configuration](llm_train/configs/firstllm_64m_exp24.yaml) |

GQA shares keys and values across query heads; SwiGLU is a gated feed-forward network. See the [modern architecture notebook](notebooks-en/part2-training/08-gpt2-to-modern-models.ipynb) for numerical examples of these components, RoPE, and normalization.

### Pretraining data and budget

The mini run uses Chinese text from `openbmb/Ultra-FineWeb`. The report records quality-score filtering at ≥ 0.8, followed by Data-Juicer 1.5.5 HTML cleaning, Unicode repair, whitespace normalization, length filtering at 100–8,000, truncation by actual BPE token counts, splitting, and packing. The pipeline relies on upstream deduplication and skips an additional SimHash pass.

| Item | Reported mini run | Current full configuration |
|:---|:---|:---|
| Documents | 255,023 | No completed-run statistics provided |
| Training / validation tokens | 269,369,065 / 1,140,875 | Must be confirmed from actual data manifests |
| PT steps / batch / block | 5,120 / 128 / 512 | 34,560 / 128 / 512 |
| PT token-processing budget | 335,544,320, approximately 0.336B | Configured budget: 2,264,924,160, approximately 2.265B |
| Learning rate | 2e-3 | 1e-3 |
| Published training metrics | Seed 42 results below | No corresponding completed report yet |

The token-processing budget is `steps × batch × block`, including repeated sampling; it is not the number of unique corpus tokens. The mini run uses cosine learning-rate decay, 100 warmup steps, weight decay 0.1, and gradient clipping at 1.0. The report records single-GPU AMD MI300X training with PyTorch 2.10.0 + ROCm 7.13.

This experiment uses an **existing MiniMind tokenizer with a 6,400-token vocabulary**. The from-scratch BPE lab is a separate experiment. Reproducing these numbers requires the matching tokenizer, special tokens, and encoded data. Some configuration comments contain historical counts that differ from the report; this card uses the report's observed data counts. Save your own manifests when reproducing a run.

### PT and SFT results

| Stage / metric | Reported result | Measurement protocol |
|:---|:---|:---|
| PT loss | 8.93 → 2.74 | Recorded during pretraining |
| PT validation PPL | 18.30 | Packed sequences, with cross-document context |
| PT validation PPL | 18.03 | Documents evaluated independently; the report separately lists mean document PPL of 21.48 |
| SFT loss | About 2.3 → 1.65 | Loss on assistant responses only |
| SFT data | BelleGroup `train_1M_CN`, 917,424 records | instruction / input / output converted to conversations |
| SFT budget | 2 epochs, 28,668 steps | Batch 64, block 512, learning rate 1e-4 |

Perplexity (PPL) measures prediction performance on validation text. Direct comparisons require the same tokenizer, data, and evaluation protocol. These numbers come from the [mini-tier seed 42 report](llm_train/reports/exp24_repro_mini_seed42_report.md); they are not means or standard deviations across multiple seeds.

### Zero-shot evaluation after SFT

Zero-shot evaluation supplies no example answers. The following results are for the report's **SFT checkpoint**, in percent. `acc_norm` is the evaluation harness's answer-length-normalized choice accuracy.

| Task | acc (%) | acc_norm (%) |
|:---|---:|---:|
| CEval-valid | 25.78 | — |
| MMLU | 24.21 | — |
| ARC Easy | 25.51 | 26.77 |
| ARC Challenge | 19.97 | 21.76 |
| PIQA | 53.97 | 53.26 |
| OpenBookQA | 13.80 | 26.20 |
| HellaSwag | 26.95 | 27.73 |
| WinoGrande | 51.30 | — |

CMMLU and Social IQa were not run because of dataset-script compatibility issues. GSM8K did not complete after a GPU failure during generation. These tasks have no reportable scores and must not be recorded as 0%. The measurements help study small-model training; the reports also document incoherent and repetitive generations.

### Reproduction and artifacts

Install dependencies using the [README setup instructions](README.md#run-the-notebooks-locally). Prepare the matching tokenizer and SFT JSONL according to the configuration, then use the [data pipeline](llm_train/preprocess_ufw.py) to generate `train.bin` and `val.bin`. These commands print the current parameter count, run mini-tier pretraining, and continue with SFT:

```bash
python llm_train/modeling_firstllm.py info \
  --config llm_train/configs/firstllm_64m_exp24.yaml

python llm_train/train_pretrain.py \
  --config llm_train/configs/firstllm_64m_exp24.yaml --tier mini --seed 42

python llm_train/train_sft.py \
  --config llm_train/configs/firstllm_64m_exp24.yaml \
  --ckpt llm_train/checkpoints/firstllm_64m_exp24/mini_seed42.pt --seed 42 \
  --out-dir llm_train/checkpoints/firstllm_64m_exp24_sft
```

The `info` command counts parameters in the current implementation, counting shared weights once. Use its output for the exact integer count. The report lists local paths for PT/SFT checkpoints, HF exports, and evaluation artifacts. This repository currently provides code and experiment records, with no public weight-download entry point.

## nanoGPT: an introductory character-level run

The [Mini-GPT notebook](notebooks-en/part1-foundation/06-mini-gpt.ipynb) demonstrates next-character training on Tiny Shakespeare: a 65-character vocabulary, 2 layers, hidden size 64, 2 attention heads, GELU FFNs, Pre-Norm LayerNorm, learned position embeddings, and tied input/output weights. It uses sequence length 64, batch 32, AdamW with learning rate 1e-3 and weight decay 0.1, seed 42, and 500 steps.

The text contains 1,115,394 characters, split 90% / 10%. Saved outputs in the [Chinese source notebook](notebooks/part1-foundation/06-mini-gpt.ipynb) record train loss **4.1917 → 2.2472** and sampled validation loss **4.0207 → 2.2906**. Validation averages 20 random batches.

There are two parameter-count conventions: the notebook's default `get_num_params()` excludes 4,096 position-embedding parameters and prints **104,256**. Including those embeddings gives **108,352 total parameters**. The implementation comes from the pinned [nanoGPT submodule](external/karpathy/nanoGPT), loaded through [karpathy_models.py](notebooks/part1-foundation/karpathy_models.py). Character-level loss is not directly comparable with the Chinese BPE model's loss.

## Historical compact Dense validation

The [Station 2 report](llm_train/reports/station2_pt_sft_report.md) records a roughly 9.34M-parameter Dense model: 4 layers, hidden size 384, 6Q / 2KV, FFN 1152, with RoPE, GQA, QK-Norm, RMSNorm, and SwiGLU. Training used one AMD MI300X VF GPU.

- Data: 5,000 Belle conversations cleaned to 4,991 records; 8,797,887 encoded tokens packed at length 256; 4,353 valid SFT conversations.
- PT: 150 steps, batch 12; first / last 10-step mean loss **7.4355 → 2.2707**.
- SFT: 150 steps, batch 12; first / last 10-step mean loss **2.5253 → 2.1588**. The last individual step's loss exceeded the first; a falling average does not mean every step improved.

The report references historical notebook paths and experiment code, and the course has since been reorganized. There is no standalone YAML recipe for this size. This record demonstrates a past short training run rather than a current default model or a complete capability evaluation.

## Intended use and remaining work

These models support learning architecture, data preparation, training, and evaluation; generation quality remains limited. Complete full-tier results, an independent second-seed record, small-MoE pretraining, and end-to-end tool-call SFT are not yet provided. The notebooks cover MoE, tool calling, LoRA merging, and post-training, but topic coverage does not imply a trained checkpoint for every path.

See [LICENSE](LICENSE) for the repository's terms. External datasets and submodules retain their own licensing terms.
