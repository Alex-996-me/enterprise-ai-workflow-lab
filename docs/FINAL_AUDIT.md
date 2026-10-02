# Enterprise AI Workflow Lab
# Final Release Audit

## 1. Project Identity

- **Project:** Enterprise AI Workflow Lab
- **Tool:** Workflow Guardrail / AI 结构化输出校验台
- **Version:** v1.0.0 candidate
- **Nature:** 实习结束后的公开、脱敏教学 Demo；以可交互方式说明结构化外观不等于内容可靠。

## 2. Internship Relationship

本项目不是实习期间的公司系统开发成果。本人在 2026 年企业 AI workflow 实习中学习、观察、参与、梳理、拆解、分析和总结；实习结束后，基于调研中识别出的通用风险问题，进一步完成了这个公开、脱敏工具。没有声称本人主导或部署公司系统，也没有声称本工具改善了真实业务指标。

## 3. Public Deliverables

- **Repository:** https://github.com/Alex-996-me/enterprise-ai-workflow-lab
- **Live Demo:** https://alex-996-me.github.io/enterprise-ai-workflow-lab/
- **Desktop screenshot:** [`artifacts/public-desktop.png`](../artifacts/public-desktop.png)
- **Blocked screenshot:** [`artifacts/public-validation-blocked.png`](../artifacts/public-validation-blocked.png)
- **Mobile screenshot:** [`artifacts/public-mobile.png`](../artifacts/public-mobile.png)
- **GitHub QR:** [`artifacts/github-repo-qr.png`](../artifacts/github-repo-qr.png)
- **Demo QR:** [`artifacts/live-demo-qr.png`](../artifacts/live-demo-qr.png)

## 4. Architecture

HTML、CSS、Vanilla JavaScript；GitHub Pages 以 `main` 的仓库根目录发布，根入口以相对路径进入 `app/`。所有输入和检查均在浏览器本地处理；没有后端、API 调用、数据库、登录或真实 LLM 调用。

## 5. Validation Logic

1. **Input：** 原始材料和模拟输出必须均非空，否则阻断。
2. **JSON Parse：** 使用 `JSON.parse`；结果必须是非数组对象。解析或顶层类型失败时，依赖节点跳过。
3. **Schema Contract：** `province`、`city`、`level1`、`level2`、`level3` 必须存在且为字符串；除 `city` 外不可为空。字段检查失败时后续节点跳过。
4. **Business Rules：** 检查分类三级路径是否属于代码中的完全虚构分类树；非法路径标记失败。
5. **Evidence Match：** 仅检查非空的 `province` 和 `city` 值是否被原始文本字面包含；未找到时发出警告，不证明事实不存在。
6. **Final Gate：** 规则失败优先显示“已拦截”；只有证据警告时显示“需要人工复核”；全部演示检查通过时显示“可进入人工复核”，仍需人判断。

## 6. Functional Verification

Stage 2E 在 Public Pages URL 重新运行五项案例，均与预期一致。

| Case | Expected | Actual | Status |
| --- | --- | --- | --- |
| 01 正确输出 | 四项通过；可进入人工复核 | 四项均通过；可进入人工复核 | PASS |
| 02 分类路径错误 | 业务规则失败；已拦截 | 业务规则失败，列出 `$.level3` 非法路径；已拦截 | PASS |
| 03 缺少原文依据 | 原文证据警告；需要人工复核 | `$.city` 警告，指出“上海”未见于原文；需要人工复核 | PASS |
| 04 缺失字段 | 字段契约失败；已拦截 | `$.level3` 缺失，后续节点跳过；已拦截 | PASS |
| 05 JSON 格式错误 | JSON 解析失败；页面保持可用 | JSON 解析失败，后续节点跳过；页面仍可操作 | PASS |

案例切换可用；修改输入后显示“待重新校验／结果已过期”；Reset 清空输入和结果；About 显示公开成果转化与本地处理说明。

## 7. Public Access Verification

- 仓库与 Demo 均通过不附带登录凭据的公网访问检查；Repository 为 Public，默认分支 `main`。[Stage 2D 记录](audit_public_access.md)
- 根 URL 自动进入 `/app/`；根入口、App、CSS、JavaScript 返回 HTTP 200；浏览器错误日志为空。
- 1440×900 和 1600×900 桌面视口三栏完整、无横向溢出；390×844 移动视口可输入、运行并查看结论。[Stage 2D 截图与记录](audit_public_access.md)

## 8. Privacy Verification

`private_sources/` 被 `.gitignore` 排除，不在跟踪文件或可达 Git 对象路径中；原始 PDF／DOCX、真实客户数据、内部 workflow 截图、内部 IP／API／URL、原始 Prompt 和公司系统配置均未进入公开仓库。Demo 案例与分类规则完全虚构；截图和二维码经隐私检查，二维码仅编码两个公开 URL。

## 9. Git Verification

- **Repository:** `Alex-996-me/enterprise-ai-workflow-lab`
- **Visibility / default branch:** Public / `main`
- **Remote:** `https://github.com/Alex-996-me/enterprise-ai-workflow-lab.git`
- **Stage 2D approved main:** `a2e47d6`（`merge: approve public access verification`）。
- **Final main release commit:** 以最终 `v1.0.0` tag 解引用所得 SHA 为准；候选审计文件自身不能预先写入包含自身的最终提交 SHA。
- **History audit:** `git ls-files`、`git log --all --stat` 和 `git rev-list --objects --all` 已核对；未发现 `private_sources/` 或原始 PDF／DOCX 的路径。`.gitignore` 与文件树检查共同维持私有原件隔离。

## 10. Known Limitations

- 分类树完全虚构，不代表真实保险业务规则。
- Evidence Match 只做字面包含检查，没有语义推理或事实验证能力。
- 不是生产规则引擎，也不是公司内部系统；不适合自动保险业务决策。

## 11. Audit Trail

| Stage | Records |
| --- | --- |
| 0 | [`project_spec.md`](project_spec.md)、[`public_scope.md`](public_scope.md) |
| 1 | [`audit_stage1.md`](audit_stage1.md) |
| 2A | [`audit_public_preflight.md`](audit_public_preflight.md) |
| 2B | [`audit_stage2b_repo.md`](audit_stage2b_repo.md) |
| 2C | [`audit_stage2c_pages.md`](audit_stage2c_pages.md) |
| 2D | [`audit_public_access.md`](audit_public_access.md) |

## 12. Final Status

**PUBLIC RELEASE READY**

发布前安全扫描、README 链接检查与公网功能回归均已通过。合并后仍须确认 GitHub Pages 更新到最终 `main`，再创建 `v1.0.0` tag。
