# Build Workflow

## 准备

```bash
corepack enable
pnpm install
```

`admin-web` 和 `portal-web` 均包含 `.env.development`、`.env.test`、`.env.production`。关键变量见 `docs/overview.md`。

## 本地启动

| 应用 | 命令 | 默认端口 |
| --- | --- | --- |
| `apps/admin-web` | `pnpm dev:admin` | `5173` |
| `apps/portal-web` | `pnpm dev:portal` | `5174` |
| `apps/ai-console` | `pnpm dev:ai` | 不启动生产服务 |

开发 / 测试环境下，运行时 `apiBaseUrl` 会置空，实际请求通过 Vite `/api` 代理转发。

## 构建

```bash
pnpm build
```

等价于 `pnpm -r build`。当前效果：

- `admin-web`：`vite build`，产物在 `apps/admin-web/dist`
- `portal-web`：`vite build`，产物在 `apps/portal-web/dist`
- `ai-console`：闭环命令，不产出生产构建物
- 多数 `packages/*`：`tsc -p tsconfig.json --noEmit`

按范围构建：

```bash
pnpm --filter admin-web build
pnpm --filter portal-web build
pnpm -r --filter "@frontend/*" build
pnpm --filter @frontend/request build
```

## 合并前建议

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

快速检查 workspace 关键文件：

```bash
node scripts/verify-workspace.mjs
```

## 对齐 GitHub Actions

当前生产流水线的构建相关步骤：

```bash
pnpm lint
pnpm typecheck
pnpm test
node scripts/prepare-frontend-build-env.mjs
pnpm --filter portal-web build
pnpm --filter admin-web build
```

注意：

- `portal-web` 发布到 `/`
- `admin-web` 发布到 `/admin/`
- 构建环境由各应用 `.env.production` 加 GitHub Variables 覆盖生成
- 两个 dist 会一起打包为 `frontend.tar.gz`

## 常见问题

- `pnpm` 不存在：确认 Node.js 20，执行 `corepack enable` 后重开终端。
- 共享包 build 没有 `dist`：多数共享包当前是类型校验式 build。
- 别名解析失败：先确认已在根目录 `pnpm install`，再检查 `tsconfig.base.json` 与应用 `vite.config.ts`。
