<template>
  <section class="workspace-page" :class="`workspace-page--${pageKey}`">
    <nav class="workspace-page__toolbar" aria-label="Workspace navigation">
      <el-tabs :model-value="pageKey" class="workspace-page__tabs" @tab-change="handleTabChange">
        <el-tab-pane v-for="tab in PORTAL_WORKSPACE_NAV_ITEMS" :key="tab.key" :name="tab.key">
          <template #label>
            <span class="workspace-page__tab-label" :class="`is-${tab.key}`">
              <span class="workspace-page__tab-icon-surface">
                <portal-svg-icon :name="tab.iconName" class="workspace-page__tab-icon" />
              </span>
              <span class="workspace-page__tab-text">{{ tab.label }}</span>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <div v-if="toolbarActions.length > 0" class="workspace-page__toolbar-side">
        <div class="workspace-page__toolbar-group workspace-page__toolbar-group--actions">
          <template v-for="action in toolbarActions" :key="action.key">
            <el-popconfirm
              v-if="action.confirm"
              :title="action.confirm.title"
              :confirm-button-text="action.confirm.confirmButtonText ?? '确认'"
              :cancel-button-text="action.confirm.cancelButtonText ?? '取消'"
              :hide-icon="true"
              :teleported="false"
              :width="248"
              @confirm="handleToolbarAction(action.key)"
            >
              <template #reference>
                <button
                  type="button"
                  class="workspace-page__toolbar-action"
                  :class="`is-${action.tone ?? 'default'}`"
                  :disabled="action.disabled || action.loading"
                >
                  {{ action.loading ? '处理中...' : action.label }}
                </button>
              </template>
            </el-popconfirm>

            <button
              v-else
              type="button"
              class="workspace-page__toolbar-action"
              :class="`is-${action.tone ?? 'default'}`"
              :disabled="action.disabled || action.loading"
              @click="handleToolbarAction(action.key)"
            >
              {{ action.loading ? '处理中...' : action.label }}
            </button>
          </template>
        </div>
      </div>
    </nav>

    <div class="workspace-page__layout">
      <section class="workspace-page__main">
        <header class="workspace-page__section-head">
          <h1>{{ title }}</h1>

          <div v-if="sectionPills.length > 0" class="workspace-page__section-pills">
            <button
              v-for="pill in sectionPills"
              :key="pill.key"
              type="button"
              class="workspace-page__section-pill"
              :class="{ 'is-active': pill.active }"
              :aria-pressed="Boolean(pill.active)"
              @click="handleSectionPillClick(pill.key)"
            >
              {{ pill.label }}
            </button>
          </div>
        </header>

        <slot />
      </section>

      <aside class="workspace-page__sidebar">
        <portal-workspace-profile-card />
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import PortalWorkspaceProfileCard from './PortalWorkspaceProfileCard.vue'
import {
  PORTAL_WORKSPACE_NAV_ITEMS,
  type PortalWorkspaceSection,
  type WorkspacePageOption,
  type WorkspaceToolbarAction
} from '@/constants/workspace'

const props = defineProps<{
  pageKey: PortalWorkspaceSection
  sectionPills: WorkspacePageOption[]
  title: string
  toolbarActions: WorkspaceToolbarAction[]
}>()

const emit = defineEmits<{
  sectionPillClick: [key: string]
  toolbarActionClick: [key: string]
}>()

const router = useRouter()

function handleTabChange(name: string | number): void {
  const targetKey = String(name) as PortalWorkspaceSection

  if (targetKey === props.pageKey) {
    return
  }

  const targetItem = PORTAL_WORKSPACE_NAV_ITEMS.find((item) => item.key === targetKey)

  if (targetItem) {
    void router.push({ name: targetItem.routeName })
  }
}

function handleSectionPillClick(key: string): void {
  const currentPill = props.sectionPills.find((pill) => pill.key === key)

  if (currentPill?.active) {
    return
  }

  emit('sectionPillClick', key)
}

