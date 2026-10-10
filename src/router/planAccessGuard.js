import store from "@/store";

const readMenu = () => {
  try {
    return JSON.parse(sessionStorage.getItem("menu")) || [];
  } catch (error) {
    return [];
  }
};

export default async function planAccessGuard(to, from, next) {
  const menu = readMenu();
  const modules = store.getters["subscriptions/modulesForRoute"](menu, to.name);
  if (to.name === "miPlan" || !modules.length) return next();

  await store.dispatch("subscriptions/loadPlanAccess");
  const module = store.getters["subscriptions/lockedModuleForRoute"](menu, to.name);
  if (!module) return next();

  next(from.name ? false : { name: "miPlan" });
  store.dispatch(
    "subscriptions/promptPlanUpgrade",
    store.getters["subscriptions/lockedModuleNotice"](module.name)
  );
}
