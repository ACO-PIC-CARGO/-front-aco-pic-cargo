import type { RouteLocationNormalized } from "vue-router";
import { useLegalPagesStore } from "@/stores/legalPages";
import { useSubscriptionsStore } from "@/stores/subscriptions";

export default function resetSessionOnLogin(to: RouteLocationNormalized) {
  if (to.name === "Login") {
    useSubscriptionsStore().resetSession();
    useLegalPagesStore().resetSession();
  }
}
