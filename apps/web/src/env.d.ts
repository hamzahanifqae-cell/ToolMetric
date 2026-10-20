/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_SITE_NAME: string;
  readonly PUBLIC_OPERATOR_NAME: string | undefined;
  readonly PUBLIC_OPERATOR_EMAIL: string | undefined;
  readonly PUBLIC_ADSENSE_ENABLED: string | undefined;
  readonly PUBLIC_ADSENSE_CLIENT_ID: string | undefined;
  readonly PUBLIC_ROBOTS_POLICY: string | undefined;
  readonly PUBLIC_API_BASE_URL: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
