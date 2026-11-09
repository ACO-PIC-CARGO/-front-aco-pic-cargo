import { aplicarMinimoDescargaPeru, calcularValor, numeroSeguro } from "@/utils/cotizacion";
import type { ContenedorCantidad, Costo, Multiplicador, Numerico } from "@/types/cotizacion";

export interface QuoteCargo {
  weight: Numerico;
  volume: Numerico;
  amount: Numerico;
  containers: ContenedorCantidad[];
}

export interface QuoteTotals {
  cost: number;
  sale: number;
  profit: number;
}

export interface QuoteTotalsInput {
  costs: Costo[];
  multipliers: Multiplicador[];
  cargo: QuoteCargo;
  isoCountry: number | null;
}

type MultiplierCode = Multiplicador["code"] | "N";

const PERCENTAGE_CODES = [5, 13, 14, 15];
const FREIGHT_BASE_SKIPPED_CODES = [5, 13, 14];
const CATEGORY_FLAGS = ["esorigenflag", "eslocalflag", "esaduanaflag", "esalmacenflag", "esgastostercerosflag"] as const;

function factorFor(code: MultiplierCode, multipliers: Multiplicador[], cargo: QuoteCargo): Numerico {
  const config = multipliers.find((item) => item.code == code);
  if (config && config.id_container) {
    const found = cargo.containers.find((v) => v.id_containers == config.id_container);
    return found ? found.cantidad : 0;
  }
  const { volume, weight, amount } = cargo;
  switch (code) {
    case 1:
    case 14:
      return config && config.valor ? parseFloat(String(config.valor)) : 1;
    case 2:
      return volume;
    case 3:
      return Number(weight) / 1000 > Number(volume) ? Number(weight) / 1000 : volume;
    case 4:
      return Number(weight) / 1000;
    case 6:
      return Number(volume) * 166.66 > Number(weight) ? Number(volume) * 166.66 : weight;
    case 15:
      return Number(amount) / 100;
    case 18:
      return weight;
    case 24:
      if (Number(volume) < 15) return Number(weight) / 1000;
      return Math.max(Number(weight) / 1000, Number(volume) / 3, 1);
    default:
      return 1;
  }
}

function isPercentage(row: Costo, multipliers: Multiplicador[]): boolean {
  return multipliers.some((v) => v.id == row.id_multiplicador && PERCENTAGE_CODES.includes(v.code as number));
}

function costOf(row: Costo, input: QuoteTotalsInput, freight: number): number {
  const { multipliers, cargo, isoCountry } = input;
  const multiplier = multipliers.find((v) => v.id === row.id_multiplicador);
  const value = multiplier ? multiplier.valor : 0;
  const code: MultiplierCode = multiplier ? multiplier.code : "N";

  if (!isPercentage(row, multipliers)) {
    let factor = factorFor(code, multipliers, cargo);
    if (row.code_cost == 4 && (cargo.volume as number) < 1 && (factor as number) < 1) {
      factor = 1;
    }
    let amount = (value as number) * (row.costounitario as number) * (factor as number);
    if (row.considerarvalorminimoflag && row.costounitario != 0) {
      amount = Number(row.minimo || 0) > Number(amount) ? Number(row.minimo) : amount;
    }
    return aplicarMinimoDescargaPeru(code, cargo.weight, isoCountry, row.costounitario as Numerico, amount);
  }

  const percentageBase = PERCENTAGE_CODES.includes(code as number) ? row.cif : row.seguro;
  return calcularValor(cargo.amount, freight, multiplier ? code : "", percentageBase as Numerico, row.minimo as number);
}

function freightBase(costs: Costo[], input: QuoteTotalsInput): number {
  const { multipliers, cargo, isoCountry } = input;
  return costs
    .filter((row) => row.esfleteflag == 1 && row.status == 1 && row.esventaflag == 1)
    .reduce((total, row) => {
      const multiplier = multipliers.find((item) => item.id == row.id_multiplicador);
      if (!multiplier || FREIGHT_BASE_SKIPPED_CODES.includes(Number(multiplier.code))) return total;
      let factor = numeroSeguro(factorFor(multiplier.code, multipliers, cargo));
      if (row.code_cost == 4 && numeroSeguro(cargo.volume) < 1) factor = Math.max(factor, 1);
      const subtotal = aplicarMinimoDescargaPeru(
        multiplier.code,
        cargo.weight,
        isoCountry,
        row.costounitario as Numerico,
        numeroSeguro(multiplier.valor) * numeroSeguro(row.costounitario) * factor,
      );
      return (
        total +
        (row.considerarvalorminimoflag && row.costounitario != 0 ? Math.max(numeroSeguro(row.minimo), subtotal) : subtotal)
      );
    }, 0);
}

function optionTotal(rows: Costo[], input: QuoteTotalsInput, freight: number): number {
  const active = rows.filter((row) => row.status == 1);
  let total = 0;
  active.filter((row) => row.esfleteflag == 1).forEach((row) => {
    total += costOf(row, input, freight);
  });
  active.forEach((row) => {
    const amount = Number(costOf(row, input, freight));
    CATEGORY_FLAGS.forEach((flag) => {
      if (row[flag] == 1) total += amount;
    });
  });
  return total;
}

export function quoteOptionTotals(input: QuoteTotalsInput): QuoteTotals {
  const costRows = input.costs.filter((row) => row.esopcionflag == 1);
  const saleRows = input.costs.filter((row) => row.esventaflag == 1);
  const base = freightBase(input.costs, input);
  const saleFreight = saleRows
    .filter((row) => row.esfleteflag == 1 && row.status == 1)
    .reduce((total, row) => total + costOf(row, input, base), 0);
  const cost = optionTotal(costRows, input, saleFreight);
  const sale = optionTotal(saleRows, input, saleFreight);
  return { cost, sale, profit: sale - cost };
}
