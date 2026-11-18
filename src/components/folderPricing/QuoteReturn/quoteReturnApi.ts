import http from "@/api/http";
import type { ApiResponse } from "@/types/api";

export interface QuoteReturnStatus {
  id: number;
  name: string;
}

export interface QuoteReturnPayload {
  status_id?: number;
  reason: string;
}

const url = (path: string) => `${import.meta.env.VITE_URL_MAIN}${path}`;

export async function listQuoteReturnStatuses() {
  const { data } = await http<ApiResponse<QuoteReturnStatus[]>>({ method: "get", url: url("quote_return_statuses") });
  return data;
}

export async function returnQuoteToSales(quoteId: number | string, payload: QuoteReturnPayload) {
  const { data } = await http<ApiResponse<never[]>>({ method: "post", url: url(`quote_return_to_sales/${quoteId}`), data: payload });
  return data;
}
