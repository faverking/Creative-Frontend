export interface PortalIconDefinition {
  viewBox: string
  body: string
}

const portalBrandLogoLightBody = `
  <defs>
    <linearGradient id="ringGradLight" x1="108" y1="78" x2="354" y2="314" gradientUnits="userSpaceOnUse">
      <stop stop-color="#DFF4FF"/>
      <stop offset="0.35" stop-color="#8FD8FF"/>
      <stop offset="0.72" stop-color="#5FA7E8"/>
      <stop offset="1" stop-color="#3F74B8"/>
    </linearGradient>

    <linearGradient id="coreCrossLight" x1="216" y1="162" x2="240" y2="229" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#DDF6FF"/>
    </linearGradient>

    <radialGradient id="coreGradLight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
      gradientTransform="translate(228 202) rotate(90) scale(44 44)">
      <stop stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#E8FAFF"/>
      <stop offset="1" stop-color="#A8E2FF"/>
    </radialGradient>

    <filter id="ringGlowLight" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.18 0"/>
      <feBlend in="SourceGraphic" mode="screen"/>
    </filter>

    <filter id="coreGlowLight" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.20 0"/>
      <feBlend in="SourceGraphic" mode="screen"/>
    </filter>

    <filter id="tinyGlowLight" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <style>
      .brand-text {
        font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
        font-weight: 700;
        letter-spacing: 4px;
        fill: #3E5C84;
      }
      .sub-text {
        font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        font-weight: 500;
        letter-spacing: 1.8px;
        fill: #6D8AB6;
      }
    </style>
  </defs>

  <g filter="url(#tinyGlowLight)" opacity="0.9">
    <circle cx="96" cy="88" r="5" fill="#DDF6FF"/>
    <circle cx="148" cy="66" r="2.6" fill="#9DCDFF"/>
    <circle cx="338" cy="102" r="4.2" fill="#DDF6FF"/>
    <circle cx="365" cy="154" r="2.8" fill="#9DCDFF"/>
    <circle cx="116" cy="300" r="4.6" fill="#DDF6FF"/>
    <circle cx="320" cy="294" r="3.6" fill="#C9C6FF" fill-opacity="0.55"/>
    <path d="M332 246C334 252 339 257 345 259C339 261 334 266 332 272C330 266 325 261 319 259C325 257 330 252 332 246Z"
          fill="#EAFBFF"/>
  </g>

  <g>
    <g filter="url(#ringGlowLight)">
      <path d="
        M230 84
        C281 84 323 101 349 129
        C368 149 379 173 381 198
        C382 212 372 224 358 224
        C344 224 333 214 330 200
        C326 181 317 165 303 153
        C286 138 261 129 232 129
        C197 129 168 141 148 164
        C129 186 121 214 128 242
        C134 269 152 291 180 304
        C209 318 243 317 271 304
        C283 299 297 301 306 311
        C315 321 314 337 304 347
        C282 368 233 378 187 362
        C147 348 114 319 98 279
        C82 239 84 193 104 157
        C128 112 173 84 230 84Z"
        fill="url(#ringGradLight)"/>

      <path d="
        M351 124
        C373 126 390 139 396 157
        C401 172 395 186 382 194
        C371 201 357 199 348 190
        C339 181 337 169 340 158
        C343 145 346 133 351 124Z"
        fill="#D8F7FF"/>
    </g>

    <g opacity="0.42">
      <ellipse cx="225" cy="206" rx="92" ry="88" fill="#C9EDFF"/>
    </g>

    <g filter="url(#coreGlowLight)">
      <circle cx="228" cy="202" r="30" fill="url(#coreGradLight)"/>
      <path d="M228 163C232 180 241 190 258 194C241 198 232 208 228 225C224 208 215 198 198 194C215 190 224 180 228 163Z"
            fill="url(#coreCrossLight)"/>
    </g>

    <g filter="url(#tinyGlowLight)">
      <path d="M146 128C149 136 156 142 164 145C156 148 149 154 146 162C143 154 136 148 128 145C136 142 143 136 146 128Z"
            fill="#F7FEFF" fill-opacity="0.9"/>
      <circle cx="170" cy="98" r="3" fill="#DDF6FF"/>
      <circle cx="286" cy="117" r="2.5" fill="#BDE6FF"/>
    </g>
  </g>

  <g transform="translate(470 0)">
    <text x="0" y="188" font-size="96" class="brand-text">创意中心</text>
    <text x="173" y="262" font-size="26" text-anchor="middle" class="sub-text">Creative Center</text>
    <path d="M8 308C108 322 222 322 346 306" stroke="#6FAFEA" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
    <circle cx="366" cy="304" r="4" fill="#8FD8FF" opacity="0.72"/>
  </g>
`

