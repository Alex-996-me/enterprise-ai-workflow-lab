# Stage 3C.1 — Onboarding Simplification Audit

## Scope

本轮只调整默认模板、单行引导和入门文档。默认加载 `template_spec.md` 中已冻结的 IT 服务工单原文、JSON、配置；页面不自动运行。自由模式预填案例、配置入口、validation engine、配置模型与三栏布局未改。工作保留在 `stage/03c1-onboarding`，未合入 `main` 或部署。

## 首次体验 QA

| 项 | 本地浏览器实际结果 | 结论 |
| --- | --- | --- |
| A 默认打开 | 场景为“IT 服务工单”，闸门“尚未运行”；运行按钮下方可见“30 秒体验：先运行一次 → 改一个字段 → 再运行”。 | PASS |
| B 首次运行 | 四项检查均通过，闸门为“可进入人工复核”；同一行提示把 `severity` 从“紧急”改成“低”。 | PASS |
| C 手动修改后运行 | `severity = 低` 时，JSON 与字段通过、允许值检查 FAIL，闸门“已拦截”；原文证据另有 WARNING。 | PASS |
| D 检查名称 | 主界面依次为“JSON 解析／字段完整性／允许值检查／原文证据”，无“业务规则”或“字段契约”。 | PASS |
| E Quickstart | Markdown 共约 616 个中文字；HTML 阅读页实际打开，UTF-8 中文显示正常，内容为六个简短主题。 | PASS |
| F README 首屏 | 顶部依次为项目名、一句话价值、Live Demo、30 秒上手及当前 IT 案例的 blocked 截图。 | PASS |

截图保存在 `artifacts/onboarding-it-blocked.png`，由本地运行中的真实页面截取，并在截图前确认闸门 `blocked`、允许值节点 `fail`。`node --check app/app.js` 与原有 23 项引擎 smoke tests 通过；浏览器无 error 日志。

## Gate Result

**READY FOR FINAL UX REVIEW**

等待人工验收。本轮未 merge、push、部署或进入 Stage 3D。
