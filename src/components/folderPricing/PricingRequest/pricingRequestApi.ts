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

const url = (path: string) => `${import.meta.env.VITE_URL_MAIN}${path}`;

export async function getPricingRequestInfo(quoteId: number | string) {
  const { data } = await http<ApiResponse<PricingRequestInfo[]>>({ method: "get", url: url(`quote_pricing_request/${quoteId}`) });
  return data;
}

export async function createPricingRequest(quoteId: number | string) {
  const { data } = await http<ApiResponse<never[]>>({ method: "post", url: url(`quote_pricing_request/${quoteId}`) });
  return data;
}
