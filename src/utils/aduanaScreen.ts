import Swal from "sweetalert2";
import router from "@/router";

export const ADUANA_NOT_FOUND_MESSAGE = "No encontramos esta cotización de aduana. Vuelve al listado e inténtalo de nuevo.";

export async function returnToAduanaList(message: string): Promise<void> {
  await Swal.fire({
    icon: "info",
    text: message,
    confirmButtonText: "Volver al listado",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  await router.push({ name: "lstQuoteAduanaAduana" });
}
