# Notebook Full Run Report - 2026-06-30

Scope: Chinese `notebooks/` from `07-bert-encoder.ipynb` through `31-llm-deployment.ipynb`, plus current `appendix-advanced` A-E notebooks.
Executor: `sg messagebus -c python -m jupyter nbconvert --execute --inplace`, using PyTorch ROCm where notebooks use GPU (`torch.cuda.is_available() == True`).

Total notebooks: 30
Succeeded: 30
Failed: 0
Font warnings: 0

| # | Notebook | Status | Time | Notes |
|---:|---|---|---:|---|
| 1 | `notebooks/part1-foundation/07-bert-encoder.ipynb` | success | 27.5s | ok |
| 2 | `notebooks/part2-training/08-gpt2-to-modern-models.ipynb` | success | 6.3s | ok |
| 3 | `notebooks/part2-training/09-model-config.ipynb` | success | 5.7s | ok |
| 4 | `notebooks/part2-training/10-moe.ipynb` | success | 7.0s | ok |
| 5 | `notebooks/part2-training/11-training-loss.ipynb` | success | 5.1s | ok |
| 6 | `notebooks/part2-training/12-scaling-laws.ipynb` | success | 2.5s | ok |
| 7 | `notebooks/part2-training/13-distributed-training.ipynb` | success | 2.5s | ok |
| 8 | `notebooks/part2-training/14-data-engineering.ipynb` | success | 2.7s | ok |
| 9 | `notebooks/part2-training/15-lora.ipynb` | success | 200.5s | ok |
| 10 | `notebooks/part2-training/16-function-calling.ipynb` | success | 2.6s | ok |
| 11 | `notebooks/part2-training/17-rlhf-alignment.ipynb` | success | 2.5s | ok |
| 12 | `notebooks/part2-training/18-mla-kv-cache.ipynb` | success | 4.1s | ok |
| 13 | `notebooks/part3-inference/19-generation.ipynb` | success | 302.9s | ok |
| 14 | `notebooks/part3-inference/20-inference-acceleration.ipynb` | success | 73.8s | ok |
| 15 | `notebooks/part3-inference/21-quantization.ipynb` | success | 2.7s | ok |
| 16 | `notebooks/part3-inference/22-speculative-decoding.ipynb` | success | 19.7s | ok |
| 17 | `notebooks/part3-inference/23-inference-systems.ipynb` | success | 3.4s | ok |
| 18 | `notebooks/part4-frontiers/24-long-context.ipynb` | success | 25.3s | ok |
| 19 | `notebooks/part4-frontiers/25-cot-thinking.ipynb` | success | 55.5s | ok |
| 20 | `notebooks/part4-frontiers/26-vlm.ipynb` | success | 4.9s | ok |
| 21 | `notebooks/part4-frontiers/27-efficient-attention.ipynb` | success | 18.8s | ok |
| 22 | `notebooks/part5-production/28-evaluation.ipynb` | success | 4.3s | ok |
| 23 | `notebooks/part5-production/29-distillation.ipynb` | success | 2.9s | ok |
| 24 | `notebooks/part5-production/30-opd.ipynb` | success | 4.0s | ok |
| 25 | `notebooks/part5-production/31-llm-deployment.ipynb` | success | 5.9s | ok |
| 26 | `notebooks/appendix-advanced/A-flops-memory-accounting.ipynb` | success | 8.5s | ok |
| 27 | `notebooks/appendix-advanced/B-mixed-precision-training.ipynb` | success | 26.6s | ok |
| 28 | `notebooks/appendix-advanced/C-training-framework-apis.ipynb` | success | 5.3s | ok |
| 29 | `notebooks/appendix-advanced/D-flash-attention.ipynb` | success | 9.2s | ok |
| 30 | `notebooks/appendix-advanced/E-modern-optimizers.ipynb` | success | 28.9s | ok |

## Fixes Applied During Run

- Filled existing exercise placeholders so notebooks can execute end-to-end instead of stopping at asserts.
- Updated notebook-compatible APIs: Mixtral MoE attribute, Jupyter-safe multiprocessing start method, Transformers `safe_serialization=False` for tied MiniGPT weights.
- Used public `Qwen/Qwen2.5-0.5B` in deployment notebook because `Qwen/Qwen2.5-0.6B` returned 401/not found from HuggingFace.
- Guarded external API/service examples when credentials or local vLLM service are absent; the notebooks now print explicit skip/explanation output instead of crashing.
- Moved the expensive optimizer comparison in appendix E onto ROCm/PyTorch `cuda` device without reducing step counts.
- Converted remaining plot-visible Chinese model labels to English where font warnings appeared.

## External Conditions

- No `DEEPSEEK_API_KEY`/OpenAI-style API token was available, so evaluation API calls were not made; the notebook executed its documented example-output path.
- `vllm` is not installed and no local vLLM server was running on `localhost:8000`; deployment notebook executed download/local/HF-format sections and printed clear service-skip messages for live serving cells.
- `/sanbu-workspace/modern-llm-notebook` is root-owned and not writable by `claude-runner`; execution outputs were written in the writable working copy `/tmp/modern-llm-notebook-run`.

## Problems

None. All scoped notebooks returned success, contain no error outputs, and emitted no Matplotlib font warnings in saved outputs.
