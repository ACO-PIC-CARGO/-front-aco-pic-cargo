import Vue from "vue";
import { fetchPlanAccess } from "@/api/branchSubscription";

export const planAccessState = Vue.observable({ access: null });

let pending = null;

export const loadPlanAccess = () => {
  if (pending) return pending;
  const current = fetchPlanAccess().then((response) => {
    const access = response.estadoflag ? response.data[0] || null : null;
    if (pending === current) {
      planAccessState.access = access;
      if (!access) pending = null;
    }
    return access;
  });
  pending = current;
  return current;
};

export const reloadPlanAccess = () => {
  pending = null;
  return loadPlanAccess();
};
