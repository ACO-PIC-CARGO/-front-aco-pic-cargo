import http from "@/api/http";
import type { ApiResponse } from "@/types/api";

export type QuoteNoticeKind = "pricing_request" | "sent_to_client";

export interface QuoteNotice {
  notification_id: number | string;
  kind: QuoteNoticeKind;
  branch_id: number;
  quote_id: number;
  quote_code: string;
  client_name: string | null;
  created_by_name: string | null;
  pricing_notes: string | null;
  created_at: string;
}

const url = (path: string) => `${import.meta.env.VITE_URL_MAIN}${path}`;

export async function listPendingQuoteNotifications(): Promise<QuoteNotice[]> {
  const { data } = await http<ApiResponse<QuoteNotice[]>>({ method: "get", url: url("quote_notifications/pending") });
  return data.estadoflag ? data.data : [];
}

export async function markQuoteNotificationSeen(notificationId: number | string): Promise<void> {
  await http({ method: "put", url: url(`quote_notifications/${notificationId}/seen`) });
}
