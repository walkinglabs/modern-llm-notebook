# FirstLLM 64M 复现实验报告（mini 档 seed42）

日期：2026-09-10 · 机器：4× AMD MI300X（单卡训练）· 环境：llm_nb_venv (torch 2.10.0+rocm7.13)

## 数据（口径以 WORK_记录_firstllm数据清洗.md 为准）

| 项 | 值 |
|---|---|
| 数据源 | Ultra-FineWeb-zh（openbmb，MiniCPM 核心预训练数据）|
| 清洗 | Data-Juicer 1.5.5：score≥0.8 粗筛 + clean_html/fix_unicode/whitespace mapper + 长度过滤 100-8000，**无 SimHash 去重**（57% 假阳性）|
| 截断 | 按真实 BPE token（MiniMind 6400 词表）累加至 2.7 亿：**255,023 文档**，截断处 score 0.9368 |
| packing | block 512，`<|endoftext|>` 文档边界，100% 利用率：train 269,369,065 / val 1,140,875 token |

## 预训练（PT）

| 项 | 值 |
|---|---|
| 模型 | Dense GQA：8层/768d/8Q/4KV/qk-norm/SwiGLU/tied embedding，**实测 61.55M** |
| 配置 | 5120 步 × 128 batch × 512 block = 0.33B token，lr 2e-3 cosine，warmup 100，wd 0.1，bf16 |
| 结果 | loss 8.93 → **2.74**，吞吐 ~264 万 token/s，用时 ~17 分钟（MI300X 单卡）|
| PPL | 打包口径 **18.30** ／ 单文档口径 **18.03**（文档均值 21.48）|

## SFT

| 项 | 值 |
|---|---|
| 数据 | BelleGroup train_1M_CN，917,424 条（instruction/input→output 转 role/content）|
| 配置 | 2 epochs（28,668 步），batch 64，block 512，lr 1e-4，assistant-only loss mask |
| 结果 | loss ~2.3 → **~1.65**，生成验证：「中国的首都是哪里？」→「中国的首都是北京。」✓ |

## lm-eval 评测（0-shot，SFT checkpoint）

| 任务 | acc | acc_norm |
|---|---|---|
| ceval-valid | **25.78** | — |
| mmlu | **24.21** | — |
| arc_easy | 25.51 | 26.77 |
| arc_challenge | 19.97 | 21.76 |
| piqa | 53.97 | 53.26 |
| openbookqa | 13.80 | 26.20 |
| hellaswag | 26.95 | 27.73 |
| winogrande | **51.30** | — |
| cmmlu | 未跑（harness 新版不兼容该数据集脚本，需换社区版 yaml）|
| social_iqa | 未跑（同上）|
| gsm8k | 未完成（生成阶段 GPU 异常崩溃，待修）|

对照历史（FirstLLM_最终汇总，2026-08-21，historical）：当时 ceval 25.0-25.7 / mmlu 23.2-37.4*。
本次 ceval 25.78 / mmlu 24.21 与历史同档位吻合，**复现成功**。

## 复现过程中的修复（已提交进仓库）

1. HF 数据集仓库更名：openbmb/Ultra-FineWeb-zh → openbmb/Ultra-FineWeb（zh 子目录）
2. DJ 1.5.5 算子名：clean_html→clean_html_mapper 等 3 个
3. MiniMind 词表无 `<s>/<pad>`：SFT/PPL 边界符兼容（`<|endoftext|>`(0)/`<|im_end|>`(2)）
4. run_ppl.py `id=0` 被 `or` 判假的经典 bug
5. FirstLLMConfig 补 HF 标准字段别名（num_hidden_layers 等），修复 DynamicCache 生成
6. lm-eval 新版移除 siqa/cmmlu 等 script 型任务，需改用社区 yaml（待办）

## 产物位置

- PT ckpt：`llm_train/checkpoints/firstllm_64m_exp24/mini_seed42.pt`
- SFT ckpt：`llm_train/checkpoints/firstllm_64m_exp24_sft/mini_seed42_sft.pt`
- HF 导出：`llm_train/checkpoints/firstllm_64m_exp24_sft/mini_seed42_sft_hf_export/`
- 评测原始结果：`llm_train/checkpoints/firstllm_64m_exp24_sft/mini_seed42_sft_lm_eval/`
- 数据：`/home/devpod/data/ufw_mini/`（bin + manifest）

## 附：Notebook 实战版 64M 短程验证（2026-09-14）

应教程需求，`11-training-loss.ipynb` 实战部分已改为直接使用 64M 模型与真实数据：

- 模型：TeachingLM（8层/768d/8Q/4KV/2304 FFN，tied），61,551,360 参数，配置读自
  `llm_train/configs/firstllm_64m_exp24.yaml`
- PT：ufw_mini train.bin（2.69 亿 token，block 512），batch 16，lr 2e-3，bf16，500 步
  → loss 8.92 → 5.94（GPU 单卡几十秒）
- SFT：belle_sft.jsonl 91.7 万条，assistant-only mask，lr 1e-4，500 步
  → loss 6.93 → 5.37
- 生成验证已存入 notebook 输出；64M 短程生成仍生硬（符合预期），完整实验样例见
  station2 报告

与完整复现的关系：Notebook 验证「模型/数据/loss 链路」三者的真实性和正确性；
5120 步 PT + 28,668 步 SFT + 双 seed + lm-eval 的完整数字以上方正式复现记录为准。
