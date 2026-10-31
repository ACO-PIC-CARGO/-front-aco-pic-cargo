import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { usePricingStore } from "@/stores/pricing";
import { currencyFormat } from "@/utils/cotizacion";
import type { Costo } from "@/types/cotizacion";

const CONFECCION = 33;
const ITBM = 38;
const ITBM_TAXED_CODES = [29, 36, 41, 68];
const ITBM_RATE = 0.07;

export function useSpecialCostAmounts() {
  const pricingStore = usePricingStore();
  const { calcularFac } = useCotizacionCalculos();

  function confeccionAmount(item: Costo): string {
    let monto = 0;
    if (item.code_cost == CONFECCION) {
      const base = parseFloat(String(pricingStore.datosPrincipales.amount)) + parseFloat(String(pricingStore.totalFlete));
      const cif = base + base * 0.01;
      if (cif < 5000) monto = 50;
      if (cif >= 5000 && cif < 10000) monto = 80;
      if (cif >= 10000) monto = 80 + cif * 0.0025;
    }
    item.costounitario = monto.toFixed(2);
    return currencyFormat(monto);
  }

  function itbmAmount(item: Costo, costs: Costo[]): string {
    let taxed = 0;
    if (item.code_cost == ITBM) {
      const { listMultiplicador, datosPrincipales } = pricingStore;
      costs
        .filter((cost) => ITBM_TAXED_CODES.includes(Number(cost.code_cost)))
        .forEach((cost) => {
          const multiplicador = listMultiplicador.find((v) => v.id == cost.id_multiplicador);
          const factor = calcularFac(
            multiplicador ? multiplicador.code : "N",
            datosPrincipales.volumen,
            datosPrincipales.peso,
            datosPrincipales.containers,
            datosPrincipales.amount,
          );
          taxed += parseFloat(String(multiplicador ? multiplicador.valor : 0)) * parseFloat(String(cost.costounitario || 0)) * Number(factor);
        });
    }
    const itbm = (taxed * ITBM_RATE).toFixed(2);
    item.costounitario = parseFloat(itbm);
    return currencyFormat(itbm);
  }

  function creditNoteAmount(item: Costo, costs: Costo[]): string {
    let confeccion = 0;
    if (item.code_cost == 69) {
      costs.filter((cost) => cost.code_cost == CONFECCION).forEach((cost) => (confeccion = Number(cost.costounitario)));
    }
    const credit = -1 * Number((confeccion * 0.5).toFixed(2));
    item.costounitario = credit;
    return currencyFormat(credit);
  }

  return { confeccionAmount, itbmAmount, creditNoteAmount };
}
