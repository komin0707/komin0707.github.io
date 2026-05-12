/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VERCEL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_ENABLE_DEBUG_PANEL?: string;
  readonly VITE_VERCEL_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
