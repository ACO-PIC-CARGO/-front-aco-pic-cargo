import store from "@/store";

export const reloadPlanAccess = () =>
  store.dispatch("subscriptions/reloadPlanAccess");
