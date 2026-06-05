/// <reference types="vite/client" />

declare module 'postcss-pxtorem' {
  interface PostcssPxToRemOptions {
    rootValue?: number
    propList?: string[]
    mediaQuery?: boolean
    minPixelValue?: number
    exclude?: RegExp | string | ((filePath?: string) => boolean)
  }

  export default function pxtorem(options?: PostcssPxToRemOptions): { postcssPlugin: string }
}
