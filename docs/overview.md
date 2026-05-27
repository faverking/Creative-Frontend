# MonoApp 工程概览

`docs/overview.md` 只记录工程事实；编码约束看 `docs/spec.md`，命令流程看 `docs/workflows/*`。

## 1. 一句话

MonoApp 是基于 `pnpm workspace` 的前端 monorepo：

- `apps/*`：可运行应用
- `packages/*`：共享基础能力、SDK、运行时装配与工程配置
- 根目录：workspace 配置、质量门禁、CI/CD、发布治理

当前包含：

- 应用：`admin-web`、`portal-web`、`ai-console`
- 共享包：`@frontend/*`
- 工程配置包：`@frontend/eslint-config`、`@frontend/vitest-config`

## 2. 顶层目录

```text
apps/                 业务应用
packages/             共享能力与 SDK
docs/                 工程说明与流程文档
scripts/              工作区脚本
tests/e2e/            E2E 入口说明
.github/workflows/    GitHub Actions
.husky/               Git hooks
package.json          根脚本
pnpm-workspace.yaml   workspace 范围
tsconfig.base.json    全局 TS 配置与 @frontend/* 别名
```

`pnpm-workspace.yaml` 纳入：

```yaml
packages:
  - apps/*
  - packages/*
  - packages/*/*
```

`packages/*/*` 用于 SDK 子入口，例如 `core`、`plugin`、`adapter`、`api`、`components`、`composables`。

## 3. 应用

| 应用 | 状态 | 默认端口 | 说明 |
| --- | --- | --- | --- |
| `apps/admin-web` | 可运行 | `5173` | 管理端，包含登录/注册、权限路由、后台首页、内容管理、AI 面板装配 |
| `apps/portal-web` | 可运行 | `5174` | 门户端，包含首页、公开模块、公开详情、工作台、登录弹窗、主题切换 |
| `apps/ai-console` | 预备 | - | 当前用于保持 workspace 命令闭环，不纳入生产前端发布包 |

`admin-web` 主要目录：

- `src/api`：业务 HTTP 装配
- `src/auth`、`src/permission`、`src/router`：登录态、权限、路由守卫
- `src/views`、`src/components`、`src/styles`：后台页面、组件和样式

`portal-web` 主要目录：

- `src/api`：首页、模块、详情、工作台 API
- `src/constants`：门户业务常量
- `src/components`：全局组件、图片、请求边界、图标
- `src/views/home`、`src/views/modules`、`src/views/public`、`src/views/workspace`
- `src/styles`：`index.css`、`tokens/*`、`tokens-dark/*`、`adaptive/*`

关键路由：

- `admin-web`：`/login`、`/register`、`/home/overview`、`/home/manage`、`/home/admin/overview`、`/home/admin/manage`、`/home/books`、`/home/topics`、`/home/images`、`/home/articles`
- `portal-web`：`/workspace`、`/articles/:id`、`/topics/:id`、`/books/:id`、`/galleries/:id`

## 4. 共享包

基础能力：

- `@frontend/config`：环境变量读取与校验
- `@frontend/constants`：共享常量
- `@frontend/types`：共享类型
- `@frontend/composables`：通用组合式逻辑
- `@frontend/theme`：主题 token、字体、Element Plus 覆盖
- `@frontend/ui`：基础 UI 插件
- `@frontend/store`：共享 Pinia 模块
- `@frontend/request`：Axios 客户端与拦截器
- `@frontend/app-runtime`：认证、HTTP、观测等跨应用装配层

领域 SDK：

- `@frontend/login-sdk`：`core / plugin / adapter`
- `@frontend/permission-sdk`：`core / plugin / adapter`
- `@frontend/tracking-sdk`：`core / plugin / adapter`
- `@frontend/monitor-sdk`：`core / plugin / adapter`
- `@frontend/ai-sdk`：`api / components / composables / adapter`

工程配置：

- `@frontend/eslint-config`
- `@frontend/vitest-config`

## 5. 启动链路

`admin-web` 与 `portal-web` 的主链路基本一致：

```text
loadEnvConfig
-> create Pinia
-> init user/theme stores
-> setupObservabilityRuntime
-> create loginSdk
-> create permissionEngine
-> setupAuthRuntime
-> setupHttpClient
-> handleOAuthCallbackFromLocation
-> install Vue plugins
-> router.isReady
-> app.mount
-> scheduleThemeFontsLoad
```

## 6. 环境与构建事实

关键环境变量：

- `VITE_APP_TITLE`
- `VITE_API_BASE_URL`
- `VITE_SSO_BASE_URL`
- `VITE_MONITOR_DSN`
- `VITE_TRACKING_APP_ID`
- `VITE_AI_API_BASE_URL`

默认值：

- `VITE_API_PREFIX=/api/v1`
- `VITE_OAUTH_PROVIDER=google`

构建含义：

- `admin-web`、`portal-web` 的 `build` 会产出 `dist`
- `ai-console` 当前不产出生产构建物
- 多数 `packages/*` 的 `build` 是 `tsc --noEmit`
- 共享包当前更像源码工作区依赖，不是先构建 `dist` 再消费的发布型包

## 7. 工程入口

- 根脚本：`dev:admin`、`dev:portal`、`dev:ai`、`lint`、`typecheck`、`test`、`build`、`format`
- Git hooks：`pre-commit -> pnpm lint-staged`，`commit-msg -> pnpm commitlint --edit "$1"`
- 部署工作流：`.github/workflows/deploy-frontend.yml`
- 部署环境生成：`scripts/prepare-frontend-build-env.mjs`
- 工作区校验：`scripts/verify-workspace.mjs`

## 8. 推荐阅读

1. `docs/spec.md`
2. `docs/workflows/README.md`
3. `docs/overview.md`
4. `apps/admin-web/src/main.ts`
5. `apps/portal-web/src/main.ts`
6. `packages/app-runtime/src/index.ts`
7. `packages/request/src/index.ts`
