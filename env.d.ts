/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VUE_APP_URL_MAIN: string;
  readonly VUE_APP_URL_REPORT: string;
  readonly VUE_APP_VERSION: string;
  readonly VUE_APP_PADDLE_CLIENT_TOKEN: string;
  readonly VUE_APP_PADDLE_ENV: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module "moment/dist/locale/es";
