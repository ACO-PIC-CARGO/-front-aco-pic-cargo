import { formatPrice } from "../../components/SubscriptionPackages/packageView.js";

export const PENDING_PLAN_KEY = "pendingPlan";
export const PLAN_CHANGED_EVENT = "company-plan-changed";

const STATUS_VIEW = {
  active: { label: "Activo", tone: "ok" },
  trialing: { label: "En prueba", tone: "ok" },
  past_due: { label: "Pago pendiente", tone: "warning" },
  paused: { label: "Pausado", tone: "warning" },
  canceled: { label: "Cancelado", tone: "muted" },
};

const BILLING_BY_QUERY = { mensual: "monthly", anual: "annual" };

export const isLivePlan = (plan) => Boolean(plan) && plan.status !== "canceled";

export const statusView = (plan) => {
  if (!plan) return STATUS_VIEW.canceled;
  if (plan.scheduled_change_action === "cancel" && plan.status !== "canceled") {
    return { label: "Cancelación programada", tone: "warning" };
  }
  return STATUS_VIEW[plan.status] || { label: plan.status, tone: "muted" };
};

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

export const billingLabel = (billing) =>
  billing === "annual" ? "Pago anual" : "Pago mensual";

export const planDateLine = (plan) => {
  if (plan.status === "canceled")
    return `Cancelado el ${formatDate(plan.canceled_at)}.`;
  if (plan.scheduled_change_action === "cancel") {
    return `Tu plan termina el ${formatDate(
      plan.scheduled_change_at
    )}. No se harán más cobros.`;
  }
  if (plan.status === "trialing") {
    return `Tu prueba termina el ${formatDate(
      plan.next_billed_at
    )}; ese día se hará el primer cobro.`;
  }
  if (plan.status === "past_due") return "No pudimos cobrar tu último pago.";
  if (plan.status === "paused")
    return "Tu plan está pausado; no se harán cobros mientras siga así.";
  return `Próxima renovación: ${formatDate(plan.next_billed_at)}.`;
};

export const hasSession = () => {
  try {
    return Boolean(sessionStorage.getItem("auth-token"));
  } catch (error) {
    return false;
  }
};

export const readBranchId = () => {
  try {
    return JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
  } catch (error) {
    return null;
  }
};

export const savePendingChoice = (choice) => {
  try {
    localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(choice));
    return true;
  } catch (error) {
    return false;
  }
};

export const clearPendingChoice = () => {
  try {
    localStorage.removeItem(PENDING_PLAN_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

const readStoredChoice = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PENDING_PLAN_KEY));
    return stored && stored.packageId ? stored : null;
  } catch (error) {
    return null;
  }
};

export const readPendingChoice = (query) => {
  if (query.paquete) {
    return {
      packageId: Number(query.paquete),
      billing: BILLING_BY_QUERY[query.ciclo] || "monthly",
    };
  }
  return readStoredChoice();
};

const CHANGEABLE_STATUSES = ["active", "trialing"];
const PERIOD_BY_BILLING = { monthly: "al mes", annual: "al año" };

export const canChangePlan = (plan) =>
  Boolean(plan) && CHANGEABLE_STATUSES.includes(plan.status);

const UNAVAILABLE_ACTIONS = ["current", "lower", "annual-only"];
const UPGRADE_ACTIONS = ["change", "change-module"];

const isCheaper = (pkg, plan, currentPackage) => {
  const currentPrice = currentPackage
    ? currentPackage.monthly_price
    : plan.package_monthly_price;
  return (
    currentPrice != null && Number(pkg.monthly_price) < Number(currentPrice)
  );
};

export const cardAction = (pkg, plan, billing, currentPackage) => {
  if (!plan) return "change";
  if (isCheaper(pkg, plan, currentPackage)) return "lower";
  if (pkg.id !== plan.package_id) return "change";
  if (billing !== plan.billing)
    return plan.billing === "annual" ? "annual-only" : "change";
  return pkg.module_selection_limit ? "change-module" : "current";
};

export const isUnavailableAction = (action) =>
  UNAVAILABLE_ACTIONS.includes(action);

export const currentPackageOf = (plan, packages) =>
  plan ? packages.find((pkg) => pkg.id === plan.package_id) : undefined;

export const hasUpgrade = (plan, packages) => {
  const currentPackage = currentPackageOf(plan, packages);
  return packages.some((pkg) =>
    ["monthly", "annual"].some((billing) =>
      UPGRADE_ACTIONS.includes(cardAction(pkg, plan, billing, currentPackage))
    )
  );
};

export const purchaseAction = (pkg, plan, billing, currentPackage) => {
  if (!isLivePlan(plan)) return "buy";
  if (!canChangePlan(plan)) return "manage";
  return cardAction(pkg, plan, billing, currentPackage);
};

export const changeSummary = (preview) => {
  const recurring = `${formatPrice(preview.recurring_amount)} ${
    PERIOD_BY_BILLING[preview.billing]
  } desde el ${formatDate(preview.next_billed_at)}`;
  const today = {
    charge: `Hoy se cobrarán ${formatPrice(
      preview.amount
    )} a tu método de pago. Después pagarás ${recurring}.`,
    credit: `Te quedará un crédito de ${formatPrice(
      preview.amount
    )} para tus siguientes pagos. Después pagarás ${recurring}.`,
    none: `No se te cobrará nada hoy. Pagarás ${recurring}.`,
  }[preview.action];
  return preview.removes_cancel
    ? `${today} Tu cancelación programada se quitará.`
    : today;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const daysUntil = (value, now) =>
  Math.max(0, Math.ceil((Date.parse(value) - now) / DAY_MS) || 0);

const NO_NOTICE = { days: null, ended: false, canBuy: false, paidText: null };
const ACO_BRANCH_ID = 1;

const registrationTrialNotice = (registrationTrial, canBuy, now) => {
  const notice = { ...NO_NOTICE, canBuy };
  if (!registrationTrial) return canBuy ? notice : null;
  const days = daysUntil(registrationTrial.ends_at, now);
  return days > 0 ? { ...notice, days } : { ...notice, ended: true };
};

export const trialNotice = ({
  plan,
  registrationTrial,
  branchId,
  now = Date.now(),
}) => {
  if (!isLivePlan(plan)) {
    const canBuy = Number(branchId) !== ACO_BRANCH_ID;
    return registrationTrialNotice(registrationTrial, canBuy, now);
  }
  if (plan.status === "trialing") {
    return {
      ...NO_NOTICE,
      days: daysUntil(plan.current_period_ends_at || plan.next_billed_at, now),
    };
  }
  if (plan.status === "active")
    return { ...NO_NOTICE, paidText: `ACO ${plan.package_name} activo` };
  return null;
};

export const paymentUpdateNeeded = (plan) =>
  plan.status === "past_due" && plan.scheduled_change_action !== "cancel";

export const daysLabel = (days) => (days > 1 ? `${days} días` : "Último día");

const featureDescriptions = (features, moduleId) =>
  features
    .filter((feature) => feature.module_id === moduleId)
    .map((feature) => feature.description);

export const planDetails = (plan) => {
  const features = (plan && plan.features) || [];
  return {
    users:
      plan && plan.user_limit
        ? `${plan.user_count || 0} de ${plan.user_limit}`
        : null,
    modules: ((plan && plan.modules) || []).map((module) => ({
      id: module.id,
      name: module.name,
      details: featureDescriptions(features, module.id),
    })),
    extras: featureDescriptions(features, null),
  };
};
