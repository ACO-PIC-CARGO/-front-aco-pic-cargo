import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";

export default function signedInGuard(to: RouteLocationNormalized): NavigationGuardReturn {
  const requiresAuth = to.matched.some((record) => record.meta && record.meta.requiresAuth);
  const signedIn = sessionStorage.getItem("auth-token") && sessionStorage.getItem("dataUser");
  // la pantalla de ingreso retoma la sesión recordada y vuelve a esta dirección
  if (requiresAuth && !signedIn) {
    return to.fullPath && to.fullPath !== "/" ? { name: "Login", query: { redirect: to.fullPath } } : { name: "Login" };
  }
}
