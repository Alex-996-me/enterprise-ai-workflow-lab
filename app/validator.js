"use strict";

// Pure validation logic shared by the browser and the Node smoke tests.
(function (root) {
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const nodeNames = ["parse", "schema", "rules", "evidence"];

  function fieldPath(field) {
    return /^[A-Za-z_$][\w$]*$/.test(field) ? `$.${field}` : `$[${JSON.stringify(field)}]`;
  }

  function configIssue(path, detail) {
    return { severity: "blocker", path, title: "校验配置错误", detail };
  }

  function validateConfig(input) {
    const issues = [];
    const config = { requiredFields: [], evidenceFields: [], enumRules: Object.create(null) };
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      return { valid: false, config, issues: [configIssue("$config", "校验配置必须是对象。")] };
    }

    for (const key of ["requiredFields", "evidenceFields"]) {
      if (!own(input, key) || !Array.isArray(input[key])) {
        issues.push(configIssue(`$config.${key}`, "必须提供字段名数组。"));
        continue;
      }
      const seen = new Set();
      input[key].forEach((value, index) => {
        if (typeof value !== "string" || !value.trim()) {
          issues.push(configIssue(`$config.${key}[${index}]`, "字段名必须是非空字符串。"));
          return;
        }
        const name = value.trim();
        if (!seen.has(name)) {
          config[key].push(name);
          seen.add(name);
        }
      });
    }

    if (!own(input, "enumRules") || input.enumRules === null || typeof input.enumRules !== "object" || Array.isArray(input.enumRules)) {
      issues.push(configIssue("$config.enumRules", "必须提供枚举规则对象。"));
    } else {
      for (const rawName of Object.keys(input.enumRules)) {
        const path = `$config.enumRules${/^[A-Za-z_$][\w$]*$/.test(rawName) ? `.${rawName}` : `[${JSON.stringify(rawName)}]`}`;
        const name = rawName.trim();
        if (!name) {
          issues.push(configIssue(path, "枚举字段名不能为空。"));
          continue;
        }
        const values = input.enumRules[rawName];
        if (!Array.isArray(values) || values.length === 0) {
          issues.push(configIssue(path, "每条枚举规则必须有非空的允许值数组。"));
          continue;
        }
        if (own(config.enumRules, name)) {
          issues.push(configIssue(path, "去除空白后出现重复的枚举字段名。"));
          continue;
        }
        const allowed = [];
        const seen = new Set();
        values.forEach((value, index) => {
          if (typeof value !== "string" || !value.trim()) {
            issues.push(configIssue(`${path}[${index}]`, "允许值必须是非空字符串。"));
            return;
          }
          const normalized = value.trim();
          if (!seen.has(normalized)) {
            allowed.push(normalized);
            seen.add(normalized);
          }
        });
        config.enumRules[name] = allowed;
      }
    }

    const required = new Set(config.requiredFields);
    for (const name of config.evidenceFields) {
      if (!required.has(name)) issues.push(configIssue("$config.evidenceFields", `字段“${name}”必须同时列入 requiredFields。`));
    }
    for (const name of Object.keys(config.enumRules)) {
      if (!required.has(name)) issues.push(configIssue("$config.enumRules", `字段“${name}”必须同时列入 requiredFields。`));
    }
    return { valid: issues.length === 0, config, issues };
  }

  function validateWorkflow(sourceText, modelOutputText, validationConfig) {
    const configResult = validateConfig(validationConfig);
    const { config } = configResult;
    const checks = {
      parse: { status: "skipped", detail: "前置检查尚未完成。" },
      schema: config.requiredFields.length ? { status: "skipped", detail: "等待 JSON 解析。" } : { status: "unconfigured", detail: "未配置必填字段。" },
      rules: Object.keys(config.enumRules).length ? { status: "skipped", detail: "等待字段检查。" } : { status: "unconfigured", detail: "未配置允许值规则。" },
      evidence: config.evidenceFields.length ? { status: "skipped", detail: "等待字段检查。" } : { status: "unconfigured", detail: "未配置原文证据字段。" },
    };
    const issues = [...configResult.issues];

    function result(note = "") {
      const summary = { pass: 0, fail: 0, warning: 0, skipped: 0, unconfigured: 0, note };
      for (const name of nodeNames) summary[checks[name].status] += 1;
      const blocked = issues.some((issue) => issue.severity === "blocker");
      const warned = checks.evidence.status === "warning";
      const contentPassed = ["schema", "rules", "evidence"].some((name) => checks[name].status === "pass");
      const gate = blocked ? "blocked" : warned || !contentPassed ? "review" : "ready";
      if (!blocked && !warned && !contentPassed) summary.note = "仅检查格式，尚未配置内容检查。";
      return { gate, checks, issues, summary };
    }

    if (!configResult.valid) {
      checks.parse.detail = "校验配置错误，本项未运行。";
      return result("校验配置错误。");
    }
    if (typeof sourceText !== "string" || !sourceText.trim() || typeof modelOutputText !== "string" || !modelOutputText.trim()) {
      issues.push({ severity: "blocker", path: "$input", title: "输入不完整", detail: "原始材料和模型输出均不能为空。" });
      checks.parse.detail = "输入不完整，本项未运行。";
      return result("输入不完整。");
    }

    let data;
    try {
      data = JSON.parse(modelOutputText);
    } catch {
      checks.parse = { status: "fail", detail: "模型输出不是合法的 JSON。" };
      issues.push({ severity: "blocker", path: "$", title: "JSON 格式错误", detail: "模型输出不是合法的 JSON。" });
      return result();
    }
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      checks.parse = { status: "fail", detail: "JSON 顶层必须是对象。" };
      issues.push({ severity: "blocker", path: "$", title: "JSON 顶层类型错误", detail: "JSON 顶层必须是对象。" });
      return result();
    }
    checks.parse = { status: "pass", detail: "JSON 对象解析成功。" };

    if (config.requiredFields.length) {
      const schemaIssues = [];
      for (const field of config.requiredFields) {
        const path = fieldPath(field);
        if (!own(data, field)) schemaIssues.push({ severity: "blocker", path, title: "缺少必填字段", detail: "该字段必须提供。" });
        else {
          const value = data[field];
          const valid = (typeof value === "string" && value.trim() !== "") ||
            (typeof value === "number" && Number.isFinite(value)) || typeof value === "boolean";
          if (!valid) schemaIssues.push({ severity: "blocker", path, title: "字段值无效", detail: "必填字段须为非空字符串、数字或布尔值。" });
        }
      }
      if (schemaIssues.length) {
        checks.schema = { status: "fail", detail: `${schemaIssues.length} 个必填字段未通过。` };
        checks.rules.detail = checks.rules.status === "unconfigured" ? checks.rules.detail : "字段检查失败，本项未运行。";
        checks.evidence.detail = checks.evidence.status === "unconfigured" ? checks.evidence.detail : "字段检查失败，本项未运行。";
        issues.push(...schemaIssues);
        return result();
      }
      checks.schema = { status: "pass", detail: "必填字段均存在且为有效标量。" };
    }

    if (checks.rules.status !== "unconfigured") {
      const ruleIssues = [];
      for (const [field, allowed] of Object.entries(config.enumRules)) {
        const value = data[field];
        if (typeof value !== "string" || !allowed.includes(value.trim())) {
          ruleIssues.push({ severity: "blocker", path: fieldPath(field), title: "不在允许值范围", detail: `当前值：${String(value)}；允许值：${allowed.join(" / ")}。` });
        }
      }
      checks.rules = ruleIssues.length ? { status: "fail", detail: `${ruleIssues.length} 个字段不符合允许值规则。` } : { status: "pass", detail: "已配置的字段允许值均通过。" };
      issues.push(...ruleIssues);
    }

    if (checks.evidence.status !== "unconfigured") {
      const evidenceIssues = [];
      for (const field of config.evidenceFields) {
        const value = data[field];
        const text = typeof value === "string" ? value.trim() : String(value);
        if (!sourceText.includes(text)) evidenceIssues.push({ severity: "warning", path: fieldPath(field), title: "缺少原文直接证据", detail: `输出值“${text}”未在原始材料中逐字出现。` });
      }
      checks.evidence = evidenceIssues.length ? { status: "warning", detail: `${evidenceIssues.length} 个字段缺少原文直接证据。` } : { status: "pass", detail: "已配置字段的值均在原文中逐字出现。" };
      issues.push(...evidenceIssues);
    }
    return result();
  }

  const api = { validateConfig, validateWorkflow };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkflowValidator = api;
})(globalThis);
