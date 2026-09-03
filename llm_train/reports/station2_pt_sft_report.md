# From-0 实战线第 2/3 站完成报告

## 完成内容

已在 `notebooks/part2-training/11-training-loss.ipynb` 尾部追加 25 个 cell，原有 52 个 cell
保持不变。新增部分由 12 个 Markdown cell 和 13 个 code cell 组成，分为以下模块：

1. DataJuicer 清洗 5,000 条 BelleGroup 对话
2. 真实中文语料的 Tokenizer 编码与 `block_size=256` packing
3. 从零实现带 RoPE、GQA、qk_norm、RMSNorm 和 SwiGLU 的 Decoder-only 模型
4. labels shift 与逐 token Cross-Entropy mean 的数值核对
5. 紧凑教学模型预训练 150 step
6. Chat Template、assistant-only loss mask 与 SFT 150 step
7. 即时生成、完整 64M 实验的正常/复读样例，以及第 3 站导航

## DataJuicer 实测

- 输入：`/tmp/belle_sft.jsonl` 固定取前 5,000 条
- 算子：`text_length_filter`（20～1200 字符）与 `document_deduplicator`
- 输出：4,991 条
- 执行器：DataJuicer 1.5.5
- 纯 Python fallback：已写入 Notebook，但本次未触发

DataJuicer 输入、输出和配置写在 `/tmp/modern_llm_station2/`，没有把中间清洗文件写入仓库。

## 模型与数据

完整「64M 教学模型」配置为 8 层、768 hidden dim、8 个 query head、4 个 KV head、
FFN dim 2304，主要参数量估算为 61.54M。

Notebook 实际运行相同架构的紧凑版：4 层、384 hidden dim、6 个 query head、2 个 KV head、
FFN dim 1152，真实参数量为 9.34M。训练使用单张 AMD Instinct MI300X VF。

预训练语料编码得到 8,797,887 个 token，packing 后形成 34,233 个训练块。SFT 清洗数据中
有 4,353 条对话能在长度 256 内形成有效训练样本，每条平均有 90.1 个监督 token。

## 真实训练结果

### 预训练

- step：150
- batch size：12
- 单步 loss：8.8800（step 1）→ 2.3166（step 150）
- 10-step mean：7.4355（前 10 step）→ 2.2707（后 10 step）
- 随机基线：`ln(6400) ≈ 8.76`

曲线显示 loss 从随机初始化附近持续下降。Notebook 同时保留逐 token loss 图和
10-step mean 曲线。

### SFT

- step：150
- batch size：12
- 单步 loss：2.3788（step 1）→ 2.4116（step 150）
- 10-step mean：2.5253（前 10 step）→ 2.1588（后 10 step）

单步数值会受抽样内容影响，最后一个 step 高于第一个 step；10-step mean 能看出整体下降趋势。
SFT 沿用 PT 后的同一个模型对象，没有重新初始化参数。

即时生成仍然存在语义混乱，符合 9.34M 模型只训练少量 step 的预期。Notebook 另引用完整
64M 长训练记录中的一个正常回答和一个「金银财宝」短语循环样例，并明确区分两组实验。

## 校验结果

使用以下环境完整执行了整个 Notebook，而不只是单独运行新增 cell：

```bash
/home/devpod/llm_nb_venv/bin/python -m jupyter nbconvert \
  --to notebook --execute --inplace \
  --ExecutePreprocessor.timeout=1200 \
  --ExecutePreprocessor.kernel_name=python3 \
  notebooks/part2-training/11-training-loss.ipynb
```

执行与静态校验结果：

- 完整执行退出码为 0
- 13 个新增 code cell 均有 execution count
- 新增 cell 没有 error output
- Notebook 通过 `json.load` 与 `nbformat.validate`
- 所有 code cell 通过 Python AST 语法解析
- 新增代码没有超过 100 字符的行
- Matplotlib title、axis label、legend 与 colorbar 可见文字均为英文
- 安装锁定的网页依赖后，`npm run build` 通过

## 导航

结尾已加入：

> 🔬 From-0 实战线 2/3 完成 → 第 3/3 站在 28-evaluation 尾部（lm-eval 正式评测）
