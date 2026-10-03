# v1.1.0 — Template Spec

> 六个模板均为新编、虚构、脱敏案例，不对应任何公司数据或规则。每个模板都由 `sourceText`、`modelOutput`、`validationConfig` 构成；“Output Schema”仅描述样例的顶层字段和值类型，不是正式 JSON Schema，配置也不强制字段必须保持该具体类型。

模板模式切换时，三件数据必须一起加载。六个模板具有不同的字段集合，不能共用保险字段契约。配置语义遵循 [`validation_config_spec.md`](validation_config_spec.md)。

## 1. 客服意图分类 `customer_intent`

**Source / `sourceText`：**“用户咨询订单配送进度，希望查询到货时间，称不着急。”

**Output Schema：** `category`、`intent`、`urgency` 均为字符串。

**`modelOutput`：**

```json
{"category":"配送","intent":"查询到货时间","urgency":"紧急"}
```

**`validationConfig`：**

```json
{"requiredFields":["category","intent","urgency"],"evidenceFields":["category","intent","urgency"],"enumRules":{"category":["配送","售后"],"urgency":["一般","紧急"]}}
```

**Expected Result：** JSON、字段、允许值均通过；`urgency = 紧急` 未在原文逐字出现，原文证据 WARNING，最终“需要人工复核”。“不着急”不被工具做语义解释。

## 2. IT 服务工单 `it_service`

**Source / `sourceText`：**“员工反馈办公门户无法登录，影响工作，要求紧急处理。”

**Output Schema：** `system`、`issue`、`severity` 均为字符串。

**`modelOutput`：**

```json
{"system":"办公门户","issue":"无法登录","severity":"紧急"}
```

**`validationConfig`：**

```json
{"requiredFields":["system","issue","severity"],"evidenceFields":["system","issue","severity"],"enumRules":{"severity":["一般","紧急"]}}
```

**Expected Result：** 四项均通过，最终“可进入人工复核”；并不证明真实 IT 工单可直接执行。

## 3. 工单信息抽取 `ticket_extract`

**Source / `sourceText`：**“记录：视频会议设备的麦克风无声，请安排远程排查；工单状态待处理。”

**Output Schema：** `device`、`symptom`、`next_step`、`status` 均为字符串。

**`modelOutput`：**

```json
{"device":"视频会议设备","symptom":"麦克风无声","next_step":"远程排查","status":"待处理"}
```

**`validationConfig`：**

```json
{"requiredFields":["device","symptom","next_step","status"],"evidenceFields":["device","symptom","next_step","status"],"enumRules":{"status":["待处理","处理中","已完成"]}}
```

**Expected Result：** 四项均通过，最终“可进入人工复核”。

## 4. 报销单据抽取 `expense_extract`

**Source / `sourceText`：**“虚构报销记录：大连购买办公用品，金额128元，费用类型办公用品。”

**Output Schema：** `city`、`expense_type` 为字符串，`amount` 为数字。

**`modelOutput`：**

```json
{"city":"大连","amount":128,"expense_type":"办公用品"}
```

**`validationConfig`：**

```json
{"requiredFields":["city","amount","expense_type"],"evidenceFields":["city","amount","expense_type"],"enumRules":{"expense_type":["办公用品","差旅交通","餐饮"]}}
```

**Expected Result：** 数字 `128` 在原文中逐字出现；四项均通过，最终“可进入人工复核”。工具不核对发票或金额真实性。

## 5. 合同信息抽取 `contract_extract`

**Source / `sourceText`：**“虚构合同摘要：甲方为示例甲方，合同类型服务采购，签署日期2026-06-01，金额5000元。”

**Output Schema：** `counterparty`、`contract_type`、`signed_on` 为字符串，`amount` 为数字。

**`modelOutput`：**

```json
{"counterparty":"示例甲方","contract_type":"服务采购","signed_on":"2026-06-01","amount":5000}
```

**`validationConfig`：**

```json
{"requiredFields":["counterparty","contract_type","signed_on","amount"],"evidenceFields":["counterparty","contract_type","signed_on","amount"],"enumRules":{"contract_type":["服务采购","设备采购"]}}
```

**Expected Result：** 四项均通过，最终“可进入人工复核”。不做合同效力或法律判断。

## 6. 保险咨询分类 `insurance_consultation`

**Source / `sourceText`：**“客户咨询辽宁沈阳地区某虚构健康保障产品的理赔材料。”

**Output Schema：** `province`、`city`、`level1`、`level2`、`level3` 均为字符串。

**`modelOutput`：**

```json
{"province":"辽宁","city":"上海","level1":"个人意外健康险","level2":"理赔","level3":"医疗咨询"}
```

**`validationConfig`：**

```json
{"requiredFields":["province","city","level1","level2","level3"],"evidenceFields":["province","city","level2"],"enumRules":{"level1":["个人意外健康险"],"level2":["理赔","投保"],"level3":["材料咨询","理赔咨询"]}}
```

**Expected Result：** JSON 与字段通过；`level3 = 医疗咨询` 不在该模板允许值中，允许值检查 FAIL；`city = 上海` 不在原文中，原文证据 WARNING；`level2 = 理赔` 可在原文中直接找到。最终“已拦截”。`level1` 和 `level3` 属于概括分类，不以逐字出现作为证据要求。这里仅检查每个字段自己的允许值，**不声称**验证跨字段分类路径或真实保险规则。

## 7. 模板覆盖与边界

| 模板 | 字段集合 | 主要演示 |
| --- | --- | --- |
| 客服意图分类 | `category, intent, urgency` | 字面证据警告 |
| IT 服务工单 | `system, issue, severity` | 独立 IT 字段与枚举 |
| 工单信息抽取 | `device, symptom, next_step, status` | 四字段信息抽取 |
| 报销单据抽取 | `city, amount, expense_type` | 数字字段与允许值 |
| 合同信息抽取 | `counterparty, contract_type, signed_on, amount` | 日期文本与数字字段 |
| 保险咨询分类 | `province, city, level1, level2, level3` | 允许值失败与原文证据警告 |

这些模板只演示通用工程问题；默认展示客服意图分类，以便访问者首先看到非保险领域和“格式通过但证据不足”的结果。所有模板输入均允许临时修改；切换模板后按所选模板重新载入三件数据并使旧结果失效。
