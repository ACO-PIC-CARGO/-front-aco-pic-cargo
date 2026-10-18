import store from "@/store";

export default function resetSessionOnLogin(to) {
  if (to.name === "Login") {
    store.dispatch("subscriptions/resetSession");
    store.dispatch("legalPages/resetSession");
  }
}
