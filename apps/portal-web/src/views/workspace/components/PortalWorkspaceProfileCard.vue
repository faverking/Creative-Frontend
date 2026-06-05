<template>
  <section class="workspace-profile-card">
    <template v-if="showSkeleton">
      <div class="workspace-profile-card__header workspace-profile-card__header--skeleton">
        <div class="workspace-profile-card__identity">
          <span class="workspace-profile-card__skeleton workspace-profile-card__skeleton--avatar" />

          <div class="workspace-profile-card__copy workspace-profile-card__copy--skeleton">
            <span
              class="workspace-profile-card__skeleton workspace-profile-card__skeleton--eyebrow"
            />
            <span
              class="workspace-profile-card__skeleton workspace-profile-card__skeleton--title"
            />
            <span class="workspace-profile-card__skeleton workspace-profile-card__skeleton--meta" />
          </div>
        </div>

        <span class="workspace-profile-card__skeleton workspace-profile-card__skeleton--button" />
      </div>

      <div class="workspace-profile-card__summary workspace-profile-card__summary--skeleton">
        <div class="workspace-profile-card__chips">
          <span class="workspace-profile-card__skeleton workspace-profile-card__skeleton--chip" />
          <span class="workspace-profile-card__skeleton workspace-profile-card__skeleton--chip" />
        </div>
        <span class="workspace-profile-card__skeleton workspace-profile-card__skeleton--joined" />
      </div>

      <div
        class="workspace-profile-card__fields workspace-profile-card__fields--skeleton"
        aria-hidden="true"
      >
        <div class="workspace-profile-card__field">
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-label"
          />
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-value"
          />
        </div>

        <div class="workspace-profile-card__field">
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-label"
          />
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-value workspace-profile-card__skeleton--field-value-long"
          />
        </div>

        <div class="workspace-profile-card__field">
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-label"
          />
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-value"
          />
        </div>

        <div class="workspace-profile-card__field workspace-profile-card__field--full">
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-label"
          />
          <span
            class="workspace-profile-card__skeleton workspace-profile-card__skeleton--field-textarea"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="workspace-profile-card__header">
        <div class="workspace-profile-card__identity">
          <div class="workspace-profile-card__avatar" aria-hidden="true">
            <img
              v-if="displayAvatarUrl"
              class="workspace-profile-card__avatar-image"
              :src="displayAvatarUrl"
              :alt="`${headingName} 的头像`"
            />
            <portal-svg-icon
              v-else
              name="user-avatar"
              class="workspace-profile-card__avatar-icon"
              size="100%"
            />
          </div>

          <div class="workspace-profile-card__copy">
            <p class="workspace-profile-card__eyebrow">个人资料</p>
            <h2>{{ headingName }}</h2>
            <p class="workspace-profile-card__meta">{{ emailLabel }}</p>
          </div>
        </div>

        <button
          type="button"
          class="workspace-profile-card__toggle"
          :class="{ 'is-active': isEditing }"
          :disabled="isBusy"
          @click="handleToggle"
        >
          {{ isEditing ? '取消' : '编辑资料' }}
        </button>
      </div>

      <div
        v-if="showNotice"
        class="workspace-profile-card__notice"
        :class="{ 'is-error': hasLoadError }"
      >
        <p>{{ noticeLabel }}</p>
        <button
          v-if="hasLoadError"
          type="button"
          class="workspace-profile-card__retry"
          @click="reloadProfile"
        >
          重新加载
        </button>
      </div>

      <div class="workspace-profile-card__summary">
        <div class="workspace-profile-card__chips">
          <span v-for="role in roleLabels" :key="role" class="workspace-profile-card__title">
            {{ role }}
          </span>
          <span class="workspace-profile-card__status" :class="`is-${profile.status}`">
            {{ statusLabel }}
          </span>
        </div>
        <span class="workspace-profile-card__joined">加入于 {{ createdAtLabel }}</span>
      </div>

      <div class="workspace-profile-card__fields">
        <label class="workspace-profile-card__field">
          <span>昵称</span>
          <input
            v-if="isEditing"
            v-model="draft.name"
            type="text"
            maxlength="20"
            :disabled="isBusy"
          />
          <strong v-else>{{ displayName }}</strong>
        </label>

        <div class="workspace-profile-card__field">
          <span>邮箱</span>
          <strong>{{ emailLabel }}</strong>
        </div>

        <div class="workspace-profile-card__field">
          <span>最近活跃</span>
          <strong>{{ lastLoginAtLabel }}</strong>
        </div>

        <div
          v-if="isEditing"
          class="workspace-profile-card__field workspace-profile-card__field--full"
        >
          <span>头像上传</span>
          <div class="workspace-profile-card__upload">
            <button
              type="button"
              class="workspace-profile-card__upload-trigger"
              disabled
              aria-disabled="true"
            >
              上传功能待接入
            </button>
            <p class="workspace-profile-card__upload-hint">暂不支持头像上传。</p>
          </div>
        </div>

        <label class="workspace-profile-card__field workspace-profile-card__field--full">
          <span>个人简介</span>
          <textarea
            v-if="isEditing"
            v-model="draft.bio"
            rows="4"
            maxlength="160"
            :disabled="isBusy"
          />
          <p v-else>{{ bioLabel }}</p>
        </label>
      </div>

      <div v-if="isEditing" class="workspace-profile-card__actions">
        <button
          type="button"
          class="workspace-profile-card__button"
          :disabled="isBusy"
          @click="resetDraft"
        >
          取消
        </button>
        <button
          type="button"
          class="workspace-profile-card__button workspace-profile-card__button--primary"
          :disabled="isBusy"
          @click="saveProfile"
        >
          {{ isBusy ? '保存中...' : '保存变更' }}
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { useWorkspaceProfile } from '../composables/useWorkspaceProfile'
import {
  WORKSPACE_PROFILE_ROLE_LABELS,
  WORKSPACE_PROFILE_STATUS_LABELS
} from '@/constants/workspace'
import { formatWorkspaceDateLabel, resolveWorkspaceAvatarUrl } from '@/utils/workspace'

