# MonoApp AI 编码 Spec

## 1. 定位

这份文档是 MonoApp 的 AI 编码约束，优先级高于 `docs/overview.md` 和 `docs/workflows/*`。

- `docs/spec.md` 只放稳定边界、职责分层、通用规则和场景硬约束。
- `docs/overview.md` 只放工程现状、目录说明和依赖关系概览。
- `docs/workflows/*` 只放命令、构建、测试、提交与部署流程。

当前仓库是前端 monorepo：

- 活跃应用：`apps/portal-web`、`apps/admin-web`
- 预备应用：`apps/ai-console`
- 共享能力：`packages/*`
- 公开内容后端：兄弟仓库 `MonoNest`，不在本仓库内维护

## 2. 新会话读取顺序

1. `docs/spec.md`
2. `docs/overview.md`
3. `docs/workflows/README.md`
4. 任务触达 `apps/portal-web` 样式 / 布局时，再读：
   - `apps/portal-web/src/styles/index.css`
   - `apps/portal-web/src/styles/tokens/*.css`
   - `apps/portal-web/src/styles/tokens-dark/*.css`
   - `apps/portal-web/src/styles/adaptive/*.css`

## 3. 执行总则

- 不使用破坏性 git 命令；不回退用户已有未提交改动，除非用户明确要求。
- 先沿现有结构、命名和设计语言增强，不无故重做。
- 不为了分层而分层；只有能降低真实复杂度、减少有意义重复或贴合既有边界时才新增抽象。
- 不保留兼容分支、旧别名、fallback 静态数据、重复入口或临时 adapter，除非用户明确要求迁移窗口。
- 行为迁移时同步清理残留：无用 import、死常量、过期状态分支、冗余 wrapper、废弃 CSS/token 变量。
- 缺陷修复先定位根因并落在责任边界内；不要用调用方绕行、局部补丁、重复兜底或额外 fallback 掩盖问题，除非依赖外部不可控行为且兜底边界明确。
- 先判断命中场景，再执行对应硬规则；多个场景同时命中时，规则累加。

## 4. 最高优先级：PowerShell 乱码判断

只要 PowerShell 输出、终端预览或命令结果中出现中文乱码、疑似编码异常或字符错乱，立即命中本节。

- 不要仅根据终端乱码判断源码、文档或资源文件编码损坏。
- 使用显式 UTF-8 重新读取文件，并结合 `typecheck`、`build` 或运行结果判断真实状态。
- 如果终端显示与文件实际内容冲突，以文件实际内容和验证结果为准。
- 未核实前，不要重编码、批量转码或覆盖文件。

## 5. 仓库边界

### 5.1 应用与共享包

- `apps/*` 只依赖 `packages/*`，不跨应用互相依赖。
- 应用层负责业务页面、业务 API 装配、业务权限模型、启动装配和应用特例。
- 跨 app 的登录、权限、请求、埋点、监控、主题、通用类型、工程配置等能力优先沉淀到 `packages/*`。
- 共享包之间通过清晰入口导出能力，避免循环依赖和深层路径耦合。

### 5.2 工程配置

命中：lint、format、test、build preset、hooks、脚本入口、CI/CD、部署行为。

入口：

- `packages/eslint-config`
- `packages/vitest-config`
- `.github/workflows/deploy-frontend.yml`
- `scripts/prepare-frontend-build-env.mjs`

规则：

- ESLint 共享规则只改 `packages/eslint-config/*`。
- Vitest 共享配置只改 `packages/vitest-config/*`。
- 根目录 `.eslintrc.cjs` 和应用级 `vitest.config.ts` 保持薄壳，只做 extends / preset 接入和必要本地特例。
- 仓库级 hooks、lint-staged、commitlint 放根目录，不在单个 app 复制。
- 可复用格式化配置、构建 preset、脚手架能力、通用工程脚本优先沉淀到 `packages/*` 或 `scripts/*`。
- 前端生产发布只从 `.github/workflows/deploy-frontend.yml` 进入，由 `web-v*` tag 触发；新增 base path、部署环境变量或打包结构时，必须同时验证 `portal-web` 与 `admin-web`。
- 生产构建环境由 `scripts/prepare-frontend-build-env.mjs` 生成；`FRONTEND_*` 是共享覆盖，`PORTAL_*` / `ADMIN_*` 是单应用覆盖；DeepSeek key 不写入 git，优先使用加密变量注入。

