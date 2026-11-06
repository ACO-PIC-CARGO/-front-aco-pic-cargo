<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import dataGen from "./DataGen.vue";
//import houselist from "./houselist.vue";
import dataEmbar from "./DataEmbar.vue";
import Bitacora from "./BitacoraHouse.vue";
import services from "./ServicesHouse.vue";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
import { useHousesStore } from "@/stores/houses";
import type { ApiResponse } from "@/types/api";
import type { ServicioHouse } from "@/types/operaciones";
import HouseArrivalNoticeDialog from "@/components/HouseFile/HouseArrivalNoticeDialog.vue";
import { sessionBranchId } from "@/utils/sesion";
import { useBankStore } from "@/stores/bank";
import { usePermissions } from "@/composables/usePermissions";
import type { HouseCopiaRaiz } from "@/types/app";

//houselist,

const appStore = useAppStore();
const bankStore = useBankStore();
const route = useRoute();
const appRouter = useRouter();
const housesStore = useHousesStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const { can } = usePermissions();
const itemsModality = computed(() => appStore.itemsModality);
const itemsShipment = computed(() => appStore.itemsShipment);

const fab = ref(false);
const transition = "slide-y-reverse-transition";
const SAVE_ERROR = "No pudimos guardar los cambios del house. Revisa tu conexión e intenta de nuevo.";
const noticeDialog = ref(false);
const statusData = ref(false);
const formControlHouseReadonly = ref(false);
const displayMenuNotificaciones = ref(false);
const loadingBotonGuardarHouse = ref(false);
const loadingBotonEliminarHouse = ref(false);
const loadingBotonTracking = ref(false);
const dialogFormato = ref(false);
const formatoflag = ref(true);

function getValidationIcon(error: string): string {
  if (error === "Proveedor" || error === "Operador") return "mdi-truck";
  if (error.includes("correo")) return "mdi-email";
  if (error === "Fecha ETD" || error === "Fecha ETA") return "mdi-calendar-month";
  if (error === "Monto") return "mdi-currency-usd";
  if (error === "Peso") return "mdi-weight-kilogram";
  if (error === "Volumen" || error === "Nº de bultos") return "mdi-package-variant";
  if (error.includes("Puerto")) return "mdi-map-marker";
  if (error === "Tipo de Embarque") return "mdi-ferry";
  if (error === "Sentido") return "mdi-swap-horizontal";
  if (error === "Cliente") return "mdi-account";
  return "mdi-alert-circle";
}

