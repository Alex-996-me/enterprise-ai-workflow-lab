"use strict";

const originalText = "客户咨询辽宁地区某健康险的理赔材料。";
const demoOutputs = {
  valid: { province: "辽宁", city: "", level1: "个人意外健康险", level2: "理赔", level3: "材料咨询" },
  category: { province: "辽宁", city: "", level1: "个人意外健康险", level2: "理赔", level3: "医疗咨询" },
  evidence: { province: "辽宁", city: "上海", level1: "个人意外健康险", level2: "理赔", level3: "材料咨询" },
  missing: { province: "辽宁", city: "", level1: "个人意外健康险", level2: "理赔" },
  combined: { province: "辽宁", city: "上海", level1: "个人意外健康险", level2: "理赔", level3: "医疗咨询" },
};

// 完全虚构的教学分类树，不代表任何公司的业务规则。
const demoTaxonomy = {
  "个人意外健康险": {
    "理赔": ["理赔咨询", "材料咨询"],
    "投保": ["投保咨询"],
  },
};
const requiredFields = ["province", "city", "level1", "level2", "level3"];
const nodeNames = ["parse", "schema", "rules", "evidence"];
const initialDetails = {
  parse: "检查 JSON 语法及顶层对象。",
  schema: "检查必填字段及字符串类型。",
  rules: "检查虚构分类路径。",
  evidence: "检查地区值是否出现在原始输入中。",
};

const sourceInput = document.querySelector("#source-input");
const jsonInput = document.querySelector("#json-input");
const scenarioSelect = document.querySelector("#scenario-select");
const gate = document.querySelector("#gate");
const gateLabel = document.querySelector("#gate-label");
const gateCount = document.querySelector("#gate-count");
const validationState = document.querySelector("#validation-state");
const issueCount = document.querySelector("#issue-count");
const issueList = document.querySelector("#issue-list");
const runMeta = document.querySelector("#run-meta");
const lineNumbers = document.querySelector("#line-numbers");
let runCount = 0;
let hasRun = false;

function node(name) {
  return document.querySelector(`[data-node="${name}"]`);
}

function updateEditorMeta() {
  document.querySelector("#character-count").textContent = `字符数：${Array.from(sourceInput.value).length}`;
  const lines = jsonInput.value.split(/\r\n|\r|\n/).length;
  document.querySelector("#line-count").textContent = `行数：${lines}`;
  lineNumbers.textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
}

function resetResults(dirty = false) {
  gate.dataset.gate = "idle";
  gateLabel.textContent = dirty ? "结果已过期" : "尚未运行";
  gateCount.textContent = dirty ? "输入已修改，请重新运行校验" : "运行校验后查看判断";
  validationState.textContent = dirty ? "待重新校验" : "尚未运行";
  validationState.dataset.state = dirty ? "dirty" : "idle";
  issueCount.textContent = "0 项问题";
  issueList.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "empty-issues";
  empty.textContent = dirty ? "本次修改尚未校验。" : "尚无校验结果。";
  issueList.append(empty);
  for (const name of nodeNames) {
    const row = node(name);
    delete row.dataset.status;
    row.open = false;
    row.querySelector(".node-status").textContent = "—";
    row.querySelector(".node-detail").textContent = initialDetails[name];
  }
  if (dirty) runMeta.textContent = `第 ${String(runCount).padStart(3, "0")} 次运行后输入已修改`;
  else runMeta.textContent = "当前没有校验结果";
}

function loadSample(kind) {
  scenarioSelect.value = kind;
  sourceInput.value = originalText;
  jsonInput.value = kind === "malformed" ? '{ "province": "辽宁",' : JSON.stringify(demoOutputs[kind], null, 2);
  updateEditorMeta();
  hasRun = false;
  resetResults();
}

function setNode(name, status, detail) {
  const row = node(name);
  row.dataset.status = status;
  row.querySelector(".node-status").textContent = ({ pass: "✓ 通过", warning: "! 警告", fail: "× 失败", skipped: "— 跳过" })[status];
  row.querySelector(".node-detail").textContent = detail;
}

function showResult(status, issues, startedAt, inputFailure = false) {
  const labels = { fail: "已拦截", warning: "需要人工复核", pass: "可进入人工复核" };
  const icons = { fail: "×", warning: "!", pass: "✓" };
  const gateKinds = { fail: "blocked", warning: "review", pass: "ready" };
  const counts = { pass: 0, fail: 0, warning: 0 };
  for (const name of nodeNames) {
    const state = node(name).dataset.status;
    if (state in counts) counts[state] += 1;
  }
  if (inputFailure) counts.fail += 1;
  gate.dataset.gate = gateKinds[status];
  gateLabel.textContent = `${icons[status]} ${labels[status]}`;
  gateCount.textContent = `${counts.pass} 项通过 · ${counts.fail} 项失败 · ${counts.warning} 项警告`;
  validationState.textContent = "已出结果";
  validationState.dataset.state = "result";

  issueList.replaceChildren();
  issueCount.textContent = `${issues.length} 项问题`;
  if (!issues.length) {
    const empty = document.createElement("p");
    empty.className = "empty-issues";
    empty.textContent = "这些演示检查未发现问题；仍需人工判断。";
    issueList.append(empty);
  }
  for (const issue of issues) {
    const item = document.createElement("div");
    item.className = "issue";
    item.dataset.severity = issue.severity;
    const head = document.createElement("div");
    head.className = "issue-head";
    const severity = document.createElement("span");
    severity.className = "issue-severity";
    severity.textContent = issue.severity === "blocker" ? "× 严重" : "! 警告";
    const path = document.createElement("code");
    path.className = "issue-path";
    path.textContent = issue.path;
    head.append(severity, path);
    const title = document.createElement("strong");
    title.textContent = issue.title;
    const detail = document.createElement("p");
    detail.textContent = issue.detail;
    item.append(head, title, detail);
    issueList.append(item);
  }

  const completed = counts.pass + counts.fail + counts.warning - (inputFailure ? 1 : 0);
  const elapsed = performance.now() - startedAt;
  runMeta.textContent = `第 ${String(runCount).padStart(3, "0")} 次运行 · ${completed} 项检查 · ${elapsed.toFixed(1)} ms`;
}

