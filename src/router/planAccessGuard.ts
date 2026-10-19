import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";
import { useSubscriptionsStore } from "@/stores/subscriptions";

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
  const subscriptionsStore = useSubscriptionsStore();
  const menu = readMenu();
  const modules = subscriptionsStore.modulesForRoute(menu, to.name);
  if (to.name === "miPlan" || !modules.length) return;

  await subscriptionsStore.loadPlanAccess();
  const module = subscriptionsStore.lockedModuleForRoute(menu, to.name);
  if (!module) return;

  subscriptionsStore.promptPlanUpgrade(subscriptionsStore.lockedModuleNotice(module.name));
  return from.name ? false : { name: "miPlan" };
}
