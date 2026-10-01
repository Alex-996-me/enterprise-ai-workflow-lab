# Stage 2A — Public Repository Preflight Audit

## 1. Audit Scope

检查 `stage/02a-public-preflight` 当前公开候选文件、所有 Git refs 的可达历史、演示数据、工具能力与五个核心案例。本阶段只做本地预检，未创建远程仓库、添加 remote、推送或部署。

## 2. Git Status

- 审计开始时，当前分支为 `stage/02a-public-preflight`，工作区干净。
- `main` 与本分支在 Stage 2A 开始时同指向 `f57842f`（`merge: complete stage 1`）；`stage/01-app` 的实现已合入 `main`。用户已明确告知 Stage 1 人工验收通过。
- 本阶段只新增本审计与 `public_inventory.md`；`main` 未改动，未设置 remote。

## 3. Private Source Isolation

- `git ls-files` 只列出 `.gitignore`、`README.md`、`app/` 三个文件及 Stage 0/1 文档；没有 `private_sources/` 下的被跟踪文件。
- `.gitignore` 第一行是 `private_sources/`。对该目录现存五个文件逐个运行 `git check-ignore -v`，均命中同一规则。

## 4. Git History Audit

- `git log --oneline --decorate --graph --all` 显示当前可达历史为初始化、Stage 0、Stage 1 和 Stage 1 merge 四个 commit。
- `git log --all --stat`、`git log --all --name-only` 以及 `git rev-list --objects --all` 均未列出 `private_sources/` 或任何原始实习材料文件对象。就**当前 refs 可达历史**而言，早期误提交的私有源文件已被移除；本审计不对本地不可达对象作公开性判断。
- **剩余历史风险：** 可达提交的作者／提交者元数据含个人 QQ 邮箱。完整历史公开时该地址会随 commit 可见。此处不记录邮箱值；用户尚未明确同意公开该邮箱。
- **正文中的名称：** 虽然原始文件对象不可达，`docs/project_spec.md` 和 `docs/public_scope.md` 的可达历史仍包含私有材料文件名及章节索引。这些是文本引用，不等于原文件泄露；其公开必要性及边界尚待人工审查。只改当前文件不能从历史中移除旧文本。

## 5. Public File Inventory

逐文件状态见 [public_inventory.md](public_inventory.md)：**7 SAFE、3 REVIEW、0 BLOCK**。`README.md`、`docs/project_spec.md`、`docs/public_scope.md` 为 REVIEW。加上提交元数据风险，当前候选仓库尚不具备发布条件。

## 6. Sensitive Information Audit

对当前跟踪的文本与代码搜索手机号、身份证格式、邮箱、IPv4、URL、本地 Windows 绝对路径及 `file://`；文件正文未发现这些具体值。对内部 ID、API、token、Prompt、截图、客户信息等关键词逐项查看：命中主要是 `public_scope.md` 的禁止公开清单、`project_spec.md` 的材料索引和代码中的虚构客户咨询句，没有发现真实账号、接口、凭据、客户记录、原始 Prompt、截图或配置。

检查 `app/` 后未发现 `fetch`、`XMLHttpRequest`、`sendBeacon`、`WebSocket`、外部脚本或本地持久化调用。`app/index.html` 仅通过相对路径载入本地 CSS 和 JavaScript。个人邮箱风险存在于 **Git 元数据**，不在文件正文。

## 7. Authenticity Audit

README 与 About 均说明这是实习结束后的公开、脱敏成果转化，不称为公司内部系统，也未声称本人开发、部署公司系统或提升真实业务指标。`README.md` 和 `public_scope.md` 使用了真实实习单位名称；后者明确规定该名称的最终公开措辞须人工确认，当前尚无该项确认记录。

## 8. Demo Data Audit

六个场景只改变同一段新编咨询句和五个演示字段，未含客户姓名、联系方式、保单号、工单或附件。分类树在代码中明确标为虚构教学规则；没有真实截图或公司配置。案例 01–05 分别独立触发通过、路径错误、证据警告、缺字段和 JSON 错误；案例 06 组合路径与证据问题。

## 9. Capability Audit

应用实际执行 `JSON.parse`、五个字段的存在／类型／非空检查、虚构分类路径检查，以及 `province` 和 `city` 的字面包含检查，随后汇总闸门。README、About 和 Stage 1 审计对这些能力的描述与代码相符；没有声称语义验证、事实核查或生产合规能力。

`project_spec.md` 是 Stage 0 方案，仍写有六节点呈现、未约定字段校验等未完全实施的预案。该历史规格可能使读者误认当前能力，列为公开前 REVIEW，不据此扩展应用功能。

## 10. Functional Regression

在本地浏览器切换场景并点击“运行校验”复核，结果如下。

| Case | Expected | Actual | Status |
| --- | --- | --- | --- |
| 01 正确输出 | 四项通过；可进入人工复核 | 四项“✓ 通过”；闸门“✓ 可进入人工复核” | PASS |
| 02 分类路径错误 | 业务规则失败；已拦截 | `$.level3`；业务规则“× 失败”；闸门“× 已拦截” | PASS |
| 03 缺少原文依据 | 原文证据警告；需要人工复核 | `$.city`；原文证据“! 警告”；闸门“! 需要人工复核” | PASS |
| 04 缺失字段 | 字段契约失败；已拦截 | `$.level3`；字段契约“× 失败”；后续跳过；闸门“× 已拦截” | PASS |
| 05 JSON 格式错误 | 解析失败且页面可用 | 解析“× 失败”；后续跳过；闸门“× 已拦截” | PASS |

## 11. Changes Made During Preflight

仅新增 `docs/public_inventory.md` 与本审计文件。未修改应用、README 或 Stage 0/1 文档；未进行 Git 历史改写。当前风险涉及可达历史，不能靠一次普通文案提交彻底消除。

## 12. Known Limitations

- 分类树完全虚构，不代表真实保险业务规则。
- 原文证据只做简单字面匹配，没有语义推理或事实证明能力。
- 本工具不是公司内部系统、生产规则引擎或自动业务决策系统。
- 本轮只审计当前 refs 的可达历史；未来拟公开的实际提交集合改变后须重新检查。

## 13. Gate Result

**NOT READY**

发布前需要人工决定：是否愿意公开现有 Git 作者／提交者邮箱；是否公开真实实习单位名称及 Stage 0 的私有材料索引。若选择移除可达历史中的邮箱或索引，需要单独批准 Git 历史改写，并在改写后重新审计。Stage 2B 暂不建议启动。
