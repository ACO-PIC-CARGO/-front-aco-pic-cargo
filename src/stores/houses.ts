import { defineStore } from "pinia";
import { computed, ref } from "vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import router from "@/router";
import store from "@/store";
import { useAppStore } from "@/stores/app";
import type { ApiResponse } from "@/types/api";
import type { FilaConIdRaiz, FilaRaiz, FiltroExpedientesRaiz, HouseCopiaRaiz, RegistroBitacoraRaiz, TipoEmbarqueRaiz } from "@/types/app";
import type { ComentarioEstadoHouse, TipoContenedor } from "@/types/catalogos";
import type { HouseListado, Numerico } from "@/types/cotizacion";
import type {
  BitacoraLinealHouse,
  FacturaFiscal,
  FiltroHouseConsulta,
  HouseDetalle,
  HouseFacturable,
} from "@/types/operaciones";
import { localDateAtAppLoad } from "@/utils/appLoad";
import { sessionBranchId } from "@/utils/sesion";

export const useHousesStore = defineStore("houses", () => {
  const listHouse = ref<HouseListado[]>([]);
  const house = ref<HouseDetalle>({});
  const lstFacturasFiscales = ref<FacturaFiscal[]>([]);

  // getCargarHouse
  async function verHouse(filtros: FiltroHouseConsulta): Promise<void> {
    filtros.id_branch = sessionBranchId();
    await axios
      .get<ApiResponse<HouseDetalle[] | undefined>>(import.meta.env.VITE_URL_MAIN + `house_ver`, {
        params: filtros,

        // @ts-expect-error Kept: the header goes in as a request option, as before.
        "Content-Type": "application/json",
      })
      .then(function (response) {
        const data = response.data;
        house.value = data.data ? data.data[0]! : {};
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function setConfirmarTelex(data: Record<string, unknown>): Promise<void> {
    await axios
      .put<ApiResponse>(import.meta.env.VITE_URL_MAIN + `houses_confirmar_telex`, data, {
        // @ts-expect-error Kept: the header goes in as a request option, as before.
        "Content-Type": "application/json",
      })
      .then(function (response) {
        const data = response.data;
        if (data.estadoflag) {
          Swal.fire({
            icon: "success",
            text: data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function guardarCarpetaHouse(data: Record<string, unknown>): Promise<void> {
    const headers = {
      "Content-Type": "application/json",
    };

    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `crear-carpeta-house`,
      headers: headers,
      data: data,
    };

    axios<ApiResponse>(config).then((response) => {
      const res = response.data;
      console.log("Respuesta de guardarCarpetaHouse:", res);
    });
  }
  async function listarHouse(filtros: FiltroHouseConsulta): Promise<void> {
    filtros.id_branch = sessionBranchId();
    await axios
      .get<ApiResponse<HouseListado[] | undefined>>(import.meta.env.VITE_URL_MAIN + `listado_houses`, {
        params: filtros,

        // @ts-expect-error Kept: the header goes in as a request option, as before.
        "Content-Type": "application/json",
      })
      .then(function (response) {
        const data = response.data;

        listHouse.value = data.data ? data.data : [];
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function getCargarHouse(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_house?id_branch=${sessionBranchId()}`,

      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<HouseListado[] | undefined>>(config)
      .then(function (response) {
        const data = response.data;

        listHouse.value = data.data ? data.data : [];
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function insertComentarioHouse(dataObj: Record<string, unknown> = {}): Promise<void> {
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertComentarioHouse`,
      headers: {
        "Content-Type": "application/json",
      },
      data: dataObj,
    };

    await axios<ApiResponse>(config)
      .then(function (response) {
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
              router.push({ name: "Login" });
              setTimeout(() => {
                window.location.reload();
              }, 10);
            }
          });
        } else {
          Swal.fire({
            icon: res.estadoflag ? "success" : "error",
            text: res.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  async function deleteHouse(data: Record<string, unknown>): Promise<void> {
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "setHouseDelete",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse & { statusBol?: boolean }>(config).then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      if (response.data.status == "401") {
        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal) => {
          if (resSwal.isConfirmed && response.data.status == "401") {
            router.push({ name: "Login" });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }
        });
      }

      if (response.data.statusBol) {
        Swal.fire({
          icon: "success",
          title: "REGISTRO ELIMINADO.",
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((res) => {
          if (res.isConfirmed) {
            const ruta = router.currentRoute.value.name;
            console.log("ruta", ruta);
            if (ruta === "controlHouseEditar") {
              const id_master = store.state.copy_house.id_master;
              router.push({
                name: "controlMasterEditar",
                params: {
                  id: id_master,
                },
              });
            } else if (ruta === "controlMasterEditar") {
              window.location.reload();
            }
          }
        });
      }
    });
  }
  async function getFacturasFiscales(houseFacturable: HouseFacturable = {}): Promise<void> {
    lstFacturasFiscales.value = [];

    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getFacturasFiscales`,
      params: {
        id_house: houseFacturable.id_house,
        id_correlativo: houseFacturable.id_correlativo,
      },
      headers: {
        "Content-Type": "application/json",
      },
    };

    await axios<ApiResponse<FacturaFiscal[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);

        if (!!response.data.data[0]!.estadoflag) {
          lstFacturasFiscales.value = response.data.data;
        } else {
          lstFacturasFiscales.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  const copy_house = ref<HouseCopiaRaiz>(null as unknown as HouseCopiaRaiz);
  const modalServices_manualMode = ref(false);
  const itemsColoaders = ref<FilaRaiz[]>([]);
  const itemsBitacoraLineal = ref<BitacoraLinealHouse[]>([]);
  const itemsBitacora = ref<RegistroBitacoraRaiz[]>([]);
  const itemsHouseContainers = ref<FilaConIdRaiz[] | null>([]);
  const itemsComentariosPredefinidos = ref<ComentarioEstadoHouse[]>([]);
  const house_id_trasnport = ref<TipoEmbarqueRaiz | Numerico>("");
  const house_sentido = ref<Numerico>("");
  const house_incoterms = ref<Numerico>("");
  const house_origen = ref<Numerico>("");
  const telexconfirmado = ref<boolean | undefined>(false);
  const fechaconfirmaciontelex = ref<string | null | undefined>("");
  const house_destino = ref<Numerico>("");
  const house_id_containers = ref<TipoContenedor>("" as unknown as TipoContenedor);
  const house_cantidad = ref<Numerico>("");
  const house_id = ref<Numerico>("");
  const house_id_agente = ref<Numerico>("");
  const house_id_consigner_real = ref<Numerico>("");
  const house_id_notify = ref<Numerico>("");
  const house_id_airlines = ref<Numerico>("");
  const house_id_coloader = ref<Numerico>("");
  const house_id_naviera = ref<Numerico>("");
  const house_id_motonave = ref<Numerico>("");
  const house_viaje = ref<Numerico>("");
  const house_bultos = ref<Numerico>("");
  const house_peso = ref<Numerico>("");
  const house_volumen = ref<Numerico>("");
  const house_id_condicion = ref<Numerico>("");
  const house_id_coins = ref<Numerico>("");
  const house_blmaster = ref<Numerico>("");
  const url_onedrive = ref<Numerico>("");
  const house_master = ref<Numerico>("");
  const house_master_expediente = ref<Numerico>("");
  const house_nro_declaracion_aduana = ref<Numerico>("");
  const house_canal_aduana = ref<Numerico>("");
  const house_filtrarData = ref(false);
  const house_filtro = ref<FiltroExpedientesRaiz>({
    fecha_etd_desde: null,
    fecha_eta_desde: null,
    fecha_etd_hasta: null,
    fecha_eta_hasta: null,
  } as FiltroExpedientesRaiz);
  const dataHouse_transporte = ref<Numerico>("");
  const bitacora_id_bitacora = ref<Numerico>("");
  const bitacora_comentario_predefinido = ref<ComentarioEstadoHouse>("" as unknown as ComentarioEstadoHouse);
  const bitacora_comentario = ref<Numerico>("");
  const bitacora_comentario_flag = ref(false);
  const bitacora_fecha = ref(localDateAtAppLoad);
  const bitacora_visible_cliente = ref(true);
  const house_enlace_tracking = ref("");
  const house_monto = ref<Numerico>();
  const house_cotizacion = ref<Numerico>();
  const house_id_vendedor = ref<Numerico>();
  const house_id_pricing = ref<Numerico>();
  const house_nro_containers = ref<Numerico>();
  const house_nro_precinto = ref<Numerico>();
  const id_master = ref<Numerico>();
  const house_cotizacionaduana = ref<Numerico>();

  const itemsColoadersGetter = computed(() => itemsColoaders.value);
  const itemsBitacoraLinealGetter = computed(() => itemsBitacoraLineal.value);
  const itemsBitacoraGetter = computed(() => itemsBitacora.value);
  const itemsHouseContainersGetter = computed(() => itemsHouseContainers.value);
  const itemsComentariosPredefinidosGetter = computed(() => itemsComentariosPredefinidos.value);

  function _setColoaders(dataColoaders: FilaRaiz[]): void {
    itemsColoaders.value = dataColoaders;
  }

  function _setBitacoraLineal(data: BitacoraLinealHouse[]): void {
    itemsBitacoraLineal.value = data;
  }

  function _setItemsBitacora(data: RegistroBitacoraRaiz[]): void {
    itemsBitacora.value = data;
  }

  function _setItemsHouseContainers(data: FilaConIdRaiz[] | null): void {
    itemsHouseContainers.value = data;
  }

  function _setItemsComentariosPredefinidos(data: ComentarioEstadoHouse[]): void {
    itemsComentariosPredefinidos.value = data;
  }

  async function _getColoaders(): Promise<void> {
    const data = JSON.stringify({
      id_role: 17,
      id_branch: sessionBranchId(),
    });
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getEntitiesList",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<FilaRaiz[]>>(config)
      .then(function (response) {
        _setColoaders(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getBitacoraLineal(data: FilaRaiz): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getBitacoraLineal",
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios<ApiResponse<BitacoraLinealHouse[]>>(config)
      .then(function (response) {
        _setBitacoraLineal(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getHouseBitacora(): Promise<void> {
    const appStore = useAppStore();
    const data = {
      id: appStore.house_Id_get,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getHouseBitacora",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios<ApiResponse<RegistroBitacoraRaiz[]>>(config)
      .then(function (response) {
        _setItemsBitacora(response.data.estadoflag ? response.data.data : []);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getHouseContainers(data: FilaRaiz): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "getHouseContainers",
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    };
    await axios<ApiResponse<FilaConIdRaiz[] | null>>(config)
      .then(function (response) {
        _setItemsHouseContainers(response.data.data);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function _getComentariosPredefinidos(): Promise<void> {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `getComentariosPredefinidos?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<ComentarioEstadoHouse[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);
        if (response.data.estadoflag) {
          _setItemsComentariosPredefinidos(response.data.data);
        } else {
          _setItemsComentariosPredefinidos([]);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  return {
    listHouse,
    house,
    lstFacturasFiscales,
    verHouse,
    setConfirmarTelex,
    guardarCarpetaHouse,
    listarHouse,
    getCargarHouse,
    insertComentarioHouse,
    deleteHouse,
    getFacturasFiscales,
    copy_house,
    modalServices_manualMode,
    itemsColoaders,
    itemsBitacoraLineal,
    itemsBitacora,
    itemsHouseContainers,
    itemsComentariosPredefinidos,
    house_id_trasnport,
    house_sentido,
    house_incoterms,
    house_origen,
    telexconfirmado,
    fechaconfirmaciontelex,
    house_destino,
    house_id_containers,
    house_cantidad,
    house_id,
    house_id_agente,
    house_id_consigner_real,
    house_id_notify,
    house_id_airlines,
    house_id_coloader,
    house_id_naviera,
    house_id_motonave,
    house_viaje,
    house_bultos,
    house_peso,
    house_volumen,
    house_id_condicion,
    house_id_coins,
    house_blmaster,
    url_onedrive,
    house_master,
    house_master_expediente,
    house_nro_declaracion_aduana,
    house_canal_aduana,
    house_filtrarData,
    house_filtro,
    dataHouse_transporte,
    bitacora_id_bitacora,
    bitacora_comentario_predefinido,
    bitacora_comentario,
    bitacora_comentario_flag,
    bitacora_fecha,
    bitacora_visible_cliente,
    house_enlace_tracking,
    house_monto,
    house_cotizacion,
    house_id_vendedor,
    house_id_pricing,
    house_nro_containers,
    house_nro_precinto,
    id_master,
    house_cotizacionaduana,
    itemsColoadersGetter,
    itemsBitacoraLinealGetter,
    itemsBitacoraGetter,
    itemsHouseContainersGetter,
    itemsComentariosPredefinidosGetter,
    _setColoaders,
    _setBitacoraLineal,
    _setItemsBitacora,
    _setItemsHouseContainers,
    _setItemsComentariosPredefinidos,
    _getColoaders,
    _getBitacoraLineal,
    _getHouseBitacora,
    _getHouseContainers,
    _getComentariosPredefinidos,
  };
});
