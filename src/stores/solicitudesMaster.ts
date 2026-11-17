import { ref } from "vue";
import { defineStore } from "pinia";
import type { ApiResponse } from "@/types/api";
import type { SolicitudPagoControl } from "@/types/billingEntries";
import type { SolicitudCobro } from "@/types/solicitudCobro";
import { request } from "@/utils/request";

// Solicitudes de pago y de cobro de un expediente (Control de Gastos).
// Varias secciones de la pantalla muestran los mismos datos (Costos + "Solicitudes de Pagos",
// Ingresos + "Solicitudes de Cobro"): se piden una sola vez y todas leen de aquí.
// Si dos secciones piden lo mismo a la vez, comparten la misma llamada al servidor.
export const useSolicitudesMasterStore = defineStore("solicitudesMaster", () => {
  const pagos = ref<Record<number, SolicitudPagoControl[]>>({});
  const cobros = ref<Record<number, SolicitudCobro[]>>({});
  const enCurso = new Map<string, Promise<ApiResponse<unknown>>>();
  // cuándo se cargó cada lista: al entrar a la pantalla las secciones no repiten la llamada
  const cargadoEn = new Map<string, number>();
  const FRESCO_MS = 30_000;

  function pedir<T>(clave: string, ruta: string, idMaster: number, guardar: (filas: T[]) => void) {
    const previa = enCurso.get(clave);
    if (previa) return previa as Promise<ApiResponse<T>>;
    const promesa = request<T>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + ruta,
      params: { id_master: idMaster },
    })
      .then((response) => {
        // "No se encontraron registros" llega con estadoflag false: lista vacía
        if (response.estadoflag || response.tipomensaje === "TMSGINF") {
          guardar(response.estadoflag ? response.data : []);
          cargadoEn.set(clave, Date.now());
        }
        return response;
      })
      .finally(() => enCurso.delete(clave));
    enCurso.set(clave, promesa as Promise<ApiResponse<unknown>>);
    return promesa;
  }

  const cargarPagos = (idMaster: number) =>
    pedir<SolicitudPagoControl>(`pago:${idMaster}`, "solicitud_pago_listar", idMaster, (filas) => {
      pagos.value = { ...pagos.value, [idMaster]: filas };
    });

  const cargarCobros = (idMaster: number) =>
    pedir<SolicitudCobro>(`cobro:${idMaster}`, "solicitud_cobro_listar", idMaster, (filas) => {
      cobros.value = { ...cobros.value, [idMaster]: filas };
    });

  // Al entrar: solo pide si nadie lo cargó hace poco (otra sección de la misma pantalla).
  // Después de una acción (aprobar, enviar, eliminar...) se usa cargarPagos / cargarCobros.
  const fresco = (clave: string) => Date.now() - (cargadoEn.get(clave) ?? 0) < FRESCO_MS;
  const asegurarPagos = (idMaster: number) =>
    fresco(`pago:${idMaster}`) ? Promise.resolve(null) : cargarPagos(idMaster);
  const asegurarCobros = (idMaster: number) =>
    fresco(`cobro:${idMaster}`) ? Promise.resolve(null) : cargarCobros(idMaster);

  return { pagos, cobros, cargarPagos, cargarCobros, asegurarPagos, asegurarCobros };
});
