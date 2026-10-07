import {
  isModuleLocked,
  lockedModuleNotice,
  moduleForRoute,
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
  const module = moduleForRoute(readMenu(), to.name);
  if (!module || to.name === "miPlan") return next();

  const access = await loadPlanAccess();
  if (!isModuleLocked(access, module.id)) return next();

  next(from.name ? false : { name: "miPlan" });
  promptPlanUpgrade(router, lockedModuleNotice(access, module.name));
};
