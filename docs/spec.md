# AI 生成约束与项目 Spec

## 作用与范围

- 这是新会话的必读规范，优先级高于 `docs/overview.md`。
- `overview` 只负责工程概览；稳定边界、分层约束、共享规则、UI 规范统一写在这里。
- 当前仓库是 monorepo。
- 主要活跃应用：
  - `apps/portal-web`
  - `apps/admin-web`
- 公共包位于 `packages/*`。
- 公开内容相关后端接口来自兄弟仓库 `MonoNest`，不在本仓库内部。

## 新会话读取顺序

1. `docs/spec.md`
2. `docs/overview.md`
3. `docs/workflows/README.md`
4. `apps/portal-web/src/styles/index.css`
5. `apps/portal-web/src/styles/tokens/*.css`
6. `apps/portal-web/src/styles/tokens-dark/*.css`
7. `apps/portal-web/src/styles/adaptive/*.css`

## 30 秒速读

- `portal-web` 显式字号不得低于 `12px`，默认桌面优先。
- `portal-web` 桌面分辨率统一按 `compact / standard / wide` 三档组织，`1920` 视角属于 `standard` 主档。
- 共享规则、通用配置、工程能力优先进入 `packages/*`，不要先写在单个 app 或根配置里兜底。
- 公开内容请求统一走 `safeGetPublic`，返回结构统一带 `errorCode`。
- `PortalRequestBoundary` 必须按原子方式使用，且 `ready` 内容保持单根舞台。
- 筛选面板只承担控制职责；结果数量与摘要放在结果区，不放在 sticky 筛选面板里。
- 同业务的首页 / 模块 / 详情主题色必须一致，骨架结构必须贴真实布局。

## 使用方式

- 先看上面的“30 秒速读”。
- 再遵守“通用约束”。
- 如果命中“PowerShell 乱码判断”场景，优先按该场景执行；该场景优先级高于其他场景约束。
- 最后判断当前任务命中了哪些“场景约束”；命中后，该场景下的约束按硬边界执行。

## 通用约束

- 不要使用破坏性 git 命令。
- 不要回退用户已有的未提交改动，除非用户明确要求。
- 先沿现有结构和设计语言做增强，不要无故重做。
- 审查全局注册组件，避免模板里重复 `import`。
- 涉及多个 app / package 的共享规则、通用配置、工程能力，优先沉淀到 `packages/*` 共享包。
- 根目录与应用目录下的配置文件尽量保持薄壳，只保留 `extends`、脚本入口和必要本地特例。

## 按场景遵守的约束

### PowerShell 乱码判断

适用判断：只要在 PowerShell 输出、终端预览、命令结果里发现中文乱码、疑似编码异常或字符显示错乱，就立即命中本节。

- 本节优先级最高，高于其他场景约束与基于终端显示的经验判断。
- 不要仅根据 PowerShell 乱码显示判断源码、文档或资源文件编码损坏。
- 优先按文件实际内容、显式编码方式读取结果，以及 `typecheck` / `build` / 运行结果判断真实编码状态。
- 如果 PowerShell 输出与文件实际内容冲突，以文件实际内容和验证结果为准。
- 在未核实前，不要因为终端乱码擅自重编码、批量转码或覆盖文件内容。

### portal-web 基础

适用判断：只要当前任务改动 `apps/portal-web`，就默认遵守本节。

- 显式 `font-size` 不得小于 `12px`。
- 默认按桌面端优先，不主动做手机适配。
- `portal-web` 当前只维护三档桌面分辨率：
  - `compact`：`1280 - 1599`
  - `standard`：`1600 - 2239`
  - `wide`：`2240+`
- `standard` 以 `1920` 视角为主设计锚点；`compact` 负责更窄桌面与低一档笔记本，`wide` 负责 2K / 超宽屏扩展。

### 公开内容 API

适用判断：当任务涉及公开内容请求、错误处理、模块 / 详情数据拉取时，遵守本节。
入口文件：

- `apps/portal-web/src/api/public-request.ts`

约定：

