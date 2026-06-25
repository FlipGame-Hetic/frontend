/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string
  readonly VITE_SCREEN_HUB_URL?: string
  readonly VITE_SCREEN_TOKEN?: string
  readonly VITE_ENVIRONMENT?: string
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
