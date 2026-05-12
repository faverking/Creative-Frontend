# Deploy Workflow

本文档描述当前 GitLab CI/CD 与部署脚本的真实行为，重点是“当前到底部署了什么”。

## 1. 流水线触发规则

`.gitlab-ci.yml` 当前会在以下场景运行：

- `merge_request_event`
- 任意分支提交

## 2. CI 阶段

当前 stages 为：

1. `install`
2. `lint`
3. `typecheck`
4. `test`
5. `build`
6. `deploy`

## 3. 各 Job 的真实职责

### 3.1 `install`

只输出 `pnpm -v`，但在 `before_script` 中已经完成：

- `corepack enable`
- `pnpm config set store-dir $PNPM_STORE_DIR`
- `pnpm install --frozen-lockfile`

### 3.2 `lint`

执行：

```bash
pnpm lint
```

### 3.3 `typecheck`

执行：

```bash
pnpm typecheck
```

### 3.4 `unit_test`

执行：

```bash
pnpm test
```

### 3.5 `build_admin`

执行：

```bash
pnpm --filter admin-web build
```

并把以下目录作为 artifacts 保存 7 天：

```text
apps/admin-web/dist
```

### 3.6 `build_packages`

执行：

```bash
pnpm -r --filter "@frontend/*" build
```

这里主要是共享包的类型校验式 build，不是统一产出发布制品。

## 4. 当前部署范围

当前部署链路只服务于 `admin-web`：

- `BUILD_OUTPUT` 默认值是 `apps/admin-web/dist`
- `deploy` 阶段依赖 `build_admin` 的 artifacts
- `portal-web` 当前没有对应的 CI 构建和部署 job

如果要把门户也纳入上线链路，需要补充新的 build/deploy job，或者显式切换 `BUILD_OUTPUT` 和部署目标。

## 5. 部署脚本行为

部署入口：

```bash
scripts/deploy/deploy-web.sh [test|prod]
```

脚本会执行：

1. 校验目标环境参数
2. 校验构建目录是否存在
3. 写入 `DEPLOY_SSH_PRIVATE_KEY`
4. `ssh-keyscan` 写入 `known_hosts`
5. 创建远端 `releases/<timestamp>-<commit>` 目录
6. `rsync --delete` 同步静态文件
7. 使用软链接 `current` 原子切换版本

因此当前部署模型是：

- 保留历史 release
- 使用软链接切换当前版本
- 基于 SSH + rsync 的静态站点发布

## 6. 分支策略

### 6.1 测试环境

`deploy_test`：

- 目标分支：`test`
- 触发方式：自动
- 目标环境名：`test`

### 6.2 生产环境

`deploy_prod`：

- 目标分支：`main`
- 触发方式：手动
- 目标环境名：`production`

## 7. 必需 CI 变量

### 7.1 通用变量

- `DEPLOY_SSH_PRIVATE_KEY`
- `BUILD_OUTPUT`，默认 `apps/admin-web/dist`

### 7.2 测试环境变量

- `TEST_DEPLOY_HOST`
- `TEST_DEPLOY_USER`
- `TEST_DEPLOY_PORT`，默认 `22`
- `TEST_DEPLOY_PATH`
- `TEST_DEPLOY_URL`，可选

### 7.3 生产环境变量

- `PROD_DEPLOY_HOST`
- `PROD_DEPLOY_USER`
- `PROD_DEPLOY_PORT`，默认 `22`
- `PROD_DEPLOY_PATH`
- `PROD_DEPLOY_URL`，可选

## 8. 本地模拟当前 CI

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter admin-web build
pnpm -r --filter "@frontend/*" build
```

如果你要验证门户本身是否可构建，需要额外手动执行：

```bash
pnpm --filter portal-web build
```

因为这一步当前不在 GitLab CI 的默认链路里。
