import type { RouteLocationNormalized } from "vue-router";
import store from "@/store";
import { useSubscriptionsStore } from "@/stores/subscriptions";

export default function resetSessionOnLogin(to: RouteLocationNormalized) {
  if (to.name === "Login") {
    useSubscriptionsStore().resetSession();
    store.dispatch("legalPages/resetSession");
  }
}
