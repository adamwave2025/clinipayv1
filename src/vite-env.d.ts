
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLISHABLE_KEY: string;
  readonly SUPABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend the Window interface to include our global ENV object
interface Window {
  ENV: {
    PUBLISHABLE_KEY: string;
    SUPABASE_URL: string;
  };
}
