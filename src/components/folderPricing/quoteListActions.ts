import { messageLabel, type MessageDirection } from "@/components/folderPricing/InternalCommunication/messageLabel";

export type PricingView = "" | "pending_send" | "pricing_requested";

export const showsCallActions = (view: PricingView): boolean => view === "";

export const showsReturnToSalesAction = (view: PricingView): boolean => view !== "";

export const showsInternalThread = (view: PricingView): boolean => view !== "";

const LAST_COMMENT_MAX_LENGTH = 80;

export const lastCommentText = (
  direction: MessageDirection | null | undefined,
  body: string | null | undefined,
): string => {
  if (!direction || !body) return "";
  const flat = body.replace(/\s+/g, " ").trim();
  const shown = flat.length > LAST_COMMENT_MAX_LENGTH ? `${flat.slice(0, LAST_COMMENT_MAX_LENGTH)}…` : flat;
  return `${messageLabel(direction)}: ${shown}`;
};

export const withLastMessage = (
  row: { message_count?: number },
  message: { direction: MessageDirection; body: string },
) => ({
  last_message_body: message.body,
  last_message_direction: message.direction,
  message_count: (row.message_count ?? 0) + 1,
});
