/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTHORITY_URL?: string;
  readonly VITE_AUTH_CLIENT_ID?: string;
  readonly VITE_AUTH_REDIRECT_URI?: string;
  readonly VITE_ENABLE_API_MOCKS?: string;
  readonly VITE_DEFAULT_PAGE_SIZE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
