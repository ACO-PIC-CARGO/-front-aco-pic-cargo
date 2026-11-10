import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";

export default function signedInGuard(to: RouteLocationNormalized): NavigationGuardReturn {
  const requiresAuth = to.matched.some((record) => record.meta && record.meta.requiresAuth);
  const signedIn = sessionStorage.getItem("auth-token") && sessionStorage.getItem("dataUser");
  if (requiresAuth && !signedIn) return { name: "Login" };
}
