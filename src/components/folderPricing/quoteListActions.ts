import { isLightColor, LIGHT_COLOR_BORDER_COLOR, LIGHT_COLOR_TEXT } from "@/components/folderPricing/priorityColor";
import { messageLabel, type MessageDirection } from "@/components/folderPricing/InternalCommunication/messageLabel";

export type PricingView = "" | "pending_send" | "sent_to_client" | "returned";

export const showsCallActions = (view: PricingView): boolean => view === "";

export const showsReturnToSalesAction = (view: PricingView): boolean => view !== "" && view !== "returned";

export const showsCancelRequestAction = (view: PricingView): boolean => view !== "" && view !== "returned";

export const reloadsAfterPricingRequest = (view: PricingView): boolean => view !== "";

export const showsInternalThread = (view: PricingView): boolean => view !== "";

export interface ListHeader {
  key: string;
  title: string;
  align?: "start" | "center" | "end";
  minWidth?: string;
}

const HIDDEN_IN_PRICING_TABS = new Set(["status", "marketing", "fechaemisionpdf"]);

const DATE_COLUMNS: Partial<Record<PricingView, { after: string; column: ListHeader }>> = {
  sent_to_client: { after: "acciones", column: { key: "sent_to_client_at", title: "FECHA DE ENVÍO AL CLIENTE", align: "center" } },
  returned: { after: "created", column: { key: "returned_to_sales_at", title: "FECHA DE RETORNO A VENTAS", align: "center" } },
};

const LAST_COMMENT_COLUMN: ListHeader = { key: "last_message_body", title: "ÚLTIMO COMENTARIO", align: "start", minWidth: "300px" };

export function quoteListHeaders(view: PricingView, base: readonly ListHeader[]): ListHeader[] {
  if (view === "") return [...base];
  const headers = base.filter((header) => !HIDDEN_IN_PRICING_TABS.has(header.key));
  const date = DATE_COLUMNS[view];
  if (date) headers.splice(headers.findIndex((header) => header.key === date.after) + 1, 0, date.column);
  return [...headers, LAST_COMMENT_COLUMN];
}

const LAST_COMMENT_MAX_LENGTH = 80;

export const lastCommentParts = (
  direction: MessageDirection | null | undefined,
  body: string | null | undefined,
): { label: string; body: string } | null => {
  if (!direction || !body) return null;
  const flat = body.replace(/\s+/g, " ").trim();
  const shown = flat.length > LAST_COMMENT_MAX_LENGTH ? `${flat.slice(0, LAST_COMMENT_MAX_LENGTH)}…` : flat;
  return { label: messageLabel(direction), body: shown };
};

export const lastCommentPillStyle = (priorityColor: string | null | undefined) => {
  if (!priorityColor) return null;
  const background = `color-mix(in srgb, ${priorityColor} 14%, white)`;
  return isLightColor(priorityColor)
    ? { color: LIGHT_COLOR_TEXT, background, border: `1px solid ${LIGHT_COLOR_BORDER_COLOR}` }
    : { color: priorityColor, background };
};

export const withLastMessage = (
  row: { message_count?: number },
  message: { direction: MessageDirection; body: string },
) => ({
  last_message_body: message.body,
  last_message_direction: message.direction,
  message_count: (row.message_count ?? 0) + 1,
});
