"use strict";

// Stage 3B data layer; the six-template UI belongs to Stage 3C.
(function (root) {
  const templates = [
    {
      id: "customer_intent",
      name: "客服意图分类",
      sourceText: "用户咨询订单配送进度，希望查询到货时间，称不着急。",
      modelOutput: { category: "配送", intent: "查询到货时间", urgency: "紧急" },
      validationConfig: {
        requiredFields: ["category", "intent", "urgency"],
        evidenceFields: ["category", "intent", "urgency"],
        enumRules: { category: ["配送", "售后"], urgency: ["一般", "紧急"] },
      },
    },
    {
      id: "it_service",
      name: "IT 服务工单",
      sourceText: "员工反馈办公门户无法登录，影响工作，要求紧急处理。",
      modelOutput: { system: "办公门户", issue: "无法登录", severity: "紧急" },
      validationConfig: {
        requiredFields: ["system", "issue", "severity"],
        evidenceFields: ["system", "issue", "severity"],
        enumRules: { severity: ["一般", "紧急"] },
      },
    },
    {
      id: "ticket_extract",
      name: "工单信息抽取",
      sourceText: "记录：视频会议设备的麦克风无声，请安排远程排查；工单状态待处理。",
      modelOutput: { device: "视频会议设备", symptom: "麦克风无声", next_step: "远程排查", status: "待处理" },
      validationConfig: {
        requiredFields: ["device", "symptom", "next_step", "status"],
        evidenceFields: ["device", "symptom", "next_step", "status"],
        enumRules: { status: ["待处理", "处理中", "已完成"] },
      },
    },
    {
      id: "expense_extract",
      name: "报销单据抽取",
      sourceText: "虚构报销记录：大连购买办公用品，金额128元，费用类型办公用品。",
      modelOutput: { city: "大连", amount: 128, expense_type: "办公用品" },
      validationConfig: {
        requiredFields: ["city", "amount", "expense_type"],
        evidenceFields: ["city", "amount", "expense_type"],
        enumRules: { expense_type: ["办公用品", "差旅交通", "餐饮"] },
      },
    },
    {
      id: "contract_extract",
      name: "合同信息抽取",
      sourceText: "虚构合同摘要：甲方为示例甲方，合同类型服务采购，签署日期2026-06-01，金额5000元。",
      modelOutput: { counterparty: "示例甲方", contract_type: "服务采购", signed_on: "2026-06-01", amount: 5000 },
      validationConfig: {
        requiredFields: ["counterparty", "contract_type", "signed_on", "amount"],
        evidenceFields: ["counterparty", "contract_type", "signed_on", "amount"],
        enumRules: { contract_type: ["服务采购", "设备采购"] },
      },
    },
    {
      id: "insurance_consultation",
      name: "保险咨询分类",
      sourceText: "客户咨询辽宁沈阳地区某虚构健康保障产品的理赔材料。",
      modelOutput: { province: "辽宁", city: "上海", level1: "个人意外健康险", level2: "理赔", level3: "医疗咨询" },
      validationConfig: {
        requiredFields: ["province", "city", "level1", "level2", "level3"],
        evidenceFields: ["province", "city", "level2"],
        enumRules: { level1: ["个人意外健康险"], level2: ["理赔", "投保"], level3: ["材料咨询", "理赔咨询"] },
      },
    },
  ];

  if (typeof module === "object" && module.exports) module.exports = templates;
  else root.WorkflowTemplates = templates;
})(globalThis);
