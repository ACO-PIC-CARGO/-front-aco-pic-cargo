import Swal from "sweetalert2";
import { request } from "@/utils/request";

// Pregunta y reversa una cotización aprobada: la desasocia del house, anula (lógicamente) sus ingresos / costos
// y la deja sin aprobar. Devuelve true si se reversó.
export async function reversarCotizacion(idQuote: number | string, quote?: string | number | null): Promise<boolean> {
  const answer = await Swal.fire({
    icon: "warning",
    title: "¿Desea reversar la cotización?",
    html:
      `La cotización${quote ? ` <b>${quote}</b>` : ""} se desasociará del house, se anularán sus ingresos y costos ` +
      "en Control de Gastos y quedará sin aprobar.",
    showCancelButton: true,
    confirmButtonText: "Sí, reversar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#e65359",
    allowOutsideClick: false,
    allowEnterKey: false,
  });
  if (!answer.isConfirmed) return false;

  Swal.fire({ title: "Reversando cotización", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  const res = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "reversar_cotizacion",
    headers: { "Content-Type": "application/json" },
    data: { id_quote: idQuote },
  });
  await Swal.fire({
    icon: res.estadoflag ? "success" : "warning",
    title: res.estadoflag ? "Cotización reversada" : "No se pudo reversar",
    text: res.mensaje,
  });
  return !!res.estadoflag;
}
