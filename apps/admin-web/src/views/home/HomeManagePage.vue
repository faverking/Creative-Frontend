<template>
  <div class="manage-layout">
    <aside class="manage-sidebar">
      <div class="sidebar-brand">
        <span class="sidebar-pill">社区后台</span>
        <h2>内容运营工作台</h2>
        <p>适合中文内容社区的情报、图包、游戏、书库与日常运营管理。</p>
      </div>

      <div class="sidebar-user">
        <span class="sidebar-user-avatar" aria-hidden="true">
          <svg viewBox="0 0 48 48" focusable="false">
            <path
              d="M24 24c5.523 0 10-4.701 10-10.5S29.523 3 24 3 14 7.701 14 13.5 18.477 24 24 24Zm0 4c-8.837 0-16 6.268-16 14 0 1.657 1.343 3 3 3h26c1.657 0 3-1.343 3-3 0-7.732-7.163-14-16-14Z"
            />
          </svg>
        </span>

        <div class="sidebar-user-copy">
          <span>当前账号</span>
          <strong>{{ userName }}</strong>
          <small>{{ userRole }}</small>
        </div>
      </div>

      <el-menu :default-active="activeMenu" class="manage-menu" router>
        <el-menu-item v-for="item in visibleMenuItems" :key="item.path" :index="item.path">
          <div class="menu-item-shell">
            <span class="menu-item-icon" :class="`menu-item-icon-${item.icon}`" aria-hidden="true">
              <business-type-icon :name="item.icon" />
            </span>

            <div class="menu-item-copy">
              <span>{{ item.label }}</span>
              <small>{{ item.caption }}</small>
            </div>
          </div>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="manage-content">
      <header class="manage-header">
        <div class="header-copy">
          <div class="header-topline">
            <span class="header-badge">{{ currentMenu?.badge ?? '内容后台' }}</span>
            <span class="header-context">创作工作区</span>
          </div>
          <strong>{{ headerTitle }}</strong>
          <p>{{ headerSummary }}</p>

          <div class="header-metrics">
            <article v-for="item in headerMetrics" :key="item.label" class="header-metric">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>
        </div>

        <aside class="header-panel">
          <div class="header-panel-top">
            <span class="header-panel-label">本页导览</span>
            <span class="online-status">在线创作中</span>
          </div>

          <div class="header-panel-body">
            <div class="header-panel-stage" aria-hidden="true">
              <span class="panel-airship" />
              <span class="panel-sign">{{ currentMenu?.label.substring(0, 2) }}</span>

              <span class="panel-character">
                <span class="panel-character-head" />
                <span class="panel-character-hair" />
                <span class="panel-character-body" />
                <span class="panel-character-skirt" />
                <span class="panel-character-case" />
              </span>

              <span class="panel-plant panel-plant-left" />
              <span class="panel-plant panel-plant-right" />
              <span class="panel-bubble panel-bubble-large" />
              <span class="panel-bubble panel-bubble-small" />
              <span class="panel-bubble panel-bubble-mini" />
            </div>

            <div class="header-panel-copy">
              <strong>{{ headerSpotlightTitle }}</strong>

              <ul class="header-highlight-list">
                <li v-for="item in headerHighlights" :key="item">{{ item }}</li>
              </ul>

              <p class="header-panel-tip">{{ currentMenu?.caption }}</p>
            </div>
          </div>
        </aside>
      </header>

      <main class="manage-main">
        <router-view />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import { useUserStore } from '@frontend/store'
import { hasAdminManageRouteAccessByRoles } from '@/permission'
import { getUserRoleLabel } from '@/utils/format'

import BusinessTypeIcon from '@/components/BusinessTypeIcon.vue'

type ManageMenuIconName = 'overview' | 'manage' | 'books' | 'topics' | 'images' | 'articles'

interface ManageMenuItem {
  path: string
  label: string
  icon: ManageMenuIconName
  badge: string
  caption: string
  heroTitle: string
  heroSummary: string
  spotlightTitle: string
  metric: string
  scene: string
  workflow: string
  highlights: string[]
}

