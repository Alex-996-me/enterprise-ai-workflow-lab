# Stage 3B — Configurable Engine Audit

## 1. Scope

本阶段只实现配置驱动的纯校验引擎、六模板数据层、Node smoke tests，并把现有演示页接入新引擎。未加入六模板／自由模式 UI、配置面板或发布流程。实现依据为本目录的 `generalization_spec.md`、`validation_config_spec.md`、`template_spec.md`。

## 2. Engine Architecture

`app/validator.js` 导出 `validateConfig(input)` 和 `validateWorkflow(sourceText, modelOutputText, validationConfig)`。引擎只读取这三个参数，不引用 DOM、场景下拉框或保险字段。`app/app.js` 保留 DOM、事件和渲染职责，并通过演示专用配置调用引擎。`app/templates.js` 是独立数据层，本阶段未接入页面。

`validateWorkflow` 返回 `{ gate, checks, issues, summary }`；四个 `checks` 均有 `status`、`detail`。`summary` 分别统计 `pass`、`fail`、`warning`、`skipped`、`unconfigured`，计数对象仅为四个检查节点。输入或配置错误通过 `issues` 阻断闸门，不伪装成模型输出的节点错误。

## 3. Config Validation

三个配置键必须存在且类型正确。字段名与允许值必须为非空字符串，校验时去首尾空白、去重。证据字段和枚举字段必须属于必填字段；每条枚举至少有一个允许值。空数组与空枚举对象是合法的“未配置”。无效配置产生标题为“校验配置错误”的 `$config` 路径问题，闸门为 `blocked`。字段名按顶层字面键名读取，不执行路径。

## 4. Node Semantics

| 状态 | 含义 |
| --- | --- |
| `pass` | 节点已执行，按当前配置通过。 |
| `warning` | 原文证据未逐字匹配；只表示缺少直接证据。 |
| `fail` | JSON、必填字段或枚举允许值检查失败。 |
| `skipped` | 节点已配置，但前置输入、JSON 或字段检查阻止执行。 |
| `unconfigured` | 该内容节点没有相应配置，即使前置失败仍保持未配置。 |

JSON 解析通过后要求顶层为对象。字段检查接受非空字符串、数字、布尔值；`0` 与 `false` 有效。枚举仅比较单字段字符串允许值。即使枚举失败，证据检查仍运行。证据用标量文本在原文中做逐字包含判断。

## 5. Gate Semantics

输入、配置、JSON、字段或枚举失败时为 `blocked`；否则有证据警告时为 `review`；否则至少一个内容节点实际通过时为 `ready`。仅 JSON 格式检查通过时为 `review`，提示“仅检查格式，尚未配置内容检查”。`ready` 仅表示这些已配置的自动检查未发现问题，仍需人工判断。

## 6. Template Data

六个对象均有 `id`、`name`、`sourceText`、`modelOutput`、`validationConfig`，内容逐项来自 `template_spec.md`。

| ID | 预期闸门 | 关键结果 |
| --- | --- | --- |
| `customer_intent` | `review` | `urgency` 缺少原文直接证据。 |
| `it_service` | `ready` | 四节点通过。 |
| `ticket_extract` | `ready` | 四节点通过。 |
| `expense_extract` | `ready` | 数字 `128` 合法，四节点通过。 |
| `contract_extract` | `ready` | 数字 `5000` 合法，四节点通过。 |
| `insurance_consultation` | `blocked` | `level3` 枚举失败，同时 `city` 证据警告。 |

## 7. Automated Tests

执行 `node --check app/validator.js`、`node --check app/templates.js`、`node --check app/app.js`，均退出 0。执行 `node tests/validator_smoke_test.js`：23/23 通过。

| Case | Expected | Actual | Result |
| --- | --- | --- | --- |
| 六模板 | 分别符合模板规定的节点与闸门 | 六个均逐项一致 | PASS |
| 蓝牙耳机换货 | 四节点通过，`ready` | 四节点通过，`ready` | PASS |
| 蓝牙耳机退款 | 证据 WARNING，`$.action`，`review` | 一致 | PASS |
| 非法 JSON／顶层非对象 | 解析失败，已配置依赖节点跳过 | 一致且未抛给调用方 | PASS |
| 缺失必填字段 | 字段 FAIL，已配置下游跳过 | 一致 | PASS |
| 枚举非法 | 规则 FAIL，证据仍执行 | 一致 | PASS |
| 空必填／枚举／证据配置 | 对应节点 `unconfigured` | 一致，包括前置失败时 | PASS |
| 仅 JSON | `review`，不能 `ready` | 一致；仅格式提示出现 | PASS |
| 配置错误 | `$config` 问题，`blocked` | 一致；另覆盖缺键、类型、空枚举 | PASS |
| 标量类型 | `0`、`false`、数字有效；`null`、数组、对象、空白无效 | 一致 | PASS |
| 配置规范化／特殊路径／空输入 | 去空白去重、安全括号路径、空输入阻断 | 一致 | PASS |

## 8. Browser Regression

用 `python -m http.server 8000 --directory app` 启动本地页面，在浏览器实际打开 `http://localhost:8000/`。页面及 CSS 正常渲染。六个旧场景的闸门依次为 `ready`、`blocked`、`review`、`blocked`、`blocked`、`blocked`；组合案例四节点为 `pass/pass/fail/warning`。Run、Reset 和 About 均可用；浏览器 error 日志为空。为符合 v1.1 必填字段的非空语义，旧演示的正常城市值从空字符串调整为原文可支持的“沈阳”，各场景原有预期保持一致。

## 9. Privacy Check

六模板沿用 Stage 3A 冻结的虚构、脱敏文本；没有真实客户、公司内部字段或生产规则。新增引擎和模板没有 `fetch`、`XMLHttpRequest`、`WebSocket`、API 地址或 `private_sources` 引用；页面仍在浏览器本地处理输入。本阶段未执行发布。

## 10. Known Limitations

只支持顶层字段，不支持嵌套路径；证据仅逐字匹配，不做语义推理；业务规则仅单字段 enum，不检查跨字段或层级组合。没有真实业务规则，也不构成事实证明或生产决策。

## 11. Stage 3B Gate

**READY FOR UX INTEGRATION REVIEW**

引擎、模板、自动化测试与现有 UI 回归均达到 Stage 3B 要求。建议经人工验收后再进入 Stage 3C 的模板／自由模式 UI 集成。
