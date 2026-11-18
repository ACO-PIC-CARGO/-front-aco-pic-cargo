import http from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { MessageDirection } from "./messageLabel";

export interface InternalMessage {
  id: number;
  direction: MessageDirection;
  body: string;
  author_name: string | null;
  created_at: string;
}

export interface SentMessage {
  id: number;
  direction: MessageDirection;
  created_at: string;
}

const url = (quoteId: number | string) => `${import.meta.env.VITE_URL_MAIN}quote_internal_messages/${quoteId}`;

export async function getInternalMessages(quoteId: number | string) {
  const { data } = await http<ApiResponse<InternalMessage[]>>({ method: "get", url: url(quoteId) });
  return data;
}

export async function sendInternalMessage(quoteId: number | string, body: string) {
  const { data } = await http<ApiResponse<SentMessage[]>>({ method: "post", url: url(quoteId), data: { body } });
  return data;
}
