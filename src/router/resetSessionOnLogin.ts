import type { RouteLocationNormalized } from "vue-router";
import store from "@/store";

export default function resetSessionOnLogin(to: RouteLocationNormalized) {
  if (to.name === "Login") {
    store.dispatch("subscriptions/resetSession");
    store.dispatch("legalPages/resetSession");
  }
}