const route = useRoute()
const userStore = useUserStore()
const isAdminWorkspace = computed(() => hasAdminManageRouteAccessByRoles(userStore.profile?.roles))

const creatorMenuItems: ManageMenuItem[] = [
  {
    path: '/home/overview',
    label: '首页概览',
    icon: 'overview',
    badge: '运营概览',
    caption: '查看社区内容总览与基础数据统计。',
    heroTitle: '社区内容运营总览',
    heroSummary: '把日常巡检、内容盘点和趋势判断统一收在一个工作区。',
    spotlightTitle: '先看全局节奏，再进入具体板块处理',
    metric: '浏览近期整体走势',
    scene: '日常巡检与运营排期',
    workflow: '总览数据后进入具体内容区',
    highlights: [
      '情报、书库、图包、游戏的核心数据集中查看。',
      '适合作为排期、巡检和运营总览的起点。'
    ]
  },
  {
    path: '/home/manage',
    label: '内容管理',
    icon: 'manage',
    badge: '内容管理',
    caption: '按业务分类查询、翻页、编辑和处理既有内容。',
    heroTitle: '把四类已发布内容集中到一个管理视图里',
    heroSummary: '适合按标题、时间和业务类型快速筛选内容，并继续进入对应编辑页完成修改。',
    spotlightTitle: '先筛选内容，再进入业务页做精细编辑',
    metric: '统一处理历史内容与运营调整',
    scene: '内容复盘、活动返修与日常巡检',
    workflow: '先查询，再编辑或按能力范围处理删除',
    highlights: [
      '支持情报、书库、游戏、图包四类内容切换查看。',
      '编辑入口会直接跳转到对应业务页并回填当前内容。'
    ]
  },
  {
    path: '/home/books',
    label: '书库内容',
    icon: 'books',
    badge: '书库策划',
    caption: '维护书库内容与推荐编排。',
    heroTitle: '把书库基础信息、封面和章节信息收成一条编辑线',
    heroSummary: '支持回填既有书库、更新封面与章节编排，也方便后续继续扩展推荐配置。',
    spotlightTitle: '适合维护书库资料、封面与章节目录',
    metric: '书库编辑与章节整理',
    scene: '推荐策划与书库整理',
    workflow: '先维护基础资料，再同步章节与来源信息',
    highlights: ['支持封面替换、作者与风格整理。', '章节目录和外部来源字段可以在同一页一起维护。']
  },
  {
    path: '/home/topics',
    label: '游戏运营',
    icon: 'topics',
    badge: '游戏运营',
    caption: '组织游戏页面、视频导览与资源下载入口。',
    heroTitle: '把游戏内容、资源入口和视频导览组织成一页',
    heroSummary: '适合整理游戏正文、资源下载、视频导览和页面摘要，让游戏上线前的信息更完整。',
    spotlightTitle: '适合活动主会场、资源页和导览页编辑',
    metric: '游戏正文与资源同步发布',
    scene: '活动页、主会场和下载页',
    workflow: '正文、链接、图片和资源包一起收口',
    highlights: [
      '发布时自动上传富文本里的粘贴图片。',
      '视频链接和 ZIP 资源可以一起收口到游戏发布流程。'
    ]
  },
  {
    path: '/home/images',
    label: '图包发布',
    icon: 'images',
    badge: '图包发布',
    caption: '批量上传图片并以媒体 ID 完成图包投递。',
    heroTitle: '把社区图片整理成一组更好发的内容',
    heroSummary: '发布前会先上传图片媒体，再写入图包接口，适合活动现场、精选图集和社区日常内容。',
    spotlightTitle: '先上传媒体，再完成图包录入',
    metric: '自动预览图包素材',
    scene: '现场图集、精选图包和社区素材',
    workflow: '先批量上传，再统一完成图包发布',
    highlights: [
      '支持批量选图、本地预览和最近一次上传结果对照。',
      '适合现场图集、精选图包和社区日常素材整理。'
    ]
  },
  {
    path: '/home/articles',
    label: '情报投稿',
    icon: 'articles',
    badge: '情报投稿',
    caption: '富文本写作、草稿暂存与正式发布。',
    heroTitle: '写给中文社区读者的正式情报稿件',
    heroSummary: '支持分类选择、富文本编辑、草稿续写与一键发布，适合日常情报投稿和活动内容运营。',
    spotlightTitle: '适合长文情报、分类更新和活动正式稿',
    metric: '草稿续写与正式发布',
    scene: '长文情报、活动稿和分类更新',
    workflow: '先写作与暂存，再统一完成发布',
    highlights: ['支持本地草稿引用与续写。', '摘要可自动生成，适合推荐位和列表卡片。']
  }
]