const portalBrandLogoDarkBody = `
  <defs>
    <linearGradient id="ringGradDark" x1="108" y1="78" x2="354" y2="314" gradientUnits="userSpaceOnUse">
      <stop stop-color="#EAFBFF"/>
      <stop offset="0.35" stop-color="#9EDBFF"/>
      <stop offset="0.72" stop-color="#5EA8F1"/>
      <stop offset="1" stop-color="#7B8DFF"/>
    </linearGradient>

    <linearGradient id="coreCrossDark" x1="216" y1="162" x2="240" y2="229" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#DDF6FF"/>
    </linearGradient>

    <radialGradient id="coreGradDark" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
      gradientTransform="translate(228 202) rotate(90) scale(44 44)">
      <stop stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#E8FAFF"/>
      <stop offset="1" stop-color="#A8E2FF"/>
    </radialGradient>

    <filter id="ringGlowDark" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.48 0"/>
      <feBlend in="SourceGraphic" mode="screen"/>
    </filter>

    <filter id="coreGlowDark" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.55 0"/>
      <feBlend in="SourceGraphic" mode="screen"/>
    </filter>

    <filter id="tinyGlowDark" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <style>
      .brand-text {
        font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
        font-weight: 700;
        letter-spacing: 4px;
        fill: #F2F8FF;
      }
      .sub-text {
        font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        font-weight: 500;
        letter-spacing: 1.8px;
        fill: #9FC3EB;
      }
    </style>
  </defs>

  <g filter="url(#tinyGlowDark)" opacity="0.95">
    <circle cx="96" cy="88" r="5" fill="#DDF6FF"/>
    <circle cx="148" cy="66" r="2.6" fill="#9DCDFF"/>
    <circle cx="338" cy="102" r="4.2" fill="#DDF6FF"/>
    <circle cx="365" cy="154" r="2.8" fill="#9DCDFF"/>
    <circle cx="116" cy="300" r="4.6" fill="#DDF6FF"/>
    <circle cx="320" cy="294" r="3.6" fill="#C9C6FF" fill-opacity="0.72"/>
    <path d="M332 246C334 252 339 257 345 259C339 261 334 266 332 272C330 266 325 261 319 259C325 257 330 252 332 246Z"
          fill="#EAFBFF"/>
  </g>

  <g>
    <g filter="url(#ringGlowDark)">
      <path d="
        M230 84
        C281 84 323 101 349 129
        C368 149 379 173 381 198
        C382 212 372 224 358 224
        C344 224 333 214 330 200
        C326 181 317 165 303 153
        C286 138 261 129 232 129
        C197 129 168 141 148 164
        C129 186 121 214 128 242
        C134 269 152 291 180 304
        C209 318 243 317 271 304
        C283 299 297 301 306 311
        C315 321 314 337 304 347
        C282 368 233 378 187 362
        C147 348 114 319 98 279
        C82 239 84 193 104 157
        C128 112 173 84 230 84Z"
        fill="url(#ringGradDark)"/>

      <path d="
        M351 124
        C373 126 390 139 396 157
        C401 172 395 186 382 194
        C371 201 357 199 348 190
        C339 181 337 169 340 158
        C343 145 346 133 351 124Z"
        fill="#D8F7FF"/>
    </g>

    <g opacity="0.55">
      <ellipse cx="225" cy="206" rx="92" ry="88" fill="#C9EDFF"/>
    </g>

    <g filter="url(#coreGlowDark)">
      <circle cx="228" cy="202" r="30" fill="url(#coreGradDark)"/>
      <path d="M228 163C232 180 241 190 258 194C241 198 232 208 228 225C224 208 215 198 198 194C215 190 224 180 228 163Z"
            fill="url(#coreCrossDark)"/>
    </g>

    <g filter="url(#tinyGlowDark)">
      <path d="M146 128C149 136 156 142 164 145C156 148 149 154 146 162C143 154 136 148 128 145C136 142 143 136 146 128Z"
            fill="#F7FEFF" fill-opacity="0.9"/>
      <circle cx="170" cy="98" r="3" fill="#DDF6FF"/>
      <circle cx="286" cy="117" r="2.5" fill="#BDE6FF"/>
    </g>
  </g>

  <g transform="translate(470 0)">
    <text x="0" y="188" font-size="96" class="brand-text">创意中心</text>
    <text x="173" y="262" font-size="26" text-anchor="middle" class="sub-text">Creative Center</text>
    <path d="M8 308C108 322 222 322 346 306" stroke="#6FAFEA" stroke-width="2.2" stroke-linecap="round" opacity="0.72"/>
    <circle cx="366" cy="304" r="4" fill="#8FD8FF" opacity="0.82"/>
  </g>
`