function handleToolbarAction(key: string): void {
  const currentAction = props.toolbarActions.find((action) => action.key === key)

  if (!currentAction || currentAction.disabled || currentAction.loading) {
    return
  }

  emit('toolbarActionClick', key)
}
</script>

<style scoped>
.workspace-page {
  --workspace-accent: var(--workspace-messages-accent);
  --workspace-accent-soft: var(--workspace-messages-accent-soft);
  --workspace-tag-bg: var(--home-business-article-tag-bg);
  --workspace-tag-border: var(--home-business-article-tag-border);
  --workspace-tag-ink: var(--home-business-article-tag-ink);
  --workspace-surface-bg:
    linear-gradient(
      118deg,
      color-mix(in srgb, var(--workspace-accent) 3%, transparent) 0%,
      transparent 76%
    ),
    var(--workspace-surface-base-bg);
  --workspace-surface-border: color-mix(
    in srgb,
    var(--workspace-accent) 4%,
    var(--workspace-surface-base-border) 96%
  );
  --workspace-surface-shadow: var(--workspace-surface-base-shadow);
  --workspace-card-bg:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--workspace-accent-soft) 8%, transparent),
      transparent 62%
    ),
    var(--workspace-card-base-bg);
  --workspace-card-border: color-mix(
    in srgb,
    var(--workspace-accent) 7%,
    var(--workspace-card-base-border) 93%
  );
  --workspace-card-shadow: var(--workspace-card-base-shadow);
  --workspace-card-subtle-bg:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--workspace-accent) 6%, transparent),
      transparent 68%
    ),
    var(--workspace-card-subtle-base-bg);
  --workspace-card-emphasis-bg:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--workspace-accent-soft) 14%, transparent),
      transparent 78%
    ),
    var(--workspace-card-bg);
  --workspace-card-subtle-emphasis-bg:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--workspace-accent) 10%, transparent),
      transparent 74%
    ),
    var(--workspace-card-subtle-bg);
  --workspace-control-hover-bg: color-mix(
    in srgb,
    var(--workspace-accent-soft) 8%,
    var(--workspace-control-bg) 92%
  );
  --workspace-control-hover-border: color-mix(
    in srgb,
    var(--workspace-accent) 18%,
    var(--workspace-control-border) 82%
  );
  --workspace-field-divider: color-mix(
    in srgb,
    var(--workspace-accent) 8%,
    rgba(122, 160, 199, 0.16)
  );
  --workspace-media-bg:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--workspace-accent-soft) 12%, transparent),
      transparent 80%
    ),
    var(--workspace-media-base-bg);
  --workspace-media-border: color-mix(
    in srgb,
    var(--workspace-accent) 8%,
    var(--workspace-media-base-border) 92%
  );
  --workspace-media-shadow: var(--workspace-media-base-shadow);
  --workspace-media-ring: var(--workspace-media-base-ring);
  --workspace-chip-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0)),
    color-mix(in srgb, var(--workspace-tag-bg) 92%, var(--workspace-chip-base-surface));
  --workspace-chip-border: color-mix(
    in srgb,
    var(--workspace-tag-border) 62%,
    rgba(255, 255, 255, 0.28)
  );
  --workspace-chip-ink: color-mix(
    in srgb,
    var(--workspace-tag-ink) 84%,
    var(--portal-ink-strong) 16%
  );
  --workspace-chip-active-bg:
    var(--workspace-chip-active-gloss),
    color-mix(in srgb, var(--workspace-tag-bg) 90%, var(--workspace-chip-base-surface));
  --workspace-chip-active-border: color-mix(in srgb, var(--workspace-tag-border) 74%, transparent);
  --workspace-chip-active-ink: var(--portal-ink-strong);
  --workspace-tab-line: color-mix(in srgb, var(--workspace-accent) 5%, var(--home-line) 95%);
  --workspace-tab-track: color-mix(in srgb, var(--workspace-accent) 42%, transparent);
  width: min(var(--portal-workspace-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline)
    var(--portal-stage-padding-bottom);
  box-sizing: border-box;
  display: grid;
  gap: var(--portal-workspace-stage-gap);
}