const adminMenuItems: ManageMenuItem[] = [
  {
    path: '/home/admin/overview',
    label: '管理概览',
    icon: 'overview',
    badge: '管理概览',
    caption: '查看全站公开内容的汇总状态、推荐情况与业务分布。',
    heroTitle: '把全站内容治理数据集中到一个管理员概览里',
    heroSummary: '适合快速查看情报、书库、游戏和图包的总量、可见性、审核状态与推荐情况。',
    spotlightTitle: '先看全站分布，再进入首页管理处理内容',
    metric: '查看全站内容状态与推荐结构',
    scene: '首页运营、内容治理与管理巡检',
    workflow: '先读汇总，再进入首页管理执行操作',
    highlights: [
      '统计基于后端管理汇总接口，覆盖情报、书库、游戏和图包四类内容。',
      '图表会聚焦公开、私有、待审、驳回和推荐等关键状态。'
    ]
  },
  {
    path: '/home/admin/manage',
    label: '运营管理',
    icon: 'manage',
    badge: '运营管理',
    caption: '按业务分类查看全站公开内容，并执行推荐、设为私有和删除。',
    heroTitle: '把全站公开内容集中到一个首页管理视图里',
    heroSummary:
      '适合按标题、时间和业务类型快速筛选全站公开内容，并按权限范围执行推荐、设为私有和物理删除。',
    spotlightTitle: '先筛选内容，再完成首页推荐与运营处理',
    metric: '统一处理首页推荐与内容可见性',
    scene: '首页推荐、可见性调整与内容治理',
    workflow: '先查询，再按权限范围处理推荐、设私有或删除',
    highlights: [
      '管理员可推荐、取消推荐、设为私有；超级管理员额外可物理删除。',
      '首页管理页不提供编辑入口，避免修改其他用户业务数据。'
    ]
  }
]

const visibleMenuItems = computed(() =>
  isAdminWorkspace.value ? adminMenuItems : creatorMenuItems
)

const activeMenu = computed(() => {
  const routePath = route.path
  return visibleMenuItems.value.some((item) => item.path === routePath)
    ? routePath
    : (visibleMenuItems.value[0]?.path ?? '/home/overview')
})

const currentMenu = computed(
  () =>
    visibleMenuItems.value.find((item) => item.path === activeMenu.value) ??
    visibleMenuItems.value[0]
)
const headerTitle = computed(() => currentMenu.value?.heroTitle ?? '内容运营工作台')
const headerSummary = computed(() => currentMenu.value?.heroSummary ?? '继续在下方处理具体内容。')
const headerSpotlightTitle = computed(
  () => currentMenu.value?.spotlightTitle ?? '统一处理当前分区的编辑与发布流程'
)
const headerHighlights = computed(() => currentMenu.value?.highlights ?? [])
const headerMetrics = computed(() => [
  {
    label: '本页焦点',
    value: currentMenu.value?.metric ?? '处理当前分区内容'
  },
  {
    label: '适合场景',
    value: currentMenu.value?.scene ?? '社区内容运营'
  },
  {
    label: '操作节奏',
    value: currentMenu.value?.workflow ?? '继续在下方完成当前页面操作'
  }
])
const userName = computed(() => userStore.profile?.name ?? '创作者')
const userRoleLabel = computed(() => getUserRoleLabel(userStore.profile?.roles?.[0]))
const userRole = computed(() => `身份：${userRoleLabel.value}`)
</script>

