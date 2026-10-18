import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import {
  calcularImpuestos,
  calcularValor,
  comienzaConCaracter,
  comienzaNoConCaracter,
  currencyFormat,
  formatImp,
  formatearContainer,
  formatearContainerEditar,
  formatearNotas,
  formatearServicios,
  obtenerAduanaFlag,
  obtenerAlmacenFlag,
  obtenerFlagOrigen,
  obtenerLocalFlag,
  obtenerPorcentaje,
  obtenerStatus,
  probarFunction,
  validateCost,
  validateLength,
} from "@/utils/cotizacion";

const {
  calcularFac,
  calcularTotalFleteVentaPorOpcion,
  formatearCostos,
  formatearCostosEditar,
} = useCotizacionCalculos();

const miMixin = {
  methods: {
    probarFunction,
    obtenerFlagOrigen,
    obtenerStatus,
    obtenerLocalFlag,
    obtenerAduanaFlag,
    obtenerAlmacenFlag,
    calcularFac,
    calcularValor,
    currencyFormat,
    validateCost,
    comienzaNoConCaracter,
    comienzaConCaracter,
    formatearServicios,
    formatearCostos,
    formatearCostosEditar,
    formatearNotas,
    formatearContainer,
    formatearContainerEditar,
    formatImp,
    calcularTotalFleteVentaPorOpcion,
    calcularImpuestos,
    obtenerPorcentaje,
    validateLength,
  },
};

export default miMixin;
