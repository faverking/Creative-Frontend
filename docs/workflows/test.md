# Test Workflow

本文档说明当前仓库测试能力的真实分布、执行命令和现阶段测试空白。

## 1. 当前测试栈

- 单元测试：`Vitest`
- Vue 组件测试：`Vue Test Utils + Vitest`
- 共享测试配置：`@frontend/vitest-config`
- E2E：当前只有测试入口说明，未纳入默认质量门禁

## 2. 当前测试分布

### 2.1 应用层

- `apps/admin-web`
  - 已存在 `src/components/ThemeSwitcher.test.ts`
  - 通过应用级 `vitest.config.ts` 接入共享 Vue 应用测试配置
  - 页面级测试覆盖需要继续补齐
- `apps/portal-web`
  - 已通过应用级 `vitest.config.ts` 接入共享 Vue 应用测试配置
  - 当前没有已落地的 `.test` 文件
  - 业务能力主要依赖运行时与页面联调
- `apps/ai-console`
  - `test` 脚本用于保持 workspace 命令闭环

### 2.2 共享包

当前已存在代表性测试的共享包包括：

- `@frontend/config`
  - `src/index.test.ts`
- `@frontend/request`
  - `src/__tests__/client.test.ts`
- `@frontend/app-runtime`
  - `src/auth-runtime-core.test.ts`
- `@frontend/login-sdk`
  - OAuth / SSO factory、token manager、token payload 测试
- `@frontend/permission-sdk`
  - factory、directive、permission engine、route guard 测试

其余共享包普遍通过：

```bash
vitest run --passWithNoTests
```

也就是说，当前很多包已经具备测试入口，但并不一定已有完善用例。

## 3. 配置规范

- 可复用的 Vitest 规则统一放在 `packages/vitest-config`。
- Vue 应用通过本地 `vitest.config.ts` 接入 `defineVueAppVitestConfig(import.meta.url)`。
- TS-only 共享包后续需要本地特例时，优先接入 `defineNodePackageVitestConfig()`，不要在单个包里复制公共规则。
- 单元测试就近放在对应 app/package 的源码目录旁，根目录 `tests/e2e` 仅用于端到端测试。

## 4. 执行命令

### 4.1 全量测试

```bash
pnpm test
```

这是根脚本，会递归执行所有 workspace 的 `test`。

### 4.2 只测单个应用

```bash
pnpm --filter admin-web test
pnpm --filter portal-web test
```

### 4.3 只测单个共享包

```bash
pnpm --filter @frontend/config test
pnpm --filter @frontend/request test
pnpm --filter @frontend/permission-sdk test
```

### 4.4 E2E 入口命令

```bash
pnpm test:e2e
```

当前命令用于标识 E2E 入口，真实浏览器测试框架尚未纳入默认质量门禁。

## 5. 合并前建议

最小门禁：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

如果改动触及以下内容，建议补跑 `pnpm build`：

- 应用入口
- 路由装配
- 环境变量读取
- 共享包导出结构
- Vite 配置和别名配置

## 6. 当前测试空白

当前最值得补的测试方向：

- `apps/portal-web` 的模块路由与详情页装配
- `apps/admin-web` 的认证守卫和权限 landing path
- `@frontend/theme` 的主题切换和字体延迟加载行为
- `@frontend/monitor-sdk`、`@frontend/tracking-sdk` 的适配器行为
- `@frontend/ai-sdk` 的 API 封装和组件交互
