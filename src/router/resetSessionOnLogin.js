import store from "@/store";

export default function resetSessionOnLogin(to, from, next) {
  if (to.name === "Login") {
    store.dispatch("subscriptions/resetSession");
    store.dispatch("legalPages/resetSession");
  }
  next();
}
