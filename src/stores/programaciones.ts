import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import type {
  FiltroProgramacionProveedor,
  ProgramacionListado,
  ProgramacionPagoProveedor,
} from "@/types/finanzas";
import { hasFailed, request } from "@/utils/request";

const JSON_HEADERS = { "Content-Type": "application/json" };

const load = <Row>(path: string) =>
  request<Row>({ method: "get", url: import.meta.env.VITE_URL_MAIN + path, headers: JSON_HEADERS });

const send = (method: "post" | "put", path: string, data: Record<string, unknown>) =>
  request({ method, url: import.meta.env.VITE_URL_MAIN + path, headers: JSON_HEADERS, data });

const notify = (response: { estadoflag: boolean; mensaje: string }) =>
  Swal.fire({ icon: response.estadoflag ? "success" : "warning", titleText: "Aviso", text: response.mensaje });

export const useProgramacionesStore = defineStore("programaciones", () => {
  const listado = ref<ProgramacionListado[]>([]);
  const listProgramacion = ref<unknown[]>([]);
  const listProgramacionxProveedor = ref<ProgramacionPagoProveedor[]>([]);

  async function loadInto<Row>(path: string, target: { value: Row[] }): Promise<void> {
    const response = await load<Row>(path);
    target.value = response.estadoflag ? response.data : [];
    if (hasFailed(response)) {
      Swal.fire({ icon: "error", text: response.mensaje });
    }
  }

  async function ListProgrammedPayment(): Promise<void> {
    await loadInto("ListProgrammedPayment", listado);
  }
  async function GetTotalCotizacion(): Promise<void> {
    await loadInto("cargar_programacion", listProgramacion);
  }
  async function getListProgramacion(data: FiltroProgramacionProveedor): Promise<void> {
    await loadInto(
      `pagos_programados_por_proveedor?id_proveedor=${data.id_proveedor}&id_programend=${data.id}&id_coins=${data.id_coins}`,
      listProgramacionxProveedor,
    );
    listProgramacionxProveedor.value.forEach((element) => {
      element.tipocambio = element.tipocambio ? element.tipocambio : 1;
    });
  }
  async function saveAndReload(method: "post" | "put", path: string, data: Record<string, unknown>): Promise<void> {
    const response = await send(method, path, data);
    const result = await notify(response);
    if (response.estadoflag && result.isConfirmed) {
      await ListProgrammedPayment();
    }
  }
  async function setPagoProgramado(data: Record<string, unknown>): Promise<void> {
    await saveAndReload("post", "registrar_pagos_programado", data);
  }
  async function eliminarProgramacion(data: Record<string, unknown>): Promise<void> {
    await saveAndReload("put", "eliminar_programacion", data);
  }
  async function eliminarProgramacionDetalle(data: Record<string, unknown>): Promise<void> {
    await notify(await send("put", "eliminar_programacion_detalle", data));
  }

  return {
    listado,
    listProgramacion,
    listProgramacionxProveedor,
    ListProgrammedPayment,
    GetTotalCotizacion,
    getListProgramacion,
    setPagoProgramado,
    eliminarProgramacion,
    eliminarProgramacionDetalle,
  };
});