- `safeGetPublic` 负责把异常流适配为结果流。
- 返回结构统一为：`data`、`error`、`errorCode`。
- `errorCode` 统一归一化为：`401`、`403`、`404`、`500`。
- 不要在页面里直接判断 `AxiosError` 再拆状态码。

### Constants

适用判断：当任务涉及模块配置、筛选项、排序项、query 解析时，遵守本节。
入口文件：

- `apps/portal-web/src/constants/public-modules.ts`

约定：

- 稳定模块配置、筛选项、排序项、query 解析放 `public-modules.ts`。
- portal-web 首页、公开模块与公开详情统一只保留真实请求链路，不维护额外静态数据 constants。
- 不要把模块配置散落回 `api/*`。

### Composables

适用判断：当任务涉及模块查询状态、路由同步、详情请求状态或图包自动续载时，遵守本节。
入口文件：

- `apps/portal-web/src/views/modules/composables/usePortalModuleQuery.ts`
- `apps/portal-web/src/views/public/composables/usePublicDetailRequestState.ts`
- `apps/portal-web/src/composables/useAutoLoadSentinel.ts`

约定：

- 可共享的查询、路由同步、错误状态优先收进公共 composable。
- 公开模块与公开详情的 composable 只保留真实请求、路由同步和错误状态。
- 图包和其他滚动续载页面统一复用 `src/composables/useAutoLoadSentinel.ts`。

### 工程配置

适用判断：当任务涉及 lint、format、共享工程规则、提交钩子、脚本入口时，遵守本节。
共享入口：

- `packages/eslint-config`
- `packages/vitest-config`
- `.github/workflows/deploy-frontend.yml`

约定：

- ESLint 的共享规则、Vue / TS 通用 lint 规则，统一改在 `packages/eslint-config/*`。
- Vitest 的共享测试配置统一改在 `packages/vitest-config/*`。
- 根目录 `.eslintrc.cjs` 保持轻量壳层，默认只做 `extends` 汇总。
- 应用级 `package.json` 可以保留统一命令入口，例如 `lint`、`format`、`format:check`、`typecheck`、`test`、`build`，但不要在应用里重复定义共享规则。
- 应用级 `vitest.config.ts` 保持薄壳，只负责接入共享配置和声明必要本地特例。
- 仓库级提交链路，例如 `husky`、`lint-staged`，统一放根目录，不在单个 app 内复制一套。
- 前端部署唯一入口是 `.github/workflows/deploy-frontend.yml`；生产发布由 `web-v*` tag 触发。GitHub Variables 采用共享默认值加应用独立覆盖：`FRONTEND_*` 作为共享默认，`PORTAL_*` / `ADMIN_*` 覆盖单个应用；每个发布应用必须能解析出 `VITE_API_BASE_URL`，单机同源部署优先只配置 `FRONTEND_API_BASE_URL`。
- `portal-web` 生产部署在 `/`，`admin-web` 生产部署在 `/admin/`，新增 base path 相关行为时必须同时验证两个应用。
- 未来新增可复用的格式化配置、构建 preset、脚手架能力、通用工程脚本时，优先沉淀到 `packages/*`。

### 全局共享组件

适用判断：当任务涉及公开内容域的共享组件编排、复用、导入方式时，遵守本节。
重要组件：`PortalRequestBoundary`、`PortalModuleFilterPanel`、`PortalSectionHeading`

约定：

- 如果组件已全局注册，模板内不要重复本地导入。
- 只有在脚本类型引用或局部逻辑确实需要时，才引入类型。

### PortalRequestBoundary

适用判断：当任务涉及 loading / error / ready 状态舞台或状态切换结构时，遵守本节。
入口文件：

- `apps/portal-web/src/components/PortalRequestBoundary.vue`

约定：