.workspace-page--favorites {
  --workspace-accent: var(--workspace-favorites-accent);
  --workspace-accent-soft: var(--workspace-favorites-accent-soft);
  --workspace-tag-bg: var(--home-business-bookshelf-tag-bg);
  --workspace-tag-border: var(--home-business-bookshelf-tag-border);
  --workspace-tag-ink: var(--home-business-bookshelf-tag-ink);
}

.workspace-page--history {
  --workspace-accent: var(--workspace-history-accent);
  --workspace-accent-soft: var(--workspace-history-accent-soft);
  --workspace-tag-bg: var(--home-business-topic-tag-bg);
  --workspace-tag-border: var(--home-business-topic-tag-border);
  --workspace-tag-ink: var(--home-business-topic-tag-ink);
}

.workspace-page__toolbar {
  position: sticky;
  top: var(--portal-workspace-toolbar-top);
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: var(--portal-workspace-toolbar-align-items);
  justify-content: space-between;
  gap: 18px;
  padding: var(--portal-workspace-toolbar-padding);
  border: 1px solid var(--workspace-surface-border);
  border-radius: var(--workspace-surface-radius);
  background: var(--workspace-surface-bg);
  box-shadow: var(--workspace-surface-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.64)) saturate(1);
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.64)) saturate(1);
}

.workspace-page__tabs {
  flex: 1 1 420px;
  width: var(--portal-workspace-toolbar-section-width);
  min-width: 0;
}

.workspace-page__toolbar-side,
.workspace-page__toolbar-group,
.workspace-page__section-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.workspace-page__toolbar-side {
  flex: 0 1 auto;
  width: var(--portal-workspace-toolbar-section-width);
  min-width: var(--portal-workspace-toolbar-side-min-width);
  margin-left: var(--portal-workspace-toolbar-side-margin-left);
  justify-content: var(--portal-workspace-toolbar-side-justify);
}

.workspace-page__toolbar-group--actions {
  gap: 8px;
}

.workspace-page__toolbar-action,
.workspace-page__section-pill {
  appearance: none;
  -webkit-appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.workspace-page__toolbar-action {
  border: 1px solid var(--workspace-control-border);
  background: var(--workspace-control-bg);
  color: var(--workspace-control-ink);
}

.workspace-page__toolbar-action:hover,
.workspace-page__section-pill:hover {
  border-color: var(--workspace-control-hover-border);
  background: var(--workspace-control-hover-bg);
}

.workspace-page__toolbar-action:disabled {
  cursor: default;
  opacity: 0.62;
  box-shadow: none;
}

.workspace-page__toolbar-action.is-primary {
  border-color: var(--workspace-control-primary-border);
  background: var(--workspace-control-primary-bg);
  color: var(--workspace-control-primary-ink);
}

.workspace-page__toolbar-action.is-danger {
  border-color: var(--workspace-control-danger-border);
  background: var(--workspace-control-danger-bg);
  color: var(--workspace-control-danger-ink);
}

.workspace-page__layout {
  display: grid;
  grid-template-columns: var(--portal-workspace-layout-columns);
  gap: var(--portal-workspace-layout-gap);
  align-items: start;
}

.workspace-page__main {
  min-width: 0;
  display: grid;
  gap: 20px;
}

.workspace-page__section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--home-section-heading-gap);
  min-width: 0;
}

.workspace-page__section-head h1 {
  margin: 0;
  color: var(--portal-ink-strong);
  font-size: var(--home-heading-title-size);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: var(--home-heading-title-tracking);
}

.workspace-page__section-pill {
  border: 1px solid color-mix(in srgb, var(--workspace-accent) 10%, transparent);
  background: color-mix(in srgb, var(--workspace-accent-soft) 5%, transparent);
  color: color-mix(in srgb, var(--workspace-chip-ink) 78%, var(--portal-muted) 22%);
}

