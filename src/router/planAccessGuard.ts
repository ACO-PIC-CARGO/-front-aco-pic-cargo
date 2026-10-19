import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";
import store from "@/store";

const readMenu = () => {
  try {
    return JSON.parse(sessionStorage.getItem("menu") ?? "null") || [];
  } catch {
    return [];
  }
};

export default async function planAccessGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): Promise<NavigationGuardReturn> {
  const menu = readMenu();
  const modules = store.getters["subscriptions/modulesForRoute"](menu, to.name);
  if (to.name === "miPlan" || !modules.length) return;

  await store.dispatch("subscriptions/loadPlanAccess");
  const module = store.getters["subscriptions/lockedModuleForRoute"](menu, to.name);
  if (!module) return;

  store.dispatch(
    "subscriptions/promptPlanUpgrade",
    store.getters["subscriptions/lockedModuleNotice"](module.name),
  );
  return from.name ? false : { name: "miPlan" };
}
