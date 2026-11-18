export type PricingView = "" | "pending_send" | "sent_to_client" | "returned";

export const showsCallActions = (view: PricingView): boolean => view === "";
