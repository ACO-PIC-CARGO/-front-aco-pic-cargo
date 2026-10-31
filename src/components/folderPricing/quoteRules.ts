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

export const NO_DEFAULT_STATUS =
  "Tu empresa no tiene un estatus por defecto ni un estatus PRELIMINAR activo para cotizaciones. Elige el estado de la cotización en la lista o configura el estatus por defecto en Configuración.";

export const FOLDER_NOT_CREATED =
  "No pudimos crear la carpeta de la cotización en OneDrive. Puedes seguir trabajando y pedir a soporte que la cree.";

export const positiveInteger = (value: unknown): true | string =>
  (/^\d+$/.test(String(value ?? "").trim()) && Number(value) > 0) ||
  "Ingresa un número entero mayor que 0.";

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
  multiplicadores,
}: {
  idStatus: DatosPrincipales["id_status"];
  opcionCostos: OpcionCosto[];
  containers: ContenedorCantidad[];
  multiplicadores: Multiplicador[];
}): string | null {
  if (!idStatus) {
    return `Falta el estado de la cotización. ${NO_DEFAULT_STATUS}`;
  }

  const transitoInvalido = opcionCostos
    .filter((opcion) => positiveInteger(opcion.tiempo_transito) !== true)
    .map((opcion) => opcion.nro_propuesta);
  if (transitoInvalido.length > 0) {
    return `El tiempo de tránsito de la opción ${transitoInvalido.join(", ")} debe ser un número entero de días mayor que 0. Corrígelo en los costos de la cotización y vuelve a guardar.`;
  }

  const contenedoresInvalidos = containers
    .filter((container) => positiveInteger(container.cantidad) !== true)
    .map((container) => container.description);
  if (contenedoresInvalidos.length > 0) {
    return `La cantidad de ${contenedoresInvalidos.join(", ")} debe ser un número entero mayor que 0. Corrígela en los datos de la carga y vuelve a guardar.`;
  }

  const lineasInvalidas = new Set(
    opcionCostos.flatMap((opcion) =>
      opcion.listCostos
        .filter((costo) => costo.status == 1 && hasInvalidMultiplier(costo, multiplicadores))
        .map((costo) => costo.nameservice),
    ),
  );
  if (lineasInvalidas.size > 0) {
    return `Estas líneas de costo tienen un multiplicador que no está activo para este tipo de embarque: ${[...lineasInvalidas].join(", ")}. Elige otro multiplicador en cada línea marcada en rojo o quítala; si vienen de la plantilla de costos, corrígela en Configuración.`;
  }

  return null;
}

export function blockedQuoteSave(pricing: {
  opcionCostos: OpcionCosto[];
  datosPrincipales: DatosPrincipales;
  listMultiplicador: Multiplicador[];
}): boolean {
  const problem = quoteSaveProblem({
    idStatus: pricing.datosPrincipales.id_status,
    opcionCostos: pricing.opcionCostos,
    containers: pricing.datosPrincipales.containers ?? [],
    multiplicadores: pricing.listMultiplicador,
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
