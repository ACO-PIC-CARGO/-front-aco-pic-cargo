import type { NavigationGuardReturn, RouteLocationNormalized, RouteLocationRaw } from "vue-router";
import { isPersistentToken, tokenExpiresSoon } from "@/api/sessionRefresh";
import type { SucursalSesion, UsuarioSesion } from "@/types/sesion";

// Si el servidor no responde en este tiempo se muestra el formulario de ingreso.
export const RESUME_TIMEOUT_MS = 10_000;

const readRows = <Row>(key: string): Row[] | null => {
  try {
    return JSON.parse(sessionStorage.getItem(key) as string) as Row[] | null;
  } catch {
    return null;
  }
};

// Solo direcciones internas: evita redirigir a otro sitio con ?redirect=//dominio.
export const safeRedirect = (value: unknown): string | null =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null;

// Destino tras ingresar: la pantalla que se intentó abrir (enlace, acceso directo) o el inicio.
export const afterLoginTarget = (route: Pick<RouteLocationNormalized, "query"> | undefined): RouteLocationRaw =>
  safeRedirect(route?.query?.redirect) ?? { name: "Main" };

// Login clásico (token de 8 h sin sesión persistente) que sigue vigente y con sucursal elegida.
const hasLiveClassicSession = (token: string | null): boolean => {
  if (!token || isPersistentToken(token) || tokenExpiresSoon(token)) return false;
  const [user] = readRows<UsuarioSesion>("dataUser") ?? [];
  const [branch] = readRows<SucursalSesion>("dataBranch") ?? [];
  return !!user?.id_branch && branch?.id === user.id_branch && !branch.esnuevoflag && !!sessionStorage.getItem("menu");
};

const withTimeout = <T>(promise: Promise<T>, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), RESUME_TIMEOUT_MS))]);

// Al abrir la pantalla de ingreso con una sesión activa se entra directo, sin mostrar el formulario.
export default async function resumeSessionGuard(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  if (to.name !== "Login") return;
  const [user] = readRows<UsuarioSesion>("dataUser") ?? [];
  if (!user?.id_user) return;

  const token = sessionStorage.getItem("auth-token") ?? localStorage.getItem("auth-token");
  if (hasLiveClassicSession(token)) return afterLoginTarget(to);
  // Un login clásico nunca tuvo cookie de refresco: consultarla solo daría 401.
  if (token && !isPersistentToken(token)) return;

  try {
    // import dinámico: el store importa el router
    const { useSecuritysStore } = await import("@/stores/securitys");
    if (await withTimeout(useSecuritysStore().retomarSesion(), false)) return afterLoginTarget(to);
  } catch (error) {
    console.error("No se pudo retomar la sesión:", error);
  }
}
