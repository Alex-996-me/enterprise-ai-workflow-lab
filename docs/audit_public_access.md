# Stage 2D — Public Access Verification

## 1. Scope

验证无项目账号或 GitHub 登录状态的外部访问者，能否通过公网打开仓库并使用 Workflow Guardrail；保存桌面、拦截和移动端截图，以及仓库和 Demo 二维码。本阶段未修改 App、UI 或检查逻辑。

## 2. Repository Access

- URL：https://github.com/Alex-996-me/enterprise-ai-workflow-lab
- 匿名方式：不附带 GitHub 凭据的公开 HTTP 请求；仓库页面返回 HTTP 200，公开 REST API 返回 `visibility: public`、`private: false`。
- 默认分支：`main`。
- `README.md` 的公开原始文件返回 HTTP 200；公开文件树包含 `app/`、`docs/`。
- 公开文件树没有 `private_sources/`、原始 PDF／DOCX 或明显敏感文件路径。

## 3. Demo Access

- URL：https://alex-996-me.github.io/enterprise-ai-workflow-lab/
- 不附带登录凭据的 HTTP 请求与独立无账号浏览器会话均可访问。
- 浏览器从根 URL 自动进入 `/enterprise-ai-workflow-lab/app/`。
- 根入口、App、`app/styles.css`、`app/app.js` 均返回 HTTP 200；样式和脚本正常加载，中文显示正常。
- 场景下拉、运行校验和 About 均可用。所查关键资源无 404；浏览器错误日志为空。

## 4. Desktop Verification

- 在 1440×900 公网页面检查三栏布局；原始输入、模型输出和校验结果同时可见，顶部操作区完整，主要操作可在第一屏完成。
- 1440×900 和 1600×900 均无页面横向溢出；运行按钮和最终结论位于视口内。
- “已拦截”状态、失败节点、`$.level3` 字段路径和分类路径说明清晰可见；未发现核心文本遮挡或明显截断。

## 5. Functional Verification

以下均在真正的 Public Pages URL 上重新运行。

| Case | Expected | Public Actual | Status |
| --- | --- | --- | --- |
| 01 正确输出 | 四项通过；可进入人工复核 | JSON 解析、字段契约、业务规则、原文证据均通过；可进入人工复核 | PASS |
| 02 分类路径错误 | 业务规则失败；已拦截 | 业务规则失败，显示非法路径与 `$.level3`；已拦截 | PASS |
| 03 缺少原文依据 | 原文证据警告；需要人工复核 | 原文证据警告，指出“上海”缺少依据；需要人工复核 | PASS |
| 04 缺失字段 | 字段契约失败；已拦截 | 字段契约失败，指出缺少 `$.level3`；已拦截 | PASS |
| 05 JSON 格式错误 | JSON 解析失败；页面保持可用 | JSON 解析失败，后续节点跳过；页面仍可切换案例和运行 | PASS |

## 6. Stale Result Verification

运行正确输出案例后，手动修改原始输入；界面显示“待重新校验”和“结果已过期”。再次运行后显示新的“已出结果”，旧结果没有继续被标为当前有效结果。

## 7. Mobile Verification

在 390×844 视口打开公网 Demo。三栏纵向排列，输入区可见，运行按钮可用；运行分类路径错误案例后，能够滚动查看“已拦截”、失败节点和问题明细。页面没有严重横向溢出。此项为基本可用性验证，不是完整移动端设计验收。

## 8. Screenshot Assets

以下截图均由独立无账号浏览器会话直接访问 Public Pages URL 获取，无浏览器工具栏、开发者工具、账号头像或本地路径。

- `artifacts/public-desktop.png`：1440×900，正确输出运行结果。
- `artifacts/public-validation-blocked.png`：1440×900，分类路径错误的“已拦截”结果与问题明细。
- `artifacts/public-mobile.png`：390×1326，390×844 移动视口的全页截图，展示纵向布局与最终结果。

## 9. QR Assets

二维码均为黑白 PNG，采用高纠错级别、白色 quiet zone，无 Logo，尺寸 637×637。生成后使用独立解码库读取图片并逐字比较：

- `artifacts/github-repo-qr.png` → `https://github.com/Alex-996-me/enterprise-ai-workflow-lab`：PASS。
- `artifacts/live-demo-qr.png` → `https://alex-996-me.github.io/enterprise-ai-workflow-lab/`：PASS。

## 10. Privacy Regression

公开仓库文件树没有 `private_sources/` 或原始实习 PDF／DOCX。截图经视觉检查，没有私有材料、凭据、账号信息或本地路径；五张 PNG 的元数据为空。两个二维码只编码上述公开 URL。Stage 2D 资产和本文档保留在 `stage/02d-public-access` 分支，等待人工 Gate。

## 11. Known Limitations

- 分类树是虚构示例，不是正式业务规则。
- 原文证据只做字面匹配，不具备语义推理或事实证明能力。
- 本工具不是生产规则引擎，也不是公司内部系统。

## 12. Gate Result

**READY FOR FINAL RELEASE REVIEW**

Stage 2D 技术验收项已完成；等待人工审查截图、二维码和审计记录。
