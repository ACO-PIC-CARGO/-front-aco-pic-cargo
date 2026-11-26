type ConceptoOp = {
  total_op?: unknown;
  totalopcuentabanco?: unknown;
  acronym?: string | null;
  symbol?: string | null;
};

// Monto Op en la moneda del concepto: en USD es total_op; en otra moneda (PEN, etc.) total_op es solo
// el equivalente en dólares y el monto real es el de la cuenta del banco (totalopcuentabanco).
// Misma regla que la BD (function_solicitudpago_guardar).
export function montoOpMoneda(d: ConceptoOp): number {
  const moneda = String(d.acronym || d.symbol || "USD").trim().toUpperCase();
  const local = Number(d.totalopcuentabanco || 0);
  const esDolar = moneda === "USD" || moneda === "$";
  return !esDolar && local > 0 ? local : Number(d.total_op || 0);
}

const esMonedaDolar = (moneda: string | null | undefined) => ["USD", "$"].includes(String(moneda || "USD").trim().toUpperCase());

// Concepto guardado en una solicitud (con la moneda de la solicitud): monto / IGV / total en esa moneda
export function conceptoEnMoneda(
  c: ConceptoOp & { monto_op?: unknown; igv_op?: unknown; montoopcuentabanco?: unknown; igvopcuentabanco?: unknown },
  moneda: string | null | undefined,
) {
  const local = !esMonedaDolar(moneda) && Number(c.totalopcuentabanco || 0) > 0;
  return local
    ? { monto: Number(c.montoopcuentabanco ?? c.totalopcuentabanco ?? 0), igv: Number(c.igvopcuentabanco || 0), total: Number(c.totalopcuentabanco || 0) }
    : { monto: Number(c.monto_op || 0), igv: Number(c.igv_op || 0), total: Number(c.total_op || 0) };
}

// Pricing no tiene monto en la cuenta del banco: siempre en USD
export const monedaPricing = (moneda: string | null | undefined) => (esMonedaDolar(moneda) ? (moneda || "USD") : "USD");
