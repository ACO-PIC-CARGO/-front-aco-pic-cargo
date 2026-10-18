import store from "@/store/index";
import type {
  ContenedorCantidad,
  Costo,
  DatosPrincipales,
  Multiplicador,
  Numerico,
} from "@/types/cotizacion";
import { calcularValor, looseEquals, numeroSeguro } from "@/utils/cotizacion";

type CodigoMultiplicador = number | string | null | undefined;
type MultiplicadorBuscado = Multiplicador & { length?: number };

interface OpcionesFormatearCostos {
  costos?: Costo[];
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
      store.state.pricing.listMultiplicador;

    const configMult = listMultiplicador.find((item) =>
      looseEquals(item.code, code),
    );

    const getContainerCount = (identificador: Multiplicador["id_container"]) => {
      if (!Array.isArray(containers)) return 0;
      const found = containers.find((v) =>
        looseEquals(v.id_containers, identificador),
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
      case 2:
        return metroscc;
      case 3:
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
    const pricing = store.state.pricing;
    const datosPrincipales: DatosPrincipales = pricing.datosPrincipales || {};
    const costosFlete = (Array.isArray(listCostos) ? listCostos : []).filter(
      (costo) =>
        costo &&
        looseEquals(costo.esfleteflag, 1) &&
        looseEquals(costo.status, 1) &&
        looseEquals(costo.esventaflag, 1),
    ) as Costo[];

    return costosFlete.reduce((total, costo) => {
      const multiplicador = ((pricing.listMultiplicador || []) as Multiplicador[])
        .find((item) => looseEquals(item.id, costo.id_multiplicador));
      let factor = numeroSeguro(
        calcularFac(
          multiplicador ? multiplicador.code : "N",
          datosPrincipales.volumen,
          datosPrincipales.peso,
          datosPrincipales.containers,
          datosPrincipales.amount,
        ),
      );

      if (
        looseEquals(costo.code_cost, 4) &&
        numeroSeguro(datosPrincipales.volumen) < 1
      ) {
        factor = Math.max(factor, 1);
      }

      if ([5, 13, 14].includes(Number(multiplicador && multiplicador.code))) {
        return total;
      }

      return (
        total +
        numeroSeguro(multiplicador && multiplicador.valor) *
          numeroSeguro(costo.costounitario) *
          factor
      );
    }, 0);
  }

  function buscarMultiplicador(
    costo: Costo,
    multiplicadores: Multiplicador[],
  ): MultiplicadorBuscado | undefined {
    return costo.id_multiplicador
      ? multiplicadores.filter((v) => looseEquals(v.id, costo.id_multiplicador))[0]
      : [];
  }

  function calcularSubtotal(
    costo: Costo,
    codemultiplicador: MultiplicadorBuscado,
    datosPrincipales: DatosPrincipales,
    totalDeFlete: Numerico,
  ): number {
    const code = codemultiplicador.code;
    const esPorcentaje =
      looseEquals(code, 5) || looseEquals(code, 13) || looseEquals(code, 14);
    if (!esPorcentaje) {
      return (
        Number(codemultiplicador.valor) *
        Number(costo.costounitario) *
        Number(
          calcularFac(
            code,
            datosPrincipales.metroscc,
            datosPrincipales.kg,
            datosPrincipales.containers,
            datosPrincipales.amount,
          ),
        )
      );
    }
    calcularValor(
      datosPrincipales.amount,
      totalDeFlete,
      code,
      looseEquals(code, 14) ? (costo.cif as Numerico) : (costo.seguro as Numerico),
      costo.minimo ? Number(costo.minimo) : 118,
    );
    return 0;
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
    const cost: Costo[] = [];
    costos
      .filter(
        (v) =>
          (v.esorigenflag ||
            v.esfleteflag ||
            v.eslocalflag ||
            v.esaduanaflag ||
            v.esgastostercerosflag ||
            v.esalmacenflag) &&
          looseEquals(v.status, 1),
      )
      .forEach((costo) => {
        const codemultiplicador = buscarMultiplicador(costo, multiplicadores);
        let subTotal = 0;

        if (codemultiplicador && codemultiplicador.length! > 0) {
          subTotal = calcularSubtotal(
            costo,
            codemultiplicador,
            datosPrincipales,
            totalDeFlete,
          );
        }
        if (
          codemultiplicador &&
          !(
            looseEquals(codemultiplicador.code, 5) &&
            looseEquals(codemultiplicador.code, 13) &&
            looseEquals(codemultiplicador.code, 14) &&
            costo.esorigenflag
          )
        ) {
          cost.push({
            ...costo,
            code_service: costo.code_service ? costo.code_service : "",
            code_cost: costo.code_cost ? costo.code_cost : "",
            id: costo.id ? costo.id : "",
            concepto: costo.nameservice,
            minimo: costo.minimo ? costo.minimo : 0,
            subtotal: subTotal,
          });
        }
      });
    return cost;
  }

  function formatearCostosEditar({
    costos = [],
    multiplicadores = [],
    datosPrincipales = {},
    totalDeFlete = 0,
  }: OpcionesFormatearCostos) {
    const cost: Costo[] = [];
    costos
      .filter(
        (v) =>
          (looseEquals(v.esorigenflag, true) ||
            looseEquals(v.eslocalflag, true) ||
            looseEquals(v.esfleteflag, true) ||
            looseEquals(v.esaduanaflag, true) ||
            looseEquals(v.esgastostercerosflag, true) ||
            looseEquals(v.esalmacenflag, true)) &&
          looseEquals(v.status, 1),
      )
      .forEach((costo) => {
        const codemultiplicador = buscarMultiplicador(costo, multiplicadores);
        let subTotal = 0;

        if (codemultiplicador && codemultiplicador.length! > 0) {
          subTotal = calcularSubtotal(
            costo,
            codemultiplicador,
            datosPrincipales,
            totalDeFlete,
          );
        }
        if (
          codemultiplicador &&
          !(
            looseEquals(codemultiplicador.code, 5) &&
            looseEquals(codemultiplicador.code, 13) &&
            looseEquals(codemultiplicador.code, 14) &&
            costo.esorigenflag
          )
        ) {
          cost.push({
            ...costo,
            code_cost: costo.code_cost ? costo.code_cost : null,
            id: costo.id ? costo.id : null,
            concepto: costo.nameservice,
            minimo: costo.minimo ? costo.minimo : 0,
            subtotal: subTotal,
          });
        }
      });

    return cost;
  }

  return {
    calcularFac,
    calcularTotalFleteVentaPorOpcion,
    formatearCostos,
    formatearCostosEditar,
  };
}