const { profile, loadProfile, updateProfile } = useWorkspaceProfile()

const isEditing = ref(false)
const draft = reactive({
  name: profile.name,
  bio: profile.bio
})

const isBusy = computed(() => profile.isLoading || profile.isUpdating)
const hasLoadError = computed(() => !profile.isLoaded && Boolean(profile.loadError))
const showSkeleton = computed(() => profile.isLoading && !profile.isLoaded)
const displayName = computed(() => profile.name.trim() || '未设置昵称')
const headingName = computed(() =>
  isEditing.value ? draft.name.trim() || displayName.value : displayName.value
)
const displayAvatarUrl = computed(() => resolveWorkspaceAvatarUrl(profile.avatarUrl))
const emailLabel = computed(() => profile.email.trim() || '未绑定邮箱')
const bioLabel = computed(() => profile.bio.trim() || '暂无简介')
const statusLabel = computed(() => WORKSPACE_PROFILE_STATUS_LABELS[profile.status])
const roleLabels = computed(() => {
  const labels = Array.from(new Set(profile.roles)).map(
    (role) => WORKSPACE_PROFILE_ROLE_LABELS[role]
  )
  return labels.length > 0 ? labels : [WORKSPACE_PROFILE_ROLE_LABELS.user]
})
const createdAtLabel = computed(() => formatWorkspaceDateLabel(profile.createdAt) || '暂无记录')
const lastLoginAtLabel = computed(
  () => formatWorkspaceDateLabel(profile.lastLoginAt, true) || '暂无记录'
)
const noticeLabel = computed(() => {
  if (hasLoadError.value) {
    return '个人资料暂时加载失败，你仍然可以重新同步当前账号信息。'
  }

  return ''
})
const showNotice = computed(() => noticeLabel.value.length > 0)