## 6. portal-web 通用边界

命中：任何 `apps/portal-web` 改动。

- 显式字号按 1920 设计稿语义书写，源码 `font-size` 不得低于 `12px` 或等价 `1.2rem`。
- 默认桌面优先，不主动新增手机适配。
- 桌面端只维护 `1920px` 一个设计锚点，通过 rem 等比缩放：`1920px` 下 `1rem = 10px`，其他桌面宽度由根字号按 `100vw / 192` 缩放。
- 移动端只维护 `1100px` 及以下独立窄屏层，通过 `data-portal-viewport="mobile"` 命中，可整体移除。
- 不再维护多套桌面分辨率档位，不在页面 SFC 中重复声明主断点。

## 7. portal-web 公开内容域

公开内容域包括首页、公开模块页、公开详情页、评论、相关推荐和工作台里复用的公开内容状态组件。

### 7.1 请求与错误

命中：公开内容请求、首页 / 模块 / 详情数据拉取、错误处理、空态判断。

入口：

- `apps/portal-web/src/api/public-request.ts`
- `apps/portal-web/src/api/content.ts`
- `apps/portal-web/src/api/public-modules.ts`
- `apps/portal-web/src/api/public-detail.ts`

规则：

- 公开内容 GET 请求统一走 `safeGetPublic`。
- `safeGetPublic` 返回结构统一为 `data`、`error`、`errorCode`。
- `errorCode` 只归一化为 `401`、`403`、`404`、`500`。
- 页面层不直接判断 `AxiosError` 或拆状态码。
- 首页、公开模块、公开详情只展示真实请求结果；不新增额外静态数据常量、fallback 数据源、并行 mock 状态或绕过真实请求的入口。
- 请求失败进入真实错误态，由 `PortalRequestBoundary` 消费 `errorCode`；请求成功但业务结果为空才使用 `empty`。

### 7.2 常量与查询状态

命中：模块配置、筛选项、排序项、query 解析、路由同步、详情请求状态、滚动续载。

入口：

- `apps/portal-web/src/constants/public-modules.ts`
- `apps/portal-web/src/views/modules/composables/usePortalModuleQuery.ts`
- `apps/portal-web/src/views/public/composables/usePublicDetailRequestState.ts`
- `apps/portal-web/src/composables/useAutoLoadSentinel.ts`

规则：

- 稳定模块配置、筛选项、排序项、query 解析集中在 `public-modules.ts`，不散落回 `api/*`。
- 可共享的查询状态、路由同步、错误状态收进 composable；页面只编排业务视图。
- 公开模块与公开详情 composable 只保留真实请求、路由同步和错误状态。
- 图包和其他滚动续载页面复用 `useAutoLoadSentinel.ts`；追加加载失败保留局部重试，并从当前进度继续拉取。

### 7.3 全局组件与状态舞台

命中：公开内容共享组件编排、loading / error / empty / ready 状态切换。

入口：

- `apps/portal-web/src/components/index.ts`
- `apps/portal-web/src/components/PortalRequestBoundary.vue`
- `apps/portal-web/src/components/PortalModuleFilterPanel.vue`
- `apps/portal-web/src/components/PortalSectionHeading.vue`

规则：

- 已在 `components/index.ts` 全局注册的组件，模板内不重复本地导入；只有脚本类型引用或局部逻辑需要时才引入类型。
- `PortalRequestBoundary` 是原子状态舞台：谁承担真实状态切换，boundary 就直接成为谁。
- 不在子模块已经有状态壳后，再由父层包一层更大的状态壳。
- 能把舞台 class 挂到 boundary 根节点，就不要额外套纯布局 `div`。
- boundary 状态只包含 `loading`、`error`、`empty`、`ready`。
- `ready` 内容保持单根舞台，避免和内部 `Transition` 冲突。
- loading 骨架放在 `#loading` 插槽内，不在 boundary 外再切一套 loading DOM。
- 公开详情主请求失败或缺失用 `error`，不降级为 `empty`；相关推荐可单独失败并显示局部错误态；作者资料等局部失败可轻量降级。

