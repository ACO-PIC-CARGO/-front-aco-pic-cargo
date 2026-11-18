export type MessageDirection = "sales_to_pricing" | "pricing_to_sales";

const labels: Record<MessageDirection, string> = {
  sales_to_pricing: "De Ventas para Pricing",
  pricing_to_sales: "De Pricing para Ventas",
};

export const messageLabel = (direction: MessageDirection) => labels[direction];