<style scoped>
.manage-layout {
  display: grid;
  grid-template-columns: minmax(300px, 332px) minmax(0, 1fr);
  gap: 24px;
  min-height: calc(100vh - 156px);
}

.manage-sidebar,
.manage-content {
  border: 1px solid var(--community-border);
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04)),
    var(--community-surface);
  backdrop-filter: blur(22px);
  box-shadow: var(--community-shadow), var(--community-inner-glow);
}

.manage-sidebar {
  position: sticky;
  top: 20px;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: calc(100vh - 156px);
  padding: 24px 22px;
}

.sidebar-brand h2 {
  margin: 14px 0 10px;
  font-size: clamp(20px, 2vw, 24px);
  line-height: 1.14;
}

.sidebar-brand p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.75;
}

.sidebar-pill,
.header-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  background: rgba(92, 193, 255, 0.14);
  color: #2d77b6;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(129, 180, 223, 0.18);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(114, 208, 255, 0.16), rgba(var(--community-violet-rgb), 0.12)),
    var(--community-surface-soft);
  box-shadow: var(--community-inner-glow);
}

.sidebar-user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  color: #2d77b6;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(219, 239, 255, 0.8));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 14px 24px rgba(47, 95, 159, 0.14);
}

.sidebar-user-avatar svg {
  width: 36px;
  height: 36px;
  fill: currentColor;
}

.sidebar-user-copy {
  min-width: 0;
}

.sidebar-user-copy span,
.sidebar-user-copy small {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.sidebar-user-copy strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 18px;
}

.manage-menu {
  flex: 1;
}

.menu-item-shell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.menu-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 16px;
  background: rgba(92, 193, 255, 0.14);
  color: #2d77b6;
  box-shadow: var(--community-inner-glow);
}

.menu-item-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.menu-item-icon-manage {
  color: #4f88bc;
}

.menu-item-icon-books {
  color: #3782b7;
}

.menu-item-icon-topics {
  color: #5c73d6;
}

.menu-item-icon-images {
  color: #d5679d;
}

.menu-item-icon-articles {
  color: #3c93cf;
}

.menu-item-copy {
  display: grid;
  gap: 4px;
  width: 100%;
}

.menu-item-copy span {
  font-size: 14px;
  font-weight: 600;
}

.menu-item-copy small {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  white-space: normal;
  line-height: 1.55;
}

.manage-content {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: calc(100vh - 156px);
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(109, 161, 223, 0.16), transparent 26%),
    radial-gradient(circle at left top, rgba(142, 222, 255, 0.2), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04)),
    var(--community-surface);
}

.manage-header {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(400px, 1fr);
  align-items: start;
  gap: 22px;
  margin: 22px 22px 0;
  padding: 28px;
  border: 1px solid var(--community-border);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.06)),
    radial-gradient(circle at top right, rgba(109, 161, 223, 0.18), transparent 22%),
    radial-gradient(circle at left center, rgba(142, 222, 255, 0.18), transparent 34%),
    var(--community-surface);
  box-shadow: var(--community-shadow), var(--community-inner-glow);
}

.header-copy {
  display: grid;
  align-content: start;
  gap: 12px;
}

.header-topline {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-context,
.header-panel-label,
.header-panel-tip,
.header-highlight-list,
.header-metric span {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.manage-header strong {
  display: block;
  margin: 0;
  font-size: clamp(22px, 2.4vw, 24px);
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.manage-header p {
  margin: 0;
  max-width: 720px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.8;
}

.header-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 4px;
}

.header-metric {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border: 1px solid rgba(126, 175, 223, 0.18);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(235, 245, 255, 0.34)),
    rgba(255, 255, 255, 0.32);
  box-shadow: var(--community-inner-glow);
}

.header-metric strong {
  font-size: 16px;
  line-height: 1.55;
}

.header-panel {
  position: relative;
  align-self: start;
  display: grid;
  gap: 14px;
  padding: 18px;
  overflow: hidden;
  border: 1px solid rgba(104, 156, 207, 0.2);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(236, 246, 255, 0.68)),
    rgba(255, 255, 255, 0.6);
  box-shadow:
    0 24px 46px rgba(46, 79, 134, 0.1),
    var(--community-inner-glow);
}