- 按原子方式使用；谁是真正的状态舞台，`PortalRequestBoundary` 就直接成为谁。
- 不要在子模块内部已经用了状态壳后，父层再包一层更大的状态壳。
- 能把原有舞台 class 直接挂到 boundary 根节点上，就不要再套纯布局 `div`。
- `ready` 内容保持单根舞台，避免和内部 `Transition` 语义冲突。
- 状态仅包含：`loading`、`error`、`ready`。
- 公开模块与公开详情只使用 `loading`、`error`、`ready` 三态；失败时直接进入真实错误态。
- 骨架内容统一放在 `#loading` 插槽内，不要在 boundary 外再切一套 loading DOM。
- 默认错误态使用 `errorCode` 对应插画；整体水平居中，文案和按钮区内部左对齐。
- `Transition` 固定保留在 boundary 内部；业务自己的 ready 态动画放在业务组件内部。

### 骨架屏

适用判断：当任务涉及模块或详情的 loading 骨架、骨架结构、shimmer 效果时，遵守本节。

- 骨架结构必须和真实布局一一对应。
- 首页骨架是默认参考实现；公开模块、公开详情、工作台等新骨架，优先沿用首页骨架那套稳定写法，不要各写一套局部语法。
- 首页骨架稳定写法指：先搭真实结构壳子，再填充 `lines / line / block / pill`；不要直接用几条泛化长条去“估”真实高度。
- 多行文本骨架（标题、摘要、作者简介等）统一使用“外层 `lines` 容器 + 行容器 + 内层 `block`”的三层写法；外层容器先占真实总高度，单行高度按真实文本 `line-height` 对齐。
- 标题骨架优先对齐真实标题的 `line-height` 与总行数高度；不要只根据 `block` 自身高度或字号 token 估算两行标题高度。
- section heading、评论输入 footer、meta 行、作者卡正文等固定高度区域，骨架必须保留对应外层 wrapper / shell；先对齐真实组件的高度、gap、padding，再放内部骨架块。
- 真实结构中只出现一次的区块，骨架里也只能出现一次；不要靠重复 DOM 或额外过渡层去“拼”出视觉效果。
- 骨架节奏优先复用共享 rhythm / skeleton tokens。
- 通用 shimmer 组只负责 shimmer / overflow，`position` 由具体骨架元素自己负责。
- 情报模块：标题 1 行、摘要 2 行、封面右上主题标签、底部 meta。
- 游戏模块：标题 1 行、摘要 2 行、顶部 header 标签、底部游戏标签 / 作者 / 时间 + 统计。
- 书库模块：标题 1 行、摘要 2 行、左侧书册封面、底部作者 / 章节 / 时间与统计。
- 图包模块：标题最多 2 行、底部 meta。
- 公开详情的 hero、正文、侧栏、相关推荐都要按真实结构拆分骨架。
- 不要用泛化长条代替真实详情节奏。

### CSS Tokens

适用判断：当任务涉及 `portal-web` 的主题 token、业务 token、变量命名、暗色覆盖时，遵守本节。
入口文件：

- `apps/portal-web/src/styles/index.css`
- `apps/portal-web/src/styles/tokens/*.css`
- `apps/portal-web/src/styles/tokens-dark/*.css`
- `apps/portal-web/src/styles/adaptive/*.css`

约定：

- `index.css` 是 `portal-web` 唯一全局样式入口；只负责导入 token 层、adaptive 层、全局 reset 和少量基础交互样式。
- 全局 token 按职责分层；当前固定分为：`foundation`、`shared-components`、`home`、`public-detail`、`modules`、`workspace`。
- 分辨率档位样式单独维护在 `styles/adaptive/*`，不要把 `compact / standard / wide` 的布局常量塞回业务 token 文件。
- 深色 token 目录按同名镜像维护；亮色与深色必须保持同一语义、同一命名、同一层级归属。
- 全局 token 只保留稳定的业务语义。
- 纯尺寸、局部布局、单组件实现细节尽量留在组件内部。
- 单组件私有变量默认留在组件内；只有跨多个页面 / 组件复用，或确实要供 teleport 到全局层的 UI 消费时，才提升为全局 token。
- 不要为了复用局部尺寸而创建全局 token；优先接受 feature-local / component-local 变量。
- 布局档位变量优先放在 adaptive 层，通过根节点 viewport tier 驱动；业务页面只消费变量，不在页面 SFC 内重复声明主档位断点。
- `compact`、`standard`、`wide` 共用同一批布局变量名；新增档位时先复用变量，不复制一套同义 token。
- 首页与公开模块在同一档位下优先共用同一条 browse stage 基线；确有差异时，只在列数、卡片密度或局部 media 比例层面分化，不重复维护两套舞台宽度 token。
- adaptive 层变量不要在页面里再包一层无新增语义的中转别名；只有页面真正引入了新的业务语义或局部组合关系，才允许再落 feature-local 变量。
- token 分组注释要专业、精准，不使用过于泛化的 `family/shared/misc`。
- token 名称优先表达业务语义，而不是历史实现。
- 同一个业务语义在浅色和深色主题中保持一致命名。
- 不保留新的“大总表” token 文件，也不创建 `misc.css` 这类兜底文件。