.workspace-page__section-pill.is-active {
  border-color: color-mix(in srgb, var(--workspace-accent) 18%, transparent);
  background: color-mix(in srgb, var(--workspace-accent-soft) 10%, transparent);
  color: var(--workspace-chip-active-ink);
}

.workspace-page__sidebar {
  position: var(--portal-workspace-sidebar-position);
  top: var(--portal-workspace-sidebar-top);
}

.workspace-page__tab-label {
  --workspace-tab-accent: var(--workspace-messages-accent);
  --workspace-tab-accent-soft: var(--workspace-messages-accent-soft);
  --workspace-tab-icon-bg: color-mix(in srgb, var(--workspace-tab-accent-soft) 7%, transparent);
  --workspace-tab-icon-border: color-mix(in srgb, var(--workspace-tab-accent) 8%, transparent);
  --workspace-tab-icon-hover-bg: color-mix(
    in srgb,
    var(--workspace-tab-accent-soft) 10%,
    transparent
  );
  --workspace-tab-icon-hover-border: color-mix(
    in srgb,
    var(--workspace-tab-accent) 12%,
    transparent
  );
  --workspace-tab-icon-active-bg: color-mix(
    in srgb,
    var(--workspace-tab-accent-soft) 12%,
    transparent
  );
  --workspace-tab-icon-active-border: color-mix(
    in srgb,
    var(--workspace-tab-accent) 16%,
    transparent
  );
  --workspace-tab-icon-ink: color-mix(
    in srgb,
    var(--workspace-tab-accent) 70%,
    var(--portal-muted) 30%
  );
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  padding: 0 8px 8px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--workspace-tab-text);
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.workspace-page__tab-label.is-messages {
  --workspace-tab-accent: var(--workspace-messages-accent);
  --workspace-tab-accent-soft: var(--workspace-messages-accent-soft);
}

.workspace-page__tab-label.is-favorites {
  --workspace-tab-accent: var(--workspace-favorites-accent);
  --workspace-tab-accent-soft: var(--workspace-favorites-accent-soft);
}

.workspace-page__tab-label.is-history {
  --workspace-tab-accent: var(--workspace-history-accent);
  --workspace-tab-accent-soft: var(--workspace-history-accent-soft);
}

.workspace-page__tab-icon-surface {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--workspace-tab-icon-border);
  border-radius: 999px;
  background: var(--workspace-tab-icon-bg);
  color: var(--workspace-tab-icon-ink);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.workspace-page__tab-icon {
  width: 12px;
  height: 12px;
}

.workspace-page__tab-text {
  line-height: 1;
  white-space: nowrap;
}

:deep(.workspace-page__tabs .el-tabs__header) {
  margin: 0;
}

:deep(.workspace-page__tabs .el-tabs__nav-wrap::after) {
  display: block;
  height: 1px;
  background: var(--workspace-tab-line);
}

:deep(.workspace-page__tabs .el-tabs__content) {
  display: none;
}

:deep(.workspace-page__tabs .el-tabs__nav-scroll) {
  overflow: visible;
}

:deep(.workspace-page__tabs .el-tabs__nav) {
  gap: 16px;
}

:deep(.workspace-page__tabs .el-tabs__item) {
  height: auto;
  padding: 0;
  color: inherit;
}

:deep(.workspace-page__tabs .el-tabs__item + .el-tabs__item) {
  margin-left: 0;
}

:deep(.workspace-page__tabs .el-tabs__item:hover .workspace-page__tab-label) {
  color: var(--workspace-tab-text-active);
}

:deep(.workspace-page__tabs .el-tabs__item:hover .workspace-page__tab-icon-surface) {
  border-color: var(--workspace-tab-icon-hover-border);
  background: var(--workspace-tab-icon-hover-bg);
}

:deep(.workspace-page__tabs .el-tabs__item.is-active .workspace-page__tab-label) {
  color: var(--workspace-tab-text-active);
}

