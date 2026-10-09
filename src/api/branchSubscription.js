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

export const confirmCompanyPlan = (transactionId) =>
  request({
    method: "post",
    url: "branch_subscription/confirm",
    data: { transaction_id: transactionId },
  });

export const previewPlanChange = (payload) =>
  request({
    method: "post",
    url: "branch_subscription/change/preview",
    data: payload,
  });

export const changeCompanyPlan = (payload) =>
  request({ method: "post", url: "branch_subscription/change", data: payload });

export const keepCompanyPlan = () =>
  request({ method: "post", url: "branch_subscription/resume" });

export const fetchPlanAccess = () =>
  request({ method: "get", url: "branch_subscription/access" });

export const fetchRegistrationTrial = () =>
  request({ method: "get", url: "branch_subscription/registration_trial" });

export const fetchBillingHistory = () =>
  request({ method: "get", url: "branch_subscription/billing_history" });

export const fetchInvoiceUrl = (transactionId) =>
  request({
    method: "get",
    url: `branch_subscription/billing_history/${encodeURIComponent(
      transactionId
    )}/invoice`,
  });

export const startPaymentMethodUpdate = () =>
  request({ method: "post", url: "branch_subscription/payment_method" });