.header-panel::before,
.header-panel::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.header-panel::before {
  top: -36px;
  right: -20px;
  width: 138px;
  height: 138px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(123, 218, 255, 0.3), transparent 70%);
}

.header-panel::after {
  inset: auto 22px 16px 22px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.24),
    rgba(255, 255, 255, 0.04)
  );
  opacity: 0.62;
}

.header-panel-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.header-panel-body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(160px, 184px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.header-panel-stage {
  position: relative;
  min-height: 156px;
  overflow: hidden;
  border: 1px solid rgba(116, 168, 220, 0.18);
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    rgba(241, 250, 255, 1) 0%,
    rgba(188, 230, 255, 0.96) 34%,
    rgba(132, 190, 237, 0.92) 56%,
    rgba(90, 126, 180, 0.94) 57%,
    rgba(58, 86, 130, 1) 100%
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

.header-panel-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      transparent 0 15%,
      rgba(54, 90, 139, 0.28) 15% 16.8%,
      transparent 16.8% 46%,
      rgba(54, 90, 139, 0.28) 46% 47.8%,
      transparent 47.8% 77%,
      rgba(54, 90, 139, 0.28) 77% 78.8%,
      transparent 78.8% 100%
    ),
    linear-gradient(
      180deg,
      transparent 0 16%,
      rgba(54, 90, 139, 0.24) 16% 17.8%,
      transparent 17.8% 64%,
      rgba(54, 90, 139, 0.22) 64% 65.6%,
      transparent 65.6% 100%
    );
  opacity: 0.88;
}

.header-panel-stage::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18px;
  height: 24px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.28),
    rgba(255, 255, 255, 0.05)
  );
  opacity: 0.58;
}

.panel-airship {
  position: absolute;
  top: 28px;
  left: 50%;
  width: 124px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(45, 83, 143, 0.94), rgba(89, 145, 219, 0.72));
  transform: translateX(-34%) rotate(-4deg);
  box-shadow: 0 12px 22px rgba(46, 79, 134, 0.16);
}

.panel-airship::before,
.panel-airship::after {
  content: '';
  position: absolute;
}

.panel-airship::before {
  right: -10px;
  top: 5px;
  width: 22px;
  height: 18px;
  border-radius: 2px 16px 16px 2px;
  background: rgba(45, 83, 143, 0.88);
}

.panel-airship::after {
  left: 14px;
  bottom: -6px;
  width: 48px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
}

.panel-sign {
  position: absolute;
  top: 16px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  padding: 6px 10px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(83, 208, 255, 0.96), rgba(99, 168, 255, 0.86));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  box-shadow: 0 10px 18px rgba(65, 156, 220, 0.24);
}

.panel-character {
  position: absolute;
  left: 54%;
  bottom: 18px;
  width: 48px;
  height: 96px;
  transform: translateX(-50%);
}

.panel-character-head,
.panel-character-hair,
.panel-character-body,
.panel-character-skirt,
.panel-character-case {
  position: absolute;
}

.panel-character-head {
  top: 10px;
  left: 14px;
  z-index: 3;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffd7cb;
}

