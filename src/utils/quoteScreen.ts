import Swal from "sweetalert2";
import router from "@/router";

export const QUOTE_NOT_FOUND_MESSAGE = "No encontramos esta cotización. Vuelve al listado e inténtalo de nuevo.";

export async function returnToQuoteList(message: string): Promise<void> {
  await Swal.fire({
    icon: "info",
    text: message,
    confirmButtonText: "Volver al listado",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
  await router.push({ name: "lstQuote" });
}
