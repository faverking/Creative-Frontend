# Test Workflow

## 测试栈

- 单元测试：Vitest
- Vue 组件测试：Vue Test Utils + Vitest
- 共享配置：`@frontend/vitest-config`
- E2E：仅保留入口，尚未纳入默认质量门禁

## 当前分布

应用：

- `admin-web`：已有少量组件测试，接入共享 Vue app 测试配置。
- `portal-web`：已接入共享 Vue app 测试配置，当前业务测试仍待补齐。
- `ai-console`：`test` 脚本用于保持 workspace 闭环。

共享包中已有代表性测试：

- `@frontend/config`
- `@frontend/request`
- `@frontend/app-runtime`
- `@frontend/login-sdk`
- `@frontend/permission-sdk`

其他包多数使用 `vitest run --passWithNoTests` 保持测试入口可执行。

## 配置规范

- 共享 Vitest 规则放在 `packages/vitest-config`。
- Vue 应用使用 `defineVueAppVitestConfig(import.meta.url)`。
- TS-only 共享包如需特例，优先接入 `defineNodePackageVitestConfig()`。
- 单元测试就近放在 app/package 源码旁；根目录 `tests/e2e` 只放端到端测试。

## 命令

```bash
pnpm test
pnpm --filter admin-web test
pnpm --filter portal-web test
pnpm --filter @frontend/config test
pnpm --filter @frontend/request test
pnpm --filter @frontend/permission-sdk test
pnpm test:e2e
```

`pnpm test:e2e` 当前只是 E2E 入口标识，真实浏览器测试框架尚未接入默认门禁。

## 合并前建议

最小门禁：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

触及应用入口、路由、环境变量、共享包导出、Vite 配置或别名时，追加：

```bash
pnpm build
```

## 优先补齐的测试

- `portal-web` 模块路由、详情页装配、公开内容请求状态。
- `admin-web` 认证守卫、权限 landing path。
- `@frontend/theme` 主题切换与字体延迟加载。
- `@frontend/monitor-sdk`、`@frontend/tracking-sdk` 适配器行为。
- `@frontend/ai-sdk` API 封装与组件交互。
