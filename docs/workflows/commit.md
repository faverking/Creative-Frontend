# Commit Workflow

## 提交前门禁

默认最小门禁：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

影响打包、入口、环境变量、共享包导出或 CI 时，追加：

```bash
pnpm build
```

## Git hooks

`pre-commit`：

```bash
pnpm lint-staged
```

根 `package.json` 中：

- `*.{ts,tsx,vue}`：`eslint --fix` + `prettier --write`
- `*.{js,cjs,mjs,json,md,yml,yaml}`：`prettier --write`

`commit-msg`：

```bash
pnpm commitlint --edit "$1"
```

提交信息遵守 Conventional Commits。

## 提交信息

格式：

```text
<type>: <subject>
```

常用类型：

- `feat`
- `fix`
- `refactor`
- `docs`
- `test`
- `chore`

示例：

```text
docs: simplify monorepo workflow guides
fix: refresh expired token before protected route enter
feat: add portal gallery module query state
```

## 流程

1. 同步最新代码。
2. 按改动范围执行门禁。
3. `git add`。
4. 使用规范 commit message 提交。
5. 推送分支并发起 PR。

## Changeset

命令：

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

需要 changeset 的场景：

- 修改 `packages/*` 对外导出的 API。
- 共享包对外契约变化。
- 需要为后续发布保留版本记录。

应用内部页面、样式或文档更新通常不需要 changeset。