### 7.4 公开模块页面

命中：情报、游戏、书库、图包模块页或公共筛选面板。

规则：

- 上方统一筛选，下方内容区；新增公开模块优先复用 `PortalModuleFilterPanel`。
- 筛选面板只承担控制职责；结果数量、结果摘要放在结果区，不放在 sticky 筛选面板里。
- 情报模块：双列分页；标题 1 行；摘要 2 行；底部左时间右统计；统计使用图标 + 数值。
- 游戏模块：列表分页；主筛选按题材；标题 1 行；摘要 2 行；底部保留游戏标签 / 作者 / 时间与统计。
- 书库模块：双列分页；标题 1 行；摘要 2 行；左侧保留书册封面；底部保留作者 / 章节 / 时间与统计。
- 图包模块：瀑布流；标题最多 2 行；追加加载失败保留局部重试。

### 7.5 公开详情页面

命中：情报 / 游戏 / 书库 / 图包详情页、相关推荐、评论区。

入口：

- `apps/portal-web/src/views/public/PortalArticleDetailView.vue`
- `apps/portal-web/src/views/public/PortalTopicDetailView.vue`
- `apps/portal-web/src/views/public/PortalBookDetailView.vue`
- `apps/portal-web/src/views/public/PortalGalleryDetailView.vue`

规则：

- 主请求由 `usePublicDetailRequestState` 管理 loading / error / ready。
- 详情页和模块页统一消费 `errorCode`。
- 主体内容、侧栏、相关推荐、评论区各自按真实职责处理局部错误，不把局部失败提升为主错误态，除非主数据不可用。
- 书库阅读器的来源适配、章节解析、目录滚动辅助、漫画图片增强与阅读器专用组件归入 `apps/portal-web/src/views/public/book-reader`；不要把数据源适配逻辑放进通用详情组件目录。
- 书库阅读器目录保持打开时，必须在新 `readerData` 赋值、目录 DOM 就绪且 DOM 中的 active 目录项已对应新章节后，通过目录自身的 `el-scrollbar` API 让当前章节条目滚入目录视口；目录就绪等待应使用短生命周期 DOM observer，不要依赖固定帧数重试；目录项和底部上一/下一章点击只触发路由导航，不得在 loading 前滚动旧目录；目录展开、挂载后的 `nextTick` 和新章节 `readerData` 就绪后可执行目录定位。
- 书库阅读器的进度显示必须区分阅读进度、章节位置和漫画页码；漫画进度按当前可见页 / 总页数计算，不得使用会随图片懒加载变化的整章滚动高度作为分母。

## 8. portal-web 视觉与样式

### 8.1 CSS token 与 adaptive

命中：主题 token、业务 token、暗色覆盖、档位布局变量、全局样式入口。

入口：

- `apps/portal-web/src/styles/index.css`
- `apps/portal-web/src/styles/tokens/*.css`
- `apps/portal-web/src/styles/tokens-dark/*.css`
- `apps/portal-web/src/styles/adaptive/*.css`
- `apps/portal-web/vite.config.ts`

规则：