watch(
  () => [profile.name, profile.bio],
  () => {
    if (!isEditing.value) {
      Object.assign(draft, {
        name: profile.name,
        bio: profile.bio
      })
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (!profile.isLoaded) {
    void loadProfile().catch(() => undefined)
  }
})

function resetDraft(): void {
  Object.assign(draft, {
    name: profile.name,
    bio: profile.bio
  })
  isEditing.value = false
}

async function reloadProfile(): Promise<void> {
  await loadProfile(true).catch(() => undefined)
}

async function saveProfile(): Promise<void> {
  if (isBusy.value) {
    return
  }

  const normalizedBio = draft.bio.trim()
  if (normalizedBio.length <= 2) {
    ElMessage.warning('个人简介至少输入 3 个字。')
    return
  }

  try {
    await updateProfile({
      name: draft.name.trim() || profile.name,
      bio: normalizedBio
    })
    resetDraft()
    ElMessage.success('资料已更新。')
  } catch {
    // 消息提示由请求层统一处理
  }
}

function handleToggle(): void {
  if (isBusy.value) {
    return
  }

  if (isEditing.value) {
    resetDraft()
    return
  }

  Object.assign(draft, {
    name: profile.name,
    bio: profile.bio
  })
  isEditing.value = true
}
</script>

<style scoped>
.workspace-profile-card {
  --workspace-accent-current: var(--workspace-accent, var(--workspace-messages-accent));
  --workspace-card-bg-current: var(--workspace-card-bg, var(--workspace-card-base-bg));
  --workspace-card-border-current: var(--workspace-card-border, var(--workspace-card-base-border));
  --workspace-card-shadow-current: var(--workspace-card-shadow, var(--workspace-card-base-shadow));
  --workspace-profile-card-bg-current: color-mix(
    in srgb,
    var(--workspace-card-bg-current) 88%,
    var(--workspace-surface-bg, var(--workspace-surface-base-bg)) 12%
  );
  --workspace-media-bg-current: var(--workspace-media-bg, var(--workspace-media-base-bg));
  --workspace-media-border-current: var(
    --workspace-media-border,
    var(--workspace-media-base-border)
  );
  --workspace-media-shadow-current: var(
    --workspace-media-shadow,
    var(--workspace-media-base-shadow)
  );
  --workspace-chip-bg-current: var(
    --workspace-chip-bg,
    color-mix(in srgb, var(--home-business-article-tag-bg) 92%, var(--workspace-chip-base-surface))
  );
  --workspace-chip-border-current: var(
    --workspace-chip-border,
    color-mix(in srgb, var(--home-business-article-tag-border) 72%, rgba(255, 255, 255, 0.28))
  );
  --workspace-chip-ink-current: var(
    --workspace-chip-ink,
    color-mix(in srgb, var(--home-business-article-tag-ink) 84%, var(--portal-ink-strong) 16%)
  );
  --workspace-field-divider-current: var(
    --workspace-field-divider,
    color-mix(in srgb, var(--workspace-accent-current) 8%, rgba(122, 160, 199, 0.16))
  );
  --workspace-control-hover-bg-current: var(
    --workspace-control-hover-bg,
    color-mix(in srgb, var(--workspace-accent-current) 8%, var(--workspace-control-bg) 92%)
  );
  --workspace-control-hover-border-current: var(
    --workspace-control-hover-border,
    color-mix(in srgb, var(--workspace-accent-current) 18%, var(--workspace-control-border) 82%)
  );
  --workspace-profile-label-size: 12px;
  --workspace-profile-label-line-height: 1.5;
  --workspace-profile-value-size: 13px;
  --workspace-profile-value-line-height: 1.68;
  --workspace-profile-field-gap: calc(var(--home-copy-gap-tight) + 2px);
  --workspace-profile-field-block-min-height: calc(
    var(--workspace-profile-value-size) * var(--workspace-profile-value-line-height)
  );
  --workspace-profile-section-gap: calc(var(--workspace-section-gap) + 2px);
  --workspace-profile-header-gap: 14px;
  --workspace-profile-summary-gap: 12px;
  --workspace-profile-input-padding-block: 8px;
  --workspace-profile-input-padding-inline: 10px;
  --workspace-profile-upload-gap: 8px;
  --workspace-profile-upload-min-height: 88px;
  display: grid;
  gap: var(--workspace-profile-section-gap);
  padding: 16px 14px;
  border: 1px solid var(--workspace-card-border-current);
  border-radius: 20px;
  background: var(--workspace-profile-card-bg-current);
  box-shadow: var(--workspace-card-shadow-current);
}

.workspace-profile-card__header,
.workspace-profile-card__identity,
.workspace-profile-card__summary,
.workspace-profile-card__actions,
.workspace-profile-card__chips {
  display: flex;
  align-items: center;
}

.workspace-profile-card__header,
.workspace-profile-card__summary {
  justify-content: space-between;
}

.workspace-profile-card__header {
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--workspace-profile-header-gap);
}

.workspace-profile-card__identity {
  min-width: 0;
  gap: var(--workspace-profile-header-gap);
}

.workspace-profile-card__avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border: 1px solid var(--workspace-media-border-current);
  border-radius: 20px;
  background: var(--workspace-media-bg-current);
  color: var(--portal-ink-strong);
  font-size: 18px;
  font-weight: 700;
  box-shadow: var(--workspace-media-shadow-current);
}

.workspace-profile-card__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workspace-profile-card__avatar-icon {
  width: 100%;
  height: 100%;
  color: color-mix(in srgb, var(--workspace-accent-current) 72%, var(--portal-ink-strong) 28%);
}

