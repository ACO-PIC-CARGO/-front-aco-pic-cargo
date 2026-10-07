import { request } from "@/api/subscriptionPackages";

export const fetchCompanyPlan = () =>
  request({ method: "get", url: "branch_subscription" });

export const startCheckout = (payload) =>
  request({
    method: "post",
    url: "branch_subscription/checkout",
    data: payload,
  });

export const cancelCompanyPlan = () =>
  request({ method: "post", url: "branch_subscription/cancel" });

export const openBillingPortal = () =>
  request({ method: "post", url: "branch_subscription/portal" });
