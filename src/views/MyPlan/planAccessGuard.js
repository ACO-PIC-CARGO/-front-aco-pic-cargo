import {
  lockedModuleForRoute,
  lockedModuleNotice,
  modulesForRoute,
} from "./planAccess";
import { loadPlanAccess } from "./planAccessStore";
import { promptPlanUpgrade } from "./promptPlanUpgrade";

const readMenu = () => {
  try {
    return JSON.parse(sessionStorage.getItem("menu")) || [];
  } catch (error) {
    return [];
  }
};

export const planAccessGuard = (router) => async (to, from, next) => {
  const menu = readMenu();
  if (to.name === "miPlan" || !modulesForRoute(menu, to.name).length)
    return next();

  const access = await loadPlanAccess();
  const module = lockedModuleForRoute(menu, to.name, access);
  if (!module) return next();

  next(from.name ? false : { name: "miPlan" });
  promptPlanUpgrade(router, lockedModuleNotice(access, module.name));
};
