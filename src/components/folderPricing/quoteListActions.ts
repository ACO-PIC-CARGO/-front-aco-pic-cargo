export type PricingView = "" | "pending_send" | "pricing_requested";

export const showsCallActions = (view: PricingView): boolean => view === "";

export const showsReturnToSalesAction = (view: PricingView): boolean => view !== "";
