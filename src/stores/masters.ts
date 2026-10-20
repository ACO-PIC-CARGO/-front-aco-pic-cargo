import { defineStore } from "pinia";
import { computed, ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useAppStore } from "@/stores/app";
import type { ApiResponse } from "@/types/api";
import type { CampoRaiz, FilaRaiz, FiltroExpedientesRaiz, NroMasterRaiz, SeleccionRaiz } from "@/types/app";
import type { ComentarioMaster } from "@/types/operaciones";
import { localDateAtAppLoad } from "@/utils/appLoad";
import { sessionBranchId } from "@/utils/sesion";

export const useMastersStore = defineStore("masters", () => {
  async function createCarpetaOneDrive({ name = "" }: { name?: string }): Promise<string | false> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `crear-carpeta-master?nromaster=${name}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    const res = await axios<ApiResponse<string>>(config)
      .then(async function (response) {
        return response.data.data;
      })
      .catch((e) => {
        console.error(e);
        return false as const;
      });
    return res;
  }
  async function actualizarMaster({ id = 0, url = "" }: { id?: number; url?: string }): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `update_folder_onedrive`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios<ApiResponse>(config).then(async function (response) {
      return response.data.data;
    });
  }
  async function insertComentarioMaster({
    id_entitie = 0,
    id_master = 0,
    fecha = 0,
    comentario = 0,
  }: ComentarioMaster): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insert_comentario_master`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_entitie: id_entitie,
        id_master: id_master,
        fecha: fecha,
        comentario: comentario,
      },
    };

    await axios<ApiResponse>(config).then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      const res = response.data;
      if (res.status == "401") {
        Swal.fire({
          icon: "error",
          text: res.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal) => {
          if (resSwal.isConfirmed && res.status == "401") {
            // @ts-expect-error Kept: router is not imported in this module, so a confirmed 401 throws a ReferenceError.
            router.push({ name: "Login" });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }
        });
      } else {
        Swal.fire({
          icon: res.estadoflag == true ? "success" : "error",
          text: res.mensaje,
        });
      }
    });
  }
  async function actualizarURLEnElMaster({ id = "", url = "" }: { id?: number | string; url?: string }): Promise<void> {
    console.log("crearCarpetaOneDrive", url);
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_folder_onedrive_master`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: id,
        url: url,
      },
    };
    await axios<ApiResponse>(config).then(async (response) => {
      return response.data.data;
    });
  }
  async function moverCostos(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `mover_cgegresos`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(async (response) => {
        return response.data.data;
      })
      .catch((e) => {
        console.error(e);
      });
  }
  async function controlGastosReactivar(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `master_control_reactivar`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse>(config)
      .then(async (response) => {
        return response.data.data;
      })
      .catch((e) => {
        console.error(e);
      });
  }

  const salidaflag = ref(false);
  const llegadaflag = ref(false);
  const disponibilidadflag = ref(false);
  const namecampaign = ref<CampoRaiz>("");
  const comentario = ref<FilaRaiz[]>([]);
  const id_canal = ref<CampoRaiz>("");
  const nro_manifiesto = ref<CampoRaiz>("");
  const url_folderonedrive = ref<CampoRaiz>("");
  const fecha_libre_almacenaje = ref<CampoRaiz>("");
  const fecha_libre_sobreestadia = ref<CampoRaiz>("");
  const almacen_recepcion = ref<CampoRaiz>("");
  const dias_sobreestadia = ref<number | string>(0);
  const grupalflag = ref(false);
  const itemsServicesBegin = ref<FilaRaiz[]>([]);
  const itemsServicesList = ref<FilaRaiz[]>([]);
  const itemsBitacoraList = ref<FilaRaiz[]>([]);
  const itemsProveedorRolAgente = ref<FilaRaiz[]>([]);
  const itemsProveedorRolColoader = ref<FilaRaiz[]>([]);
  const itemsProveedorRolNaviera = ref<FilaRaiz[]>([]);
  const statusData = ref<boolean | string>(false);
  const master_expediente = ref<CampoRaiz>("");
  const master_Id_get = ref<CampoRaiz>("");
  const master_nro_expediente = ref<CampoRaiz>("");
  const master_cotizanion = ref<CampoRaiz>("");
  const master_sentido = ref<CampoRaiz>("");
  const master_incoterms = ref<CampoRaiz>("");
  const master_ganancia_pricing = ref<CampoRaiz>("");
  const master_ganancia_operaciones = ref<CampoRaiz>("");
  const master_id_operador = ref<CampoRaiz>("");
  const master_cantidad_house = ref(1);
  const master_insertId = ref(1);
  const master_id_consigner = ref<CampoRaiz>("");
  const master_id_notify = ref<CampoRaiz>("");
  const master_id_airlines = ref<CampoRaiz>("");
  const master_id_coloader = ref<CampoRaiz>("");
  const master_id_naviera = ref<CampoRaiz>("");
  const master_id_motonave = ref<CampoRaiz>("");
  const master_viaje = ref<CampoRaiz>("");
  const master_bultos = ref<CampoRaiz>("");
  const master_peso = ref<CampoRaiz>("");
  const master_volumen = ref<CampoRaiz>("");
  const master_id_condicion = ref<CampoRaiz>("");
  const master_id_coins = ref<CampoRaiz>("");
  const master_blmaster = ref<CampoRaiz>("");
  const totalItemsMasterList = ref(0);
  const master_filtrarData = ref(false);
  const master_filtro = ref<FiltroExpedientesRaiz>({
    fecha_etd_desde: null,
    fecha_eta_desde: null,
    fecha_etd_hasta: null,
    fecha_eta_hasta: null,
  });
  const master_fecha_eta = ref<CampoRaiz>(localDateAtAppLoad);
  const master_fecha_etd = ref<CampoRaiz>(localDateAtAppLoad);
  const master_fecha_disponibilidad = ref<CampoRaiz>(localDateAtAppLoad);
  const house_nro_expediente = ref<CampoRaiz>("");
  const rowMaster = ref<SeleccionRaiz | CampoRaiz>("");
  const master_monto = ref<CampoRaiz>();
  const nro_master = ref<CampoRaiz>();
  const master_vuelo = ref<CampoRaiz>();
  const cuotas = ref<CampoRaiz>();

  const itemsServicesBeginGetter = computed(() => itemsServicesBegin.value);
  const itemsServicesListGetter = computed(() => itemsServicesList.value);
  const itemsBitacoraListGetter = computed(() => itemsBitacoraList.value);

  function _setServicesBegin(dataServicesBegin: FilaRaiz[]): void {
    itemsServicesBegin.value = dataServicesBegin.sort();
  }

  function _setItemsBitacoraList(dataBitacoraList: FilaRaiz[]): void {
    itemsBitacoraList.value = dataBitacoraList;
  }

  function _setDataNroMaster(data: NroMasterRaiz[]): void {
    master_expediente.value = new Date().getFullYear() + "MBL" + data[0]!.nro_master;
    master_nro_expediente.value = data[0]!.nro_master;
  }

  function _setRowMaster(data: SeleccionRaiz | CampoRaiz): void {
    rowMaster.value = data;
  }

  function _setTotalMasterList(data: number): void {
    totalItemsMasterList.value = data;
  }

  function _setServicesList(data: FilaRaiz[]): void {
    itemsServicesList.value = data;
  }

  function _setItemsProveedorRolAgente(data: FilaRaiz[]): void {
    itemsProveedorRolAgente.value = data;
  }

  function _setItemsProveedorRolColoader(data: FilaRaiz[]): void {
    itemsProveedorRolColoader.value = data;
  }

  function _setItemsProveedorRolNaviera(data: FilaRaiz[]): void {
    itemsProveedorRolNaviera.value = data;
  }

  function openURL({ url }: { url: string }): void {
    window.open(url, "_blank");
  }

  async function _getServicesBegin(): Promise<void> {
    const appStore = useAppStore();
    const data = {
      id_modality: master_sentido.value ? master_sentido.value : null,
      id_shipment: (appStore.master_id_trasnport as SeleccionRaiz).id
        ? (appStore.master_id_trasnport as SeleccionRaiz).id
        : null,
      id_incoterms: master_incoterms.value ? master_incoterms.value : null,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getItemsServices",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        if (response.data.data) {
          _setServicesBegin(response.data.data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getBitacoraList(): Promise<void> {
    const data = {
      id_branch: sessionBranchId(),
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getBitacoraList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setItemsBitacoraList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getnroMaster(): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getNroMaster",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id_branch: sessionBranchId(),
      },
    };
    await axios<ApiResponse<NroMasterRaiz[]>>(config)
      .then(function (response) {
        _setDataNroMaster(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getTotalMasterList(): Promise<void> {
    const config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `getTotalMasterList?id_branch=${sessionBranchId()}&id_canal=${master_filtro.value.id_canal || ""}&id_sentido=${
          master_filtro.value.id_sentido || ""
        }&id_tipo_embarque=${
          master_filtro.value.id_tipo_embarque ? master_filtro.value.id_tipo_embarque.id || "" : ""
        }&id_origen=${master_filtro.value.id_origen || ""}&id_destino=${
          master_filtro.value.id_destino || ""
        }&id_agente=${master_filtro.value.id_agente || ""}&fecha_etd=${master_filtro.value.fecha_etd || ""}&fecha_eta=${
          master_filtro.value.fecha_eta || ""
        }&status_op=${
          master_filtro.value.status_operativo == 0 || master_filtro.value.status_operativo == 1
            ? master_filtro.value.status_operativo
            : ""
        }&status_adm=${
          master_filtro.value.status_administrativo == 0 || master_filtro.value.status_administrativo == 1
            ? master_filtro.value.status_administrativo
            : ""
        }&busqueda=${master_filtro.value.busqueda || ""}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse & { total: string }>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        _setTotalMasterList(parseInt(response.data.total) || 0);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getServicesList(): Promise<void> {
    const appStore = useAppStore();
    const data = {
      id_modality: master_sentido.value,
      id_shipment: (appStore.master_id_trasnport as SeleccionRaiz).id,
      id_incoterms: master_incoterms.value,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getItemsServicesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setServicesList(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getProveedorRolAgente(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_proveedor_rol_no_shipper?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setItemsProveedorRolAgente(response.data.data);
        } else {
          _setItemsProveedorRolAgente([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getProveedorRolColoader(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_proveedor_x_rol?id_branch=${sessionBranchId()}&rol=COLOADER`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setItemsProveedorRolColoader(response.data.data);
        } else {
          _setItemsProveedorRolColoader([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getProveedorRolNaviera(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_proveedor_x_rol?id_branch=${sessionBranchId()}&rol=NAVIERA`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setItemsProveedorRolNaviera(response.data.data);
        } else {
          _setItemsProveedorRolNaviera([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    createCarpetaOneDrive,
    actualizarMaster,
    insertComentarioMaster,
    actualizarURLEnElMaster,
    moverCostos,
    controlGastosReactivar,
    salidaflag,
    llegadaflag,
    disponibilidadflag,
    namecampaign,
    comentario,
    id_canal,
    nro_manifiesto,
    url_folderonedrive,
    fecha_libre_almacenaje,
    fecha_libre_sobreestadia,
    almacen_recepcion,
    dias_sobreestadia,
    grupalflag,
    itemsServicesBegin,
    itemsServicesList,
    itemsBitacoraList,
    itemsProveedorRolAgente,
    itemsProveedorRolColoader,
    itemsProveedorRolNaviera,
    statusData,
    master_expediente,
    master_Id_get,
    master_nro_expediente,
    master_cotizanion,
    master_sentido,
    master_incoterms,
    master_ganancia_pricing,
    master_ganancia_operaciones,
    master_id_operador,
    master_cantidad_house,
    master_insertId,
    master_id_consigner,
    master_id_notify,
    master_id_airlines,
    master_id_coloader,
    master_id_naviera,
    master_id_motonave,
    master_viaje,
    master_bultos,
    master_peso,
    master_volumen,
    master_id_condicion,
    master_id_coins,
    master_blmaster,
    totalItemsMasterList,
    master_filtrarData,
    master_filtro,
    master_fecha_eta,
    master_fecha_etd,
    master_fecha_disponibilidad,
    house_nro_expediente,
    rowMaster,
    master_monto,
    nro_master,
    master_vuelo,
    cuotas,
    itemsServicesBeginGetter,
    itemsServicesListGetter,
    itemsBitacoraListGetter,
    _setServicesBegin,
    _setItemsBitacoraList,
    _setDataNroMaster,
    _setRowMaster,
    _setTotalMasterList,
    _setServicesList,
    _setItemsProveedorRolAgente,
    _setItemsProveedorRolColoader,
    _setItemsProveedorRolNaviera,
    openURL,
    _getServicesBegin,
    _getBitacoraList,
    _getnroMaster,
    _getTotalMasterList,
    _getServicesList,
    _getProveedorRolAgente,
    _getProveedorRolColoader,
    _getProveedorRolNaviera,
  };
});
