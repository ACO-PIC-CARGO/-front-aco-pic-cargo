import { ref } from "vue";
import Swal from "sweetalert2";
import { shortDate } from "@/utils/dates";
import { areaPendiente, tienePerfilRevision } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import type { SolicitudARechazar } from "@/components/folderBilling/RechazarSolicitudDialog.vue";

const escapar = (valor: unknown) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface DatosRechazo {
  motivo?: string | null;
  usuario?: string | null;
  fecha?: string | null;
  area?: string | null;
}

// Solicitud rechazada: motivo, quién la rechazó, en qué paso y cuándo
export function verMotivoRechazo(d: DatosRechazo) {
  const fecha = d.fecha ? `${shortDate(d.fecha.slice(0, 10))} ${d.fecha.slice(11, 16)}`.trim() : "—";
  const area = d.area === "GER" ? "Gerencia" : d.area === "ADM" ? "Administración" : "—";
  const fila = (etiqueta: string, valor: string) =>
    `<div style="display:grid;grid-template-columns:130px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid #f1d5d5;text-align:left">` +
    `<b style="color:#7f1d1d">${etiqueta}</b><span>${valor}</span></div>`;
  return Swal.fire({
    icon: "error",
    title: "Motivo del rechazo",
    html:
      `<div style="padding:4px 12px;border-radius:12px;background:#fef2f2">` +
      fila("Motivo", escapar(d.motivo || "Sin motivo")) +
      fila("Rechazó", escapar(d.usuario || "—")) +
      fila("Paso", area) +
      fila("Fecha", escapar(fecha)) +
      "</div>",
    confirmButtonText: "Cerrar",
    confirmButtonColor: "#475569",
  });
}

// Botón "Rechazar" de los listados: solo el paso pendiente y solo quien puede aprobarlo
// areaDe: qué paso se rechaza según el estado (pagos: PENADM / PENGER; cobros: Pendiente por confirmar)
export function useRechazoSolicitud(areaDe: (codigoEstado: string | null | undefined) => AreaRevision | null = areaPendiente) {
  const dialogRechazo = ref(false);
  const rechazoSel = ref<SolicitudARechazar | null>(null);

  const puedeRechazar = (codigoEstado: string | null | undefined, permiso: boolean) => {
    const area = areaDe(codigoEstado);
    return !!area && permiso && tienePerfilRevision(area);
  };
  const tituloRechazar = (codigoEstado: string | null | undefined) => {
    const area = areaDe(codigoEstado);
    if (!area) return "Solo se rechaza mientras está pendiente";
    if (!tienePerfilRevision(area)) return `Solo quien aprueba por ${area === "ADM" ? "Administración" : "Gerencia"} puede rechazar`;
    return `Rechazar (paso de ${area === "ADM" ? "Administración" : "Gerencia"})`;
  };
  function abrirRechazo(id: number | string, codigoEstado: string | null | undefined) {
    const area = areaDe(codigoEstado);
    if (!area) return;
    rechazoSel.value = { id, area };
    dialogRechazo.value = true;
  }

  return { dialogRechazo, rechazoSel, puedeRechazar, tituloRechazar, abrirRechazo };
}
