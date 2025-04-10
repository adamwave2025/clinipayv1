
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLISHABLE_KEY: string;
  readonly SUPABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
