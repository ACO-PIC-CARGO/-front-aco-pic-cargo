import type { PricingRequestInfo } from "./pricingRequestApi";

export const ALREADY_REQUESTED_TOOLTIP = "Ya fue solicitado. Edita la cotización para volver a solicitarla.";

const ALREADY_REQUESTED_PREFIX = "Ya fue solicitada";

export function isAlreadyRequested(info: Pick<PricingRequestInfo, "can_request" | "blocked_reason"> | null): boolean {
  return !!info && !info.can_request && !!info.blocked_reason?.startsWith(ALREADY_REQUESTED_PREFIX);
}

export function alreadyRequestedTooltip(reason: string | null): string {
  return reason ?? ALREADY_REQUESTED_TOOLTIP;
}
