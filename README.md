# MonoApp 前端 Monorepo 脚手架

本仓库是一个面向中大型团队协作的前端 Monorepo 初版脚手架。

## 环境要求

- Node.js 20.x
- pnpm 10.x（仓库声明：`packageManager: pnpm@10.2.1`）

## 快速开始

```bash
pnpm install
pnpm dev:admin
```

## 工作区结构

- `apps/admin-web`：可运行的 Vue 3 + Vite 应用
- `apps/portal-web`：门户应用占位包
- `apps/ai-console`：AI 工作台占位包
- `packages/*`：共享基础能力与 SDK 骨架

## 质量门禁

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 流程文档

- [流程总览](./docs/workflows/README.md)
- [构建流程](./docs/workflows/build.md)
- [提交流程](./docs/workflows/commit.md)
- [测试流程](./docs/workflows/test.md)
- [部署流程](./docs/workflows/deploy.md)

## 说明

构建、提交、测试、部署的执行手册已完整补充，详见 `docs/workflows/` 目录。