function runWorkflow() {
  const startedAt = performance.now();
  runCount += 1;
  hasRun = true;
  resetResults();
  const text = sourceInput.value.trim();
  const output = jsonInput.value.trim();
  const issues = [];

  if (!text || !output) {
    for (const name of nodeNames) setNode(name, "skipped", "输入不完整，本项未运行。");
    issues.push({ severity: "blocker", path: "$input", title: "输入不完整", detail: "原始输入和模型输出均不能为空。" });
    showResult("fail", issues, startedAt, true);
    return;
  }

  let data;
  try {
    data = JSON.parse(output);
  } catch {
    setNode("parse", "fail", "模型输出不是合法的 JSON。");
    for (const name of ["schema", "rules", "evidence"]) setNode(name, "skipped", "JSON 解析失败，本项未运行。");
    issues.push({ severity: "blocker", path: "$", title: "JSON 格式错误", detail: "模型输出不是合法的 JSON。" });
    showResult("fail", issues, startedAt);
    return;
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    setNode("parse", "fail", "JSON 顶层必须是对象。");
    for (const name of ["schema", "rules", "evidence"]) setNode(name, "skipped", "缺少 JSON 对象，本项未运行。");
    issues.push({ severity: "blocker", path: "$", title: "JSON 顶层类型错误", detail: "JSON 顶层必须是对象。" });
    showResult("fail", issues, startedAt);
    return;
  }
  setNode("parse", "pass", "JSON 对象解析成功。");

  const schemaIssues = [];
  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) schemaIssues.push({ field, title: "缺少必填字段", detail: "该字段必须提供。" });
    else if (typeof data[field] !== "string") schemaIssues.push({ field, title: "字段类型错误", detail: "该字段必须是字符串。" });
    else if (field !== "city" && !data[field].trim()) schemaIssues.push({ field, title: "字段不能为空", detail: "该字段必须有值。" });
  }
  if (schemaIssues.length) {
    setNode("schema", "fail", schemaIssues.map((item) => `$.${item.field}: ${item.detail}`).join(" "));
    setNode("rules", "skipped", "字段契约未通过，本项未运行。");
    setNode("evidence", "skipped", "字段契约未通过，本项未运行。");
    issues.push(...schemaIssues.map((item) => ({ severity: "blocker", path: `$.${item.field}`, title: item.title, detail: item.detail })));
    showResult("fail", issues, startedAt);
    return;
  }
  setNode("schema", "pass", "必填字段均为字符串；city 允许为空。");

  const levels = demoTaxonomy[data.level1]?.[data.level2];
  const validPath = Array.isArray(levels) && levels.includes(data.level3);
  if (validPath) {
    setNode("rules", "pass", "分类路径符合虚构示例规则。");
  } else {
    setNode("rules", "fail", "分类路径不符合虚构示例规则。");
    issues.push({ severity: "blocker", path: "$.level3", title: "分类路径非法", detail: `${data.level1} → ${data.level2} → ${data.level3}` });
  }

  const missingEvidence = ["province", "city"].filter((field) => {
    const value = data[field].trim();
    return value && !text.includes(value);
  });
  if (missingEvidence.length) {
    setNode("evidence", "warning", missingEvidence.map((field) => `$.${field} 未在原始输入中找到。`).join(" "));
    issues.push(...missingEvidence.map((field) => ({ severity: "warning", path: `$.${field}`, title: "缺少原文依据", detail: `输出值“${data[field].trim()}”未在原始输入中找到。` })));
  } else {
    setNode("evidence", "pass", "非空地区值均出现在原始输入中。");
  }

  showResult(!validPath ? "fail" : missingEvidence.length ? "warning" : "pass", issues, startedAt);
}

sourceInput.addEventListener("input", () => { updateEditorMeta(); resetResults(hasRun); });
jsonInput.addEventListener("input", () => { updateEditorMeta(); resetResults(hasRun); });
jsonInput.addEventListener("scroll", () => { lineNumbers.scrollTop = jsonInput.scrollTop; });
scenarioSelect.addEventListener("change", () => loadSample(scenarioSelect.value));
document.querySelector("#load-button").addEventListener("click", () => loadSample(scenarioSelect.value));
document.querySelector("#reset-button").addEventListener("click", () => {
  sourceInput.value = "";
  jsonInput.value = "";
  hasRun = false;
  updateEditorMeta();
  resetResults();
});
document.querySelector("#run-button").addEventListener("click", runWorkflow);
const aboutDialog = document.querySelector("#about-dialog");
document.querySelector("#about-button").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#close-about").addEventListener("click", () => aboutDialog.close());
loadSample("combined");
