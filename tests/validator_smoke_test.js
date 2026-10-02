"use strict";

const assert = require("node:assert/strict");
const { validateConfig, validateWorkflow } = require("../app/validator.js");
const templates = require("../app/templates.js");

let passed = 0;
function test(name, body) {
  body();
  passed += 1;
  console.log(`PASS ${name}`);
}
function run(source, output, config) {
  return validateWorkflow(source, typeof output === "string" ? output : JSON.stringify(output), config);
}
function statuses(result) {
  return ["parse", "schema", "rules", "evidence"].map((name) => result.checks[name].status);
}

const expectedTemplates = {
  customer_intent: { gate: "review", checks: ["pass", "pass", "pass", "warning"] },
  it_service: { gate: "ready", checks: ["pass", "pass", "pass", "pass"] },
  ticket_extract: { gate: "ready", checks: ["pass", "pass", "pass", "pass"] },
  expense_extract: { gate: "ready", checks: ["pass", "pass", "pass", "pass"] },
  contract_extract: { gate: "ready", checks: ["pass", "pass", "pass", "pass"] },
  insurance_consultation: { gate: "blocked", checks: ["pass", "pass", "fail", "warning"] },
};
assert.equal(templates.length, 6);
for (const template of templates) {
  test(`template ${template.id}`, () => {
    assert.equal(typeof template.name, "string");
    const result = run(template.sourceText, template.modelOutput, template.validationConfig);
    assert.equal(result.gate, expectedTemplates[template.id].gate);
    assert.deepEqual(statuses(result), expectedTemplates[template.id].checks);
    if (template.id === "insurance_consultation") {
      assert.deepEqual(template.validationConfig.evidenceFields, ["province", "city", "level2"]);
      assert(result.issues.some((issue) => issue.path === "$.level3" && issue.severity === "blocker"));
      assert(result.issues.some((issue) => issue.path === "$.city" && issue.severity === "warning"));
    }
  });
}

const headphones = {
  source: "客户反馈购买的蓝牙耳机左耳没有声音，希望直接换货。",
  output: { product: "蓝牙耳机", problem: "左耳没有声音", action: "换货" },
  config: {
    requiredFields: ["product", "problem", "action"],
    evidenceFields: ["product", "problem", "action"],
    enumRules: { action: ["换货", "退款", "维修"] },
  },
};
test("free mode headphones exchange", () => {
  const result = run(headphones.source, headphones.output, headphones.config);
  assert.equal(result.gate, "ready");
  assert.deepEqual(statuses(result), ["pass", "pass", "pass", "pass"]);
});
test("free mode headphones refund evidence warning", () => {
  const result = run(headphones.source, { ...headphones.output, action: "退款" }, headphones.config);
  assert.equal(result.gate, "review");
  assert.deepEqual(statuses(result), ["pass", "pass", "pass", "warning"]);
  assert(result.issues.some((issue) => issue.path === "$.action" && issue.title === "缺少原文直接证据"));
});

test("malformed JSON skips configured nodes", () => {
  const result = run(headphones.source, "{", headphones.config);
  assert.equal(result.gate, "blocked");
  assert.deepEqual(statuses(result), ["fail", "skipped", "skipped", "skipped"]);
  assert.equal(result.summary.pass, 0);
});
test("JSON top level must be object", () => {
  for (const output of ["null", "[]", "42"]) {
    const result = run(headphones.source, output, headphones.config);
    assert.equal(result.checks.parse.status, "fail");
    assert.equal(result.gate, "blocked");
  }
});
test("missing required field skips downstream", () => {
  const result = run(headphones.source, { product: "蓝牙耳机", problem: "左耳没有声音" }, headphones.config);
  assert.deepEqual(statuses(result), ["pass", "fail", "skipped", "skipped"]);
  assert.equal(result.gate, "blocked");
  assert(result.issues.some((issue) => issue.path === "$.action"));
});
test("invalid enum does not skip evidence", () => {
  const result = run(headphones.source, { ...headphones.output, action: "退货" }, headphones.config);
  assert.deepEqual(statuses(result), ["pass", "pass", "fail", "warning"]);
  assert.equal(result.gate, "blocked");
});

