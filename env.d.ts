/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_URL_MAIN: string;
  readonly VITE_URL_REPORT: string;
  readonly VITE_VERSION: string;
  readonly VITE_PADDLE_CLIENT_TOKEN: string;
  readonly VITE_PADDLE_ENV: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module "moment/dist/locale/es";
declare module "vuex";
