# AGENTS.md

## 必读顺序

- 每个新的编码会话都先读 `docs/spec.md`。
- 当任务涉及架构、包边界、命令、校验或部署行为时，再读 `docs/overview.md` 与 `docs/workflows/README.md`。
- 当任务涉及 `apps/portal-web` 样式或布局时，再检查 `docs/spec.md` 列出的样式入口、token 文件与 adaptive 文件。

## 默认 Skill

- 在本仓库做实现、重构、review 修复、清理、UI、API、package、配置或校验任务时，使用 `.codex/skills/monoapp-spec-coding/SKILL.md`。
- `docs/spec.md` 是约束源；不要在这里复制或覆盖完整 spec。

## 当前交接

- 当前工作树包含一轮 `apps/portal-web` 大屏 rem 适配收敛：桌面以 1920 为唯一设计锚点，构建期 `postcss-pxtorem` 转换 px；移动端继续通过 `data-portal-viewport="mobile"` 独立覆盖。
- adaptive 层当前只保留 `rem-root.css`、`shared.css`、`desktop.css` 与 `adaptive/mobile/*`；viewport 语义为 `mobile` / desktop 默认态。
- 公开模块列表骨架已按 `docs/spec.md` 对齐真实布局：情报、游戏、书库标题 / 摘要 / footer 的骨架高度跟真实文本行高绑定，避免用泛化高度估算。
- 最近修过的骨架根因：
  - `PortalTopicModuleView.vue`：`portal-topic-module-page__theme-tag-skeleton` 需要自己的 `position: relative`，否则 shimmer `::after { inset: 0 }` 会脱离标签高度边界。
  - `PortalBookModuleView.vue`：书库封面骨架复用真实封面基类时，要关闭真实封面 `::before` 并重置 `::after` 的书脊宽高，避免污染 shimmer。
- 扫描结论：当前未发现第二个 shimmer `::after` 宿主缺少定位上下文的问题；骨架复用真实基类伪元素的候选需逐个按真实职责判断，不要一刀切清掉。
- 本轮补扫已清除 portal foundation 中确认无消费的 generic surface token；token 矩阵里剩余未被源码 `var()` 直接命中的项为 Element Plus 覆盖变量。
- 最近一次已跑 `pnpm.cmd --filter portal-web lint`、`typecheck`、`test`、`build` 通过；继续改 portal-web 公开内容样式时，交付前仍需按影响范围补跑校验。
- 下一会话先看 `git status` 区分已暂存与未暂存改动，不要回退已有工作；如继续处理骨架问题，优先从真实布局结构、伪元素定位上下文、真实基类伪元素污染三类根因排查。

## 硬规则

- 除非用户明确要求，不使用破坏性 git 命令，不回退用户已有改动。
- 如果 PowerShell 输出出现中文乱码，先用显式 UTF-8 读取与 build/typecheck 结果核实，再判断编码状态。
- 保持职责与边界清晰：`apps/*` 负责应用特有页面、API 装配、权限与启动；跨 app 可复用能力进入 `packages/*`。
- 只有能减少真实复杂度、减少有意义重复或贴合既有边界时才增加抽象或分层。
- 除非用户明确要求迁移窗口，不保留兼容残留。
- 行为迁移时同步清理无用 import、死常量、fallback 静态数据、冗余 wrapper、旧别名和废弃状态分支。
