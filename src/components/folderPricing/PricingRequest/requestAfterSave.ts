import Swal from "sweetalert2";
import { createPricingRequest } from "./pricingRequestApi";

export type SaveChoice = "save_only" | "save_and_request";

interface SaveResult {
  saved: boolean;
  quoteId: number | string | null | undefined;
}

export interface RequestOutcome {
  estadoflag: boolean;
  mensaje: string;
}

const REQUEST_FAILED =
  "Guardamos la cotización, pero no pudimos enviar la solicitud a pricing. Revisa tu conexión y solicítala desde el botón Solicitar a pricing.";

export function requestAfterSave(choice: SaveChoice, { saved, quoteId }: SaveResult): number | string | null {
  return choice === "save_and_request" && saved && quoteId ? quoteId : null;
}

export async function requestPricingAfterSave(choice: SaveChoice, result: SaveResult): Promise<RequestOutcome | null> {
  const quoteId = requestAfterSave(choice, result);
  if (quoteId === null) return null;
  try {
    const { estadoflag, mensaje } = await createPricingRequest(quoteId);
    return { estadoflag, mensaje: mensaje || (estadoflag ? "Enviamos la solicitud a pricing." : REQUEST_FAILED) };
  } catch {
    return { estadoflag: false, mensaje: REQUEST_FAILED };
  }
}

export async function askSaveChoice(): Promise<SaveChoice | null> {
  const answer = await Swal.fire({
    icon: "question",
    title: "Guardar cotización",
    text: "¿Quieres solicitar la cotización a pricing al guardarla?",
    confirmButtonText: "Guardar y solicitar a pricing",
    denyButtonText: "Solo guardar",
    showDenyButton: true,
    showCancelButton: true,
    cancelButtonText: "Cancelar",
  });
  if (answer.isConfirmed) return "save_and_request";
  return answer.isDenied ? "save_only" : null;
}
