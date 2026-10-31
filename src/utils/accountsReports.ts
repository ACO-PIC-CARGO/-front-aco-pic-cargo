import { filledParams } from "@/utils/queryParams";

type Choice = number[] | string;

export interface ReceivableFilters {
  clients: Choice;
  arrival: string;
  to: string;
  file: string;
  incomes: Choice;
  subIncomes: Choice;
}

export interface PayableFilters {
  providers: Choice;
  arrival: string;
  to: string;
  file: string;
  expenses: Choice;
  subExpenses: Choice;
}

interface AdminReceivableLine {
  symbol: string;
  total_pagar: string | number;
  igv: string | number;
}

const URL_LIFETIME_MS = 60_000;

const joined = (choice: Choice) => (Array.isArray(choice) ? choice.join(",") : choice);

export const receivableQuery = (filters: ReceivableFilters) =>
  filledParams({
    id_cliente: joined(filters.clients),
    llegadaflag: filters.arrival,
    fechahasta: filters.to,
    nro_expediente: filters.file,
    id_ingreso: joined(filters.incomes),
    id_subingreso: joined(filters.subIncomes),
  });

export const payableQuery = (filters: PayableFilters) =>
  filledParams({
    id_proveedor: joined(filters.providers),
    llegada: filters.arrival,
    hasta: filters.to,
    nro_expediente: filters.file,
    id_gasto: joined(filters.expenses),
    id_subgasto: joined(filters.subExpenses),
  });

export const adminReceivableTotals = (rows: { details: AdminReceivableLine[] }[], localCurrency: string) => {
  const totals = { usd: { pending: 0, tax: 0 }, local: { pending: 0, tax: 0 } };
  rows.forEach((row) =>
    row.details.forEach((line) => {
      const bucket = line.symbol == "USD" ? totals.usd : totals.local;
      bucket.pending += Number(line.total_pagar) || 0;
      bucket.tax += Number(line.igv) || 0;
    }),
  );
  const asRow = (moneda: string, { pending, tax }: { pending: number; tax: number }) => ({
    moneda,
    monto: pending.toFixed(2),
    igv: tax.toFixed(2),
    total: pending.toFixed(2),
  });
  return [asRow("USD", totals.usd), asRow(localCurrency, totals.local)];
};

export const unscheduledLines = <Line extends { programado: number }>(lines: Line[]) => lines.filter((line) => line.programado == 0);

export const downloadExternalFile = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(String(response.status));
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await response.blob());
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), URL_LIFETIME_MS);
  } catch {
    window.open(url, "_blank", "noopener");
  }
};
