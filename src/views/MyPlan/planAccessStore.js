import Vue from "vue";
import { fetchPlanAccess } from "@/api/branchSubscription";

export const planAccessState = Vue.observable({ access: null });

let pending = null;

export const loadPlanAccess = () => {
  pending =
    pending ||
    fetchPlanAccess().then((response) => {
      if (!response.estadoflag) pending = null;
      planAccessState.access = response.estadoflag ? response.data[0] : null;
      return planAccessState.access;
    });
  return pending;
};

export const reloadPlanAccess = () => {
  pending = null;
  return loadPlanAccess();
};
