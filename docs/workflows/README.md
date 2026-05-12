# Workflow Playbook

本文档汇总 MonoApp 当前可执行的工程流程，内容已和仓库脚本、Git hooks、CI 配置以及部署脚本对齐。

## 1. 适用范围

- Node.js `20.x`
- pnpm `10.2.1`
- 仓库根目录执行命令
- Workspace 范围：`apps/*`、`packages/*`

首次进入仓库建议先执行：

```bash
corepack enable
pnpm install
```

## 2. 常用入口

### 2.1 本地启动

```bash
pnpm dev:admin
pnpm dev:portal
pnpm dev:ai
```

当前行为：

- `dev:admin` -> 启动 `admin-web`，默认端口 `5173`
- `dev:portal` -> 启动 `portal-web`，默认端口 `5174`
- `dev:ai` -> 输出 placeholder 日志，不启动真实应用

### 2.2 全量门禁

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### 2.3 按范围执行

```bash
pnpm --filter admin-web build
pnpm --filter portal-web build
pnpm --filter @frontend/request test
pnpm -r --filter "@frontend/*" build
```

## 3. 快速决策表

| 场景              | 推荐命令                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 只验证管理端      | `pnpm --filter admin-web lint && pnpm --filter admin-web typecheck && pnpm --filter admin-web test && pnpm --filter admin-web build`                             |
| 只验证门户端      | `pnpm --filter portal-web lint && pnpm --filter portal-web typecheck && pnpm --filter portal-web test && pnpm --filter portal-web build`                         |
| 只验证共享包      | `pnpm -r --filter "@frontend/*" lint && pnpm -r --filter "@frontend/*" typecheck && pnpm -r --filter "@frontend/*" test && pnpm -r --filter "@frontend/*" build` |
| 提交前最小门禁    | `pnpm lint && pnpm typecheck && pnpm test`                                                                                                                       |
| 对齐当前 CI       | `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter admin-web build && pnpm -r --filter "@frontend/*" build`                                              |
| 查看 E2E 占位状态 | `pnpm test:e2e`                                                                                                                                                  |

## 4. 当前流程文档索引

- [构建流程](./build.md)
- [提交流程](./commit.md)
- [测试流程](./test.md)
- [部署流程](./deploy.md)

## 5. 使用时需要知道的事实

- `admin-web` 和 `portal-web` 都是可运行应用
- `ai-console` 当前仍是 placeholder
- `packages/*` 的 `build` 大多是 `tsc --noEmit`，属于“校验式 build”
- 当前 GitLab CI 只对 `admin-web` 做制品部署，`portal-web` 尚未接入部署链路
