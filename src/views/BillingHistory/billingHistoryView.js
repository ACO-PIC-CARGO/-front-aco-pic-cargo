import { formatDate } from "../MyPlan/myPlanView.js";

const CONCEPT_BY_ORIGIN = {
  subscription_recurring: "Renovación",
  subscription_update: "Cambio a",
};
const BILLING_LABELS = { monthly: "Mensual", annual: "Anual" };
const PAID = { label: "Pagado", tone: "ok" };
const STATUS_VIEW = {
  completed: PAID,
  paid: PAID,
  billed: { label: "Facturado", tone: "info" },
  past_due: { label: "Pago pendiente", tone: "warning" },
  canceled: { label: "Cancelado", tone: "muted" },
};
const REFUNDED = { label: "Reembolsado", tone: "muted" };
const PARTLY_REFUNDED = { label: "Reembolso parcial", tone: "info" };
const CARD_BRANDS = {
  visa: "Visa",
  mastercard: "Mastercard",
  american_express: "American Express",
  discover: "Discover",
  diners_club: "Diners Club",
  jcb: "JCB",
  maestro: "Maestro",
  union_pay: "UnionPay",
};

const conceptOf = (entry) => {
  const name = `${CONCEPT_BY_ORIGIN[entry.origin] || "Compra"} ${
    entry.product_name
  }`;
  return entry.billing ? `${name} · ${BILLING_LABELS[entry.billing]}` : name;
};

const amountOf = (entry) =>
  new Intl.NumberFormat("es", {
    style: "currency",
    currency: entry.currency_code,
  }).format(Number(entry.total) / 100);

const statusOf = (entry) => {
  const total = Number(entry.total);
  const adjusted = Number(entry.adjusted_total);
  const status = STATUS_VIEW[entry.status];
  if (status !== PAID || adjusted >= total) return status;
  return adjusted > 0 ? PARTLY_REFUNDED : REFUNDED;
};

export const billingRows = (entries) =>
  entries.map((entry) => {
    const status = statusOf(entry);
    return {
      id: entry.id,
      date: formatDate(entry.billed_at),
      concept: conceptOf(entry),
      amount: amountOf(entry),
      statusLabel: status.label,
      statusTone: status.tone,
      hasInvoice: entry.has_invoice,
    };
  });

export const cardLabel = (paymentMethod) => {
  if (!paymentMethod) return null;
  const brand = CARD_BRANDS[paymentMethod.brand] || "Tarjeta";
  const month = String(paymentMethod.expiry_month).padStart(2, "0");
  return `${brand} terminada en ${paymentMethod.last4} · vence ${month}/${paymentMethod.expiry_year}`;
};