.panel-character-hair {
  top: 6px;
  left: 9px;
  z-index: 2;
  width: 30px;
  height: 32px;
  border-radius: 56% 50% 60% 44%;
  background: linear-gradient(180deg, #25529a, #2d6abc);
  box-shadow: 10px 18px 0 -8px rgba(37, 82, 154, 0.96);
}

.panel-character-body {
  top: 30px;
  left: 13px;
  z-index: 3;
  width: 24px;
  height: 26px;
  border-radius: 10px 10px 8px 8px;
  background: linear-gradient(180deg, #ffffff, #edf3fb);
}

.panel-character-skirt {
  top: 52px;
  left: 9px;
  z-index: 2;
  width: 32px;
  height: 28px;
  background: linear-gradient(180deg, #de7599, #c0547c);
  clip-path: polygon(16% 0, 84% 0, 100% 100%, 0 100%);
}

.panel-character-case {
  right: 0;
  top: 40px;
  width: 12px;
  height: 28px;
  border-radius: 4px;
  background: #2a4a79;
  box-shadow: 0 -12px 0 -9px #2a4a79;
}

.panel-plant {
  position: absolute;
  bottom: -4px;
  width: 64px;
  height: 72px;
  filter: drop-shadow(0 12px 22px rgba(17, 31, 59, 0.26));
}

.panel-plant::before,
.panel-plant::after {
  content: '';
  position: absolute;
  bottom: 0;
  background: linear-gradient(180deg, rgba(31, 59, 101, 0.96), rgba(16, 31, 58, 0.98));
}

.panel-plant::before {
  width: 20px;
  height: 58px;
  border-radius: 999px 999px 0 999px;
}

.panel-plant::after {
  width: 24px;
  height: 68px;
  border-radius: 999px 999px 999px 0;
}

.panel-plant-left {
  left: -6px;
}

.panel-plant-left::before {
  left: 10px;
  transform: rotate(-18deg);
}

.panel-plant-left::after {
  left: 30px;
  transform: rotate(12deg);
}

.panel-plant-right {
  right: -8px;
}

.panel-plant-right::before {
  right: 28px;
  transform: rotate(12deg);
}

.panel-plant-right::after {
  right: 8px;
  transform: rotate(-16deg);
}

.panel-bubble {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 28%,
    rgba(255, 255, 255, 0.96),
    rgba(176, 225, 255, 0.34) 42%,
    rgba(104, 173, 228, 0.08) 74%,
    transparent 75%
  );
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.48);
}

.panel-bubble-large {
  top: 24px;
  left: 18px;
  width: 18px;
  height: 18px;
}

.panel-bubble-small {
  top: 50px;
  left: 42px;
  width: 10px;
  height: 10px;
}

.panel-bubble-mini {
  top: 36px;
  right: 76px;
  width: 12px;
  height: 12px;
}

.header-panel-copy {
  display: grid;
  align-content: start;
  gap: 10px;
}

.header-panel strong {
  position: relative;
  z-index: 1;
  font-size: clamp(18px, 1.8vw, 20px);
  line-height: 1.42;
}

.header-highlight-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  line-height: 1.65;
}

.header-panel-tip {
  position: relative;
  z-index: 1;
  padding: 10px 12px;
  border: 1px solid rgba(113, 179, 229, 0.16);
  border-radius: 16px;
  background: rgba(110, 189, 255, 0.1);
  color: var(--el-text-color-secondary);
}

.online-status {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid rgba(97, 174, 227, 0.18);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: #2f6fab;
  background: rgba(110, 194, 255, 0.14);
}

.manage-main {
  padding: 18px 22px 24px;
}

:deep(.el-menu-item) {
  height: auto;
  min-height: 72px;
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 20px;
  line-height: 1.4;
}

:deep(.el-menu-item:hover) {
  border-color: rgba(103, 183, 235, 0.18);
  background: rgba(237, 246, 255, 0.44);
}

:deep(.el-menu-item.is-active) {
  border-color: var(--community-border-strong);
  background:
    linear-gradient(135deg, rgba(110, 194, 255, 0.16), rgba(var(--community-violet-rgb), 0.12)),
    var(--community-surface-soft);
  box-shadow: var(--community-inner-glow);
}

:deep(.el-menu-item.is-active) .menu-item-icon {
  background: linear-gradient(135deg, rgba(92, 193, 255, 0.22), rgba(116, 137, 255, 0.18));
}
</style>
