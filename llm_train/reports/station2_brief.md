# From-0 实战线 第 2/3 站任务书：预训练实战（放进 11-training-loss.ipynb）

## 背景
modern-llm-notebook 是一套从零实现 LLM 核心组件的中文教学 notebook 仓库。
已完成第 1 站：02-bpe-tokenizer.ipynb 尾部加了「综合实战：训练一个真正的中文 tokenizer」，
读者用 tokenizers 库在 BelleGroup 中文对话（data/cn_corpus_sample.txt）上训练了 6400 vocab BPE。

## 你的任务
设计并实现第 2/3 站：**预训练 + SFT 实战**，追加到 `notebooks/part2-training/11-training-loss.ipynb`（训练循环与损失函数）尾部。

用户要求（必须遵守）：
1. **预训练和 SFT 分开**：拆成两个明确的实战小节（同一 notebook 尾部，PT 在前 SFT 在后，或两个大 section）
2. **数据处理默认先用 DataJuicer**：先一句话简单介绍（是什么、为什么用），直接给出最小可运行用法；「后面再详细介绍」= 14-data-engineering 已有数据工程理论，这里只调用不展开
3. **不提 MiniMind**：模型就叫「64M 教学模型」，架构 8层/768 dim/GQA/qk_norm，从头写或从已有教学代码出发
4. **风格**：与第 1 站一致——真实数据、真实运行结果、cell 有真实输出、结尾「下一站」导航；代码 ≤100 字符/行；中文 docstring；教学代码不封装
5. 本机有真实实验资产可引用（见下）

## 可用真实资产（/home/devpod/github/modern-llm-notebook/llm_train/）
- 语料：data/cn_corpus_sample.txt（9MB，第 1 站同款 BelleGroup 中文对话纯文本）
- 对话 JSONL：/tmp/belle_sft.jsonl（116 万条 conversations）
- 训练脚本（可参考逻辑但 notebook 内要自包含）：train_pretrain.py, train_sft.py, preprocess_gpu.py
- 真实训练曲线：checkpoints/custom_tok_2.4b/metrics.jsonl 等（PT loss 6.3→0.29 量级）
- SFT 真实输出样例：含正常回复和复读循环失败样本（诊断记录在 reports/ 下）
- 已确认的 bin 产物：data/belle_custom_sft_bin（block 512, 97M supervised tokens）

## 设计要求
A. **DataJuicer 最小用法**：
   - 一句话介绍：「阿里开源的数据处理瑞士军刀，20+ 算子，这里只用 2-3 个演示」
   - 最小 demo：对 belle_sft.jsonl 抽样 5 千条 → 1-2 个算子（如 固定长度过滤 + 去重）→ 输出统计
   - 装不上/不想装时的 fallback：给一个 10 行的纯 python 等价实现
   - 明确注明「数据工程理论见 14-data-engineering，这里只上手用」

B. **预训练实战**：
   - 数据：cn_corpus_sample.txt → 用第 1 章自训 tokenizer 切分 → packing 到 block=256（教学规模）
   - 模型：极小版（如 4 层/256 dim/4 head，~10M 参数，CPU 可跑或单卡几分钟）
   - 真跑 100-200 step，展示 loss 下降曲线
   - 手算/代码验证：这一章主线是 CE loss，实战要把 loss 计算链路和主线呼应（labels shift、mean over tokens）

C. **SFT 实战**：
   - 数据：DataJuicer 洗过的对话 → chat template 拼接 → loss mask（只学 assistant 部分）
   - 同一模型继续训 100-200 step
   - 展示真实生成样例：1 个正常 + 1 个复读失败（引用真实实验现象，说明 64M/10M 级模型生成不稳是正常现象，评测详见第 3 站）
   - 呼应本章 2 节「Chat Template 为什么会影响 loss」

D. **收尾**：
   - 小结 checklist
   - 「🔬 From-0 实战线 2/3 完成 → 第 3/3 站在 28-evaluation 尾部（lm-eval 正经评测）」导航

## 执行方式
1. 先读 11-training-loss.ipynb 现有内容（尤其第 6 节迷你 Trainer 的 ToyTextDataset 风格），保证风格连贯
2. 直接修改 notebook：追加 cells（不要动现有内容）
3. **必须真实执行**新增代码 cell 验证能跑通（用 /home/devpod/llm_nb_venv/bin/python，有 GPU 但教学模型 CPU 也行）；执行结果保留在 notebook 里
4. 产出说明：改了哪些 cell、实测结果摘要、DataJuicer fallback 是否触发
5. 写入报告到 reports/station2_pt_sft_report.md
