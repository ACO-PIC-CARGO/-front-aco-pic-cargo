import http from "@/api/http";
import type { ApiResponse } from "@/types/api";

export interface PricingRequestInfo {
  quote_code: string;
  pricing_name: string | null;
  pricing_notes: string | null;
  pending_since: string | null;
  can_request: boolean;
  blocked_reason: string | null;
}

export interface PricingRequestNotice {
  request_id: number | string;
  quote_id: number;
  quote_code: string;
  client_name: string | null;
  requested_by_name: string | null;
  pricing_notes: string | null;
  created_at: string;
}

const url = (path: string) => `${import.meta.env.VITE_URL_MAIN}${path}`;

export async function getPricingRequestInfo(quoteId: number | string) {
  const { data } = await http<ApiResponse<PricingRequestInfo[]>>({ method: "get", url: url(`quote_pricing_request/${quoteId}`) });
  return data;
}

export async function createPricingRequest(quoteId: number | string) {
  const { data } = await http<ApiResponse<never[]>>({ method: "post", url: url(`quote_pricing_request/${quoteId}`) });
  return data;
}

export async function listPendingPricingRequests(): Promise<PricingRequestNotice[]> {
  const { data } = await http<ApiResponse<PricingRequestNotice[]>>({ method: "get", url: url("quote_pricing_requests/pending") });
  return data.estadoflag ? data.data : [];
}

export async function markPricingRequestSeen(requestId: number | string): Promise<void> {
  await http({ method: "put", url: url(`quote_pricing_requests/${requestId}/seen`) });
}
