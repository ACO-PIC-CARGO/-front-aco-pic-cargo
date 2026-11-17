import axios from "axios";
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

// Sesión persistente: el access token (JWT de 15 min) vive en el storage y se renueva con la
// cookie HttpOnly de refresco (30 días) que solo el backend puede leer.
const TOKEN_KEY = "auth-token";
const RENEW_BEFORE_MS = 60_000;
const LOCK_NAME = "aco-session-refresh";

// Instancia sin interceptores: la renovación nunca debe dispararse a sí misma.
export const refreshClient = axios.create({ withCredentials: true });
const bare = refreshClient;

interface TokenPayload {
  exp?: number;
  sid?: string;
  userId?: TokenPayload;
}

export const readTokenPayload = (token: string | null): TokenPayload | null => {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    let payload = JSON.parse(atob(base64)) as TokenPayload;
    const exp = payload.exp;
    // Las renovaciones del backend anidan el payload original en userId.
    while (payload.userId && typeof payload.userId === "object") payload = payload.userId;
    return { ...payload, exp };
  } catch {
    return null;
  }
};

export const isPersistentToken = (token: string | null): boolean => !!readTokenPayload(token)?.sid;

export const tokenExpiresSoon = (token: string | null, now = Date.now()): boolean => {
  const exp = readTokenPayload(token)?.exp;
  return !exp || exp * 1000 - now < RENEW_BEFORE_MS;
};

const storedToken = () => sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);

const storeToken = (token: string) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
};

// Sucursal a la que está ligada la sesión, según la última renovación.
let sessionBranchId: number | null = null;

const requestNewToken = async (): Promise<string | null> => {
  try {
    const { data } = await bare.post<{ estadoflag?: boolean; token?: string; id_branch?: number | null }>(
      `${import.meta.env.VITE_URL_MAIN}auth/refresh`,
    );
    if (!data?.estadoflag || !data.token) return null;
    storeToken(data.token);
    sessionBranchId = data.id_branch ?? null;
    return data.token;
  } catch {
    return null;
  }
};

// Entre pestañas: la primera renueva y las demás reutilizan el token que dejó en localStorage.
const refreshAcrossTabs = (tokenBefore: string | null): Promise<string | null> => {
  const run = async () => {
    const latest = localStorage.getItem(TOKEN_KEY);
    if (latest && latest !== tokenBefore && !tokenExpiresSoon(latest)) {
      sessionStorage.setItem(TOKEN_KEY, latest);
      return latest;
    }
    return requestNewToken();
  };
  return navigator.locks ? navigator.locks.request(LOCK_NAME, run) : run();
};

let inFlight: Promise<string | null> | null = null;

export const refreshAccessToken = (): Promise<string | null> => {
  inFlight ??= refreshAcrossTabs(storedToken()).finally(() => {
    inFlight = null;
  });
  return inFlight;
};

// Retoma una sesión "recordada" al abrir la app. Siempre consulta al servidor (la sesión pudo
// cerrarse o ser reemplazada por otra en la misma sucursal) y devuelve la sucursal de la sesión.
export const resumeSession = async (): Promise<{ idBranch: number | null } | null> => {
  if (!isPersistentToken(storedToken())) return null;
  const token = await refreshAccessToken();
  return token ? { idBranch: sessionBranchId } : null;
};

// Liga la sesión a la sucursal elegida. En el servidor queda una sola sesión por usuario y
// sucursal: la última que se liga se mantiene y se cierran las anteriores.
export const bindSessionBranch = async (idBranch: number): Promise<void> => {
  let token = storedToken();
  if (!isPersistentToken(token)) return;
  if (tokenExpiresSoon(token)) token = await refreshAccessToken();
  if (!token) return;
  await bare
    .post(`${import.meta.env.VITE_URL_MAIN}auth/sesion/sucursal`, { id_branch: idBranch }, { headers: { [TOKEN_KEY]: token } })
    .catch(() => undefined);
};

export const logoutSession = () =>
  bare.post(`${import.meta.env.VITE_URL_MAIN}auth/logout`).catch(() => undefined);

const isAuthRoute = (url = "") => /(^|\/)(auth\/(refresh|logout)|singin)$/.test(url);

interface RetriableConfig extends InternalAxiosRequestConfig {
  _sessionRetried?: boolean;
}

// Antes de cada petición: si el token persistente está por vencer, se renueva primero.
const renewBeforeRequest = async (config: InternalAxiosRequestConfig) => {
  if (isAuthRoute(config.url)) return config;
  const token = (config.headers[TOKEN_KEY] as string | undefined) ?? storedToken();
  if (isPersistentToken(token) && tokenExpiresSoon(token)) {
    const fresh = await refreshAccessToken();
    if (fresh) config.headers[TOKEN_KEY] = fresh;
  }
  return config;
};

// Ante un 401: intenta renovar una vez y repite la petición. Devuelve null si no se pudo.
export const retryWithFreshToken = async (instance: AxiosInstance, error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  if (error.response?.status !== 401 || !config || config._sessionRetried || isAuthRoute(config.url)) return null;
  if (!config.headers?.[TOKEN_KEY]) return null;
  const fresh = await refreshAccessToken();
  if (!fresh) return null;
  config._sessionRetried = true;
  config.headers[TOKEN_KEY] = fresh;
  return instance.request(config);
};

export const installSessionRefresh = (instance: AxiosInstance, { retryOn401 = true } = {}) => {
  instance.interceptors.request.use(renewBeforeRequest);
  if (retryOn401) {
    instance.interceptors.response.use(undefined, async (error: AxiosError) => {
      const retried = await retryWithFreshToken(instance, error);
      return retried ?? Promise.reject(error);
    });
  }
};
