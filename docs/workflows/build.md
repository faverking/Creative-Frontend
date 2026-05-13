# Build Workflow

本文档说明当前仓库如何进行本地运行、构建校验和 CI 对齐验证。

## 1. 前置准备

```bash
corepack enable
pnpm install
```

两个可运行应用都自带：

- `.env.development`
- `.env.test`
- `.env.production`

如果新增环境文件，至少要保证以下变量存在：

- `VITE_APP_TITLE`
- `VITE_API_BASE_URL`
- `VITE_SSO_BASE_URL`
- `VITE_MONITOR_DSN`
- `VITE_TRACKING_APP_ID`
- `VITE_AI_API_BASE_URL`

## 2. 本地启动

### 2.1 管理端

```bash
pnpm dev:admin
```

- 应用：`apps/admin-web`
- 默认端口：`5173`
- `/api` 代理目标来自 `apps/admin-web/vite.config.ts` 中读取的 `VITE_API_BASE_URL`

### 2.2 门户端

```bash
pnpm dev:portal
```

- 应用：`apps/portal-web`
- 默认端口：`5174`
- `/api` 代理目标来自 `apps/portal-web/vite.config.ts` 中读取的 `VITE_API_BASE_URL`

### 2.3 AI 工作台预备应用

```bash
pnpm dev:ai
```

当前用于保持 workspace 命令闭环，不启动生产服务。

## 3. 构建命令

### 3.1 全量构建

```bash
pnpm build
```

根脚本等价于：

```bash
pnpm -r build
```

当前实际效果：

- `admin-web`：执行 `vite build`，产物在 `apps/admin-web/dist`
- `portal-web`：执行 `vite build`，产物在 `apps/portal-web/dist`
- `ai-console`：执行工作区闭环命令，不产出生产构建物
- 大多数共享包：执行 `tsc -p tsconfig.json --noEmit`
- `@frontend/eslint-config`：输出 skip 日志

### 3.2 仅构建单个应用

```bash
pnpm --filter admin-web build
pnpm --filter portal-web build
```

### 3.3 仅构建共享包

```bash
pnpm -r --filter "@frontend/*" build
```

适用于只修改了 `packages/*` 的场景，但要注意它更偏向类型校验，并不默认产出 `dist`。

### 3.4 仅构建单个共享包

```bash
pnpm --filter @frontend/request build
pnpm --filter @frontend/login-sdk build
```

## 4. 推荐顺序

如果目标是合并前校验，建议按下面顺序执行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

如果目标是快速确认工作区完整性，也可以先执行：

```bash
node scripts/verify-workspace.mjs
```

## 5. 与当前 GitHub Actions 对齐

当前 GitHub Actions 由 `web-v*` tag 触发，构建相关步骤是：

```bash
pnpm lint
pnpm typecheck
pnpm test
node scripts/prepare-frontend-build-env.mjs
pnpm --filter portal-web build
pnpm --filter admin-web build
```

这里需要特别注意：

- `portal-web` 发布在站点根路径 `/`
- `admin-web` 发布在 `/admin/`
- GitHub Actions 先读取各应用自己的 `.env.production`，再用 `FRONTEND_*` 共享变量或 `PORTAL_*` / `ADMIN_*` 应用变量生成临时 `.env.production.local`
- 每个发布应用必须最终解析出 `VITE_API_BASE_URL`；当前仓库 `.env.production` 已提供阿里云单机默认值
- `admin-web` 浏览器 OpenAI 实验链路也由 `node scripts/prepare-frontend-build-env.mjs` 写入生产构建环境；OpenAI key 推荐用 `ADMIN_TESTAI_API_KEY_ENCRYPTED` + `ADMIN_TESTAI_API_KEY_ENCRYPTION_KEY` 解密注入，不写入 git
- GitHub Actions 会把两个 dist 打包进同一个 `frontend.tar.gz`

## 6. 常见问题

### 6.1 `pnpm` 不存在

- 确认 Node.js 版本为 `20.x`
- 执行 `corepack enable`
- 重新打开终端

### 6.2 明明配置了 `VITE_API_BASE_URL`，运行时 `apiBaseUrl` 却是空字符串

这是当前仓库的预期行为：

- `development/test` 环境下，`@frontend/config` 会返回空的运行时 base URL
- 实际请求依赖 Vite dev server 的 `/api` 代理

### 6.3 共享包 build 之后没有 `dist`

当前大部分共享包的 `build` 是 `tsc --noEmit`，目的是校验 TypeScript 类型与入口结构，不是产出发布制品。

### 6.4 路径别名解析失败

- 确认在仓库根目录执行 `pnpm install`
- 检查 `tsconfig.base.json` 中 `@frontend/*` 路径映射
- 检查应用 `vite.config.ts` 中 `@` 别名是否指向本应用 `src`