const portalUserAvatarBody = `
  <!-- 呆毛 -->
  <path d="M68 17C70 10 75 6 79 10C81 13 78 18 72 24" stroke="#6F7B9F" stroke-width="3.2" stroke-linecap="round"/>

  <!-- 左双马尾：上提并略向外 -->
  <path d="M28.5 58.5C23.1 61.5 20.1 67.4 20.8 73.7C21.4 78.7 24.1 83.1 28.5 86.3C31.4 88.3 35 89.6 38.6 89.8C35.8 85.9 34.9 81.1 35.4 76.2C36 71.3 37.8 67.1 41.1 63.8L28.5 58.5Z" fill="#6F7B9F"/>

  <!-- 右双马尾：上提并略向外 -->
  <path d="M99.5 58.5C104.9 61.5 107.9 67.4 107.2 73.7C106.6 78.7 103.9 83.1 99.5 86.3C96.6 88.3 93 89.6 89.4 89.8C92.2 85.9 93.1 81.1 92.6 76.2C92 71.3 90.2 67.1 86.9 63.8L99.5 58.5Z" fill="#6F7B9F"/>

  <!-- 双马尾内层阴影 -->
  <path d="M32.3 62.9C28.9 65.6 27.1 69.8 27.4 74.4C27.7 78 29.4 81.2 32.3 83.8C31.9 80.3 32.6 76.2 35.3 71.4C36.5 69.2 38 67.2 39.8 65.3L32.3 62.9Z" fill="#54607F"/>
  <path d="M95.7 62.9C99.1 65.6 100.9 69.8 100.6 74.4C100.3 78 98.6 81.2 95.7 83.8C96.1 80.3 95.4 76.2 92.7 71.4C91.5 69.2 90 67.2 88.2 65.3L95.7 62.9Z" fill="#54607F"/>

  <!-- 后发 -->
  <path d="M42 52.5C42 41.5 51 33 64 33C77 33 86 41.5 86 52.5C86 57.2 84.9 61.6 82.9 65.4C81.1 68.9 78.6 71.8 75.6 74C72.3 76.3 68.3 77.5 64 77.5C59.7 77.5 55.7 76.3 52.4 74C49.4 71.8 46.9 68.9 45.1 65.4C43.1 61.6 42 57.2 42 52.5Z" fill="#6F7B9F"/>

  <!-- 后发层次 -->
  <path d="M50 39.5C53.2 37.7 57.3 36.6 61.4 36.8" stroke="#9FAAD0" stroke-width="1.8" stroke-linecap="round" opacity="0.72"/>
  <path d="M78 40.4C75.9 38.8 73.1 37.6 69.8 36.9" stroke="#9FAAD0" stroke-width="1.8" stroke-linecap="round" opacity="0.62"/>

  <!-- 脸 -->
  <path d="M37 71C37 52 49 38 64 38C79 38 91 52 91 71C91 87 79 99 64 99C49 99 37 87 37 71Z" fill="#FCE5DA"/>

  <!-- 主头发 -->
  <path d="M28.8 53.5C28.8 34.2 44.5 18.5 64 18.5C83.5 18.5 99.2 34.2 99.2 53.5C99.2 61.7 97.2 69.1 93.3 75.8C91.1 69.8 86.5 63.9 79.4 60C72 56 62.4 55.7 53.2 58.1C45.4 60.1 39.6 66.6 34.7 75.8C30.8 69.1 28.8 61.7 28.8 53.5Z" fill="#6F7B9F"/>

  <!-- 刘海底层 -->
  <path d="M34 42.5C38 28 50 20 64 20C79 20 90 28.3 94 43C89.8 40.9 85.8 40.4 81.6 41.8C76.5 43.4 73 48.2 67.8 51.6C62.7 54.8 57.1 55.3 51.6 53.3C46 51.2 40.7 46.3 34 42.5Z" fill="#54607F"/>

  <!-- 刘海分束 -->
  <path d="M45.5 26.8C49.8 34.8 49 43.8 44.5 51.2" stroke="#54607F" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M58.5 23.8C61.8 33.2 60.8 44.2 55.2 54.2" stroke="#54607F" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M69.8 24.5C71.2 33.8 69.8 43.2 65.4 51.8" stroke="#54607F" stroke-width="3.8" stroke-linecap="round"/>

  <!-- 左侧发 -->
  <path d="M35.5 56C31.9 60.6 30.1 66.4 30.5 72.7C30.8 78 33 82.7 36.6 86C36.7 81.8 38.6 76.6 43 68.3L35.5 56Z" fill="#54607F"/>

  <!-- 右侧发 -->
  <path d="M92.5 56C96.1 60.6 97.9 66.4 97.5 72.7C97.2 78 95 82.7 91.4 86C91.3 81.8 89.4 76.6 85 68.3L92.5 56Z" fill="#54607F"/>

  <!-- 双马尾根部：移到主头发和侧发之后 -->
  <ellipse cx="35.8" cy="60.3" rx="5" ry="3.9" fill="#54607F"/>
  <ellipse cx="92.2" cy="60.3" rx="5" ry="3.9" fill="#54607F"/>

  <!-- 珠饰发圈：移到更上层，并稍微下调一点 -->
  <circle cx="34.8" cy="60.5" r="1.45" fill="#EAF1FF"/>
  <circle cx="37.2" cy="60.0" r="1.65" fill="#DCE8FF"/>
  <circle cx="39.5" cy="60.6" r="1.3" fill="#BED2FF"/>

  <circle cx="88.5" cy="60.6" r="1.3" fill="#BED2FF"/>
  <circle cx="90.8" cy="60.0" r="1.65" fill="#DCE8FF"/>
  <circle cx="93.2" cy="60.5" r="1.45" fill="#EAF1FF"/>

  <!-- 珠饰高光 -->
  <circle cx="34.4" cy="60.1" r="0.35" fill="white"/>
  <circle cx="36.8" cy="59.5" r="0.38" fill="white"/>
  <circle cx="39.1" cy="60.2" r="0.3" fill="white"/>

  <circle cx="88.1" cy="60.2" r="0.3" fill="white"/>
  <circle cx="90.4" cy="59.5" r="0.38" fill="white"/>
  <circle cx="92.8" cy="60.1" r="0.35" fill="white"/>

  <!-- 发丝高光 -->
  <path d="M50 28C55.5 24.5 61.2 22.8 68.4 23.6" stroke="#C8D1E6" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>

  <!-- 月亮发饰 -->
  <circle cx="82.2" cy="44.8" r="5.8" fill="#EAF1FF"/>
  <circle cx="84.7" cy="43.5" r="5.8" fill="#6F7B9F"/>
  <path d="M79.9 41.8C80.8 40.9 82.1 40.2 83.5 39.9" stroke="white" stroke-width="0.9" stroke-linecap="round" opacity="0.9"/>
  <circle cx="87.8" cy="40.6" r="0.8" fill="#EAF1FF"/>
  <circle cx="89.6" cy="42.3" r="0.45" fill="#DCE8FF"/>

  <!-- 左眼 -->
  <path d="M48.4 74.2C48.4 70.4 50.4 67.6 53.2 67.6C56.1 67.6 58.1 70.4 58.1 74.2C58.1 77.7 56.1 80.4 53.2 80.4C50.4 80.4 48.4 77.7 48.4 74.2Z" fill="#2F3E5B"/>
  <path d="M48.8 72.1C49.8 69.1 51.6 67.5 53.9 67.5C56.1 67.5 57.4 68.8 58 70.8" stroke="#2B3853" stroke-width="1.1" stroke-linecap="round"/>

  <!-- 右眼 -->
  <path d="M69.9 74.2C69.9 70.4 71.9 67.6 74.8 67.6C77.6 67.6 79.6 70.4 79.6 74.2C79.6 77.7 77.6 80.4 74.8 80.4C71.9 80.4 69.9 77.7 69.9 74.2Z" fill="#2F3E5B"/>
  <path d="M70.3 72.1C71.3 69.1 73.1 67.5 75.4 67.5C77.6 67.5 78.9 68.8 79.5 70.8" stroke="#2B3853" stroke-width="1.1" stroke-linecap="round"/>

  <!-- 高光 -->
  <circle cx="54.6" cy="72.2" r="1.1" fill="white"/>
  <circle cx="76.1" cy="72.2" r="1.1" fill="white"/>
  <circle cx="53.2" cy="74.8" r="0.45" fill="#DCE8FF"/>
  <circle cx="74.7" cy="74.8" r="0.45" fill="#DCE8FF"/>

  <!-- 小嘴 -->
  <path d="M61.6 84.4C62.8 85.4 65.2 85.4 66.4 84.4" stroke="#D9919C" stroke-width="1.9" stroke-linecap="round"/>

  <!-- 腮红 -->
  <ellipse cx="44.5" cy="80.5" rx="5.8" ry="3" fill="#F7BDC9" fill-opacity="0.34"/>
  <ellipse cx="83.5" cy="80.5" rx="5.8" ry="3" fill="#F7BDC9" fill-opacity="0.34"/>
`

