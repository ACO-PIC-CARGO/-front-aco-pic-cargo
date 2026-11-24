import moment from "moment";

export type QuoteListView = "" | "pending_send" | "sent_to_client" | "returned";

interface ViewDates {
  view_date_from?: string | null;
  view_date_to?: string | null;
}

const VIEW_DATES: Partial<Record<QuoteListView, { label: string; lastDays: number }>> = {
  pending_send: { label: "Fecha de solicitud a Pricing", lastDays: 30 },
  sent_to_client: { label: "Fecha de envío al cliente", lastDays: 10 },
};

export const viewDateLabel = (view: QuoteListView): string | null => VIEW_DATES[view]?.label ?? null;

export const defaultViewDates = (view: QuoteListView, today = moment()): ViewDates => {
  const dates = VIEW_DATES[view];
  if (!dates) return {};
  return {
    view_date_from: today.clone().subtract(dates.lastDays, "days").format("YYYY-MM-DD"),
    view_date_to: today.format("YYYY-MM-DD"),
  };
};

export const viewDatesProblem = (view: QuoteListView, { view_date_from, view_date_to }: ViewDates): string | null => {
  const label = viewDateLabel(view);
  if (!label || Boolean(view_date_from) === Boolean(view_date_to)) return null;
  return `Debes seleccionar la ${label} ${view_date_from ? "Hasta" : "Desde"}.`;
};
