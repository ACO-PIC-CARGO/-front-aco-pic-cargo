import { userLabel } from "../../components/SubscriptionPackages/packageView.js";

const routesOf = (node) =>
  (node.children || []).flatMap((child) => [child.route, ...routesOf(child)]);

export const moduleForRoute = (menuTree, routeName) => {
  const module = (menuTree || []).find((node) =>
    routesOf(node).includes(routeName)
  );
  return module ? { id: module.id, name: module.name } : null;
};

export const isModuleLocked = (access, moduleId) =>
  Boolean(access && access.has_plan) &&
  (access.locked_module_ids || []).includes(moduleId);

export const canAddUsers = (access) =>
  !access || !access.has_plan || Boolean(access.can_add_users);

const STOPPED_PLAN_TEXT = {
  canceled: (plan, next) =>
    `Tu plan ACO ${plan} está cancelado. Elige un plan para ${next}.`,
  paused: (plan) =>
    `Tu plan ACO ${plan} está pausado. Revisa Mi plan para reactivarlo.`,
};

export const lockedModuleNotice = (access, moduleName) => {
  const stopped = STOPPED_PLAN_TEXT[access.plan_status];
  if (stopped) {
    return {
      title: `${moduleName} no está disponible`,
      text: stopped(access.package_name, `volver a usar ${moduleName}`),
    };
  }
  return {
    title: `${moduleName} no está en tu plan`,
    text: `Tu plan ACO ${access.package_name} no incluye ${moduleName}. Mejora tu plan para usarlo.`,
  };
};

export const userLimitNotice = (access) => {
  const stopped = STOPPED_PLAN_TEXT[access.plan_status];
  if (stopped) {
    return {
      title: "No puedes agregar usuarios",
      text: stopped(access.package_name, "agregar usuarios"),
    };
  }
  return {
    title: "Llegaste al límite de usuarios",
    text: `Tu plan ACO ${access.package_name} permite ${userLabel(
      access.user_limit
    )} y tu empresa ya tiene ${
      access.user_count
    }. Mejora tu plan para agregar más.`,
  };
};