const moduleFilterStarBody = `
  <path
    d="M74 0C88 42 106 60 148 74C106 88 88 106 74 148C60 106 42 88 0 74C42 60 60 42 74 0Z"
    fill="currentColor"
    fill-opacity="0.12"
  />
  <path
    d="M74 0C88 42 106 60 148 74C106 88 88 106 74 148C60 106 42 88 0 74C42 60 60 42 74 0Z"
    fill="none"
    stroke="var(--portal-icon-outline-color, currentColor)"
    stroke-opacity="0.64"
    stroke-linejoin="round"
    stroke-width="6"
  />
  <path
    d="M74 24C83 50 98 65 124 74C98 83 83 98 74 124C65 98 50 83 24 74C50 65 65 50 74 24Z"
    fill="var(--portal-icon-secondary-color, currentColor)"
  />
  <path
    d="M74 24C83 50 98 65 124 74C98 83 83 98 74 124C65 98 50 83 24 74C50 65 65 50 74 24Z"
    fill="none"
    stroke="var(--portal-icon-inner-line-color, white)"
    stroke-opacity="0.42"
    stroke-linejoin="round"
    stroke-width="3.5"
  />
  <path
    d="M74 40C80 57 91 68 108 74C91 80 80 91 74 108C68 91 57 80 40 74C57 68 68 57 74 40Z"
    fill="var(--portal-icon-highlight-color, currentColor)"
  />
  <path
    d="M74 54C78 64 84 70 94 74C84 78 78 84 74 94C70 84 64 78 54 74C64 70 70 64 74 54Z"
    fill="var(--portal-icon-glint-color, white)"
    fill-opacity="0.66"
  />
`

