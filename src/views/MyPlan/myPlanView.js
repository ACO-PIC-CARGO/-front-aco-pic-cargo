export const PENDING_PLAN_KEY = "pendingPlan";

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
