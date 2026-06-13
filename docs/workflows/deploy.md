# Deploy Workflow

前端生产部署由 GitHub Actions tag 工作流完成，目标服务器路径为 `/www/apps/frontend`。

## 部署结果

```text
/www/apps/frontend
├─ releases/<tag>
├─ shared/frontend.tar.gz
└─ current -> releases/<tag>
```

一次发布同时包含：

- `portal-web`：站点根路径 `/`
- `admin-web`：子路径 `/admin/`

`ai-console` 当前不进入生产发布包。

## GitHub Actions

入口：

```text
.github/workflows/deploy-frontend.yml
```

触发：

- 推送 `web-v*` tag，例如 `web-v1.0.0`
- `main` push 不直接发布
- tag 只能包含字母、数字、点、下划线、连字符

核心步骤：

1. Checkout
2. 设置 Node.js 20 与 `pnpm@10.2.1`
3. `pnpm install --frozen-lockfile`
4. `pnpm lint && pnpm typecheck && pnpm test`
5. `node scripts/prepare-frontend-build-env.mjs`
6. 构建 `portal-web` 和 `admin-web`
7. 打包 `frontend.tar.gz`
8. 上传到 `/www/apps/frontend/shared`
9. 解压到 `/www/apps/frontend/releases/<tag>`
10. 原子切换 `/www/apps/frontend/current`
11. 仅保留最近 5 个 release

发布包结构：

```text
frontend.tar.gz
├─ portal/
└─ admin/
```

## 构建环境变量

生成入口：

```bash
node scripts/prepare-frontend-build-env.mjs
```

解析顺序：

- `portal-web`：`PORTAL_*` -> `FRONTEND_*` -> `apps/portal-web/.env.production`
- `admin-web`：`ADMIN_*` -> `FRONTEND_*` -> `apps/admin-web/.env.production`

每个发布应用必须最终解析出 `VITE_API_BASE_URL`。

常用共享变量：

- `FRONTEND_API_BASE_URL`
- `FRONTEND_SSO_BASE_URL`
- `FRONTEND_AI_API_BASE_URL`
- `FRONTEND_MONITOR_DSN`
- `FRONTEND_TRACKING_APP_ID`
- `FRONTEND_API_PREFIX`
- `FRONTEND_OAUTH_PROVIDER`

应用覆盖变量：

- `PORTAL_API_BASE_URL`、`PORTAL_SSO_BASE_URL`、`PORTAL_AI_API_BASE_URL`、`PORTAL_ADMIN_WEB_BASE_URL`
- `ADMIN_API_BASE_URL`、`ADMIN_SSO_BASE_URL`、`ADMIN_AI_API_BASE_URL`
- `ADMIN_DEEPSEEK_API_BASE_URL`、`ADMIN_DEEPSEEK_MODEL`

默认回退：

- `SSO_BASE_URL`、`AI_API_BASE_URL` 沿用当前应用解析后的 `API_BASE_URL`
- `MONITOR_DSN=disabled`
- `TRACKING_APP_ID=portal-web` 或 `admin-web`
- `API_PREFIX=/api/v1`
- `OAUTH_PROVIDER=google`
- `PORTAL_ADMIN_WEB_BASE_URL=/admin/`

## DeepSeek 浏览器直连链路

`admin-web` 辅助编辑直连 DeepSeek Chat Completions API，默认模型为 `deepseek-v4-flash`。

API key 不写入 git，不建议放 GitHub Variables 明文项。推荐：

- Secret：`ADMIN_DEEPSEEK_API_KEY_ENCRYPTION_KEY`
- Variable：`ADMIN_DEEPSEEK_API_KEY_ENCRYPTED`

本地生成密文：

```powershell
$env:ADMIN_DEEPSEEK_API_KEY='sk-...'
$env:ADMIN_DEEPSEEK_API_KEY_ENCRYPTION_KEY='your-long-random-secret'
node scripts/encrypt-admin-deepseek-api-key.mjs
```

CI 也兼容直接读取 Secret `ADMIN_DEEPSEEK_API_KEY`，但优先使用密文 + 解密密钥。解密后的 key 会进入浏览器构建产物，属于运行时可见配置。

## GitHub 配置

Secrets：

- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_PORT`
- `SERVER_SSH_KEY`
- `ADMIN_DEEPSEEK_API_KEY_ENCRYPTION_KEY`

服务器一次性初始化：

```bash
mkdir -p /www/apps/frontend/releases /www/apps/frontend/shared
```

## 发版

推荐从已合入 `main` 的提交打 tag：

```bash
git checkout main
git pull
git tag web-v1.0.0
git push origin web-v1.0.0
```

重发优先使用递增 tag，例如 `web-v1.0.1`。workflow 串行执行，避免多个 tag 同时切换 `current`。

## Nginx 契约

关键要求：

- `root` 指向 `/www/apps/frontend/current`
- `/admin` 重定向到 `/admin/`
- `/admin/` fallback 到 `/admin/index.html`
- `/api/` 代理到后端
- 门户 `location /` 使用 `root /www/apps/frontend/current/portal` 并 fallback 到 `/index.html`

参考：

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
    root /www/apps/frontend/current/portal;
    try_files $uri $uri/ /index.html;
  }
}
```

不要把门户 fallback 写成 `/portal/index.html` 形式，否则可能造成内部重定向循环。当前 workflow 不执行 `nginx -t` 或 reload，发布通过 symlink 原子切换生效。

## 本地验证

```bash
pnpm lint
pnpm typecheck
pnpm test
node scripts/prepare-frontend-build-env.mjs
pnpm --filter portal-web build
pnpm --filter admin-web build
```

验收重点：

- `apps/portal-web/dist/index.html` 使用根路径资源。
- `apps/admin-web/dist/index.html` 使用 `/admin/` 资源。
- 刷新 `/articles/:id` 与 `/admin/home/overview` 不返回 404。
- 前端请求进入 `/api/v1/...` 并由 Nginx 转发。
