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
  if (plan.status === "past_due") {
    return "No pudimos cobrar tu último pago. Actualiza tu método de pago en “Gestionar pago y facturas”.";
  }
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
      billing: BILLING_BY_QUERY[query.ciclo] || "annual",
    };
  }
  return readStoredChoice();
};

const CHANGEABLE_STATUSES = ["active", "trialing"];
const PERIOD_BY_BILLING = { monthly: "al mes", annual: "al año" };

export const canChangePlan = (plan) =>
  Boolean(plan) && CHANGEABLE_STATUSES.includes(plan.status);

export const cardAction = (pkg, plan, billing) => {
  if (!plan || pkg.id !== plan.package_id || billing !== plan.billing)
    return "change";
  return pkg.module_selection_limit ? "change-module" : "current";
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

const trialDaysLabel = (plan, now) => {
  const end = Date.parse(plan.current_period_ends_at || plan.next_billed_at);
  const days = Math.ceil((end - now) / DAY_MS);
  if (!(days > 0)) return "Último día de prueba";
  return days === 1 ? "1 día de prueba" : `${days} días de prueba`;
};

export const planBadge = (plan, now = Date.now()) => {
  if (!plan) return null;
  if (plan.status === "trialing")
    return { text: trialDaysLabel(plan, now), tone: "trial" };
  if (plan.status === "active")
    return { text: `ACO ${plan.package_name} activo`, tone: "paid" };
  return null;
};
