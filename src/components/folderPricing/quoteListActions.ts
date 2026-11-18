import { isLightColor, LIGHT_COLOR_BORDER_COLOR, LIGHT_COLOR_TEXT } from "@/components/folderPricing/priorityColor";
import { messageLabel, type MessageDirection } from "@/components/folderPricing/InternalCommunication/messageLabel";

export type PricingView = "" | "pending_send" | "sent_to_client" | "returned";

export const showsCallActions = (view: PricingView): boolean => view === "";

export const showsReturnToSalesAction = (view: PricingView): boolean => view !== "" && view !== "returned";

export const showsInternalThread = (view: PricingView): boolean => view !== "";

const LEADING_DATE_COLUMNS: Partial<Record<PricingView, { key: "sent_to_client_at" | "returned_to_sales_at"; title: string; align: "center" }>> = {
  sent_to_client: { key: "sent_to_client_at", title: "FECHA DE ENVÍO AL CLIENTE", align: "center" },
  returned: { key: "returned_to_sales_at", title: "FECHA DE RETORNO A VENTAS", align: "center" },
};

export const leadingDateColumn = (view: PricingView) => LEADING_DATE_COLUMNS[view] ?? null;

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
