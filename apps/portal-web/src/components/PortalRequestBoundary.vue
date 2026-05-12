<template>
  <component :is="as" class="portal-request-boundary">
    <button
      v-if="showDebugSkeletonToggle"
      type="button"
      class="portal-request-boundary__debug-toggle"
      :class="{ 'is-active': debugSkeletonPreview }"
      :aria-pressed="debugSkeletonPreview"
      @click="debugSkeletonPreview = !debugSkeletonPreview"
    >
      {{ debugSkeletonPreview ? '查看内容' : '查看骨架' }}
    </button>

    <transition :name="resolvedTransitionName" mode="out-in">
      <slot v-if="resolvedMode === 'loading'" name="loading" />

      <slot v-else-if="resolvedMode === 'error'" name="error">
        <div key="error-state" class="portal-request-boundary__state">
          <div class="portal-request-boundary__media">
            <img
              :src="resolvedErrorIllustration"
              alt=""
              aria-hidden="true"
              class="portal-request-boundary__art"
            />
          </div>

          <div class="portal-request-boundary__copy">
            <p class="portal-request-boundary__message">{{ resolvedTitle }}</p>

            <div v-if="showsActions" class="portal-request-boundary__actions">
              <button
                v-if="primaryLabel"
                type="button"
                class="portal-request-boundary__action portal-request-boundary__action--primary"
                @click="$emit('primary')"
              >
                {{ primaryLabel }}
              </button>
              <button
                v-if="secondaryLabel"
                type="button"
                class="portal-request-boundary__action portal-request-boundary__action--secondary"
                @click="$emit('secondary')"
              >
                {{ secondaryLabel }}
              </button>
            </div>
          </div>
        </div>
      </slot>

      <slot v-else />
    </transition>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'

import error401Illustration from '@/assets/error-401.svg'
import error403Illustration from '@/assets/error-403.svg'
import error404Illustration from '@/assets/error-404.svg'
import error500Illustration from '@/assets/error-500.svg'

export type PortalRequestBoundaryMode = 'error' | 'loading' | 'ready'
export type PortalRequestBoundaryErrorCode = 401 | 403 | 404 | 500

const errorIllustrationMap: Record<PortalRequestBoundaryErrorCode, string> = {
  401: error401Illustration,
  403: error403Illustration,
  404: error404Illustration,
  500: error500Illustration
}

const props = withDefaults(
  defineProps<{
    as?: 'article' | 'aside' | 'div' | 'section'
    debugSkeletonToggle?: boolean
    errorCode?: PortalRequestBoundaryErrorCode
    mode: PortalRequestBoundaryMode
    primaryLabel?: string
    secondaryLabel?: string
    title?: string
    transitionName?: string
  }>(),
  {
    as: 'div',
    debugSkeletonToggle: true,
    errorCode: 500,
    primaryLabel: '',
    secondaryLabel: '',
    title: '网络开了点小差，请稍后再试。',
    transitionName: ''
  }
)

defineEmits<{
  primary: []
  secondary: []
}>()

const slots = useSlots()
const debugSkeletonPreview = ref(false)
const resolvedTransitionName = computed(
  () => props.transitionName.trim() || 'portal-request-boundary-stage'
)
const showDebugSkeletonToggle = computed(
  () =>
    import.meta.env.DEV &&
    props.debugSkeletonToggle &&
    props.mode === 'ready' &&
    Boolean(slots.loading)
)
const resolvedMode = computed<PortalRequestBoundaryMode>(() =>
  showDebugSkeletonToggle.value && debugSkeletonPreview.value ? 'loading' : props.mode
)
const showsActions = computed(() =>
  Boolean(props.primaryLabel.trim() || props.secondaryLabel.trim())
)
const resolvedErrorIllustration = computed(() => errorIllustrationMap[props.errorCode])
const resolvedTitle = computed(() => props.title.trim())
</script>

<style scoped>
.portal-request-boundary {
  position: relative;
  min-width: 0;
}

.portal-request-boundary-stage-enter-active,
.portal-request-boundary-stage-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    filter 200ms ease;
}

