# Public File Inventory — Stage 2A

本清单列出当前分支上拟进入公开仓库的全部文件。`SAFE` 表示本轮未发现需要阻止公开的文件内容；`REVIEW` 表示发布前仍需人工决定或改写；`BLOCK` 表示不得公开。状态只针对文件正文，Git 提交元数据风险见 `audit_public_preflight.md`。

| File | Purpose | Public status | Notes |
| --- | --- | --- | --- |
| `.gitignore` | 排除私有材料与临时文件 | SAFE | `private_sources/` 忽略规则有效 |
| `README.md` | 项目定位与本地使用说明 | REVIEW | 写有真实实习单位名称；`public_scope.md` 要求发布前人工确认该措辞 |
| `app/index.html` | 校验台界面与 About 说明 | SAFE | 本人署名；说明实习后成果转化及虚构案例 |
| `app/styles.css` | 页面样式 | SAFE | 无外部资源地址或本地绝对路径 |
| `app/app.js` | 本地检查与六个虚构案例 | SAFE | 无网络请求、内部标识或真实业务参数 |
| `docs/audit_stage1.md` | Stage 1 功能与隐私检查记录 | SAFE | 仅描述演示逻辑和测试结果 |
| `docs/project_spec.md` | Stage 0 方案与材料索引 | REVIEW | 正文列出私有源文件名及章节摘要；部分 Stage 0 预案与最终四项检查不一致，发布前需决定公开化改写方式 |
| `docs/public_scope.md` | 公开边界 | REVIEW | 引用私有材料文件名与章节，并写明公司名称需人工确认 |
| `docs/public_inventory.md` | 本清单 | SAFE | 不包含原始材料或敏感值 |
| `docs/audit_public_preflight.md` | Stage 2A 审计结论 | SAFE | 只记录风险类别，不重复个人邮箱或原始材料内容 |

**汇总：7 SAFE，3 REVIEW，0 BLOCK。** 文件层面的 `REVIEW` 尚未解除；此外，当前可达 Git 提交元数据中的个人邮箱会随完整历史公开。任何内容离开本机前须解决这两类风险，并重新审计最终拟发布历史。
