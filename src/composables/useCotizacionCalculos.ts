import { usePricingStore } from "@/stores/pricing";
import type {
  ContenedorCantidad,
  Costo,
  DatosPrincipales,
  Multiplicador,
  Numerico,
  Servicio,
} from "@/types/cotizacion";
import {
  aplicarMinimoDescargaPeru,
  calcularValor,
  numeroSeguro,
} from "@/utils/cotizacion";
import { sessionIsoPais } from "@/utils/sesion";

type CodigoMultiplicador = number | string | null | undefined;

interface OpcionesFormatearCostos {
  costos?: Costo[];
  services?: Servicio[];
  multiplicadores?: Multiplicador[];
  datosPrincipales?: DatosPrincipales;
  totalDeFlete?: Numerico;
}

export function useCotizacionCalculos() {
  function calcularFac(
    code: CodigoMultiplicador = null,
    metroscc: Numerico = 0,
    kg: Numerico = 0,
    containers: ContenedorCantidad[] | null = [],
    amount: Numerico = 0,
  ): Numerico {
    const listMultiplicador: Multiplicador[] =
      usePricingStore().listMultiplicador;

    const configMult = listMultiplicador.find((item) =>
      item.code == code,
    );

    const getContainerCount = (identificador: Multiplicador["id_container"]) => {
      if (!Array.isArray(containers)) return 0;
      const found = containers.find((v) =>
        v.id_containers == identificador,
      );
      return found ? found.cantidad : 0;
    };

    if (configMult && configMult.id_container) {
      return getContainerCount(configMult.id_container);
    }

    switch (code) {
      case 1:
      case 14:
        return configMult && configMult.valor
          ? parseFloat(String(configMult.valor))
          : 1;
      case 2: // M3
        return metroscc;
      case 3: // TO/M3
        return Number(kg) / 1000 > Number(metroscc)
          ? Number(kg) / 1000
          : metroscc;
      case 4:
        return Number(kg) / 1000;
      case 6:
        return Number(metroscc) * 166.66 > Number(kg)
          ? Number(metroscc) * 166.66
          : kg;
      case 15:
        return Number(amount) / 100;
      case 18:
        return kg;
      case 24:
        if (Number(metroscc) < 15) {
          return Number(kg) / 1000;
        }
        return Math.max(Number(kg) / 1000, Number(metroscc) / 3, 1);
      default:
        return 1;
    }
  }

  function calcularTotalFleteVentaPorOpcion({
    listCostos = [],
  }: { listCostos?: (Costo | null)[] } = {}): number {
    const pricing = usePricingStore();
    const datosPrincipales: DatosPrincipales = pricing.datosPrincipales || {};
    const costosFlete = (Array.isArray(listCostos) ? listCostos : []).filter(
      (costo) =>
        costo &&
        costo.esfleteflag == 1 &&
        costo.status == 1 &&
        costo.esventaflag == 1,
    ) as Costo[];

    return costosFlete.reduce((total, costo) => {
      const multiplicador = ((pricing.listMultiplicador || []) as Multiplicador[])
        .find((item) => item.id == costo.id_multiplicador);
      if (!multiplicador || [5, 13, 14].includes(Number(multiplicador.code))) {
        return total;
      }
      return total + subtotalPorFactor(costo, multiplicador, datosPrincipales);
    }, 0);
  }

  function subtotalPorFactor(
    costo: Costo,
    multiplicador: Multiplicador,
    datosPrincipales: DatosPrincipales,
  ): number {
    let factor = numeroSeguro(
      calcularFac(
        multiplicador.code,
        datosPrincipales.volumen,
        datosPrincipales.peso,
        datosPrincipales.containers,
        datosPrincipales.amount,
      ),
    );
    if (costo.code_cost == 4 && numeroSeguro(datosPrincipales.volumen) < 1) {
      factor = Math.max(factor, 1);
    }
    const subtotal = aplicarMinimoDescargaPeru(
      multiplicador.code,
      datosPrincipales.peso,
      sessionIsoPais(),
      costo.costounitario,
      numeroSeguro(multiplicador.valor) * numeroSeguro(costo.costounitario) * factor,
    );
    return costo.considerarvalorminimoflag && costo.costounitario != 0
      ? Math.max(numeroSeguro(costo.minimo), subtotal)
      : subtotal;
  }

  function calcularSubtotal(
    costo: Costo,
    multiplicador: Multiplicador | undefined,
    datosPrincipales: DatosPrincipales,
    totalDeFlete: Numerico,
  ): number {
    if (!multiplicador) return 0;
    if ([5, 13, 14, 15].includes(Number(multiplicador.code))) {
      return calcularValor(
        datosPrincipales.amount,
        totalDeFlete,
        multiplicador.code,
        costo.cif,
        costo.minimo,
      );
    }
    return subtotalPorFactor(costo, multiplicador, datosPrincipales);
  }

  function costosConMultiplicador(costos: Costo[], multiplicadores: Multiplicador[]) {
    return costos.flatMap((costo) => {
      const multiplicador = multiplicadores.find((v) => v.id == costo.id_multiplicador);
      return costo.id_multiplicador && !multiplicador ? [] : [{ costo, multiplicador }];
    });
  }

  function formatearCostos({
    costos = [],
    multiplicadores = [],
    datosPrincipales = {},
    totalDeFlete = 0,
  }: OpcionesFormatearCostos) {
    costos.filter((v) => {
      const flags = [
        v.esorigenflag,
        v.esfleteflag,
        v.eslocalflag,
        v.esaduanaflag,
        v.esgastostercerosflag,
        v.esalmacenflag,
      ];

      const tieneFlag = flags.some((f) => Number(f) === 1);
      const statusOk = Number(v.status) === 1;

      if (!tieneFlag || !statusOk) {
        console.log("Registro descartado:", v.nameservice, {
          flags,
          status: v.status,
        });
      }

      return tieneFlag && statusOk;
    });
    const activos = costos.filter(
      (v) =>
        (v.esorigenflag ||
          v.esfleteflag ||
          v.eslocalflag ||
          v.esaduanaflag ||
          v.esgastostercerosflag ||
          v.esalmacenflag) &&
        v.status == 1,
    );
    return costosConMultiplicador(activos, multiplicadores).map(({ costo, multiplicador }) => ({
      ...costo,
      code_service: costo.code_service ? costo.code_service : "",
      code_cost: costo.code_cost ? costo.code_cost : "",
      id: costo.id ? costo.id : "",
      concepto: costo.nameservice,
      minimo: costo.minimo ? costo.minimo : 0,
      subtotal: calcularSubtotal(costo, multiplicador, datosPrincipales, totalDeFlete),
    }));
  }

  function formatearCostosEditar({
    costos = [],
    multiplicadores = [],
    datosPrincipales = {},
    totalDeFlete = 0,
  }: OpcionesFormatearCostos) {
    const activos = costos.filter(
      (v) =>
        (v.esorigenflag == true ||
          v.eslocalflag == true ||
          v.esfleteflag == true ||
          v.esaduanaflag == true ||
          v.esgastostercerosflag == true ||
          v.esalmacenflag == true) &&
        v.status == 1,
    );
    return costosConMultiplicador(activos, multiplicadores).map(({ costo, multiplicador }) => ({
      ...costo,
      code_cost: costo.code_cost ? costo.code_cost : null,
      id: costo.id ? costo.id : null,
      concepto: costo.nameservice,
      minimo: costo.minimo ? costo.minimo : 0,
      subtotal: calcularSubtotal(costo, multiplicador, datosPrincipales, totalDeFlete),
    }));
  }

  return {
    calcularFac,
    calcularTotalFleteVentaPorOpcion,
    aplicarMinimoDescargaPeru,
    formatearCostos,
    formatearCostosEditar,
  };
}
