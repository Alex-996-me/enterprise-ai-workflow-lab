"use strict";

const freeExample = {
  sourceText: "客户反馈购买的蓝牙耳机左耳没有声音，希望直接换货。",
  modelOutput: { product: "蓝牙耳机", problem: "左耳没有声音", action: "换货" },
  validationConfig: {
    requiredFields: ["product", "problem", "action"],
    evidenceFields: ["product", "problem", "action"],
    enumRules: { action: ["换货", "退款", "维修"] },
  },
};
const nodeNames = ["parse", "schema", "rules", "evidence"];
const initialDetails = {
  parse: "检查语法和顶层对象。",
  schema: "检查已配置的必填字段和值。",
  rules: "检查已配置的单字段允许值。",
  evidence: "检查关键值是否在原始材料中逐字出现。",
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
const configSummary = document.querySelector("#config-summary");
const quickTip = document.querySelector("#quick-tip");
const configDialog = document.querySelector("#config-dialog");
let runCount = 0;
let hasRun = false;
let mode = "template";
let activeTemplate = WorkflowTemplates[0];
let freeDraft = {
  sourceText: freeExample.sourceText,
  modelOutputText: JSON.stringify(freeExample.modelOutput, null, 2),
  validationConfig: freeExample.validationConfig,
};

for (const template of WorkflowTemplates) {
  const option = document.createElement("option");
  option.value = template.id;
  option.textContent = template.name;
  scenarioSelect.append(option);
}

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

function currentConfig() {
  return mode === "template" ? activeTemplate.validationConfig : freeDraft.validationConfig;
}

function renderConfigSummary() {
  const config = currentConfig();
  configSummary.textContent = `${config.requiredFields.length} 个必填字段 · ${config.evidenceFields.length} 个证据字段 · ${Object.keys(config.enumRules).length} 条允许值规则`;
}

function loadTemplate(template) {
  activeTemplate = template;
  scenarioSelect.value = template.id;
  sourceInput.value = template.sourceText;
  jsonInput.value = JSON.stringify(template.modelOutput, null, 2);
  updateEditorMeta();
  hasRun = false;
  resetResults();
  quickTip.textContent = "最快体验：点击「运行校验」，然后修改一个字段再运行一次。";
  renderConfigSummary();
}

function switchMode(nextMode) {
  if (nextMode === mode) return;
  if (mode === "free") {
    freeDraft.sourceText = sourceInput.value;
    freeDraft.modelOutputText = jsonInput.value;
  }
  mode = nextMode;
  document.querySelector("#template-mode").setAttribute("aria-pressed", String(mode === "template"));
  document.querySelector("#free-mode").setAttribute("aria-pressed", String(mode === "free"));
  document.querySelector("#scenario-field").hidden = mode !== "template";
  document.querySelector("#load-button").hidden = mode !== "template";
  document.querySelector("#guide-button").hidden = mode !== "free";
  document.querySelector("#config-button").textContent = mode === "template" ? "当前检查范围" : "校验配置";
  if (mode === "template") loadTemplate(activeTemplate);
  else {
    sourceInput.value = freeDraft.sourceText;
    jsonInput.value = freeDraft.modelOutputText;
    updateEditorMeta();
    hasRun = false;
    resetResults();
    quickTip.textContent = "使用顶层 JSON，并告诉系统你希望检查哪些字段。先运行耳机案例，再试着修改 action。";
    renderConfigSummary();
  }
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
  const extra = [summary.skipped ? `${summary.skipped} 项跳过` : "", summary.unconfigured ? `${summary.unconfigured} 项未配置` : ""].filter(Boolean);
  const note = summary.note.includes("仅检查格式") ? "仅完成格式检查，尚未配置内容检查。" : summary.note;
  gateCount.textContent = `${summary.pass} 项通过 · ${summary.fail} 项失败 · ${summary.warning} 项警告${extra.length ? ` · ${extra.join(" · ")}` : ""}${note ? ` · ${note}` : ""}`;
  validationState.textContent = "已出结果";
  validationState.dataset.state = "result";

  issueList.replaceChildren();
  issueCount.textContent = `${issues.length} 项问题`;
  if (!issues.length) {
    const empty = document.createElement("p");
    empty.className = "empty-issues";
    empty.textContent = "已配置的检查未发现问题；仍需人工判断。";
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
  if (mode === "template" && activeTemplate.id === "customer_intent") quickTip.textContent = "试试把 urgency 改成「不着急」再运行：原文有这个词，但它不在允许值中。";
  else if (mode === "template" && activeTemplate.id === "it_service") quickTip.textContent = "试试把 severity 改成「低」，再运行一次。";
  else if (mode === "free") quickTip.textContent = "试试把 action 从「换货」改成「退款」，再运行一次。";
}

function runWorkflow() {
  const startedAt = performance.now();
  runCount += 1;
  hasRun = true;
  resetResults();
  const result = WorkflowValidator.validateWorkflow(sourceInput.value, jsonInput.value, currentConfig());
  showResult(result, startedAt);
}

function openConfig() {
  const config = currentConfig();
  document.querySelector("#template-config").hidden = mode !== "template";
  document.querySelector("#free-config").hidden = mode !== "free";
  document.querySelector("#config-error").hidden = true;
  if (mode === "template") {
    document.querySelector("#scope-required").textContent = config.requiredFields.join("、") || "未配置";
    document.querySelector("#scope-evidence").textContent = config.evidenceFields.join("、") || "未配置";
    document.querySelector("#scope-enums").textContent = Object.entries(config.enumRules).map(([field, values]) => `${field}：${values.join(" / ")}`).join("；") || "未配置";
  } else {
    document.querySelector("#config-required").value = config.requiredFields.join(", ");
    document.querySelector("#config-evidence").value = config.evidenceFields.join(", ");
    document.querySelector("#config-enums").value = Object.entries(config.enumRules).map(([field, values]) => `${field} = ${values.join(" | ")}`).join("\n");
  }
  configDialog.showModal();
}

function fieldList(text) {
  return text.trim() ? text.split(/[,，]/).map((part) => part.trim()) : [];
}

function saveConfig() {
  const enumRules = Object.create(null);
  const lines = document.querySelector("#config-enums").value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const error = document.querySelector("#config-error");
  for (const line of lines) {
    const separator = line.indexOf("=");
    if (separator < 0 || !line.slice(0, separator).trim()) {
      error.textContent = `允许值规则格式不正确：${line}。请写成「字段 = 值1 | 值2」。`;
      error.hidden = false;
      return;
    }
    const field = line.slice(0, separator).trim();
    if (Object.prototype.hasOwnProperty.call(enumRules, field)) {
      error.textContent = `字段“${field}”出现了重复的允许值规则。`;
      error.hidden = false;
      return;
    }
    enumRules[field] = line.slice(separator + 1).split("|").map((value) => value.trim());
  }
  const checked = WorkflowValidator.validateConfig({
    requiredFields: fieldList(document.querySelector("#config-required").value),
    evidenceFields: fieldList(document.querySelector("#config-evidence").value),
    enumRules,
  });
  if (!checked.valid) {
    error.textContent = checked.issues.map((issue) => `${issue.path}：${issue.detail}`).join(" ");
    error.hidden = false;
    return;
  }
  freeDraft.validationConfig = checked.config;
  configDialog.close();
  renderConfigSummary();
  resetResults(hasRun);
}

sourceInput.addEventListener("input", () => { updateEditorMeta(); resetResults(hasRun); });
jsonInput.addEventListener("input", () => { updateEditorMeta(); resetResults(hasRun); });
jsonInput.addEventListener("scroll", () => { lineNumbers.scrollTop = jsonInput.scrollTop; });
document.querySelector("#template-mode").addEventListener("click", () => switchMode("template"));
document.querySelector("#free-mode").addEventListener("click", () => switchMode("free"));
scenarioSelect.addEventListener("change", () => loadTemplate(WorkflowTemplates.find((template) => template.id === scenarioSelect.value)));
document.querySelector("#load-button").addEventListener("click", () => loadTemplate(activeTemplate));
document.querySelector("#reset-button").addEventListener("click", () => {
  sourceInput.value = "";
  jsonInput.value = "";
  if (mode === "free") freeDraft.validationConfig = { requiredFields: [], evidenceFields: [], enumRules: {} };
  hasRun = false;
  updateEditorMeta();
  resetResults();
  renderConfigSummary();
});
document.querySelector("#run-button").addEventListener("click", runWorkflow);
document.querySelector("#config-button").addEventListener("click", openConfig);
document.querySelector("#save-config").addEventListener("click", saveConfig);
document.querySelector("#close-config").addEventListener("click", () => configDialog.close());
const guideDialog = document.querySelector("#guide-dialog");
document.querySelector("#guide-button").addEventListener("click", () => guideDialog.showModal());
document.querySelector("#close-guide").addEventListener("click", () => guideDialog.close());
const aboutDialog = document.querySelector("#about-dialog");
document.querySelector("#about-button").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#close-about").addEventListener("click", () => aboutDialog.close());
loadTemplate(activeTemplate);
