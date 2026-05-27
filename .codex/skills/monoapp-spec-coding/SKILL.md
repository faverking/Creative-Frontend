---
name: monoapp-spec-coding
description: Use this skill for MonoApp coding tasks that must follow docs/spec.md/spec constraints, including feature implementation, bug fixes, refactors, code review fixes, UI changes, API wiring, shared package work, engineering config changes, cleanup, and any request like 按 spec 编码、遵守项目约束、清理冗余代码.
---

# MonoApp Spec Coding

## 目标

在 MonoApp 内编码时，始终以 `docs/spec.md` 为项目约束源。这个 skill 只规定工作流程、场景判断和清理边界，不复制完整 spec。

## 任务开始

1. 先读 `docs/spec.md`。
2. 当任务涉及架构、包边界、命令、校验或发布行为时，再读 `docs/overview.md` 与 `docs/workflows/README.md`。
3. 当任务涉及 `apps/portal-web` 样式或布局时，再检查 `docs/spec.md` 指定的样式入口、token 层和 adaptive 层。
4. 如果 PowerShell 或终端输出出现中文乱码，使用显式 UTF-8 重新读取文件，并以文件实际内容、`typecheck`、`build` 或运行结果为准；不要只因终端显示异常而转码或覆盖文件。
5. 编辑前先判断当前任务命中了 `docs/spec.md` 的哪些场景约束。

## 编码循环

1. 先看现有结构和局部模式，再决定实现方式。
2. 把改动放在最小且正确的职责边界内。
3. 跨 app 行为、共享工程规则、可复用运行时能力优先进入 `packages/*`；app 与根配置保持薄壳。
4. app 代码聚焦业务页面、业务 API 装配、权限模型和启动装配。
5. 只有在能减少真实复杂度、减少有意义重复或贴合既有边界时才分层；不要为了分层而分层。
6. 状态、样式、常量默认先留在 feature-local 或 component-local，直到复用真实且稳定。
7. 除非用户明确要求迁移期，不保留兼容分支、旧别名、fallback 静态数据、重复入口或临时 adapter。
8. 行为迁移时同步清理残留：无用 import、死常量、过期分支、冗余 wrapper、旧状态名、废弃 CSS/token 别名。
9. 不回退用户已有改动，不使用破坏性 git 命令。

## 场景路由

命中以下场景时，以 `docs/spec.md` 对应章节作为硬边界：

- 任意 `apps/portal-web` 改动：遵守 portal-web 基础规则。
- 公开模块、详情、首页数据请求或错误处理：遵守公开内容 API 和请求结果规则。
- 模块配置、筛选项、排序项、query 解析：遵守 Constants 规则。
- 查询状态、路由同步、详情请求状态、自动续载：遵守 Composables 规则。
- lint、format、测试、hooks、脚本、CI、部署：遵守工程配置规则。
- 公开内容状态舞台：遵守全局共享组件与 `PortalRequestBoundary` 规则。
- 骨架屏、CSS token、业务主题色、公开模块、公开详情、校验命令：触达即遵守对应规则。

## 交付前

1. 按 `docs/workflows/README.md` 和 `docs/spec.md` 校验章节，运行当前改动范围内最小但有意义的校验。
2. 改动公开内容域前端代码时，默认至少运行 `pnpm --filter portal-web typecheck` 和 `pnpm --filter portal-web build`，除非受阻。
3. 如果校验没跑或跑失败，明确说明原因。
4. 总结时说明改动落在哪个职责边界，以及同步清除了哪些残留代码。
