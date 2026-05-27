# Workflow Playbook

本目录只记录可执行流程。项目边界和编码规则看 `docs/spec.md`。

## 基础

- Node.js：`20.x`
- pnpm：`10.2.1`
- 命令默认在仓库根目录执行
- workspace：`apps/*`、`packages/*`、`packages/*/*`

首次准备：

```bash
corepack enable
pnpm install
```

## 常用命令

| 目标 | 命令 |
| --- | --- |
| 启动管理端 | `pnpm dev:admin` |
| 启动门户端 | `pnpm dev:portal` |
| 执行 AI 预备应用闭环 | `pnpm dev:ai` |
| 全量 lint | `pnpm lint` |
| 全量类型检查 | `pnpm typecheck` |
| 全量测试 | `pnpm test` |
| 全量构建 | `pnpm build` |
| E2E 入口 | `pnpm test:e2e` |

## 按范围执行

```bash
pnpm --filter admin-web build
pnpm --filter portal-web build
pnpm --filter @frontend/request test
pnpm -r --filter "@frontend/*" build
```

## 快速选择

| 场景 | 推荐命令 |
| --- | --- |
| 提交前最小门禁 | `pnpm lint && pnpm typecheck && pnpm test` |
| 只验证管理端 | `pnpm --filter admin-web lint && pnpm --filter admin-web typecheck && pnpm --filter admin-web test && pnpm --filter admin-web build` |
| 只验证门户端 | `pnpm --filter portal-web lint && pnpm --filter portal-web typecheck && pnpm --filter portal-web test && pnpm --filter portal-web build` |
| 只验证共享包 | `pnpm -r --filter "@frontend/*" lint && pnpm -r --filter "@frontend/*" typecheck && pnpm -r --filter "@frontend/*" test && pnpm -r --filter "@frontend/*" build` |
| 对齐当前 Actions | `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter portal-web build && pnpm --filter admin-web build` |

## 子文档

- [构建流程](./build.md)
- [测试流程](./test.md)
- [提交流程](./commit.md)
- [部署流程](./deploy.md)

## 当前事实

- `admin-web` 和 `portal-web` 是可运行应用。
- `ai-console` 当前不纳入生产前端发布包。
- 多数 `packages/*` 的 `build` 是校验式 `tsc --noEmit`。
- 生产部署由 `web-v*` tag 触发，同时发布 `portal-web` 与 `admin-web`。
