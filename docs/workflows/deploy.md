# Deploy Workflow

本文档描述当前前端生产部署链路。仓库统一通过 GitHub Actions tag 工作流发布到阿里云服务器。

## 1. 部署目标

前端部署到阿里云服务器：

```text
/www/apps/frontend
/www/apps/frontend/releases
/www/apps/frontend/shared
/www/apps/frontend/current -> /www/apps/frontend/releases/<tag>
```

一次部署同时发布两个应用：

- `portal-web`：站点根路径 `/`
- `admin-web`：管理端子路径 `/admin/`

当前生产发布包只包含 `portal-web` 与 `admin-web`。

## 2. GitHub Actions

部署入口：

```text
.github/workflows/deploy-frontend.yml
```

触发规则：

- 推送 `web-v*` tag 自动触发，例如 `web-v1.0.0`
- `main` 分支 push 不直接发布生产前端
- tag 名必须只包含字母、数字、点、下划线和连字符，避免被当作多级目录

流水线步骤：

1. Checkout source code
2. 提取 tag 名作为 release id
3. Setup Node.js 20
4. 启用 `pnpm@10.2.1`
5. `pnpm install --frozen-lockfile`
6. `pnpm lint`
7. `pnpm typecheck`
8. `pnpm test`
9. 构建 `portal-web`，`VITE_APP_BASE=/`
10. 构建 `admin-web`，`VITE_APP_BASE=/admin/`
11. 打包 `frontend.tar.gz`
12. 上传到 `/www/apps/frontend/shared`
13. 解压到 `/www/apps/frontend/releases/<tag>`
14. 原子切换 `/www/apps/frontend/current`
15. 清理历史 release，仅保留最近 5 个

## 3. 发布包结构

`frontend.tar.gz` 内部固定为：

```text
portal/
admin/
```

服务器解压后对应：

```text
/www/apps/frontend/current/portal/index.html
/www/apps/frontend/current/admin/index.html
```

## 4. GitHub 配置

### 4.1 Secrets

复用后端同名 secrets：

- `SERVER_HOST`：例如 `121.41.223.169`
- `SERVER_USER`
- `SERVER_PORT`
- `SERVER_SSH_KEY`

### 4.2 Variables

以下变量会注入 Vite 构建产物，属于公开前端配置：

- `FRONTEND_API_BASE_URL`
- `FRONTEND_SSO_BASE_URL`
- `FRONTEND_AI_API_BASE_URL`
- `FRONTEND_MONITOR_DSN`
- `FRONTEND_TRACKING_APP_ID`
- `FRONTEND_OAUTH_PROVIDER`

当前阿里云单机部署建议：

```text
FRONTEND_API_BASE_URL=http://121.41.223.169
FRONTEND_SSO_BASE_URL=http://121.41.223.169
FRONTEND_AI_API_BASE_URL=http://121.41.223.169
FRONTEND_OAUTH_PROVIDER=google
```

`FRONTEND_MONITOR_DSN` 与 `FRONTEND_TRACKING_APP_ID` 按实际观测系统配置。

### 4.3 服务器目录前置条件

以下目录属于服务器一次性初始化内容，不在每次部署前重复创建：

```bash
mkdir -p /www/apps/frontend/releases /www/apps/frontend/shared
```

GitHub Actions 默认 `/www/apps/frontend/shared` 已存在，因为上传步骤会直接把 `frontend.tar.gz` 放到该目录。

## 5. 发版命令

推荐从已经合入 `main` 的提交打生产 tag：

```bash
git checkout main
git pull
git tag web-v1.0.0
git push origin web-v1.0.0
```

如需重发同一个版本，优先新建递增 tag，例如 `web-v1.0.1`。工作流会串行执行生产部署，避免多个 tag 同时切换 `/www/apps/frontend/current`。

## 6. Nginx 契约

建议 Nginx 站点配置满足：

```nginx
server {
  listen 80;
  server_name 121.41.223.169;

  root /www/apps/frontend/current;

  location = /admin {
    return 301 /admin/;
  }

  location ^~ /admin/ {
    try_files $uri $uri/ /admin/index.html;
  }

  location ^~ /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files /portal$uri /portal$uri/ /portal/index.html;
  }
}
```

当前 workflow 不在每次发布时执行 `nginx -t` 或 `systemctl reload nginx`。Nginx 只需要固定指向 `/www/apps/frontend/current`，后续发布通过原子切换 symlink 生效；如服务器启用了强文件缓存，可在服务器运维流程里单独 reload。

## 7. 本地验证

```bash
pnpm lint
pnpm typecheck
pnpm test
```

构建 base path 验证：

```bash
VITE_APP_BASE=/ pnpm --filter portal-web build
VITE_APP_BASE=/admin/ pnpm --filter admin-web build
```

Windows PowerShell 可使用：

```powershell
$env:VITE_APP_BASE='/'; pnpm --filter portal-web build
$env:VITE_APP_BASE='/admin/'; pnpm --filter admin-web build
```

验收重点：

- `apps/portal-web/dist/index.html` 使用根路径资源。
- `apps/admin-web/dist/index.html` 使用 `/admin/` 资源。
- 直接刷新 `/articles/:id` 与 `/admin/home/overview` 不返回 404。
- 前端请求进入 `/api/v1/...` 并由 Nginx 转发到后端。
