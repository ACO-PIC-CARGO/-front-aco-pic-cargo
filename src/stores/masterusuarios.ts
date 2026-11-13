import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { TipoTransaccion } from "@/types/entidades";
import type { FiltroMasterDetalle, FormMasterDetalle, MasterDetalle } from "@/types/seguridad";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { request } from "@/utils/request";
import { sessionBranchId } from "@/utils/sesion";

export const useMasterusuariosStore = defineStore("masterusuarios", () => {
  const tipo = ref("filter");
  const drawer = ref(false);
  const lstCanales = ref<TipoTransaccion[]>([]);
  const lstTipoProveedor = ref<TipoTransaccion[]>([]);
  const lstPercepcionAduana = ref<TipoTransaccion[]>([]);
  const lstTipoTransaccion = ref<TipoTransaccion[]>([]);
  const lstTipoTelefono = ref<(MasterDetalle | TipoTransaccion)[]>([]);
  const lstImpuesto = ref<MasterDetalle[]>([]);
  const lstNotasQuote = ref<MasterDetalle[]>([]);
  const lstTipoPersona = ref<TipoTransaccion[]>([]);
  const lstImpRenta = ref<TipoTransaccion[]>([]);
  const lstTemperatura = ref<TipoTransaccion[]>();
  const defaultFiltros = (): FiltroMasterDetalle => ({
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    escomunflag: false,
    individualflag: true,
    grupalflag: true,
    orden: null,
  });
  const filtros = ref<FiltroMasterDetalle>(defaultFiltros());
  const model = ref<FormMasterDetalle>({
    id: "",
    id_master: "",
    valorcodigo: "",
    codigo01: "",
    codigo02: "",
    description: "",
    status: true,
    id_branch: "",
    escomunflag: "",
    individualflag: true,
    grupalflag: true,
    orden: null,
  });

  function resetFiltros(): void {
    filtros.value = defaultFiltros();
  }

  async function saveAndTell(method: string, path: string): Promise<boolean> {
    const response = await request({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: { "Content-Type": "application/json" },
      data: model.value,
    });
    Swal.fire({ icon: response.estadoflag ? "success" : "error", text: response.mensaje });
    return response.estadoflag;
  }

  function ActualizarMasterDetalle(): Promise<boolean> {
    return saveAndTell("put", "actualizar_master_detalle");
  }

  async function GetListImpuestos(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_master_detalle_impuesto?&id_branch=${sessionBranchId()}&id_master=${filtros.value.id_master}&valorcodigo=${
          filtros.value.valorcodigo == "" || filtros.value.valorcodigo == null ? "" : filtros.value.valorcodigo
        }&codigo01=${
          filtros.value.codigo01 == "" || filtros.value.codigo01 == null ? "" : filtros.value.codigo01
        }&codigo02=${filtros.value.codigo02}&description=${
          filtros.value.description == "" || filtros.value.description == null ? "" : filtros.value.description
        }&status=${filtros.value.status}&escomunflag=${filtros.value.escomunflag}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<MasterDetalle[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstImpuesto.value = data.data;
          } else {
            lstImpuesto.value = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function GetListNotasCotizacion(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listar_master_detalle_notas_cotizacion?&id_branch=${sessionBranchId()}&id_master=${filtros.value.id_master}&valorcodigo=${
          filtros.value.valorcodigo == "" || filtros.value.valorcodigo == null ? "" : filtros.value.valorcodigo
        }&codigo01=${filtros.value.codigo01}&codigo02=${
          filtros.value.codigo02 == "" || filtros.value.codigo02 == null ? "" : filtros.value.codigo02
        }&description=${
          filtros.value.description == "" || filtros.value.description == null ? "" : filtros.value.description
        }&status=${filtros.value.status == null ? "" : filtros.value.status}&escomunflag=${filtros.value.escomunflag}`,

      headers: { "Content-Type": "application/json" },
    };
    try {
      await axios<ApiResponse<MasterDetalle[]>>(config)
        .then(function (response) {
          const data = response.data;
          sessionStorage.setItem("auth-token", data.token!);

          if (data.estadoflag == true) {
            lstNotasQuote.value = data.data;
          } else {
            lstNotasQuote.value = [];
            showRejectedResponse(data);
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (error) {
      console.error(error);
    }
  }

  async function GetListTipoTelefono(): Promise<void> {
    const { valorcodigo, description, status } = filtros.value;
    const data = await request<MasterDetalle>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "listar_master_detalle_tipotelefono",
      headers: { "Content-Type": "application/json" },
      params: { valorcodigo, description, status },
    });
    lstTipoTelefono.value = data.estadoflag ? data.data : [];
    if (!data.estadoflag) showRejectedResponse(data);
  }

  // Lookup lists only feed selects: a failed request (offline, dropped mobile connection) leaves the list empty instead of rejecting into the screen that loads it.
  async function loadCatalog(method: "get" | "post", path: string): Promise<TipoTransaccion[]> {
    const data = await request<TipoTransaccion>({
      method,
      url: import.meta.env.VITE_URL_MAIN + path,
      headers: { "Content-Type": "application/json" },
    });
    if (data.token) sessionStorage.setItem("auth-token", data.token);
    return data.estadoflag ? data.data : [];
  }

  async function cargarMasterDetalleCanal(): Promise<void> {
    lstCanales.value = await loadCatalog("post", `cargar_master_detalle_canal?id_branch=${sessionBranchId()}`);
  }

  async function cargarMasterDetalleTipoProveedor(): Promise<void> {
    lstTipoProveedor.value = await loadCatalog("post", `cargar_master_detalle_tipo_proveedor?id_branch=${sessionBranchId()}`);
  }

  async function cargarMasterDetallePercepcionAduana(): Promise<void> {
    lstPercepcionAduana.value = await loadCatalog("get", `cargar_master_detalle_percepcion_aduana?id_branch=${sessionBranchId()}`);
  }

  async function cargarMasterDetalleTipoTransaccion(): Promise<void> {
    lstTipoTransaccion.value = await loadCatalog("get", `cargar_master_detalle_tipo_percepcion?id_branch=${sessionBranchId()}`);
  }

  async function cargarTipoTelefono(): Promise<void> {
    lstTipoTelefono.value = await loadCatalog("get", `cargar_master_detalle_tipo_telefono?id_branch=${sessionBranchId()}`);
  }

  function RegistrarMasterDetalleTipoTelefono(): Promise<boolean> {
    return saveAndTell("post", "insertar_master_detalle_tipotelefono");
  }

  function RegistrarMasterDetalleNotasCotizacion(): Promise<boolean> {
    return saveAndTell("post", "insertar_master_detalle_notas_cotizacion");
  }

  async function cargarTipoPersona(): Promise<void> {
    lstTipoPersona.value = await loadCatalog("get", `cargar_master_detalle_tipo_persona?id_branch=${sessionBranchId()}`);
  }

  async function cargarImpuestoRenta(): Promise<void> {
    lstImpRenta.value = await loadCatalog("get", `cargar_master_detalle_impuesto_renta?id_branch=${sessionBranchId()}`);
  }

  async function cargarTemperaturaLeds(): Promise<void> {
    lstTemperatura.value = await loadCatalog("get", `cargar_master_detalle_temperatura_leads`);
  }

  return {
    tipo,
    drawer,
    lstCanales,
    lstTipoProveedor,
    lstPercepcionAduana,
    lstTipoTransaccion,
    lstTipoTelefono,
    lstImpuesto,
    lstNotasQuote,
    lstTipoPersona,
    lstImpRenta,
    lstTemperatura,
    filtros,
    model,
    resetFiltros,
    ActualizarMasterDetalle,
    GetListImpuestos,
    GetListNotasCotizacion,
    GetListTipoTelefono,
    cargarMasterDetalleCanal,
    cargarMasterDetalleTipoProveedor,
    cargarMasterDetallePercepcionAduana,
    cargarMasterDetalleTipoTransaccion,
    cargarTipoTelefono,
    RegistrarMasterDetalleTipoTelefono,
    RegistrarMasterDetalleNotasCotizacion,
    cargarTipoPersona,
    cargarImpuestoRenta,
    cargarTemperaturaLeds,
  };
});
