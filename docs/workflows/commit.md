# Commit Workflow

本文档说明当前仓库提交前后的标准动作，以及已接入的本地提交治理。

## 1. 提交前最小门禁

```bash
pnpm lint
pnpm typecheck
pnpm test
```

如果改动会影响打包、入口文件、环境变量或共享包导出，建议追加：

```bash
pnpm build
```

## 2. 已接入的 Git Hooks

### 2.1 `pre-commit`

当前执行命令：

```bash
pnpm lint-staged
```

根 `package.json` 中的 `lint-staged` 规则为：

- `*.{js,cjs,mjs,ts,tsx,vue,json,md,yml,yaml}` -> `prettier --write`
- `*.{ts,tsx,vue}` -> `eslint --fix`

这意味着：

- 文档改动也会被 `prettier` 处理
- 代码文件在提交前会尝试自动修复 ESLint 问题

### 2.2 `commit-msg`

当前执行命令：

```bash
pnpm commitlint --edit "$1"
```

`commitlint.config.cjs` 当前继承：

```js
module.exports = {
  extends: ['@commitlint/config-conventional']
}
```

因此提交信息需要满足 Conventional Commits 规范。

## 3. 推荐提交信息格式

```text
<type>: <subject>
```

常用类型：

- `feat`：新功能
- `fix`：缺陷修复
- `refactor`：重构
- `docs`：文档变更
- `test`：测试相关
- `chore`：依赖、脚本、工程治理变更

示例：

```text
feat: add portal gallery module query state
fix: refresh expired token before protected route enter
docs: refresh monorepo overview and workflow guides
```

## 4. 建议提交流程

1. 拉取并同步最新代码。
2. 按改动范围执行对应门禁命令。
3. `git add` 暂存改动。
4. 使用规范 commit message 提交。
5. 推送分支并发起 Pull Request。

## 5. 什么时候需要 changeset

当前仓库已接入 `changeset`，根命令为：

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

建议在下面场景使用：

- 修改 `packages/*` 对外导出的 API
- 共享包对外契约发生变化
- 需要为后续发布保留版本记录

如果只是应用内部页面、样式或文档更新，一般不需要新增 changeset。