### 业务主题色

适用判断：当任务涉及首页、公开模块、公开详情的业务视觉统一时，遵守本节。

- 同业务的首页、公开模块、公开详情，主题色必须一致。
- 当前映射：情报：青蓝系；游戏：冷青紫 / iris 系；图包：mint 系；书库：茶金 / amber 系。
- 首页 `本周精选`、`推荐版块` 使用站点级标题色，不复用情报 / 游戏业务色。
- 通用 tone 色板不能抢业务主题色。

### 公开模块

适用判断：当任务涉及情报、游戏、书库、图包模块页或公共筛选面板时，遵守本节。
公共筛选组件：`apps/portal-web/src/components/PortalModuleFilterPanel.vue`

约定：

- 上方统一筛选，下方内容区。
- 后续新增公开模块优先复用统一筛选面板。
- 筛选面板只承担控制职责；结果数量、结果摘要放在结果区，不放在 sticky 筛选面板里。
- 情报模块：双列分页；标题单行；摘要两行；底部左时间右统计；统计用图标 + 数值。
- 游戏模块：列表分页；主筛选按题材；标题单行；摘要两行；底部保留游戏标签 / 作者 / 时间与统计信息。
- 书库模块：双列分页；标题单行；摘要两行；左侧保留书册封面；底部保留作者 / 章节 / 时间与统计。
- 图包模块：瀑布流；标题最多两行；追加加载失败保留局部重试，从当前进度继续拉取。

### 公开详情

适用判断：当任务涉及情报 / 游戏 / 书库 / 图包详情页或相关推荐区域时，遵守本节。
入口文件：

- `PortalArticleDetailView.vue`
- `PortalTopicDetailView.vue`
- `PortalGalleryDetailView.vue`

约定：

- 主请求失败时使用 `PortalRequestBoundary`。
- 相关推荐可单独失败并显示局部错误态。
- 作者资料等局部失败可轻量降级，不必强行上主错误态。
- 详情页和模块页统一消费 `errorCode`。

### 公开内容请求结果

适用判断：当任务涉及首页、公开模块或公开详情的数据来源与失败表现时，遵守本节。

- 首页、公开模块与公开详情统一只展示真实请求结果。
- 首页、公开模块与公开详情不保留额外静态数据常量、额外入口或并行状态分支。
- 首页、公开模块与公开详情请求失败时直接进入真实错误态，由 `PortalRequestBoundary` 按 `errorCode` 展示。

### 校验命令

适用判断：当任务改动公开内容域前端代码并准备交付时，遵守本节。

默认至少执行：

```bash
pnpm --filter portal-web typecheck
pnpm --filter portal-web build
```

需要完整校验时，再执行：

```bash
pnpm --filter portal-web format:check
pnpm --filter portal-web lint
```

## 何时更新这份文档

出现以下变化时，应同步更新 `docs/spec.md`：

- 新增共享组件并成为默认方案
- 调整全局业务 token 分层
- 修改公开模块的共用筛选、查询或错误态模式
- 调整业务主题色映射
- 重新定义骨架屏与真实布局的对应关系
- 调整共享工程配置、lint / format 规范或提交链路