//eslint-disable-next-line @typescript-eslint/no-unused-vars
const isBotonTrackingDisabled = computed(() => {
  return housesStore.house_enlace_tracking !== "" &&
    housesStore.house_enlace_tracking !== null
    ? true
    : formControlHouseReadonly.value;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTipoDocumento() {
  return isAereo() ? "GUÍA AÉREA" : "BL";
}
function abrirModalFormato() {
  dialogFormato.value = true;
}
async function exportarFormatoAWB() {
  try {
    const response = await axios({
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}generar_formato_awb`,
      params: {
        id_house: route.params.id,
        formatoflag: formatoflag.value,
      },
      headers: {},
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `formato_awb_${timestamp}.xlsx`;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Error exportando archivo:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo generar el formato",
    });
  }
  dialogFormato.value = false;
}
async function exportarFormatoHBL() {
  try {
    const response = await axios({
      method: "get",
      url: `${import.meta.env.VITE_URL_MAIN}generar_formato_bl`,
      params: {
        id_house: route.params.id,
        formatoflag: formatoflag.value,
      },
      headers: {},
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `formato_bl_${timestamp}.xlsx`;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Error exportando archivo:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo generar el formato",
    });
  }
  dialogFormato.value = false;
}
async function _generateTrackingToken() {
  const token = uuidv4();

  loadingBotonTracking.value = !loadingBotonTracking.value;
  await _setTrackingToken(token);
  loadingBotonTracking.value = !loadingBotonTracking.value;
}
async function _setTrackingToken(token: string) {
  const data = {
    id_house: route.params.id,
    token: token,
    fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
  };

  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + `setTrackingToken`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios<ApiResponse<{ token: string }[]>>(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      if (response.data.estadoflag) {
        housesStore.house_enlace_tracking =
          "https://aco.agentedecargaonline.com/tracking/" +
          response.data.data[0]!.token;

        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Enlace de tracking generado correctamente",
        });
      } else {
        Swal.fire({
          icon: response.data.status == "401" ? "error" : "info",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal) => {
          if (resSwal.isConfirmed && response.data.status == "401") {
            // @ts-expect-error router is not defined in this scope
            router.push({ name: "Login" });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }
        });
      }
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo generar el enlace de tracking",
      });
    });
}
async function _copyEnlaceTracking(texto: string) {
  await navigator.clipboard.writeText(texto);
  Swal.fire({
    icon: "success",
    title: "Copiado",
    text: "Enlace copiado al portapapeles",
    timer: 1500,
    showConfirmButton: false,
  });
}
function irAVerMaster() {
  appRouter.push({
    name: "controlHouseEditar",
    // @ts-expect-error id is not a known route location property
    id: route.params.id,
  });
}
async function _setHouseEdit() {
  if (
    !appStore.house_id_consigner ||
    !appStore.itemsProveedorRolShipper
  ) {
    Swal.fire({
      icon: "error",
      title: "Lo sentimos",
      text: "Por favor, asigne un Cliente y Proveedor para poder continuar con el proceso.",
    });
    return;
  }

  loadingBotonGuardarHouse.value = true;

  const lstservices = (appStore.itemsHouseServices || []).map(
    (item: ServicioHouse) => ({
      id: item.id || null,
      id_begend: item.id_begend || null,
      nameservice: item.nameservice || null,
      status: item.status ? 1 : 0,
      date_service: item.date_service || null,
    }),
  );

  const data = JSON.stringify({
    id_modality: housesStore.house_sentido
      ? housesStore.house_sentido
      : "",
    id_shipment: housesStore.house_id_trasnport
      ? housesStore.house_id_trasnport
      : "",
    id_consigner_real: housesStore.house_id_consigner_real
      ? housesStore.house_id_consigner_real
      : "",
    id_port_begin: housesStore.house_origen
      ? housesStore.house_origen
      : "",
    id_port_end: housesStore.house_destino
      ? housesStore.house_destino
      : "",
    id_proveedor: housesStore.house_id_agente
      ? housesStore.house_id_agente
      : "",
    id_consigner: appStore.house_id_consigner
      ? appStore.house_id_consigner
      : "",
    id_notify: housesStore.house_id_notify
      ? housesStore.house_id_notify
      : "",
    id_aerolinea: housesStore.house_id_airlines
      ? housesStore.house_id_airlines
      : "",
    id_coloader: housesStore.house_id_coloader
      ? housesStore.house_id_coloader
      : "",
    id_naviera: housesStore.house_id_naviera
      ? housesStore.house_id_naviera
      : "",
    id_incoterms: housesStore.house_incoterms
      ? housesStore.house_incoterms
      : "",
    nro_hbl: housesStore.house_blmaster
      ? housesStore.house_blmaster
      : "",
    id_motonave: housesStore.house_id_motonave
      ? housesStore.house_id_motonave
      : "",
    nro_viaje: housesStore.house_viaje
      ? housesStore.house_viaje
      : "",
    bultos: housesStore.house_bultos
      ? housesStore.house_bultos
      : "",
    peso: housesStore.house_peso ? housesStore.house_peso : "",
    volumen: housesStore.house_volumen
      ? housesStore.house_volumen
      : "",
    id_conditions: housesStore.house_id_condicion
      ? housesStore.house_id_condicion
      : "",
    id_moneda: housesStore.house_id_coins
      ? housesStore.house_id_coins
      : "",
    monto: housesStore.house_monto ? housesStore.house_monto : "",
    id_branch: sessionBranchId(),
    id_cot: housesStore.house_cotizacion
      ? housesStore.house_cotizacion
      : "",
    lstservices,
    id: housesStore.house_id,
    nro_declaracion_aduana:
      housesStore.house_nro_declaracion_aduana || "",
    canal_aduana: housesStore.house_canal_aduana || "",
  });

  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "setHouseEdit",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios(config);
    if (!response.data.estadoflag) {
      Swal.fire({ icon: "warning", text: response.data.mensaje || SAVE_ERROR });
      return;
    }

    statusData.value = true;

    if (!housesStore.url_onedrive && ["1", "2", 1, 2].includes(sessionBranchId())) {
      await housesStore.guardarCarpetaHouse({ id: housesStore.house_master });
    }

    loadingBotonGuardarHouse.value = false;
    await Swal.fire({
      icon: "success",
      title: "Excelente",
      text: "House actualizado éxitosamente",
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then(() => {
      appRouter.go(0); // Recarga la página para reflejar los cambios
    });
    // Refresh data in background (non-blocking)
  } catch (error) {
    console.error(error);
    Swal.fire({ icon: "error", text: SAVE_ERROR });
  } finally {
    loadingBotonGuardarHouse.value = false;
  }
}
function abrirCarpeta() {
  if (housesStore.url_onedrive) {
    window.open(housesStore.url_onedrive as string, "_blank");
  } else {
    Swal.fire({
      icon: "info",
      title: "Sin carpeta asignada",
      text: "No se ha asignado una carpeta de OneDrive para este expediente.",
    });
  }
}
function eliminarHouse() {
  // if (vm.$store.state.copy_house.cantidad_houses_x_master > 1) {
  Swal.fire({
    icon: "question",
    title: "ADVERTENCIA",
    text: "¿Está seguro que desea eliminar el house?",
    showDenyButton: true,
    confirmButtonText: "Si",
    denyButtonText: "No",
  }).then(async (result) => {
    if (result.isConfirmed) {
      loadingBotonEliminarHouse.value = true;
      await housesStore.deleteHouse({ id: route.params.id });
      loadingBotonEliminarHouse.value = false;
    }
  });
  // } else {
  //   Swal.fire({
  //     icon: "info",
  //     text: "Un expediente máster debe tener al menos un house asignado",
  //   });
  // }
}
function isImportacion() {
  let val = false;
  const id = housesStore.house_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number; name: string }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number; name: string }) => v.id == id)[0]!.name
      : "";

  if (name == "Importación") {
    val = true;
  }

  return val;
}
function isExportacion() {
  let val = false;
  const id = housesStore.house_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number; name: string }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number; name: string }) => v.id == id)[0]!.name
      : "";

  if (name == "Exportación") {
    val = true;
  }

  return val;
}
function isAereo() {
  let val = false;
  const id = housesStore.house_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id)[0]!.code
      : "";

  if (code == "Aéreo") {
    val = true;
  }

  return val;
}
function isLCL() {
  let val = false;
  const id = housesStore.house_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id)[0]!.code
      : "";

  if (code == "LCL") {
    val = true;
  }

  return val;
}
function isFCL() {
  let val = false;
  const id = housesStore.house_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id)[0]!.code
      : "";

  if (code == "FCL") {
    val = true;
  }
  return val;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getSentidoHouse() {
  return isImportacion()
    ? "Import"
    : isExportacion()
    ? "Export"
    : "";
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTipoEmbarqueHouse() {
  return isAereo()
    ? "Aéreo"
    : isLCL()
    ? "LCL"
    : isFCL()
    ? "FCL"
    : "";
}
async function validarMenuNotificaciones() {
  console.log(bankStore.$state);

  if (bankStore.list.length == 0) {
    Swal.fire({
      icon: "warning",
      title: "Cuentas Bancarias",
      text: "Para poder enviar la notificación. Es necesario al menos una cuenta bancaría",
    });
    return false;
  } else {
    if (
      !bankStore.list.some((v) => v.banks_details!.length > 0)
    ) {
      Swal.fire({
        icon: "warning",
        title: "Cuentas Bancarias",
        text: "Para poder enviar la notificación. Es necesario al menos una cuenta bancaría.",
      });
      return false;
    }
  }
  displayMenuNotificaciones.value = false;

  const errores = [];
  if (!housesStore.copy_house.id_modality) {
    errores.push("Sentido");
  }
  if (!housesStore.copy_house.id_shipment) {
    errores.push("Tipo de Embarque");
  }
  if (!housesStore.copy_house.id_port_begin) {
    errores.push("Puerto de Origen");
  }
  if (!housesStore.copy_house.id_port_end) {
    errores.push("Puerto de Destino");
  }
  if (!housesStore.copy_house.id_proveedor) {
    errores.push("Proveedor");
  }
  if (!housesStore.copy_house.id_consigner) {
    errores.push("Cliente");
  }
  if (!housesStore.copy_house.emailaddress_clientefinal) {
    errores.push("El cliente debe tener asignado un correo electrónico");
  }
  if (!housesStore.copy_house.id_operador) {
    errores.push("Operador");
  }
  if (!housesStore.copy_house.fecha_etd) {
    errores.push("Fecha ETD");
  }
  if (!housesStore.copy_house.fecha_eta) {
    errores.push("Fecha ETA");
  }
  if (
    !itemsShipment.value.filter(
      (v: { id: number; code: string }) =>
        v.id == housesStore.copy_house.id_shipment && v.code == "FCL",
    ).length
  ) {
    if (!housesStore.copy_house.bultos) {
      errores.push("Nº de bultos");
    }
    if (!housesStore.copy_house.peso) {
      errores.push("Peso");
    }
    if (!housesStore.copy_house.volumen) {
      errores.push("Volumen");
    }
  }
  if (!housesStore.copy_house.monto) {
    errores.push("Monto");
  }

  if (!errores.length) {
    displayMenuNotificaciones.value = true;
  } else {
    Swal.fire({
      icon: "warning",
      title: "Completa los datos del House",
      html: `
        <p>Para habilitar el menú de notificaciones, completa los siguientes campos:</p>
        <ul class="house-validation-list">
          ${errores.map((error) => `
            <li>
              <span class="house-validation-item-icon"><i class="mdi ${getValidationIcon(error)}" aria-hidden="true"></i></span>
              <span class="house-validation-item-label">${error}</span>
            </li>
          `).join("")}
        </ul>
      `,
      confirmButtonText: '<i class="mdi mdi-check-circle" aria-hidden="true"></i><span>Entendido</span>',
      showCloseButton: true,
      customClass: {
        container: "house-validation-container",
        popup: "house-validation-popup",
        title: "house-validation-title",
        icon: "house-validation-icon",
        closeButton: "house-validation-close",
        htmlContainer: "house-validation-content",
        confirmButton: "house-validation-confirm",
      },
    });
  }
}
async function openNotificaciones() {
  await validarMenuNotificaciones();
  noticeDialog.value = displayMenuNotificaciones.value;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _getHouseById() {
  const data = {
    id: route.params.id,
    id_branch: sessionBranchId(),
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getHouseListId/",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios<ApiResponse<HouseCopiaRaiz[]>>(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      housesStore.copy_house =
        response.data.data && response.data.data[0]!;
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _getHouseServices() {
  if (route.params.id) {
    const data = {
      id: route.params.id,
      id_branch: sessionBranchId(),
    };

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getHouseServices",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios<ApiResponse<ServicioHouse[]>>(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token!);

        if (response.data.estadoflag) {
          const lstServices: ServicioHouse[] = [];
          let itemImpuestos = null as ServicioHouse | null;
          response.data.data.map((item) => {
            if (item.nameservice!.toUpperCase() == "IMPUESTOS") {
              itemImpuestos = item;
            } else {
              lstServices.push(item);
            }
          });

          if (itemImpuestos !== null) {
            lstServices.push(itemImpuestos);
          }

          appStore.itemsHouseServices = lstServices;
        } else {
          appStore.itemsHouseServices = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
watch(() => appStore.modalEntitie, (val) => {
  console.log("modalEntitie", appStore.modalEntitie);
  console.log("val", val);
});
watch(() => housesStore.house, (val) => {
  if (val && (val.nro_hbl || val.consigner)) {
    const actionLabel =
      route.name == "controlHouseVer" ? "VER" : "EDITAR";
    appStore.mainTitle = `N° BL House ${val.nro_hbl || ""} - ${
      val.consigner || ""
    } [${actionLabel}]`;
  }
});
watch(() => housesStore.copy_house, (val) => {
  if (
    val &&
    (val.nro_hbl ||
      val.consigner ||
      val.consigner_name ||
      val.namelong ||
      val.cliente)
  ) {
    const actionLabel =
      route.name == "controlHouseVer" ? "VER" : "EDITAR";
    appStore.mainTitle = `N° BL House ${val.nro_hbl || ""} - ${
      val.consigner ||
      val.consigner_name ||
      val.namelong ||
      val.cliente ||
      ""
    } [${actionLabel}]`;
  }
});

if (
  (route.name == "controlHouseEditar" ||
    route.name == "controlHouseVer") &&
  route.params.id
) {
  appStore.spiner = true;
  try {
    if (typeof housesStore.verHouse === "function") {
      // await this.verHouse(this.$route.params);
    }
  } catch {}

  const houseView =
    (housesStore && housesStore.house) || null;
  if (houseView && (houseView.nro_hbl || houseView.consigner)) {
    const actionLabel =
      route.name == "controlHouseVer" ? "VER" : "EDITAR";
    appStore.mainTitle = `N° BL House ${
      (houseView && houseView.nro_hbl) || ""
    } - ${(houseView && houseView.consigner) || ""} [${actionLabel}]`;
  } else {
    // await this._getHouseById();
    const actionLabel =
      route.name == "controlHouseVer" ? "VER" : "EDITAR";
    appStore.mainTitle = `N° BL House ${
      (housesStore.copy_house &&
        housesStore.copy_house.nro_hbl) ||
      ""
    } - ${
      housesStore.copy_house &&
      (housesStore.copy_house.consigner ||
        housesStore.copy_house.consigner_name ||
        housesStore.copy_house.namelong ||
        housesStore.copy_house.cliente ||
        "")
    } [${actionLabel}]`;
  }

  if (route.name == "controlHouseVer") {
    formControlHouseReadonly.value = true;
  }
  appStore.spiner = false;
}
onMounted(async () => {
  if (route.name == "controlHouse") {
    appStore.mainTitle = "CONTROL DE EXPEDIENTE HOUSE";
  } else if (
    (route.name == "controlHouseEditar" ||
      route.name == "controlHouseVer") &&
    route.params.id
  ) {
    appStore.spiner = true;
    try {
      if (typeof housesStore.verHouse === "function") {
        // await this.verHouse(this.$route.params);
      }
    } catch {}

    const houseView =
      (housesStore && housesStore.house) || null;
    if (houseView && (houseView.nro_hbl || houseView.consigner)) {
      const actionLabel =
        route.name == "controlHouseVer" ? "VER" : "EDITAR";
      appStore.mainTitle = `N° BL House ${
        (houseView && houseView.nro_hbl) || ""
      } - ${(houseView && houseView.consigner) || ""} [${actionLabel}]`;
    } else {
      // await this._getHouseById();
      const actionLabel =
        route.name == "controlHouseVer" ? "VER" : "EDITAR";
      appStore.mainTitle = `N° BL House ${
        (housesStore.copy_house &&
          housesStore.copy_house.nro_hbl) ||
        ""
      } - ${
        housesStore.copy_house &&
        (housesStore.copy_house.consigner ||
          housesStore.copy_house.consigner_name ||
          housesStore.copy_house.namelong ||
          housesStore.copy_house.cliente ||
          "")
      } [${actionLabel}]`;
    }

    if (route.name == "controlHouseVer") {
      formControlHouseReadonly.value = true;
    }
    appStore.spiner = false;
  }

  //this._getnroHouse();
  const idHouse = route.params.id;
  const idModality = housesStore.house.id_modality;
  if (idHouse && idModality !== undefined && idModality !== null) {
    await housesStore.getListadoNotificacionesHouse({
      id_house: idHouse,
      id_modality: idModality,
    });
  }

  Promise.all([
    appStore._getModality(),
    appStore._getShipment(),
    pricingStore.getCargarEjecutivo(),
    appStore.getListBanksDetailsCargarPorSucursal(),
    aduanaStore.cargarListadoQuoteAduana(),
    bankStore.fetchDataBank({
      code: "",
      name: "",
      acronym: "",
      description: "",
      status: 1,
    }),
  ]);
});
</script>

<template>
  <v-form
    ref="formControlHouse"
    :readonly="formControlHouseReadonly"
  >
    <v-container fluid>
      <v-row>
        <v-col
          cols="12"
          md="4"
        >
          <v-card>
            <v-card-text>
              <dataGen />
            </v-card-text>
          </v-card>
          <v-card class="mt-3">
            <v-card-text>
              <dataEmbar :is-form-actions-disabled="formControlHouseReadonly || !can('listHouse', 'MODIFICAR')" />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-card>
            <v-card-text>
              <services :is-form-actions-disabled="formControlHouseReadonly || !can('listHouse', 'MODIFICAR')" />
            </v-card-text>
          </v-card>

          <v-card
            class="mt-3 pa-3"
            v-if="false"
          >
            <v-card-title class="py-1">
              Accioness
            </v-card-title>
            <div class="d-flex align-center">
              <v-speed-dial
                v-model="fab"
                location="top"
                :transition="transition"
                content-class="acciones-dial"
              >
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    color="indigo"
                    icon
                    size="small"
                  >
                    <v-icon v-if="!fab">
                      mdi-cog
                    </v-icon>
                    <v-icon v-else>
                      mdi-close
                    </v-icon>
                  </v-btn>
                </template>

                <v-btn
                  key="eliminar"
                  v-if="$route.name != 'controlHouseVer'"
                  size="small"
                  color="red"
                  :loading="loadingBotonEliminarHouse"
                  :disabled="formControlHouseReadonly"
                  @click="eliminarHouse()"
                >
                  <v-icon
                    size="small"
                    start
                  >
                    mdi-delete
                  </v-icon>
                  Eliminar
                </v-btn>

                <!-- GENERAR TRACKING (siempre visible, no deshabilitar) -->
                <v-btn
                  key="tracking"
                  size="small"
                  color="orange-darken-2"
                  :loading="loadingBotonTracking"
                  @click="_generateTrackingToken"
                >
                  <v-icon
                    size="small"
                    start
                  >
                    mdi-link-variant
                  </v-icon>
                  Tracking
                </v-btn>

                <!-- IMPRIMIR -->
                <v-btn
                  key="imprimir"
                  size="small"
                  color="primary"
                  @click="abrirModalFormato()"
                >
                  <v-icon
                    size="small"
                    start
                  >
                    mdi-printer
                  </v-icon>
                  Imprimir
                </v-btn>

                <!-- NOTIFICACIONES -->
                <v-btn
                  key="notificaciones"
                  size="small"
                  color="deep-purple"
                  :disabled="formControlHouseReadonly"
                  @click="openNotificaciones"
                >
                  <v-icon
                    size="small"
                    start
                    style="transform: rotate(-45deg)"
                  >
                    mdi-send
                  </v-icon>
                  Notificaciones
                </v-btn>

                <!-- GUARDAR / EDITAR (queda más cerca del activador, o sea abajo visualmente con direction='top') -->
                <v-btn
                  key="guardar"
                  v-if="$route.name != 'controlHouseVer'"
                  size="small"
                  color="success"
                  :loading="loadingBotonGuardarHouse"
                  :disabled="formControlHouseReadonly"
                  @click="_setHouseEdit()"
                >
                  <v-icon
                    size="small"
                    start
                  >
                    mdi-content-save
                  </v-icon>
                  Guardar
                </v-btn>
                <v-btn
                  key="editar"
                  v-else
                  size="small"
                  color="info"
                  @click="irAVerMaster()"
                >
                  <v-icon
                    size="small"
                    start
                  >
                    mdi-pencil
                  </v-icon>
                  Editar
                </v-btn>
              </v-speed-dial>
            </div>

            <!-- @vue-expect-error vue-tsc reads the store as a ref inside this dead v-if block -->
            <v-text-field
              v-if="housesStore.house_enlace_tracking"
              v-model="housesStore.house_enlace_tracking"
              label="Enlace de Tracking"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              class="mt-3"
            >
              <template #append-inner>
                <!-- @vue-expect-error vue-tsc reads the store as a ref inside this dead v-if block -->
                <v-btn
                  variant="text"
                  icon
                  size="small"
                  color="primary"
                  @click="
                    _copyEnlaceTracking(housesStore.house_enlace_tracking)
                  "
                >
                  <v-icon size="small">
                    mdi-content-copy
                  </v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-card>
            <v-card-text>
              <Bitacora :is-form-actions-disabled="formControlHouseReadonly" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <div style="position: fixed; bottom: 16px; right: 16px; z-index: 3000">
        <v-fab-transition v-if="formControlHouseReadonly && can('listHouse', 'MODIFICAR')">
          <v-btn
            icon
            size="large"
            location="bottom left"
            
            color="info"
            @click="irAVerMaster()"
          >
            <v-icon> mdi-pencil </v-icon>
          </v-btn>
        </v-fab-transition>
        <v-speed-dial
          v-else-if="!formControlHouseReadonly"
          v-model="fab"
          location="top end"
          :transition="transition"
          content-class="acciones-dial"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="info"
              icon
              aria-label="Acciones"
            >
              <v-icon v-if="fab">
                mdi-close
              </v-icon>
              <v-icon v-else>
                mdi-tools
              </v-icon>
            </v-btn>
          </template>

          <v-btn
            v-if="can('listHouse', 'ELIMINAR')"
            key="eliminar"
            color="red"
            :loading="loadingBotonEliminarHouse"
            @click="eliminarHouse()"
          >
            <v-icon start>
              mdi-delete
            </v-icon>
            Eliminar
          </v-btn>
          <v-btn
            key="tracking"
            color="orange-darken-2"
            :loading="loadingBotonTracking"
            @click="_generateTrackingToken"
          >
            <v-icon start>
              mdi-link-variant
            </v-icon>
            Tracking
          </v-btn>
          <v-btn
            v-if="can('listHouse', 'EXPORTAR')"
            key="imprimir"
            :style="{ backgroundColor: 'rgb(92, 116, 137)', color: 'white' }"
            @click="abrirModalFormato()"
          >
            <v-icon
              start
              style="color: white"
            >
              mdi-printer
            </v-icon>
            Imprimir
          </v-btn>
          <v-btn
            key="carpeta"
            size="small"
            color="primary"
            @click="abrirCarpeta"
          >
            <v-icon
              size="small"
              start
            >
              mdi-folder-open
            </v-icon>
            Carpeta
          </v-btn>
          <v-btn
            v-if="can('listHouse', 'MODIFICAR')"
            key="notificaciones"
            color="deep-purple"
            @click="openNotificaciones"
          >
            <v-icon
              start
              style="transform: rotate(-45deg)"
            >
              mdi-send
            </v-icon>
            Notificaciones
          </v-btn>
          <v-btn
            v-if="can('listHouse', 'MODIFICAR')"
            key="guardar"
            color="light-green-lighten-1"
            @click="_setHouseEdit()"
          >
            <v-icon start>
              mdi-content-save
            </v-icon>
            Guardar
          </v-btn>
        </v-speed-dial>
      </div>
      <div
        v-if="housesStore.house_enlace_tracking"
        style="
          position: fixed;
          right: 88px;
          bottom: 16px;
          z-index: 3500;
          max-width: 420px;
          width: calc(100vw - 120px);
        "
      >
        <v-text-field
          v-model="housesStore.house_enlace_tracking"
          label="Enlace de Tracking"
          readonly
          variant="outlined"
          density="compact"
          hide-details
        >
          <template #append-inner>
            <v-btn
              variant="text"
              icon
              size="small"
              color="primary"
              @click="_copyEnlaceTracking(housesStore.house_enlace_tracking)"
            >
              <v-icon size="small">
                mdi-content-copy
              </v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-container>

    <!-- Botones flotantes removidos - ahora en sección de Acciones -->

    <!-- Modal para seleccionar formato de impresión -->
    <v-dialog
      v-model="dialogFormato"
      max-width="400px"
    >
      <v-card>
        <v-card-title
          primary-title
          class="bg-light-blue-darken-2 text-white"
        >
          Imprimir Formato {{ isAereo() ? "GUÍA AÉREA" : "BL" }}
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-large mb-2">
            ¿Imprimir con fondo?
          </p>
          <v-radio-group v-model="formatoflag">
            <v-radio
              label="Sí"
              :value="true"
            />
            <v-radio
              label="No"
              :value="false"
            />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            v-if="isAereo()"
            @click="exportarFormatoAWB()"
          >
            <v-icon start>
              mdi-printer
            </v-icon>
            Imprimir Guía Aérea
          </v-btn>
          <v-btn
            color="success"
            v-else
            @click="exportarFormatoHBL()"
          >
            <v-icon start>
              mdi-printer
            </v-icon>
            Imprimir BL
          </v-btn>
          <v-btn
            color="grey"
            variant="text"
            @click="dialogFormato = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <HouseArrivalNoticeDialog
      v-model="noticeDialog"
      :house-id="Number(housesStore.house_id)"
      :modality="itemsModality.find((item: { id: number; name: string }) => item.id == housesStore.house_sentido)?.name"
    />

    <v-dialog
      v-model="loadingBotonGuardarHouse"
      persistent
      max-width="320"
    >
      <v-card
        class="pa-6 d-flex align-center justify-center"
        elevation="2"
      >
        <div class="text-center">
          <v-progress-circular
            color="primary"
            indeterminate
            size="48"
          />
          <div class="text-body-large mt-4">
            Guardando cambios...
          </div>
        </div>
      </v-card>
    </v-dialog>
  </v-form>
</template>

<style lang="scss" scoped>
._content__bitacora {
  height: 90vh;
  overflow-y: scroll;
  --scrollbar-width: none !important;
}

.div__button_bottom {
  text-decoration: none;
  text-align: center;
  margin-right: 20px;
  display: block;
}

.title_button_bottom {
  text-decoration: none;
  color: #252c32;
}

:global(.acciones-dial.v-speed-dial__content) {
  flex-direction: column-reverse;
  align-items: flex-end;
}

:global(.house-validation-container.swal2-backdrop-show) {
  backdrop-filter: blur(3px);
  background: rgba(15, 35, 61, 0.56);
}

:global(.house-validation-popup.swal2-popup) {
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(13, 43, 82, 0.24);
  overflow: hidden;
  padding: 0 2.25rem 1.6rem;
  position: relative;
}

:global(.house-validation-popup.swal2-popup::before) {
  background: linear-gradient(125deg, #70c4ff 0%, #cbe8ff 55%, #f5faff 100%);
  clip-path: ellipse(86% 100% at 50% 0%);
  content: "";
  height: 145px;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

:global(.house-validation-title.swal2-title) {
  color: #14365e;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  padding: 0;
}

:global(.house-validation-content.swal2-html-container) {
  color: #536780;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0.75rem 0 0;
}

:global(.house-validation-content .house-validation-list) {
  border-bottom: 1px solid #e2eaf5;
  display: grid;
  gap: 0.3rem;
  list-style: none;
  margin: 1rem 0 0;
  padding: 0 0 0.85rem;
  text-align: left;
}

:global(.house-validation-content .house-validation-list li) {
  align-items: flex-start;
  background: rgba(232, 241, 253, 0.56);
  border: 1px solid #dce8f8;
  border-radius: 12px;
  color: #234365;
  display: flex;
  gap: 0.85rem;
  min-height: 52px;
  padding: 0.55rem 0.75rem;
}

:global(.house-validation-content .house-validation-item-icon) {
  align-items: center;
  background: #dcecff;
  border-radius: 50%;
  color: #1471dc;
  display: inline-flex;
  flex: 0 0 36px;
  font-size: 1.25rem;
  height: 36px;
  justify-content: center;
}

:global(.house-validation-content .house-validation-item-label) {
  align-self: center;
  line-height: 1.3;
}

:global(.house-validation-icon.swal2-icon.swal2-warning) {
  background: #126bd5;
  border: 8px solid #fff;
  box-shadow: 0 4px 14px rgba(18, 107, 213, 0.24);
  color: #fff;
  height: 6rem;
  margin: 1rem auto 0.75rem;
  position: relative;
  width: 6rem;
  z-index: 1;
}

:global(.house-validation-icon .swal2-icon-content) {
  color: #fff;
  font-size: 3.5rem;
}

:global(.house-validation-close.swal2-close) {
  color: #33475e;
  font-size: 2rem;
  z-index: 1;
}

:global(.house-validation-confirm.swal2-styled) {
  align-items: center;
  background: #0969d8 !important;
  border-radius: 14px;
  box-shadow: 0 4px 10px rgba(9, 105, 216, 0.2);
  display: inline-flex;
  gap: 0.5rem;
  font-weight: 600;
  justify-content: center;
  min-width: 13rem;
  padding: 0.8rem 1.5rem;
}

:global(.house-validation-confirm.swal2-styled:hover) {
  background: #0759ba !important;
}

.acciones-dial .v-btn {
  min-width: 220px;
}
.acciones-dial .v-btn :deep(.v-btn__content) {
  justify-content: flex-start;
  width: 100%;
  font-size: 1.2rem;
  line-height: 1.4;
}
.acciones-dial .v-btn .v-icon {
  font-size: 22px !important;
  margin-right: 8px;
}
</style>
