<template>
  <svg
    aria-hidden="true"
    class="qr-placeholder"
    viewBox="0 0 360 420"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        :id="shellGradientId"
        x1="180"
        y1="20"
        x2="180"
        y2="400"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="var(--portal-qr-frame-start)" />
        <stop offset="1" stop-color="var(--portal-qr-frame-end)" />
      </linearGradient>
      <linearGradient
        :id="screenGradientId"
        x1="180"
        y1="70"
        x2="180"
        y2="328"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="var(--portal-qr-screen-start)" />
        <stop offset="1" stop-color="var(--portal-qr-screen-end)" />
      </linearGradient>
      <linearGradient
        :id="badgeGradientId"
        x1="235"
        y1="130"
        x2="300"
        y2="200"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="var(--portal-qr-badge-start)" />
        <stop offset="0.55" stop-color="var(--portal-qr-badge-mid)" />
        <stop offset="1" stop-color="var(--portal-qr-badge-end)" />
      </linearGradient>
    </defs>

    <g class="qr-placeholder__bubbles">
      <circle
        cx="44"
        cy="98"
        r="12"
        fill="var(--portal-qr-bubble-fill)"
        fill-opacity="0.34"
        stroke="var(--portal-qr-bubble-stroke)"
        stroke-opacity="0.7"
      />
      <circle
        cx="68"
        cy="64"
        r="7"
        fill="var(--portal-qr-bubble-fill)"
        fill-opacity="0.26"
        stroke="var(--portal-qr-bubble-stroke)"
        stroke-opacity="0.56"
      />
      <circle
        cx="300"
        cy="52"
        r="10"
        fill="var(--portal-qr-bubble-fill)"
        fill-opacity="0.28"
        stroke="var(--portal-qr-bubble-stroke)"
        stroke-opacity="0.66"
      />
      <circle
        cx="322"
        cy="84"
        r="5"
        fill="var(--portal-qr-bubble-fill)"
        fill-opacity="0.22"
        stroke="var(--portal-qr-bubble-stroke)"
        stroke-opacity="0.48"
      />
    </g>

    <g class="qr-placeholder__device">
      <rect x="70" y="44" width="220" height="320" rx="42" :fill="`url(#${shellGradientId})`" />
      <rect
        x="82"
        y="58"
        width="196"
        height="292"
        rx="34"
        fill="var(--portal-qr-device-fill)"
        fill-opacity="0.96"
        stroke="var(--portal-qr-device-stroke)"
        stroke-width="2"
      />
      <rect x="132" y="70" width="96" height="10" rx="5" fill="var(--portal-qr-device-detail)" />
      <circle cx="250" cy="74" r="5" fill="var(--portal-qr-device-detail)" />
      <rect x="102" y="98" width="156" height="208" rx="28" :fill="`url(#${screenGradientId})`" />

      <g fill="var(--portal-qr-screen-band)" fill-opacity="0.42">
        <path d="M102 168H258V176H102Z" />
        <path d="M102 216H258V224H102Z" />
      </g>

      <g transform="translate(122 124)">
        <rect
          width="116"
          height="116"
          rx="20"
          fill="var(--portal-qr-code-bg)"
          fill-opacity="0.92"
        />
        <g fill="var(--portal-qr-code-module)">
          <rect width="28" height="28" rx="6" />
          <rect x="88" width="28" height="28" rx="6" />
          <rect y="88" width="28" height="28" rx="6" />
          <rect x="42" y="20" width="12" height="12" rx="2" />
          <rect x="58" y="20" width="12" height="12" rx="2" />
          <rect x="42" y="36" width="28" height="12" rx="2" />
          <rect x="78" y="42" width="12" height="12" rx="2" />
          <rect x="42" y="58" width="12" height="12" rx="2" />
          <rect x="60" y="58" width="12" height="12" rx="2" />
          <rect x="78" y="58" width="12" height="30" rx="2" />
          <rect x="42" y="78" width="28" height="12" rx="2" />
          <rect x="58" y="96" width="12" height="12" rx="2" />
          <rect x="94" y="94" width="12" height="12" rx="2" />
        </g>
        <g fill="var(--portal-qr-code-accent)" fill-opacity="0.32">
          <rect x="6" y="6" width="16" height="16" rx="4" />
          <rect x="94" y="6" width="16" height="16" rx="4" />
          <rect x="6" y="94" width="16" height="16" rx="4" />
        </g>
      </g>

      <g fill="var(--portal-qr-wave)" fill-opacity="0.9">
        <path d="M128 274C140 266 160 266 172 274" />
        <path d="M188 274C200 266 220 266 232 274" />
      </g>
    </g>

    <g class="qr-placeholder__badge">
      <circle cx="264" cy="178" r="44" :fill="`url(#${badgeGradientId})`" />
      <g stroke="var(--portal-qr-badge-mark)" stroke-linecap="round" stroke-width="6">
        <path d="M246 160H238C233.582 160 230 163.582 230 168V176" />
        <path d="M282 160H290C294.418 160 298 163.582 298 168V176" />
        <path d="M246 196H238C233.582 196 230 192.418 230 188V180" />
        <path d="M282 196H290C294.418 196 298 192.418 298 188V180" />
      </g>
    </g>

    <g fill="var(--portal-qr-cloud)" fill-opacity="0.88">
      <path
        d="M24 336C34 316 58 304 84 304C95 304 108 307 118 314C126 298 143 288 162 288C186 288 206 303 212 325C220 320 230 318 240 318C266 318 288 334 294 358H24V336Z"
      />
      <path
        d="M190 356C198 340 214 330 232 330C242 330 252 333 260 339C266 328 279 320 294 320C313 320 329 332 334 350C339 347 345 346 351 346C355 346 358 346 360 348V374H190V356Z"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const uid = useId()
const shellGradientId = `qr-shell-gradient-${uid}`
const screenGradientId = `qr-screen-gradient-${uid}`
const badgeGradientId = `qr-badge-gradient-${uid}`
</script>

<style scoped>
.qr-placeholder {
  display: block;
  width: 100%;
  height: auto;
}

.qr-placeholder__device {
  filter: drop-shadow(0 16px 24px var(--portal-qr-shadow, rgba(35, 76, 130, 0.16)));
}

.qr-placeholder__bubbles {
  animation: qr-placeholder-bubbles 12s ease-in-out infinite alternate;
  transform-origin: center;
}

.qr-placeholder__badge {
  animation: qr-placeholder-badge 7s ease-in-out infinite alternate;
  transform-origin: 264px 178px;
}

@keyframes qr-placeholder-bubbles {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(0, -10px, 0);
  }
}

@keyframes qr-placeholder-badge {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(0, -6px, 0);
  }
}
</style>