export const portalIconDefinitions = {
  'brand-logo-light': {
    viewBox: '0 0 1280 420',
    body: portalBrandLogoLightBody
  },
  'brand-logo-dark': {
    viewBox: '0 0 1280 420',
    body: portalBrandLogoDarkBody
  },
  'user-avatar': {
    viewBox: '0 0 128 128',
    body: portalUserAvatarBody
  },
  'module-filter-star': {
    viewBox: '0 0 148 148',
    body: moduleFilterStarBody
  },
  'big-next': {
    viewBox: '0 0 24 24',
    body: '<path d="M8.08579 16.5858C7.30474 17.3668 7.30474 18.6332 8.08579 19.4142C8.86684 20.1953 10.1332 20.1953 10.9142 19.4142L18.3284 12L10.9142 4.58579C10.1332 3.80474 8.86684 3.80474 8.08579 4.58579C7.30474 5.36684 7.30474 6.63317 8.08579 7.41421L12.6716 12L8.08579 16.5858Z" fill="currentColor"></path>'
  },
  'big-prev': {
    viewBox: '0 0 24 24',
    body: '<path d="M8.08579 16.5858C7.30474 17.3668 7.30474 18.6332 8.08579 19.4142C8.86684 20.1953 10.1332 20.1953 10.9142 19.4142L18.3284 12L10.9142 4.58579C10.1332 3.80474 8.86684 3.80474 8.08579 4.58579C7.30474 5.36684 7.30474 6.63317 8.08579 7.41421L12.6716 12L8.08579 16.5858Z" transform="rotate(180 12 12)" fill="currentColor"></path>'
  },
  'channel-comic': {
    viewBox: '0 0 1024 1024',
    body: '<path d="M722.204 843.492h-551.68a70.144 70.144 0 0 1-69.973-69.917V400.896a70.144 70.144 0 0 1 69.973-69.945h551.68a70.144 70.144 0 0 1 69.917 69.973v372.623a70.144 70.144 0 0 1-69.917 69.945" fill="#FFE19A"></path><path d="M710.315 341.703c22.613-7.339 38.2-29.099 36.067-52.793a143.616 143.616 0 0 0-6.542-32.142C700.36 135.14 510.72 87.723 316.274 150.869 121.799 214.016-3.783 363.804 35.698 485.461c3.413 10.525 7.993 20.452 13.596 29.81 12.231 20.423 37.604 28.871 60.217 21.533l600.804-195.1z" fill="#98A4FF"></path><path d="m281.031 123.676 11.236 34.617c4.977 15.332 21.617 23.78 36.92 18.802 15.332-4.978 23.809-21.59 18.83-36.92l-11.235-34.59a29.383 29.383 0 0 0-36.92-18.801c-15.36 4.95-23.809 21.59-18.83 36.892" fill="#7A84F6"></path><path d="M444.16 714.07a139.748 139.748 0 0 0 138.297-119.553 17.493 17.493 0 0 0-17.124-20.195H322.987a17.493 17.493 0 0 0-17.124 20.195A139.776 139.776 0 0 0 444.16 714.07" fill="#FFCD8D"></path><path d="m704.796 680.903-85.845-40.619s12.288 55.752 71.396 92.672c-.086.74-.285 1.423-.37 2.19-12.715 94.55 38.2 179.4 113.692 189.554 75.492 10.127 146.973-58.31 159.687-152.86 12.687-94.52-38.2-179.4-113.72-189.525-60.018-8.079-117.42 33.65-144.84 98.588z" fill="#98A4FF"></path><path d="m856.064 682.012-19.797 99.158a6.57 6.57 0 0 1-6.457 5.29h-17.778a6.6 6.6 0 0 1-6.542-7.537l14.478-99.13a6.542 6.542 0 0 1 6.485-5.66h23.154c4.181 0 7.282 3.812 6.457 7.88M833.166 818.09l-2.986 16.298a6.57 6.57 0 0 1-6.457 5.405h-20.964a6.6 6.6 0 0 1-6.485-7.652l2.645-16.27a6.6 6.6 0 0 1 6.485-5.547h21.277c4.124 0 7.253 3.727 6.485 7.766" fill="#D9DDFF"></path>'
  },
  'channel-live': {
    viewBox: '0 0 1024 1024',
    body: '<path d="M392.448 275.911a92.416 92.416 0 1 1-184.832 0 92.416 92.416 0 0 1 184.832 0" fill="#59C9F2"></path><path d="m826.624 464.583-63.744 36.864v-48.64a72.206 72.206 0 0 0-71.68-71.936H190.72a72.192 72.192 0 0 0-71.936 71.936v295.424a71.936 71.936 0 0 0 71.936 71.936H691.2a71.936 71.936 0 0 0 71.936-71.936v-23.808l63.488 37.888a51.2 51.2 0 0 0 76.8-44.544V508.871a51.2 51.2 0 0 0-76.8-44.288m-253.696-95.232c79.46.142 143.986-64.156 144.128-143.616.142-79.46-64.156-143.986-143.616-144.128-79.26-.142-143.701 63.858-144.128 143.104-.427 79.46 63.644 144.213 143.104 144.64h.512" fill="#79E1FF"></path><path d="m425.216 512.967 124.16 71.936a25.6 25.6 0 0 1 0 42.496l-124.16 71.68a25.6 25.6 0 0 1-37.12-21.248v-143.36a25.6 25.6 0 0 1 37.12-21.504" fill="#FFE19A"></path>'
  },
  'channel-owner': {
    viewBox: '0 0 1024 1024',
    body: '<g transform="translate(-82 -290)"><g transform="scale(1.2 1.56)"><path d="M404.9 386.765c-70.897-2.565-143.347 12.06-196.65 38.182-48.848 23.963-117.63 89.46-121.928 135.563h735.323c-3.217 0-12.015-9.428-14.738-11.52-5.017-3.825-9.742-7.808-14.76-11.543-11.902-8.91-24.66-16.897-37.147-24.975a1040.175 1040.175 0 0 0-77.063-45.585c-52.47-27.945-107.865-50.805-165.69-65.002a533.88 533.88 0 0 0-107.347-15.12" fill="#79E1FF"></path><path d="M744.605 489.163c-12.713 32.31-136.71 36.765-181.395 36.765H137.802c-15.232 0-29.767 5.197-39.757 14.265-9.9 8.977-14.107 20.767-11.7 32.355 0 .112 0 .27.09.337 9.293 43.672 35.73 83.34 76.365 114.683 1.62 1.26 3.263 2.52 4.928 3.735 106.74 78.457 292.522 81.157 423.45 43.875 41.445-11.79 80.865-28.17 115.177-49.635 38.992-24.39 78.795-57.308 102.308-91.733 3.465-5.062 41.22-61.177 41.962-60.885l-106.02-43.762z" fill="#79E1FF"></path><path d="m918.058 505.317-29.88-17.077a75.082 75.082 0 0 0-70.11-2.138 75.375 75.375 0 0 0-37.418-59.354l-29.925-17.078a11.453 11.453 0 0 0-15.66 4.275l-7.83 13.703a59.063 59.063 0 0 0 21.96 80.572l15.795 9.045a.045.045 0 0 1-.045.045l51.48 29.43.045-.045 17.46 9.99a59.085 59.085 0 0 0 80.573-21.938l7.83-13.725a11.543 11.543 0 0 0-4.275-15.705" fill="#59C9F2"></path><path d="M654.515 712.497C351.327 720.867 266.3 564.425 266.3 564.425H85.782a31.995 31.995 0 0 0 .63 8.46c9.293 43.672 35.73 83.34 76.365 114.683 1.62 1.282 3.263 2.52 4.928 3.735 106.717 78.457 292.5 81.18 423.428 43.875a509.692 509.692 0 0 0 63.382-22.68" fill="#F4F7F9"></path><path d="M654.515 712.497c-65.16 1.8-120.15-4.41-166.567-14.242-49.005-10.373-26.168 59.31-3.218 56.79 37.485-4.072 73.665-10.598 106.403-19.913a502.358 502.358 0 0 0 63.382-22.635" fill="#EEF3F6"></path><path d="M407.127 674.923c21.578 69.84 69.705 117.652 116.775 113.647 3.735-.338 6.233-4.072 5.513-7.74L504.98 655.212a5.715 5.715 0 0 0-6.682-4.5l-86.715 16.898a5.782 5.782 0 0 0-4.455 7.313" fill="#79E1FF"></path><path d="M441.238 614.712a29.295 29.295 0 1 1-58.613.023 29.295 29.295 0 0 1 58.612-.022" fill="#33BFE0"></path><path d="M252.597 310.467a64.282 64.282 0 0 1 64.305-64.102c18.81 0 35.73 8.122 47.52 21.127a64.17 64.17 0 0 1 111.713 42.975 16.56 16.56 0 0 1-16.582 16.583 16.56 16.56 0 0 1-16.605-16.583 31.05 31.05 0 0 0-61.988-2.16h-.18l.113 77.468a16.582 16.582 0 1 1-33.188 0v-75.397c0-17.033-13.928-30.938-30.96-30.938a31.05 31.05 0 0 0-31.027 31.027 16.56 16.56 0 1 1-33.12 0" fill="#79E1FF"></path><path d="M364.332 408.027a22.253 22.253 0 0 1-22.207-22.23V310.4a25.358 25.358 0 1 0-50.715.09 22.23 22.23 0 0 1-44.415 0c0-38.453 31.365-69.75 69.907-69.75a69.75 69.75 0 0 1 47.52 18.765 70.2 70.2 0 0 1 47.61-18.765c38.453 0 69.75 31.297 69.75 69.75a22.23 22.23 0 0 1-44.437 0 25.425 25.425 0 0 0-50.738-1.778l-.157 2.385.09 74.7a22.253 22.253 0 0 1-22.208 22.23zm-47.542-134.19c20.16 0 36.562 16.403 36.562 36.563v75.42a10.98 10.98 0 1 0 21.915 0l-.09-83.093h.923a36.742 36.742 0 0 1 35.82-28.867c20.205 0 36.653 16.447 36.653 36.652a10.98 10.98 0 0 0 21.937 0c0-32.265-26.235-58.5-58.5-58.5-16.448 0-32.288 7.02-43.447 19.305l-4.163 4.545-4.162-4.612a58.635 58.635 0 0 0-43.336-19.283 58.635 58.635 0 0 0-58.657 58.5 10.957 10.957 0 0 0 21.915 0 36.675 36.675 0 0 1 36.63-36.63z" fill="#79E1FF"></path><path d="M389.87 621.283h-66.33a47.79 47.79 0 0 1-35.032-15.593l-23.715-25.695a28.575 28.575 0 0 0-20.88-9.293H91.048a6.525 6.525 0 1 1 0-13.095h152.887c11.453 0 22.567 4.928 30.488 13.523l23.715 25.718c6.66 7.2 15.93 11.34 25.425 11.34h66.33a6.525 6.525 0 1 1-.023 13.095" fill="#33BFE0"></path></g></g>'
  },
  'channel-read': {
    viewBox: '0 0 1024 1024',
    body: '<path d="M760.686 768a21.943 21.943 0 0 0 19.836 21.84l2.107.103a21.943 21.943 0 0 0 21.84-19.836l.102-2.107V321.829h29.258a58.514 58.514 0 0 1 58.514 58.514V819.2a58.514 58.514 0 0 1-58.514 58.514H190.17a58.514 58.514 0 0 1-58.514-58.514V204.8a58.514 58.514 0 0 1 58.514-58.514h512a58.514 58.514 0 0 1 58.515 58.514V768z" fill="#A4D8FF"></path><path d="M248.686 234.057h394.971q29.257 0 29.257 29.257V526.63q0 29.257-29.257 29.257H248.686q-29.257 0-29.257-29.257V263.314q0-29.257 29.257-29.257Z" fill="#69D4FF"></path><path d="m404.773 300.515 129.462 80.925a15.945 15.945 0 0 1 0 27.063l-129.462 80.925a15.945 15.945 0 0 1-24.43-13.531v-161.85a15.945 15.945 0 0 1 24.43-13.532z" fill="#FFD696"></path><path d="M248.686 614.4h394.971q29.257 0 29.257 29.257t-29.257 29.257H248.686q-29.257 0-29.257-29.257t29.257-29.257ZM248.686 731.429h219.428q29.257 0 29.257 29.257t-29.257 29.257H248.686q-29.257 0-29.257-29.257t29.257-29.257Z" fill="#69D4FF"></path>'
  },
  'channel-article': {
    viewBox: '0 0 1024 1024',
    body: '<g transform="scale(32)"><g transform="translate(-0.56 -1.9)"><g transform="scale(1.12 1.18)"><rect x="2.4" y="7.3" width="14.4" height="20.4" rx="3.7" fill="#EEA5CB" /><rect x="8.1" y="4.1" width="15.8" height="22.1" rx="4" fill="#79D8FF" /><rect x="11.7" y="8.4" width="8.9" height="12.3" rx="2.4" fill="#1E456B" /><path d="M13.7 11.9H18.8" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" /><path d="M13.7 15.5H19.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" /><path d="M13.7 19.1H17.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" /><path d="M22.5 9.2L26.1 12.8L19.3 19.6L15.1 20.6L16.2 16.3Z" fill="#A08CFF" /><path d="M22 8.8L23.7 7.1A2.28 2.28 0 0 1 26.9 7.1L27.7 7.9A2.28 2.28 0 0 1 27.7 11.1L26 12.8Z" fill="#FFC67E" /><path d="M4.6 4.2L5.8 6.5L8.1 7.7L5.8 8.9L4.6 11.2L3.4 8.9L1.1 7.7L3.4 6.5Z" fill="#92ECD7" /><circle cx="26.4" cy="24.7" r="2.1" fill="#FFE28B" /></g></g></g>'
  },
  'channel-bookshelf': {
    viewBox: '0 0 1024 1024',
    body: '<g transform="scale(32)"><path d="M1.8 27.2H30.2" stroke="#B08573" stroke-width="2.9" stroke-linecap="round" /><rect x="3.1" y="6.2" width="4.9" height="18.8" rx="2.2" fill="#FFC283" /><rect x="9.4" y="3.9" width="5.1" height="21.1" rx="2.3" fill="#8D92FF" /><rect x="15.9" y="6.7" width="4.9" height="18.3" rx="2.2" fill="#92ECD7" /><path d="M21.8 7.2L27.7 6.1A2.4 2.4 0 0 1 30.4 8.1L31.2 18.8A2.4 2.4 0 0 1 29.2 21.5L22.9 22.6Z" fill="#79D8FF" /><path d="M11.3 6.4V10.5L9.2 9V6.4Z" fill="#FFFFFF" fill-opacity="0.96" /><path d="M16.9 10.4H18.9" stroke="#FFFFFF" stroke-width="1.45" stroke-linecap="round" /><path d="M4.7 2.6L5.9 4.9L8.2 6.1L5.9 7.3L4.7 9.6L3.5 7.3L1.2 6.1L3.5 4.9Z" fill="#FFE189" /><circle cx="25.8" cy="4.5" r="2.2" fill="#EEA5CB" /></g>'
  },
  'channel-catalog': {
    viewBox: '0 0 1024 1024',
    body: '<g transform="scale(32)"><g transform="translate(-7.04 -4.1)"><g transform="scale(1.38 1.14)"><path d="M5.1 10.2C5.1 6.6 7.9 3.8 11.4 3.8H21C24.5 3.8 27.3 6.6 27.3 10.1V18.8C27.3 22.2 24.6 25 21.1 25H14.8L9.7 28.4V24.8C7.1 24 5.1 21.7 5.1 18.9V10.2Z" fill="#79E1FF" /><path d="M7.2 11.6C7.2 9 9.3 6.9 11.9 6.9H21.1C23.7 6.9 25.8 9 25.8 11.6V18.7C25.8 21.3 23.7 23.4 21.1 23.4H11.9C9.3 23.4 7.2 21.3 7.2 18.7V11.6Z" fill="#59C9F2" /><rect x="9.1" y="9.3" width="10.9" height="8.8" rx="2.2" fill="#FFFFFF" /><rect x="10.6" y="14.2" width="1.8" height="2.4" rx="0.9" fill="#98A4FF" /><rect x="13.4" y="12.2" width="1.8" height="4.4" rx="0.9" fill="#79E1FF" /><rect x="16.2" y="10.8" width="1.8" height="5.8" rx="0.9" fill="#FFCD8D" /><path d="M10.7 13.5L13.2 11.6L15.4 12.3L18 10.2" fill="none" stroke="#59C9F2" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" /><path d="M18.9 18.8L22 17.7L23.8 19.3L22.8 21.7L19.8 22.6L18 21Z" fill="#98A4FF" /><path d="M20.9 18.5A2.95 2.95 0 0 1 23.7 21.1" fill="none" stroke="#D9D5FF" stroke-width="1" stroke-linecap="round" /><circle cx="22.7" cy="9.7" r="3" fill="#FFE694" /><path d="M22.7 6.7V9.7L24.8 11.1" fill="none" stroke="#B98C18" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /><path d="M10.8 25.7C12.8 26.3 15.3 26.5 17.6 26.2C19.8 25.9 21.7 25.2 23.1 24.3C24.3 23.6 25.6 24.7 24.9 25.9C23.5 28.3 20.2 29.8 16.3 29.8C13.5 29.8 10.9 29.1 9.1 27.8C8 27 8.6 25.3 10 25.4Z" fill="#F3F7FA" /><circle cx="8.7" cy="7.3" r="1.8" fill="#FFC27C" /></g></g></g>'
  },
  'channel-column': {
    viewBox: '0 0 1024 1024',
    body: '<g transform="scale(32)"><path d="M7.7 3.6H17.9C19.2 3.6 20.4 4 21.3 4.9L26.3 9.4C27.2 10.2 27.8 11.4 27.8 12.7V26.2A3.7 3.7 0 0 1 24.1 29.9H7.9A3.7 3.7 0 0 1 4.2 26.2V7.1A3.5 3.5 0 0 1 7.7 3.6Z" fill="#7DD2FF" /><path d="M18.4 3.9V9.7A2.1 2.1 0 0 0 20.5 11.8H27.1" fill="#B8A9FF" /><rect x="7.7" y="14.1" width="7.4" height="8.4" rx="2.2" fill="#1E456B" /><path d="M18.1 14.9H23.4" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" /><path d="M18.1 18.4H22.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" /><path d="M18.1 21.9H24" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" /><rect x="7" y="2.3" width="7.1" height="2.8" rx="1.4" fill="#EEA5CB" /><path d="M24.8 1.8L26 4.2L28.4 5.4L26 6.6L24.8 9L23.6 6.6L21.2 5.4L23.6 4.2Z" fill="#FFE28B" /><circle cx="8" cy="26.8" r="2.1" fill="#92ECD7" /></g>'
  },
  'channel-featured': {
    viewBox: '0 0 1024 1024',
    body: '<g transform="scale(32)"><g transform="translate(-6.24 -3.2)"><g transform="scale(1.3 1.15)"><rect x="4.8" y="6.1" width="18.4" height="18.8" rx="4" fill="#EEA5CB" /><rect x="8.7" y="4.3" width="18.6" height="20.9" rx="4.2" fill="#79D8FF" /><rect x="10.9" y="7" width="8.1" height="2.8" rx="1.4" fill="#FFFFFF" fill-opacity="0.88" /><path d="M21 8.4H24.5" stroke="#FFFFFF" stroke-width="1.35" stroke-linecap="round" /><path d="M21 11.4H24" stroke="#FFFFFF" stroke-width="1.35" stroke-linecap="round" /><path d="M13.4 20.2L11.8 27.4L16.1 24.8L19.8 27.3L18.5 20.2Z" fill="#A18CFF" /><circle cx="15.9" cy="18.2" r="5.7" fill="#FFE28B" /><path d="M15.9 14.2L17.2 16.9L20.2 17.4L18 19.5L18.5 22.4L15.9 21L13.3 22.4L13.8 19.5L11.6 17.4L14.6 16.9Z" fill="#1E456B" /><path d="M25.2 3.1L26.3 5.4L28.6 6.5L26.3 7.6L25.2 9.9L24.1 7.6L21.8 6.5L24.1 5.4Z" fill="#91EFDA" /><circle cx="10.1" cy="25.7" r="2" fill="#FFCD8D" /></g></g></g>'
  },
  'channel-gallery': {
    viewBox: '0 0 1024 1024',
    body: '<g transform="scale(32)"><rect x="2.2" y="4.8" width="27.6" height="22.3" rx="5.1" fill="#7FE2F7" /><rect x="4.4" y="6.9" width="23.2" height="18.1" rx="3.4" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-opacity="0.72" /><circle cx="10.2" cy="11" r="2.5" fill="#FFE28B" /><path d="M5.8 21.8L12.4 15L16.9 19.1L20.2 15.5L25.8 21.4V23.8H5.8Z" fill="#8D92FF" /><path d="M11.6 21.8L17.1 14.1L20.8 18.9L23.7 15.8L27.4 20.9V23.8H11.6Z" fill="#FFB2CD" /><path d="M24.8 1.7L26 4.1L28.4 5.3L26 6.5L24.8 8.9L23.6 6.5L21.2 5.3L23.6 4.1Z" fill="#92ECD7" /><circle cx="28.3" cy="27" r="1.9" fill="#FFCD8D" /></g>'
  },
  'detail-actions': {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M7.2 12H16.8" /><path d="M7.2 8.1H12.8" /><path d="M7.2 15.9H14.2" /><rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.2" /><path d="M16.9 8.4L19.8 5.5" /></g>'
  },
  'detail-info': {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><rect x="4.2" y="5.1" width="15.6" height="13.8" rx="3.2" /><path d="M8.4 9.2H15.6" /><path d="M8.4 12H15.6" /><path d="M8.4 14.8H12.6" /></g>'
  },
  'detail-preview': {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><rect x="3.8" y="5" width="16.4" height="14" rx="3.4" /><circle cx="9.1" cy="10.1" r="1.6" /><path d="M6.4 16.2L10.2 12.5L13.1 15.2L16 11.9L19.2 15.6" /></g>'
  },
  'detail-related': {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><rect x="4.2" y="6" width="10.8" height="10.8" rx="2.8" /><rect x="9" y="9.2" width="10.8" height="10.8" rx="2.8" /><path d="M10.9 12.6H13.7" /></g>'
  },
  badge: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" fill-rule="evenodd"><path fill="currentColor" d="M2.64 13.39c1.068.895 1.808 2.733 1.66 4.113l.022-.196c-.147 1.384.856 2.4 2.24 2.278l-.198.016c1.387-.122 3.21.655 4.083 1.734l-.125-.154c.876 1.084 2.304 1.092 3.195.027l-.127.152c.895-1.068 2.733-1.808 4.113-1.66l-.198-.022c1.386.147 2.402-.856 2.279-2.238l.017.197c-.122-1.388.655-3.212 1.734-4.084l-.154.125c1.083-.876 1.092-2.304.027-3.195l.152.127c-1.068-.895-1.808-2.732-1.66-4.113l-.022.198c.147-1.386-.856-2.4-2.24-2.279l.198-.017c-1.387.123-3.21-.654-4.083-1.733l.125.153c-.876-1.083-2.304-1.092-3.195-.027l.127-.152c-.895 1.068-2.733 1.808-4.113 1.662l.198.02c-1.386-.147-2.4.857-2.279 2.24L4.4 6.363c.122 1.387-.655 3.21-1.734 4.084l.154-.126c-1.083.878-1.092 2.304-.027 3.195l-.152-.127z"></path><path fill="#FFF" d="M9.78 15.728l-2.633-2.999s-.458-.705.242-1.362c.7-.657 1.328-.219 1.328-.219l1.953 2.132 4.696-4.931s.663-.348 1.299.198c.636.545.27 1.382.27 1.382s-3.466 3.858-5.376 5.782c-.98.93-1.778.017-1.778.017z" fill="currentColor"></path></g>'
  },
  view: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M3.8 12C5.9 8.7 8.7 7 12 7C15.3 7 18.1 8.7 20.2 12C18.1 15.3 15.3 17 12 17C8.7 17 5.9 15.3 3.8 12Z" /><circle cx="12" cy="12" r="2.4" /></g>'
  },
  favorite: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M12 4.8L14.1 9.1L18.9 9.8L15.4 13.2L16.2 18L12 15.8L7.8 18L8.6 13.2L5.1 9.8L9.9 9.1L12 4.8Z" /></g>'
  },
  copy: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><rect x="8" y="8" width="10" height="10" rx="2.6" /><path d="M6.4 15.5H6A2 2 0 0 1 4 13.5V6A2 2 0 0 1 6 4H13.5A2 2 0 0 1 15.5 6V6.4" /></g>'
  },
  download: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9"><path d="M12 4V14" /><path d="M8.5 10.5L12 14L15.5 10.5" /><path d="M6 18.5H18" /></g>'
  },
  history: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M6.4 9.3H3.9V6.8" /><path d="M4.2 12C4.2 7.7 7.7 4.2 12 4.2C16.3 4.2 19.8 7.7 19.8 12C19.8 16.3 16.3 19.8 12 19.8C9.3 19.8 6.9 18.4 5.5 16.4" /><path d="M12 8.2V12.1L14.7 13.7" /></g>'
  },
  login: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><circle cx="10.2" cy="8.2" r="2.9" /><path d="M5.9 17.1C7.1 14.8 8.7 13.8 10.7 13.8C12.8 13.8 14.4 14.8 15.6 17.1" /><path d="M17.2 8.5V12.9" /><path d="M15 10.7H19.4" /></g>'
  },
  message: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M5 7.5C5 6.12 6.12 5 7.5 5H16.5C17.88 5 19 6.12 19 7.5V13.2C19 14.58 17.88 15.7 16.5 15.7H11.4L8.2 18.6V15.7H7.5C6.12 15.7 5 14.58 5 13.2V7.5Z" /><path d="M8.2 9.2H15.8" /><path d="M8.2 11.8H13.4" /></g>'
  },
  studio: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M5.2 17.8H18.8" /><path d="M7 17.8V10.6L12 7.4L17 10.6V17.8" /><path d="M10 13.5H14" /><path d="M10 16H14" /></g>'
  },
  top: {
    viewBox: '0 0 1024 1024',
    body: '<path d="M752.736 431.063C757.159 140.575 520.41 8.97 504.518 0.41V0l-0.45 0.205-0.41-0.205v0.41c-15.934 8.56-252.723 140.165-248.259 430.653-48.21 31.457-98.713 87.368-90.685 184.074 8.028 96.666 101.007 160.768 136.601 157.287 35.595-3.482 25.232-30.31 25.232-30.31l12.206-50.095s52.47 80.569 69.304 80.528c15.114-1.23 87-0.123 95.6 0h0.82c8.602-0.123 80.486-1.23 95.6 0 16.794 0 69.305-80.528 69.305-80.528l12.165 50.094s-10.322 26.83 25.272 30.31c35.595 3.482 128.574-60.62 136.602-157.286 8.028-96.665-42.475-152.617-90.685-184.074z m-248.669-4.26c-6.758-0.123-94.781-3.359-102.891-107.192 2.95-98.714 95.97-107.438 102.891-107.93 6.964 0.492 99.943 9.216 102.892 107.93-8.11 103.833-96.174 107.07-102.892 107.192z m-52.019 500.531c0 11.838-9.42 21.382-21.012 21.382a21.217 21.217 0 0 1-21.054-21.34V821.74c0-11.797 9.421-21.382 21.054-21.382 11.591 0 21.012 9.585 21.012 21.382v105.635z m77.333 57.222a21.504 21.504 0 0 1-21.34 21.626 21.504 21.504 0 0 1-21.34-21.626V827.474c0-11.96 9.543-21.668 21.299-21.668 11.796 0 21.38 9.708 21.38 21.668v157.082z m71.147-82.043c0 11.796-9.42 21.34-21.053 21.34a21.217 21.217 0 0 1-21.013-21.34v-75.367c0-11.755 9.421-21.299 21.013-21.299 11.632 0 21.053 9.544 21.053 21.3v75.366z" ></path>'
  },
  user: {
    viewBox: '0 0 24 24',
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M6.5 18.2C7.9 15.7 9.7 14.6 12 14.6C14.3 14.6 16.1 15.7 17.5 18.2" /></g>'
  }
} as const satisfies Record<string, PortalIconDefinition>

export type PortalIconName = keyof typeof portalIconDefinitions

export const portalIconAliases = {
  'icon-badge': 'badge',
  'icon-big-next': 'big-next',
  'icon-big-prev': 'big-prev',
  'icon-channel-comic': 'channel-comic',
  'icon-channel-live': 'channel-live',
  'icon-channel-owner': 'channel-owner',
  'icon-channel-read': 'channel-read',
  'icon-top': 'top'
} as const satisfies Partial<Record<string, PortalIconName>>
