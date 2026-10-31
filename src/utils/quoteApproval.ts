export const APPROVED_QUOTE_MESSAGE = "Esta cotización ya está aprobada. Cópiala para hacer cambios.";

const APPROVED_FLAGS: unknown[] = [true, 1, "1", "true", "si", "sí"];

export function isApprovedQuote({ aprobadoflag }: { aprobadoflag?: unknown }): boolean {
  return APPROVED_FLAGS.includes(typeof aprobadoflag === "string" ? aprobadoflag.trim().toLowerCase() : aprobadoflag);
}

export const APPROVE_FAILED_MESSAGE = "No pudimos aprobar la cotización. Revisa tu conexión e inténtalo de nuevo.";
