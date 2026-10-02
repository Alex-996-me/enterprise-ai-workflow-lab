"use strict";

const originalText = "客户咨询辽宁沈阳地区某健康险的理赔材料。";
const demoOutputs = {
  valid: { province: "辽宁", city: "沈阳", level1: "个人意外健康险", level2: "理赔", level3: "材料咨询" },
  category: { province: "辽宁", city: "沈阳", level1: "个人意外健康险", level2: "理赔", level3: "医疗咨询" },
  evidence: { province: "辽宁", city: "上海", level1: "个人意外健康险", level2: "理赔", level3: "材料咨询" },
  missing: { province: "辽宁", city: "沈阳", level1: "个人意外健康险", level2: "理赔" },
  combined: { province: "辽宁", city: "上海", level1: "个人意外健康险", level2: "理赔", level3: "医疗咨询" },
};

// UI-only example config. The validator itself knows nothing about this domain.
const demoConfig = {
  requiredFields: ["province", "city", "level1", "level2", "level3"],
  evidenceFields: ["province", "city"],
  enumRules: {
    level1: ["个人意外健康险"],
    level2: ["理赔", "投保"],
    level3: ["理赔咨询", "材料咨询"],
  },
};
const nodeNames = ["parse", "schema", "rules", "evidence"];
const initialDetails = {
  parse: "检查 JSON 语法及顶层对象。",
  schema: "检查必填字段及有效标量值。",
  rules: "检查虚构示例的字段允许值。",
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
  row.querySelector(".node-status").textContent = ({ pass: "✓ 通过", warning: "! 警告", fail: "× 失败", skipped: "— 跳过", unconfigured: "— 未配置" })[status];
  row.querySelector(".node-detail").textContent = detail;
}

function showResult(result, startedAt) {
  const labels = { blocked: "已拦截", review: "需要人工复核", ready: "可进入人工复核" };
  const icons = { blocked: "×", review: "!", ready: "✓" };
  const { gate: gateKind, checks, issues, summary } = result;
  for (const name of nodeNames) setNode(name, checks[name].status, checks[name].detail);
  gate.dataset.gate = gateKind;
  gateLabel.textContent = `${icons[gateKind]} ${labels[gateKind]}`;
  gateCount.textContent = `${summary.pass} 项通过 · ${summary.fail} 项失败 · ${summary.warning} 项警告${summary.note ? ` · ${summary.note}` : ""}`;
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

  const completed = summary.pass + summary.fail + summary.warning;
  const elapsed = performance.now() - startedAt;
  runMeta.textContent = `第 ${String(runCount).padStart(3, "0")} 次运行 · ${completed} 项检查 · ${elapsed.toFixed(1)} ms`;
}

function runWorkflow() {
  const startedAt = performance.now();
  runCount += 1;
  hasRun = true;
  resetResults();
  const result = WorkflowValidator.validateWorkflow(sourceInput.value, jsonInput.value, demoConfig);
  showResult(result, startedAt);
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
