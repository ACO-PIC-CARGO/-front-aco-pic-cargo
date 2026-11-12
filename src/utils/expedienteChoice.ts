import moment from "moment";
import Swal from "sweetalert2";

export type ExpedienteKind = "new" | "existing";

type Id = number | string | null | undefined;

export interface QuoteRoute {
  idsentido?: unknown;
  idtipocarga?: unknown;
  idincoterms?: unknown;
  idorigen?: unknown;
  iddestino?: unknown;
}

export interface MasterRoute {
  id_modality?: Id;
  id_shipment?: Id;
  id_incoterms?: Id;
  id_port_begin?: Id;
  id_port_end?: Id;
}

export function masterMismatches(quote: QuoteRoute, master: MasterRoute): string[] {
  const checks: [unknown, Id, string][] = [
    [quote.idsentido, master.id_modality, "Modalidad"],
    [quote.idtipocarga, master.id_shipment, "Tipó de Cargar"],
    [quote.idincoterms, master.id_incoterms, "Incoterms"],
    [quote.idorigen, master.id_port_begin, "Puerto de origien"],
    [quote.iddestino, master.id_port_end, "Puerto de Destino"],
  ];
  // Loose equality on purpose: the quote and the master list carry the same ids as numbers or as text.
  return checks.filter(([ofQuote, ofMaster]) => ofQuote != ofMaster).map(([, , field]) => field);
}

export function availabilityDateProblem(value: string, today: string): string | null {
  if (!value) return "La fecha de validez es requerida";
  if (value <= today) return "La fecha debe ser mayor que la fecha actual";
  return null;
}

export async function askExpedienteKind(hasMasters: boolean): Promise<ExpedienteKind | null> {
  const answer = await Swal.fire({
    icon: "question",
    iconColor: "red",
    width: 1000,
    html: hasMasters
      ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
      : "<h1>¿Desea crear un nuevo expediente?</h1>",
    showConfirmButton: true,
    confirmButtonText: "CREAR NUEVO EXPEDIENTE",
    showDenyButton: hasMasters,
    denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO",
    showCloseButton: true,
    showCancelButton: false,
    allowOutsideClick: false,
  });
  if (answer.isConfirmed) return "new";
  if (answer.isDenied) return "existing";
  return null;
}

export async function askMasterAvailabilityDate(): Promise<string | null> {
  const answer = await Swal.fire({
    icon: "warning",
    width: 1000,
    title: "Fecha de Disponibilidad - Master",
    html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>
              `,
    allowOutsideClick: false,
    confirmButtonText: "ACEPTAR",
    showCancelButton: true,
    cancelButtonText: "CANCELAR",
    preConfirm: () => {
      const value = (document.getElementById("swal-input1") as HTMLInputElement).value;
      const problem = availabilityDateProblem(value, moment().format("YYYY-MM-DD"));
      if (problem) {
        Swal.showValidationMessage(problem);
        return undefined;
      }
      return value;
    },
  });
  return answer.isConfirmed ? (answer.value as string) : null;
}
