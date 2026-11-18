import type { QuoteReturnStatus } from "./quoteReturnApi";

export const needsStatusChoice = (statuses: QuoteReturnStatus[]): boolean => statuses.length > 1;