.portal-request-boundary-stage-enter-from,
.portal-request-boundary-stage-leave-to {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(6px);
}

.portal-request-boundary__state {
  display: grid;
  grid-template-columns:
    minmax(108px, var(--portal-request-state-art-width, 148px))
    minmax(0, var(--portal-request-state-copy-width, 28ch));
  align-items: center;
  justify-content: center;
  gap: 18px 24px;
  min-height: inherit;
  text-align: left;
}

.portal-request-boundary__media {
  display: flex;
  align-items: center;
  justify-content: center;
}

.portal-request-boundary__art {
  display: block;
  width: min(100%, var(--portal-request-state-art-width, 148px));
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 16px 26px rgba(18, 41, 74, 0.12));
}

.portal-request-boundary__debug-toggle {
  appearance: none;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--portal-request-state-border) 82%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--portal-request-state-bg) 84%, transparent);
  color: var(--portal-request-state-secondary-ink);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  opacity: 0.76;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition:
    opacity 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.portal-request-boundary__debug-toggle:hover {
  opacity: 1;
  border-color: var(--portal-request-state-primary-hover-border);
  background: var(--portal-request-state-primary-hover-bg);
  color: var(--portal-request-state-primary-ink);
}

.portal-request-boundary__debug-toggle.is-active {
  opacity: 1;
  border-color: var(--portal-request-state-primary-border);
  background: var(--portal-request-state-primary-bg);
  color: var(--portal-request-state-primary-ink);
}

.portal-request-boundary__debug-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.portal-request-boundary__copy {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 14px;
  min-width: 0;
}

.portal-request-boundary__message {
  margin: 0;
  max-width: 28ch;
  color: var(--portal-request-state-message-ink);
  font-size: var(--portal-request-state-message-size);
  line-height: 1.6;
  font-weight: var(--portal-request-state-message-weight);
}

.portal-request-boundary__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.portal-request-boundary__action {
  appearance: none;
  position: relative;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 999px;
  font: inherit;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    color 180ms ease,
    opacity 180ms ease;
}

.portal-request-boundary__action--primary {
  border-color: var(--portal-request-state-primary-border);
  background: var(--portal-request-state-primary-bg);
  box-shadow: var(--portal-request-state-primary-shadow);
  color: var(--portal-request-state-primary-ink);
}

.portal-request-boundary__action--secondary {
  min-height: 28px;
  padding: 0 4px;
  border-color: var(--portal-request-state-secondary-border);
  background: var(--portal-request-state-secondary-bg);
  box-shadow: none;
  color: var(--portal-request-state-secondary-ink);
}

.portal-request-boundary__action--secondary::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 5px;
  height: 1px;
  background: currentColor;
  opacity: 0.24;
  transform: scaleX(0.82);
  transform-origin: left center;
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.portal-request-boundary__action--primary:hover {
  border-color: var(--portal-request-state-primary-hover-border);
  background: var(--portal-request-state-primary-hover-bg);
  box-shadow: var(--portal-request-state-primary-hover-shadow);
}

.portal-request-boundary__action--secondary:hover {
  color: var(--portal-request-state-secondary-hover-ink);
}

.portal-request-boundary__action--secondary:hover::after {
  opacity: 0.42;
  transform: scaleX(1);
}

.portal-request-boundary__action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

@media (prefers-reduced-motion: reduce) {
  .portal-request-boundary-stage-enter-active,
  .portal-request-boundary-stage-leave-active,
  .portal-request-boundary__action,
  .portal-request-boundary__action--secondary::after {
    transition: opacity 160ms ease;
  }

  .portal-request-boundary-stage-enter-from,
  .portal-request-boundary-stage-leave-to {
    filter: none;
    transform: none;
  }

  .portal-request-boundary__action--secondary::after {
    transform: none;
  }
}

@media (max-width: 760px) {
  .portal-request-boundary__state {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    gap: 16px;
    text-align: center;
  }

  .portal-request-boundary__copy {
    justify-items: center;
  }

  .portal-request-boundary__actions {
    justify-content: center;
  }
}
</style>