.workspace-profile-card__copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.workspace-profile-card__eyebrow {
  margin: 0;
  color: color-mix(in srgb, var(--workspace-accent-current) 72%, var(--portal-muted) 28%);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.workspace-profile-card__copy h2 {
  margin: 0;
  color: var(--portal-ink-strong);
  font-size: var(--home-font-size-title-md);
  line-height: 1.2;
  letter-spacing: 0;
}

.workspace-profile-card__meta,
.workspace-profile-card__joined,
.workspace-profile-card__notice p {
  margin: 0;
  color: var(--portal-muted);
  font-size: var(--workspace-profile-label-size);
  font-weight: 600;
  line-height: var(--workspace-profile-label-line-height);
}

.workspace-profile-card__notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid color-mix(in srgb, var(--workspace-accent-current) 10%, transparent);
  border-radius: 15px;
  background: color-mix(in srgb, var(--workspace-accent-current) 5%, transparent);
}

.workspace-profile-card__notice.is-error {
  border-color: color-mix(in srgb, var(--portal-danger) 16%, transparent);
  background: color-mix(in srgb, var(--portal-danger) 6%, transparent);
}

.workspace-profile-card__retry {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--portal-ink-strong);
  font: inherit;
  font-size: var(--workspace-profile-label-size);
  font-weight: 700;
  cursor: pointer;
}

.workspace-profile-card__summary,
.workspace-profile-card__chips {
  flex-wrap: wrap;
}

.workspace-profile-card__summary {
  align-items: flex-start;
  gap: var(--workspace-profile-summary-gap);
}

.workspace-profile-card__chips {
  gap: var(--home-card-gap-tight);
}

.workspace-profile-card__title,
.workspace-profile-card__status {
  display: inline-flex;
  align-items: center;
  min-height: var(--home-chip-height-xs);
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.workspace-profile-card__title {
  border: 1px solid
    color-mix(in srgb, var(--workspace-chip-border-current) 86%, rgba(255, 255, 255, 0.18));
  background: color-mix(in srgb, var(--workspace-chip-bg-current) 78%, transparent);
  color: var(--workspace-chip-ink-current);
}

.workspace-profile-card__status {
  border: 1px solid color-mix(in srgb, var(--workspace-accent-current) 14%, transparent);
  background: color-mix(in srgb, var(--workspace-accent-current) 8%, transparent);
  color: color-mix(in srgb, var(--workspace-accent-current) 72%, var(--portal-ink-strong) 28%);
}

.workspace-profile-card__status.is-blocked {
  border-color: color-mix(in srgb, var(--portal-danger) 18%, transparent);
  background: color-mix(in srgb, var(--portal-danger) 10%, transparent);
  color: color-mix(in srgb, var(--portal-danger) 72%, var(--portal-ink-strong) 28%);
}

.workspace-profile-card__status.is-deleted {
  border-color: color-mix(in srgb, var(--portal-muted) 28%, transparent);
  background: color-mix(in srgb, var(--portal-muted) 10%, transparent);
  color: color-mix(in srgb, var(--portal-muted) 80%, var(--portal-ink-strong) 20%);
}

.workspace-profile-card__toggle,
.workspace-profile-card__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--workspace-control-border);
  border-radius: 999px;
  background: var(--workspace-control-bg);
  color: var(--workspace-control-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    opacity 180ms ease;
}

.workspace-profile-card__toggle {
  flex: 0 0 auto;
}

.workspace-profile-card__toggle,
.workspace-profile-card__skeleton--button {
  margin-left: auto;
}

.workspace-profile-card__toggle:hover,
.workspace-profile-card__button:hover {
  border-color: var(--workspace-control-hover-border-current);
  background: var(--workspace-control-hover-bg-current);
}

.workspace-profile-card__toggle:disabled,
.workspace-profile-card__button:disabled {
  cursor: default;
  opacity: 0.62;
}

.workspace-profile-card__toggle.is-active,
.workspace-profile-card__button--primary {
  border-color: var(--workspace-control-primary-border);
  background: var(--workspace-control-primary-bg);
  color: var(--workspace-control-primary-ink);
}

.workspace-profile-card__fields {
  display: grid;
  gap: 0;
}

.workspace-profile-card__field {
  display: grid;
  gap: var(--workspace-profile-field-gap);
  padding: 12px 0;
  border-top: 1px dashed var(--workspace-field-divider-current);
}

.workspace-profile-card__field:first-child {
  border-top: 0;
  padding-top: 0;
}