- `index.css` 是唯一全局样式入口，只负责导入 foundation / shared-components token、全局 adaptive、reset 和少量基础交互样式。
- 全局 token 固定分层：`foundation`、`shared-components`、`browse`、`home`、`public-detail`、`modules`、`workspace`。
- 深色 token 按同名镜像维护，浅色与深色保持同一语义、同一命名、同一层级归属。
- `browse` 放公开浏览域通用卡片、媒体、标签、section heading 和状态舞台基线；`home` 只放首页独有布局、hero、quick entry、bookshelf 展示；`public-detail` 只放详情页 / 阅读器独有语义；`modules` 只放公开模块页筛选、分页、列表和瀑布流语义；`workspace` 只放工作台独有语义。
- 路由 CSS 聚合入口固定为三类：`routes/public-browse.css` 导入 `browse + home + modules`，`routes/public-detail.css` 导入 `browse + public-detail`，`routes/workspace.css` 只导入 `workspace` 与路由级通用移动端组件规则。
- `modules` 不引用 `public-detail` / `home` / `workspace` token；`public-detail` 不引用 `modules` / `home` / `workspace` token；`workspace` 不引用 `browse` / `modules` / `public-detail` token。
- 全局 token 只保留稳定业务语义；纯尺寸、局部布局、单组件实现细节默认留在组件内部。
- 不为复用局部尺寸创建全局 token；确有跨页面 / 跨组件复用，或需要供 teleport 到全局层消费时，才提升为全局 token。
- 桌面 adaptive 只保留 `rem-root.css`、`shared.css`、`desktop.css` 三层：根字号、共享基线、桌面布局变量。
- `mobile` 覆盖由 `adaptive/mobile.css` 聚合，子规则放在 `adaptive/mobile/*`，保持独立可移除。
- `px -> rem` 由 portal-web 构建期 PostCSS 插件处理；源码按 1920 设计稿语义书写，内联 style / JS 字符串尺寸需手动写成 rem 或走局部转换函数。
- `portal-web` 的 app 源码与 Element Plus 样式都进入 `px -> rem`；其它 `node_modules` 样式默认排除，避免无关第三方 CSS 被缩放。
- 首页与公开模块优先共用 browse stage 基线；确有差异时，只在列数、卡片密度或局部 media 比例层分化。
- 不新增大总表 token 文件、`misc.css`、无语义中转别名或过度泛化的 `shared/family/misc` 分组。

### 8.2 业务主题色

命中：首页、公开模块、公开详情的业务视觉统一。

- 同业务的首页 / 模块 / 详情主题色必须一致。
- 当前映射：情报 = 青蓝系；游戏 = 冷青紫 / iris 系；图包 = mint 系；书库 = 茶金 / amber 系。
- 首页 `本周精选`、`推荐版块` 使用站点级标题色，不复用具体业务色。
- 通用 tone 色板不能抢业务主题色。

### 8.3 骨架屏

命中：loading 骨架、shimmer、模块或详情加载态结构。

- 骨架结构必须贴真实布局，真实结构只出现一次的区块，骨架中也只出现一次。
- 优先沿用首页骨架写法：先搭真实结构壳子，再填充 `lines` / `line` / `block` / `pill`；不要用泛化长条估高度。
- 多行文本骨架使用“外层 `lines` 容器 + 行容器 + 内层 `block`”三层写法；外层先占真实总高度，单行高度对齐真实 `line-height`。
- 固定高度区域（section heading、评论 footer、meta 行、作者卡正文等）先保留真实 wrapper / shell，再放内部骨架块。
- 通用 shimmer 只负责 shimmer / overflow；`position` 由具体骨架元素负责。
- 模块骨架节奏保持：情报 / 游戏 / 书库标题 1 行、摘要 2 行；图包标题最多 2 行；详情页 hero、正文、侧栏、相关推荐按真实结构拆分。

## 9. 校验矩阵

改动后运行与范围匹配的最小有效校验；无法运行时说明原因。

| 改动范围                     | 默认校验                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apps/portal-web` 公开内容域 | `pnpm --filter portal-web typecheck` + `pnpm --filter portal-web build`                                           |
| `apps/portal-web` 非公开内容 | `pnpm --filter portal-web typecheck`，必要时 build                                                                |
| `apps/admin-web`             | `pnpm --filter admin-web typecheck`，必要时 build                                                                 |
| `packages/*`                 | 对应 package 的 `typecheck` / `test` / `build`，按风险选择                                                        |
| 工程配置、CI、脚本           | 相关脚本或根级 `pnpm lint` / `pnpm typecheck` / `pnpm test`，按影响面选择                                         |
| 准备对齐当前 Actions         | `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm --filter portal-web build` + `pnpm --filter admin-web build` |

公开内容域需要完整校验时，再运行：

```bash
pnpm --filter portal-web format:check
pnpm --filter portal-web lint
```

## 10. 何时更新本 spec

出现以下变化时，同步更新 `docs/spec.md`：

- 新增共享组件并成为默认方案。
- 调整 app / package 职责边界或共享包分层。
- 修改公开内容请求、错误态、筛选、查询或详情状态模式。
- 调整 portal-web token 分层、adaptive 档位或业务主题色映射。
- 调整 portal-web rem 缩放、移动端边界或 px-to-rem 构建规则。
- 重新定义骨架屏与真实布局的对应关系。
- 调整 lint / format / test / build / deploy 的共享工程规则。
