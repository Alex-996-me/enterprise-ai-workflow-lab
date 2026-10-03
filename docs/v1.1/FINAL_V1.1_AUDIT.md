# Workflow Guardrail v1.1.0 Release Audit

## 1. Why v1.1

v1.0.0 是固定字段与虚构保险分类案例的 proof of concept。v1.1.0 将公开案例数据、可配置的校验规则和纯校验引擎分开，使同一套检查可用于不同的虚构业务文本。这是实习结束后的公开、脱敏成果转化，不是实习期间开发或交付的公司系统。

## 2. New User Experience

默认进入“模板模式”的“IT 服务工单”，输入已预填但不会自动运行。主界面提示“30 秒体验：先运行一次 → 改一个字段 → 再运行”。首次运行通过后，用户可自行把 `severity` 从“紧急”改成“低”并再次运行。自由模式预填蓝牙耳机案例；中文 Quickstart 提供简短说明。

## 3. Validation Model

- `requiredFields`：配置必须出现、且值为有效标量的顶层字段。
- `evidenceFields`：配置需要在原始材料中逐字找到值的字段；缺少直接证据是 WARNING。
- `enumRules`：配置单字段的允许字符串值；值不在范围内是 FAIL。

主界面依次显示“JSON 解析、字段完整性、允许值检查、原文证据”。未配置的检查标为“未配置”；有配置但因前置失败无法执行的检查标为“跳过”。只有格式检查通过时，最终仍为“需要人工复核”。

## 4. Six Templates

客服意图分类、IT 服务工单、工单信息抽取、报销单据抽取、合同信息抽取、保险咨询分类。六组原文、模拟 JSON 与配置均为虚构教学数据；切换模板时三者同步更新。

## 5. Free Mode

蓝牙耳机案例的 `action = 换货` 四项通过，最终为“可进入人工复核”。用户改为 `action = 退款` 后，允许值检查仍通过，但因原文没有“退款”，原文证据对 `$.action` 给出 WARNING，最终为“需要人工复核”。

## 6. Automated Tests

发布候选 `stage/03c1-onboarding`：`node --check` 对 `app/validator.js`、`app/templates.js`、`app/app.js` 均通过；`node tests/validator_smoke_test.js` 的 23 项测试全部通过。

## 7. Browser QA

本地通过 `python -m http.server 8000` 打开实际页面，完成以下回归：

| Case | 实际结果 |
| --- | --- |
| A 默认打开 | 模板模式、IT 服务工单、尚未运行；30 秒提示可见。 |
| B 默认运行 | 四项 PASS；最终“可进入人工复核”。 |
| C `severity = 低` | 允许值 FAIL、原文证据 WARNING、`$.severity` 明确可见；最终“已拦截”。 |
| D 六模板 | 原文、JSON 字段和配置摘要随六个模板同步切换；运行结果符合各模板数据，没有沿用前一模板配置。 |
| E 自由模式 | 耳机“换货”四项 PASS；改为“退款”后允许值 PASS、原文证据 WARNING，`$.action` 可见。 |
| F 空配置 | 三项内容检查均为“未配置”，JSON 解析 PASS；最终“需要人工复核”，并显示“仅完成格式检查，尚未配置内容检查”。 |
| G 缺失必填字段 | `$.severity` 的字段完整性 FAIL；后续已配置检查为“跳过”。 |

主 UI 仅使用四项新名称，未出现“业务规则”或“字段契约”。README 顶部包含价值句、Live Demo、30 秒上手和 IT 案例截图；Quickstart Markdown 与 HTML 均以普通用户能理解的语言解释用途与限制。

公网 Pages 更新到 v1.1 后，重新从公开入口验证：默认 IT 模板保持未运行；“紧急”四项 PASS；改为“低”后允许值 FAIL、原文证据 WARNING、`$.severity` 与“已拦截”均显示正确。切换客服意图、报销单据、合同信息三个额外模板后，原文、JSON 与配置摘要同步更新。自由模式“换货”四项 PASS，“退款”产生 `$.action` 原文证据 WARNING；“校验配置”“输入规范”“关于本项目”均能打开；About 内的 Quickstart 链接可到达公网 HTML 说明页。

## 8. Privacy Audit

`git ls-files` 和当前所有分支／tag 的提交路径均未发现 `private_sources/`、原始 PDF／DOCX 或密钥文件。相对 v1.0.0 的新增二进制文件是虚构 IT 案例的本地验收截图及两张公网发布截图，均已目视检查，不含内部系统画面。新增应用、README、v1.1 文档与测试中，未发现手机号、身份证号、API key、token、内部 URL／IP、本地绝对路径、真实客户资料、公司配置或内部截图；出现的 URL 仅为公开 Demo 与本地测试地址。发布内容不包含原始实习材料。无需登录或凭据的 HTTP 请求对 Public Repo、Live Demo、Quickstart HTML 均返回 200。

## 9. Known Limitations

只检查顶层 JSON 对象及配置的字段。证据检查仅做逐字匹配，允许值检查仅做单字段 enum；不做语义推理、事实核查或复杂跨字段逻辑。检查全部通过，也不能证明业务事实正确。本工具不是生产规则引擎，也不是任何公司的内部系统。

## 10. Version History

- `v1.0.0`：Fixed-schema proof of concept；原 tag 保持不变。
- `v1.1.0`：Configurable public validation demo。

## 11. Gate

公网已核验的 v1.1 合并提交为 `4415be77faafcd429923e5f528619c7224e05733`。Git 提交不能在自身内容中写入自身 SHA；包含本审计更新的最终 main SHA 由 `v1.1.0^{commit}` 指向，并在发布汇报中列出。

1440×900 桌面视口下，三栏宽度为 446／547／446 px，运行按钮与最终闸门均在首屏，页面宽度无溢出。390×844 移动视口下，三栏按原设计纵向堆叠，每栏宽 390 px，页面无横向溢出，运行按钮可见。两张从公网 Pages 截取并目视核查的截图为 `artifacts/v1.1-public-default.png` 和 `artifacts/v1.1-public-blocked.png`；后者展示 `severity = 低`、允许值失败及“已拦截”。README 已引用新版 blocked 截图。

**PUBLIC V1.1 READY**
