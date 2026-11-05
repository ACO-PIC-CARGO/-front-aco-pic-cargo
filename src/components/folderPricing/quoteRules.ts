import Swal from "sweetalert2";
import type {
  ContenedorCantidad,
  DatosPrincipales,
  Costo,
  EstadoCotizacion,
  Multiplicador,
  Numerico,
  OpcionCosto,
} from "@/types/cotizacion";
import type { FletePricingCalculadora } from "@/types/calculadora";

export const NO_DEFAULT_STATUS =
  "Tu empresa no tiene un estatus por defecto ni un estatus PRELIMINAR activo para cotizaciones. Elige el estado de la cotización en la lista o configura el estatus por defecto en Configuración.";

export const NO_CALCULATOR_FREIGHT =
  "No hay flete de la calculadora para esta ruta. Escribe el flete en los costos de la cotización.";

export const missingCalculatorFreight = (
  flete: FletePricingCalculadora,
  esGrupal: boolean | undefined,
  shipmentCode: string | undefined,
): boolean => shipmentCode === "LCL" && !(esGrupal ? flete.monto_flete_grupal : flete.monto_flete);

export const FOLDER_NOT_CREATED =
  "No pudimos crear la carpeta de la cotización en OneDrive. Puedes seguir trabajando y pedir a soporte que la cree.";

export const FOLDER_NOT_LINKED =
  "Creamos la carpeta en OneDrive, pero no pudimos enlazarla a la cotización. Enlázala desde el listado con «Actualizar URL Carpeta».";

export const MISSING_PORTS =
  "Elige el puerto de origen y de destino en Datos de la Carga para calcular el flete.";

export const positiveInteger = (value: unknown): true | string =>
  (/^\d+$/.test(String(value ?? "").trim()) && Number(value) > 0) ||
  "Ingresa un número entero mayor que 0.";

const isStorableTransitTime = (value: unknown): boolean => value == null || /^\d+$/.test(String(value));

export const hasInvalidMultiplier = (costo: Costo, multiplicadores: Multiplicador[]): boolean =>
  !!costo.id_multiplicador && !multiplicadores.some((m) => m.id == costo.id_multiplicador);

export const invalidMultiplierMessage = (costo: Costo, multiplicadores: Multiplicador[]): string =>
  hasInvalidMultiplier(costo, multiplicadores)
    ? "Este multiplicador no está activo para este tipo de embarque. Elige otro."
    : "";

export function quoteSaveProblem({
  idStatus,
  opcionCostos,
  containers,
}: {
  idStatus: DatosPrincipales["id_status"];
  opcionCostos: OpcionCosto[];
  containers: ContenedorCantidad[];
}): string | null {
  if (!idStatus) {
    return `Falta el estado de la cotización. ${NO_DEFAULT_STATUS}`;
  }

  const transitoInvalido = opcionCostos
    .filter((opcion) => !isStorableTransitTime(opcion.tiempo_transito))
    .map((opcion) => opcion.nro_propuesta);
  if (transitoInvalido.length > 0) {
    return `El tiempo de tránsito de la opción ${transitoInvalido.join(", ")} debe ser un número entero de días, por ejemplo 15. Corrígelo en los costos de la cotización y vuelve a guardar.`;
  }

  const contenedoresInvalidos = containers
    .filter((container) => positiveInteger(container.cantidad) !== true)
    .map((container) => container.description);
  if (contenedoresInvalidos.length > 0) {
    return `La cantidad de ${contenedoresInvalidos.join(", ")} debe ser un número entero mayor que 0. Corrígela en los datos de la carga y vuelve a guardar.`;
  }

  return null;
}

export function blockedQuoteSave(pricing: { opcionCostos: OpcionCosto[]; datosPrincipales: DatosPrincipales }): boolean {
  const problem = quoteSaveProblem({
    idStatus: pricing.datosPrincipales.id_status,
    opcionCostos: pricing.opcionCostos,
    containers: pricing.datosPrincipales.containers ?? [],
  });
  if (problem) Swal.fire({ icon: "warning", title: "Revisa la cotización antes de guardar", text: problem });
  return !!problem;
}

const isOn = (value: EstadoCotizacion["defaultstatus"]) => value === 1 || value === "1" || value === true;

export const defaultQuoteStatus = (estados: EstadoCotizacion[]): EstadoCotizacion | undefined =>
  estados.find((estado) => isOn(estado.defaultstatus)) ??
  estados.find((estado) => estado.status == 1 && /preliminar/i.test(estado.name ?? ""));

export function servicesStepErrors({
  requiresGoodsValue,
  amount,
  destinationTransport,
  idTown,
  hasTowns,
}: {
  requiresGoodsValue: boolean;
  amount: Numerico;
  destinationTransport: boolean;
  idTown: Numerico;
  hasTowns: boolean;
}): { amount: string; town: string } {
  return {
    amount:
      requiresGoodsValue && !(Number(amount) > 0)
        ? "Ingresa el valor de la mercancía (mayor que 0). Lo necesitamos para calcular el seguro y los impuestos."
        : "",
    town:
      destinationTransport && hasTowns && !idTown
        ? "Elige el distrito de entrega para cotizar el transporte en destino."
        : "",
  };
}
