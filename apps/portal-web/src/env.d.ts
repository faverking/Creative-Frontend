/// <reference types="vite/client" />

declare module 'element-plus/es/components/message/style/css' {
  const style: unknown
  export default style
}

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