.workspace-profile-card__field--full {
  padding-bottom: 0;
}

.workspace-profile-card__field span {
  color: var(--portal-muted);
  font-size: var(--workspace-profile-label-size);
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: var(--workspace-profile-label-line-height);
}

.workspace-profile-card__field strong,
.workspace-profile-card__field p {
  margin: 0;
  min-height: var(--workspace-profile-field-block-min-height);
  color: var(--portal-ink-strong);
  font-size: var(--workspace-profile-value-size);
  font-weight: 500;
  line-height: var(--workspace-profile-value-line-height);
  word-break: break-word;
}

.workspace-profile-card__upload {
  display: grid;
  gap: var(--workspace-profile-upload-gap);
  min-height: var(--workspace-profile-upload-min-height);
  padding: 12px;
  border: 1px dashed var(--workspace-input-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--workspace-input-bg) 82%, transparent);
  align-content: start;
}

.workspace-profile-card__upload-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--workspace-control-border);
  border-radius: 999px;
  background: var(--workspace-control-bg);
  color: var(--workspace-control-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: not-allowed;
  opacity: 0.72;
}

.workspace-profile-card__upload-hint {
  margin: 0;
  color: var(--portal-muted);
  font-size: var(--workspace-profile-label-size);
  line-height: var(--workspace-profile-label-line-height);
}

.workspace-profile-card__field input,
.workspace-profile-card__field textarea {
  width: 100%;
  padding: var(--workspace-profile-input-padding-block)
    var(--workspace-profile-input-padding-inline);
  border: 1px solid var(--workspace-input-border);
  border-radius: 12px;
  background: var(--workspace-input-bg);
  color: var(--portal-ink-strong);
  font: inherit;
  font-size: var(--workspace-profile-value-size);
  line-height: var(--workspace-profile-value-line-height);
  box-sizing: border-box;
  resize: vertical;
}

.workspace-profile-card__field input {
  min-height: calc(var(--workspace-profile-field-block-min-height) + 16px);
}

.workspace-profile-card__field textarea {
  min-height: 94px;
}

.workspace-profile-card__field input:disabled,
.workspace-profile-card__field textarea:disabled {
  opacity: 0.68;
  cursor: default;
}

.workspace-profile-card__field input:focus-visible,
.workspace-profile-card__field textarea:focus-visible,
.workspace-profile-card__toggle:focus-visible,
.workspace-profile-card__button:focus-visible,
.workspace-profile-card__retry:focus-visible {
  outline: none;
  border-color: var(--workspace-control-primary-border);
  box-shadow: 0 0 0 4px var(--portal-focus-ring);
}

.workspace-profile-card__actions {
  justify-content: flex-end;
  gap: var(--workspace-action-stack-gap);
  padding-top: 6px;
}

.workspace-profile-card__skeleton {
  position: relative;
  display: block;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.workspace-profile-card__skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
}

.workspace-profile-card__copy--skeleton {
  gap: 6px;
}

.workspace-profile-card__summary--skeleton {
  align-items: center;
}

.workspace-profile-card__fields--skeleton .workspace-profile-card__field {
  pointer-events: none;
}

.workspace-profile-card__skeleton--avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
}

.workspace-profile-card__skeleton--eyebrow {
  width: 64px;
  height: calc(12px * 1.3);
}

.workspace-profile-card__skeleton--title {
  width: 128px;
  height: calc(var(--home-font-size-title-md) * 1.2);
}

.workspace-profile-card__skeleton--meta,
.workspace-profile-card__skeleton--joined,
.workspace-profile-card__skeleton--field-label {
  height: calc(var(--workspace-profile-label-size) * var(--workspace-profile-label-line-height));
}

.workspace-profile-card__skeleton--meta {
  width: 118px;
}

.workspace-profile-card__skeleton--button {
  width: 88px;
  height: 32px;
}

.workspace-profile-card__skeleton--chip {
  width: 56px;
  height: var(--home-chip-height-xs);
}

.workspace-profile-card__skeleton--joined {
  width: 92px;
}

.workspace-profile-card__skeleton--field-label {
  width: 44px;
}

.workspace-profile-card__skeleton--field-value {
  width: 108px;
  height: var(--workspace-profile-field-block-min-height);
}

.workspace-profile-card__skeleton--field-value-long {
  width: 152px;
}

.workspace-profile-card__skeleton--field-textarea {
  width: 100%;
  height: 88px;
  border-radius: 14px;
}
</style>