test("empty requiredFields is unconfigured", () => {
  const result = run("hello", {}, { requiredFields: [], evidenceFields: [], enumRules: {} });
  assert.equal(result.checks.schema.status, "unconfigured");
  assert.equal(result.summary.unconfigured, 3);
});
test("empty enumRules is unconfigured even on parse failure", () => {
  const config = { ...headphones.config, enumRules: {} };
  const result = run(headphones.source, "{", config);
  assert.deepEqual(statuses(result), ["fail", "skipped", "unconfigured", "skipped"]);
});
test("empty evidenceFields is unconfigured even on schema failure", () => {
  const config = { ...headphones.config, evidenceFields: [] };
  const result = run(headphones.source, {}, config);
  assert.deepEqual(statuses(result), ["pass", "fail", "skipped", "unconfigured"]);
});
test("JSON only remains review", () => {
  const result = run("hello", {}, { requiredFields: [], evidenceFields: [], enumRules: {} });
  assert.equal(result.gate, "review");
  assert.match(result.summary.note, /仅检查格式/);
  assert.equal(result.summary.pass, 1);
});
test("invalid config blocks with config issue", () => {
  const result = run("hello", {}, { requiredFields: ["a"], evidenceFields: ["b"], enumRules: {} });
  assert.equal(result.gate, "blocked");
  assert(result.issues.some((issue) => issue.path.startsWith("$config") && issue.title === "校验配置错误"));
  assert.equal(result.summary.pass, 0);
});
test("config normalization trims and deduplicates", () => {
  const checked = validateConfig({ requiredFields: [" action ", "action"], evidenceFields: [" action ", "action"], enumRules: { " action ": [" 换货 ", "换货"] } });
  assert.equal(checked.valid, true);
  assert.deepEqual(checked.config.requiredFields, ["action"]);
  assert.deepEqual(checked.config.evidenceFields, ["action"]);
  assert.deepEqual(checked.config.enumRules.action, ["换货"]);
});
test("config rejects missing keys, bad types and empty enum", () => {
  for (const config of [
    {},
    { requiredFields: "x", evidenceFields: [], enumRules: {} },
    { requiredFields: ["x"], evidenceFields: [], enumRules: { x: [] } },
    { requiredFields: ["x"], evidenceFields: [], enumRules: { x: [" "] } },
    { requiredFields: [" "], evidenceFields: [], enumRules: {} },
  ]) assert.equal(validateConfig(config).valid, false);
});
test("numbers and booleans are valid required scalars", () => {
  const config = { requiredFields: ["zero", "flag", "amount"], evidenceFields: ["zero", "flag", "amount"], enumRules: {} };
  const result = run("0 false 128", { zero: 0, flag: false, amount: 128 }, config);
  assert.deepEqual(statuses(result), ["pass", "pass", "unconfigured", "pass"]);
  assert.equal(result.gate, "ready");
});
test("null, array, object and blank string fail required scalar check", () => {
  const config = { requiredFields: ["value"], evidenceFields: [], enumRules: {} };
  for (const value of [null, [], {}, "  "]) {
    const result = run("any", { value }, config);
    assert.equal(result.checks.schema.status, "fail");
    assert.equal(result.gate, "blocked");
  }
});
test("special field names use safe display paths", () => {
  const config = { requiredFields: ["order-id"], evidenceFields: [], enumRules: {} };
  const result = run("any", {}, config);
  assert(result.issues.some((issue) => issue.path === '$["order-id"]'));
});
test("empty input blocks without throwing", () => {
  const result = validateWorkflow("", "", headphones.config);
  assert.equal(result.gate, "blocked");
  assert(result.issues.some((issue) => issue.path === "$input"));
});

console.log(`${passed} smoke cases passed`);
