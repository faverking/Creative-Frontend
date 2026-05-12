# MonoApp 前端 Monorepo

本仓库是面向内容社区的前端 Monorepo，包含门户端、管理端和共享前端能力。

## 环境要求

- Node.js 20.x
- pnpm 10.x（仓库声明：`packageManager: pnpm@10.2.1`）

## 快速开始

```bash
pnpm install
pnpm dev:portal
```

## 工作区结构

- `apps/admin-web`：管理端应用，生产部署在 `/admin/`
- `apps/portal-web`：门户应用，生产部署在站点根路径 `/`
- `apps/ai-console`：AI 工作台预备应用，当前不纳入生产前端发布包
- `packages/*`：共享基础能力、运行时装配层、SDK 与工程配置

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

构建、提交、测试、部署的执行手册详见 `docs/workflows/` 目录。生产部署统一通过 `web-v*` tag 触发 GitHub Actions 发布到阿里云服务器。
