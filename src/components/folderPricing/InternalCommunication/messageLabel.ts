export type MessageDirection = "sales_to_pricing" | "pricing_to_sales";

interface MessageParties {
  direction: MessageDirection;
  author_name: string | null;
  recipient_name: string | null;
}

const labels: Record<MessageDirection, string> = {
  sales_to_pricing: "De Ventas para Pricing",
  pricing_to_sales: "De Pricing para Ventas",
};

const roles: Record<MessageDirection, { author: string; recipient: string }> = {
  sales_to_pricing: { author: "Ventas", recipient: "Pricing" },
  pricing_to_sales: { author: "Pricing", recipient: "Ventas" },
};

const withRole = (name: string | null, role: string) => (!name || name === role ? role : `${name} (${role})`);

export const messageLabel = (direction: MessageDirection) => labels[direction];

export const messageRoute = (direction: MessageDirection) => `${roles[direction].author} → ${roles[direction].recipient}`;

export const messageAuthor = ({ direction, author_name }: MessageParties) => withRole(author_name, roles[direction].author);

export const messageRecipient = ({ direction, recipient_name }: MessageParties) =>
  withRole(recipient_name, roles[direction].recipient);
