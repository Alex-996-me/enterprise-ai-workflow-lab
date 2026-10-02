# Stage 3C — UX Integration Audit

## 1. Scope

本阶段在现有深色三栏工具界面中接入六模板、自由模式、简明配置和轻量引导；更新 README、中文快速说明。沿用 Stage 3B 的确定性 `validateWorkflow` 引擎，没有后端、API、LLM、账户或保存功能。工作仅在 `stage/03c-ux-integration` 分支，未发布。

## 2. Template Mode

首页默认加载“客服意图分类”的原始材料、JSON 与专属配置，闸门保持“尚未运行”，由用户点击运行。场景下拉来自 `app/templates.js`，六个模板切换时同步替换三件数据并清除旧结果。输入仍可编辑。模板配置通过“当前检查范围”只读查看。

六模板覆盖：IT、工单、报销、合同三个全通过案例；客服证据 WARNING；保险允许值 FAIL 加证据 WARNING。复核证据字段后，将保险模板中的 `level2` 纳入逐字证据检查，因为虚构原文明确出现“理赔”；`level1`、`level3` 是概括分类，不做逐字匹配。`template_spec.md` 已同步。保险预期闸门保持 `blocked`。

## 3. Free Mode

首次进入预填蓝牙耳机原文、`product/problem/action` JSON 和相应配置；无需从空白开始。换货时四项通过、闸门 `ready`；只改 `action` 为退款时允许值仍通过，`$.action` 出现“缺少原文直接证据”，闸门 `review`。模式切换保留自由草稿；重置清空自由输入和配置。没有保险字段隐含要求。

## 4. Validation Config UX

主界面只显示配置数量摘要；点击“校验配置”打开默认关闭的弹窗。自由模式使用三个大白话字段：逗号分隔的必填字段、逗号分隔的原文证据字段，以及每行一条的 `字段 = 值1 | 值2`。保存调用 `validateConfig` 做去空白、去重与关联校验；错误留在弹窗内解释，不会保存无效配置。模板模式只读显示同样三项。无 JSON Schema、脚本或正则输入。

## 5. Guided Onboarding

首屏轻提示“最快体验：点击运行校验，然后修改一个字段再运行一次”。默认客服案例第一次为证据警告；提示改 `urgency` 为原文中的“不着急”后，二次运行为允许值失败，最终闸门从 `review` 变为 `blocked`。IT 模板提示把 `severity` 改为“低”。自由模式有简短“输入规范”弹窗；检查节点可按需展开大白话解释，默认收起。

## 6. README / Quickstart

README 第一屏按一句话定位、Live Demo、30 秒上手、四项检查组织；明确“它不是第二个 AI”及实习后公开成果转化。`docs/QUICKSTART_CN.md` 约 970 个中文字，回答八个入门问题并给出纯文本流程。App 内 About 简短介绍并链接 `docs/QUICKSTART_CN.html`：本地浏览器直接打开 `.md` 时中文编码显示异常，静态 HTML 阅读页通过 UTF-8 元数据解决，已实际点开验证。

## 7. Desktop QA

在本地 `python -m http.server 8000` 与浏览器 1440×900 视口下检查。首屏同时看得到模式与场景、两段输入、运行按钮、四节点及最终闸门；配置和帮助默认关闭。深色三栏、编辑区与结果区保持原布局，没有横向溢出或遮挡。六模板在 UI 中逐个可选；客服 `review`，IT `ready`，报销 `ready`，保险 `blocked` 等预期结果可见。

## 8. Mobile QA

在 390×844 视口下实际切换模板和自由模式、选客服模板、点击运行，得到 `review`。自由模式配置弹窗可完整查看和填写，保存后蓝牙耳机案例运行得到 `ready`；向下滚动可看到完整最终闸门及四节点。页面无横向溢出。移动端采用纵向滚动，不追求桌面三栏同屏。测试后已恢复浏览器默认视口。

## 9. Functional QA

| QA | Expected | Actual | Result |
| --- | --- | --- | --- |
| 1 默认打开 | 三栏含输入、输出、校验及最快体验提示 | 默认客服数据已载入，尚未运行，提示可见 | PASS |
| 2 IT 模板 | 初次通过；`severity = 低` 后变化 | `ready` 四通过；修改后 `blocked`、规则 FAIL | PASS |
| 3 其他模板 | 客服、报销、保险字段与结果不同 | 键集合分别为 3、3、5；闸门 `review/ready/blocked` | PASS |
| 4 自由换货 | 四通过，`ready` | 一致 | PASS |
| 5 自由退款 | 证据 WARNING，`$.action`，`review` | 一致 | PASS |
| 6 清空允许值 | 规则 `unconfigured` | 一致；摘要显示 0 条规则 | PASS |
| 7 清空证据字段 | 证据 `unconfigured` | 一致 | PASS |
| 8 仅 JSON | `review`，提示只检查格式 | `pass/unconfigured/unconfigured/unconfigured`，提示出现 | PASS |
| 9 非法 JSON | 解析 FAIL，页面可继续操作 | `blocked`，页面无关键错误 | PASS |
| 10 缺字段 | 字段 FAIL，配置过的下游 SKIPPED | `pass/fail/skipped/skipped` | PASS |

另验证配置引用未列入必填字段时，保存被阻止且弹窗显示具体错误；自由草稿切换后保留；自由重置清空输入和配置。Node smoke tests 23/23 通过，`node --check` 均通过；浏览器 error 日志为空。

## 10. Product Boundary Check

主界面节点由“业务规则”改为“允许值检查”，不暗示完整业务逻辑正确。最终闸门仅使用“已拦截”“需要人工复核”“可进入人工复核”；没有“批准”“安全”“事实正确”等字样。README、Quickstart 和 About 均说明这是实习结束后的公开、脱敏实验，不是企业内部或生产系统，也不是 AI 语义事实判断器。

## 11. Privacy Check

模板数据均为虚构案例，无真实客户、内部配置、真实保险规则或公司系统地址。用户输入只进入浏览器内的纯 JS 引擎；新增 UI 没有 `fetch`、`XMLHttpRequest`、`WebSocket` 或上传逻辑。静态文档链接不传送输入内容。

## 12. Known Limitations

只支持顶层 JSON 字段、非空标量必填、单字段字符串允许值和原文逐字包含检查；不支持嵌套路径、跨字段条件、语义推理或生产规则。逐字匹配警告不证明模型值错误。自由配置只保留当前浏览器会话。README 的 Live Demo 仍指向现有公开 v1.0.0；Stage 3C 没有部署，v1.1.0 需后续人工批准后发布。

## 13. Gate Result

**READY FOR PUBLIC V1.1 REVIEW**

建议经人工体验验收后进入 Stage 3D。此阶段未 merge、push、部署或创建版本 tag。
