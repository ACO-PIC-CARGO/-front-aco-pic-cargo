import type { PricingRequestInfo } from "./pricingRequestApi";

export const ALREADY_REQUESTED_TOOLTIP = "Ya fue solicitado. Edita la cotización para volver a solicitarla.";

export function isAlreadyRequested(info: Pick<PricingRequestInfo, "already_requested"> | null): boolean {
  return info?.already_requested === true;
}

export function alreadyRequestedTooltip(reason: string | null): string {
  return reason ?? ALREADY_REQUESTED_TOOLTIP;
}