:deep(.workspace-page__tabs .el-tabs__item.is-active .workspace-page__tab-text) {
  font-weight: 600;
}

:deep(.workspace-page__tabs .el-tabs__item.is-active .workspace-page__tab-icon-surface) {
  border-color: var(--workspace-tab-icon-active-border);
  background: var(--workspace-tab-icon-active-bg);
}

:deep(.workspace-page__tabs .el-tabs__active-bar) {
  height: 1px;
  border-radius: 999px;
  background: var(--workspace-tab-track);
}

:deep(.workspace-badge) {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  min-height: 22px;
  padding: 0 10px;
  max-width: 100%;
  border: 1px solid transparent;
  border-radius: 999px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.workspace-badge--comment),
:deep(.workspace-badge--article) {
  background: color-mix(
    in srgb,
    var(--home-business-article-tag-bg) 90%,
    var(--workspace-chip-base-surface)
  );
  border-color: color-mix(in srgb, var(--home-business-article-tag-border) 82%, transparent);
  color: color-mix(in srgb, var(--home-business-article-tag-ink) 86%, transparent);
}

:deep(.workspace-badge--reply),
:deep(.workspace-badge--topic) {
  background: color-mix(
    in srgb,
    var(--home-business-topic-tag-bg) 90%,
    var(--workspace-chip-base-surface)
  );
  border-color: color-mix(in srgb, var(--home-business-topic-tag-border) 82%, transparent);
  color: color-mix(in srgb, var(--home-business-topic-tag-ink) 86%, transparent);
}

:deep(.workspace-badge--gallery) {
  background: color-mix(
    in srgb,
    var(--home-business-gallery-tag-bg) 90%,
    var(--workspace-chip-base-surface)
  );
  border-color: color-mix(in srgb, var(--home-business-gallery-tag-border) 82%, transparent);
  color: color-mix(in srgb, var(--home-business-gallery-tag-ink) 86%, transparent);
}

:deep(.workspace-badge--book) {
  background: color-mix(
    in srgb,
    var(--home-business-bookshelf-tag-bg) 90%,
    var(--workspace-chip-base-surface)
  );
  border-color: color-mix(in srgb, var(--home-business-bookshelf-tag-border) 82%, transparent);
  color: color-mix(in srgb, var(--home-business-bookshelf-tag-ink) 86%, transparent);
}

:deep(.workspace-action-button) {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: var(--workspace-action-button-height);
  padding: 0 var(--workspace-action-button-padding-x);
  border: 1px solid var(--workspace-control-border);
  border-radius: 999px;
  background: var(--workspace-control-bg);
  color: var(--workspace-control-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

:deep(.workspace-action-button:hover) {
  border-color: var(--workspace-control-hover-border);
  background: var(--workspace-control-hover-bg);
}

:deep(.workspace-action-button:disabled) {
  cursor: default;
  opacity: 0.62;
  box-shadow: none;
}

:deep(.workspace-action-button--primary) {
  border-color: var(--workspace-control-primary-border);
  background: var(--workspace-control-primary-bg);
  color: var(--workspace-control-primary-ink);
}

:deep(.workspace-action-button--danger) {
  border-color: var(--workspace-control-danger-border);
  background: var(--workspace-control-danger-bg);
  color: var(--workspace-control-danger-ink);
}

:deep(.workspace-action-note) {
  margin: 0;
  font-size: 12px;
  color: color-mix(in srgb, var(--home-muted) 84%, var(--home-detail-glass-ink) 16%);
  font-weight: 600;
  line-height: 1.35;
}

:deep(.workspace-tag-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.workspace-tag) {
  display: inline-flex;
  align-items: center;
  min-height: var(--home-chip-height-sm);
  padding: 0 8px;
  border: 1px solid var(--workspace-chip-border);
  border-radius: 999px;
  background: var(--workspace-chip-bg);
  color: var(--workspace-chip-ink);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
</style>
