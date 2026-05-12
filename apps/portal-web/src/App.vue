<template>
  <el-config-provider :locale="zhCn">
    <div class="portal-app">
      <portal-top-bar />

      <div class="portal-app__frame">
        <main class="portal-app__content">
          <router-view />
        </main>

        <router-view name="dialog" />
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<style scoped>
.portal-app {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  background: var(--portal-page-bg);
}

.portal-app::before,
.portal-app::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.portal-app::before {
  z-index: 0;
  background: var(--portal-scene-overlay);
  opacity: var(--portal-scene-opacity);
  transform: scale(1.02);
}

.portal-app::after {
  z-index: 0;
  background: var(--portal-scene-blur-overlay);
  filter: blur(34px) saturate(var(--portal-scene-saturate));
  opacity: var(--portal-scene-blur-opacity);
  transform: scale(1.1);
}

.portal-app__frame {
  position: relative;
  z-index: 1;
  width: var(--portal-frame-width);
  min-height: calc(100vh - 100px);
  margin: 0 auto;
  padding: 28px 0 56px;
}

.portal-app__content {
  display: grid;
  align-content: start;
  min-height: calc(100vh - 180px);
}
</style>
