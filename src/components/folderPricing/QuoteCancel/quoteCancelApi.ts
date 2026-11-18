import http from "@/api/http";
import type { ApiResponse } from "@/types/api";

export async function cancelPricingRequest(quoteId: number | string, reason: string) {
  const { data } = await http<ApiResponse<never[]>>({
    method: "put",
    url: `${import.meta.env.VITE_URL_MAIN}quote_pricing_request/${quoteId}/cancel`,
    data: { reason },
  });
  return data;
}
