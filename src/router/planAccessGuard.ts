import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";
import { useSubscriptionsStore } from "@/stores/subscriptions";

declare module "vue-router" {
  interface RouteMeta {
    menuRoute?: string;
  }
}

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
  const menuRoute = to.meta.menuRoute ?? to.name;
  const modules = subscriptionsStore.modulesForRoute(menu, menuRoute);
  if (to.name === "miPlan" || !modules.length) return;

  await subscriptionsStore.loadPlanAccess();
  const module = subscriptionsStore.lockedModuleForRoute(menu, menuRoute);
  if (!module) return;

  subscriptionsStore.promptPlanUpgrade(subscriptionsStore.lockedModuleNotice(module.name));
  return from.name ? false : { name: "miPlan" };
}
