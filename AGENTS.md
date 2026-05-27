# AGENTS.md

## 必读顺序

- 每个新的编码会话都先读 `docs/spec.md`。
- 当任务涉及架构、包边界、命令、校验或部署行为时，再读 `docs/overview.md` 与 `docs/workflows/README.md`。
- 当任务涉及 `apps/portal-web` 样式或布局时，再检查 `docs/spec.md` 列出的样式入口、token 文件与 adaptive 文件。

## 默认 Skill

- 在本仓库做实现、重构、review 修复、清理、UI、API、package、配置或校验任务时，使用 `.codex/skills/monoapp-spec-coding/SKILL.md`。
- `docs/spec.md` 是约束源；不要在这里复制或覆盖完整 spec。

## 硬规则

- 除非用户明确要求，不使用破坏性 git 命令，不回退用户已有改动。
- 如果 PowerShell 输出出现中文乱码，先用显式 UTF-8 读取与 build/typecheck 结果核实，再判断编码状态。
- 保持职责与边界清晰：`apps/*` 负责应用特有页面、API 装配、权限与启动；跨 app 可复用能力进入 `packages/*`。
- 只有能减少真实复杂度、减少有意义重复或贴合既有边界时才增加抽象或分层。
- 除非用户明确要求迁移窗口，不保留兼容残留。
- 行为迁移时同步清理无用 import、死常量、fallback 静态数据、冗余 wrapper、旧别名和废弃状态分支。
