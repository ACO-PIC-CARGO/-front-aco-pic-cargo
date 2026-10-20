<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
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
import type { CuentaBancariaPic, ItemNotificacion, ServicioHouse } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";
import { useBankStore } from "@/stores/bank";

//houselist,

const rootStore = useStore();
const bankStore = useBankStore();
const route = useRoute();
const appRouter = useRouter();
const housesStore = useHousesStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const itemsModality = computed(() => rootStore.state.itemsModality);
const itemsShipment = computed(() => rootStore.state.itemsShipment);

const fab = ref(false);
const transition = "slide-y-reverse-transition";
const selected = ref<CuentaBancariaPic[]>([]);
const errorCuentas = ref("");
const headers = [
  { key: "label", title: "Nombre" },
  { key: "cuenta", title: "Cuenta" },
  { key: "cci", title: "CCI" },
  { key: "symbol", title: "Moneda" },
];
const notificacion = ref<ItemNotificacion>(null as unknown as ItemNotificacion);
const abrirModalCuentasNotificacion = ref(false);
const statusData = ref(false);
const formControlHouseReadonly = ref(false);
const itemsNotificacionesImport: ItemNotificacion[] = [
  { title: "Aviso de Salida", value: 1 },
  { title: "Actualización de Salida", value: 2 },
  { title: "Pre-Aviso de Llegada", value: 3 },
  { title: "Aviso de Llegada", value: 4 },
  { title: "Actualización de Llegada", value: 5 },
];
const itemsNotificacionesExport: ItemNotificacion[] = [
  { title: "Aviso de Salida", value: 1 },
  { title: "Actualización de Salida", value: 2 },
  { title: "Aviso de Llegada", value: 3 },
];
const displayMenuNotificaciones = ref(false);
const openMenuNotificaciones = ref(false);
const loadingBotonNotificaciones = ref(false);
const loadingBotonGuardarHouse = ref(false);
const loadingBotonEliminarHouse = ref(false);
const loadingBotonTracking = ref(false);
const dialogFormato = ref(false);
const formatoflag = ref(true);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isBotonTrackingDisabled = computed(() => {
  return rootStore.state.house_enlace_tracking !== "" &&
    rootStore.state.house_enlace_tracking !== null
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
        rootStore.state.house_enlace_tracking =
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _setMasterContainer(id_master: number, id_containers: number, quantity: number) {
  //vm._getnroMaster();
  const data = JSON.stringify({
    id_master: id_master,
    id_containers: id_containers,
    quantity: quantity,
    status: 1,
  });

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setMasterContainers",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .then(function (response) {})
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: error,
      });
    });
}
async function _setHouseEdit() {
  if (
    !rootStore.state.house_id_consigner ||
    !rootStore.state.itemsProveedorRolShipper
  ) {
    Swal.fire({
      icon: "error",
      title: "Lo sentimos",
      text: "Por favor, asigne un Cliente y Proveedor para poder continuar con el proceso.",
    });
    return;
  }

  loadingBotonGuardarHouse.value = true;

  const lstservices = (rootStore.state.itemsHouseServices || []).map(
    (item: ServicioHouse) => ({
      id: item.id || null,
      id_begend: item.id_begend || null,
      nameservice: item.nameservice || null,
      status: item.status ? 1 : 0,
      date_service: item.date_service || null,
    }),
  );

  const data = JSON.stringify({
    id_modality: rootStore.state.house_sentido
      ? rootStore.state.house_sentido
      : "",
    id_shipment: rootStore.state.house_id_trasnport
      ? rootStore.state.house_id_trasnport
      : "",
    id_consigner_real: rootStore.state.house_id_consigner_real
      ? rootStore.state.house_id_consigner_real
      : "",
    id_port_begin: rootStore.state.house_origen
      ? rootStore.state.house_origen
      : "",
    id_port_end: rootStore.state.house_destino
      ? rootStore.state.house_destino
      : "",
    id_proveedor: rootStore.state.house_id_agente
      ? rootStore.state.house_id_agente
      : "",
    id_consigner: rootStore.state.house_id_consigner
      ? rootStore.state.house_id_consigner
      : "",
    id_notify: rootStore.state.house_id_notify
      ? rootStore.state.house_id_notify
      : "",
    id_aerolinea: rootStore.state.house_id_airlines
      ? rootStore.state.house_id_airlines
      : "",
    id_coloader: rootStore.state.house_id_coloader
      ? rootStore.state.house_id_coloader
      : "",
    id_naviera: rootStore.state.house_id_naviera
      ? rootStore.state.house_id_naviera
      : "",
    id_incoterms: rootStore.state.house_incoterms
      ? rootStore.state.house_incoterms
      : "",
    nro_hbl: rootStore.state.house_blmaster
      ? rootStore.state.house_blmaster
      : "",
    id_motonave: rootStore.state.house_id_motonave
      ? rootStore.state.house_id_motonave
      : "",
    nro_viaje: rootStore.state.house_viaje
      ? rootStore.state.house_viaje
      : "",
    bultos: rootStore.state.house_bultos
      ? rootStore.state.house_bultos
      : "",
    peso: rootStore.state.house_peso ? rootStore.state.house_peso : "",
    volumen: rootStore.state.house_volumen
      ? rootStore.state.house_volumen
      : "",
    id_conditions: rootStore.state.house_id_condicion
      ? rootStore.state.house_id_condicion
      : "",
    id_moneda: rootStore.state.house_id_coins
      ? rootStore.state.house_id_coins
      : "",
    monto: rootStore.state.house_monto ? rootStore.state.house_monto : "",
    id_branch: sessionBranchId(),
    id_cot: rootStore.state.house_cotizacion
      ? rootStore.state.house_cotizacion
      : "",
    lstservices,
    id: rootStore.state.house_id,
    nro_declaracion_aduana:
      rootStore.state.house_nro_declaracion_aduana || "",
    canal_aduana: rootStore.state.house_canal_aduana || "",
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
    sessionStorage.setItem("auth-token", response.data.token);

    if (response.data.status == "401") {
      loadingBotonGuardarHouse.value = false;
      Swal.fire({
        icon: "error",
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
      return;
    }

    statusData.value = true;

    console.log("url_onedrive:", rootStore.state.url_onedrive);
    if (!rootStore.state.url_onedrive) {
      const proveedor = rootStore.state.clientes.find(
        (v: { id: number }) => v.id == rootStore.state.house_id_consigner,
      );
      const id_branch = sessionBranchId();
      const id_branchs = ["1", "2", 1, 2];
      if (id_branchs.includes(id_branch)) {
        await housesStore.guardarCarpetaHouse({
          id: rootStore.state.house_master,
          nroMaster: `${rootStore.state.house_master_expediente}_${proveedor.namelong}`,
        });
      }
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
    loadingBotonGuardarHouse.value = false;
    Swal.fire({
      icon: "error",
      title: "Lo sentimos",
      text: error as string,
    });
  } finally {
    loadingBotonGuardarHouse.value = false;
  }
}
function abrirCarpeta() {
  if (rootStore.state.url_onedrive) {
    window.open(rootStore.state.url_onedrive, "_blank");
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
      loadingBotonEliminarHouse.value = !loadingBotonEliminarHouse.value;
      housesStore.deleteHouse({ id: route.params.id });
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
  const id = rootStore.state.house_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number; name: string }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number; name: string }) => v.id == id)[0].name
      : "";

  if (name == "Importación") {
    val = true;
  }

  return val;
}
function isExportacion() {
  let val = false;
  const id = rootStore.state.house_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number; name: string }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number; name: string }) => v.id == id)[0].name
      : "";

  if (name == "Exportación") {
    val = true;
  }

  return val;
}
function isAereo() {
  let val = false;
  const id = rootStore.state.house_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id)[0].code
      : "";

  if (code == "Aéreo") {
    val = true;
  }

  return val;
}
function isLCL() {
  let val = false;
  const id = rootStore.state.house_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id)[0].code
      : "";

  if (code == "LCL") {
    val = true;
  }

  return val;
}
function isFCL() {
  let val = false;
  const id = rootStore.state.house_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number; code: string }) => v.id == id)[0].code
      : "";

  if (code == "FCL") {
    val = true;
  }
  return val;
}
function getItemsNotificaciones() {
  return isImportacion()
    ? itemsNotificacionesImport
    : isExportacion()
    ? itemsNotificacionesExport
    : [];
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
  if (!rootStore.state.copy_house.id_modality) {
    errores.push("Sentido");
  }
  if (!rootStore.state.copy_house.id_shipment) {
    errores.push("Tipo de Embarque");
  }
  if (!rootStore.state.copy_house.id_port_begin) {
    errores.push("Puerto de Origen");
  }
  if (!rootStore.state.copy_house.id_port_end) {
    errores.push("Puerto de Destino");
  }
  if (!rootStore.state.copy_house.id_proveedor) {
    errores.push("Proveedor");
  }
  if (!rootStore.state.copy_house.id_consigner) {
    errores.push("Cliente");
  }
  if (!rootStore.state.copy_house.emailaddress_clientefinal) {
    errores.push("El cliente debe tener asignado un correo electrónico");
  }
  if (!rootStore.state.copy_house.id_operador) {
    errores.push("Operador");
  }
  if (!rootStore.state.copy_house.fecha_etd) {
    errores.push("Fecha ETD");
  }
  if (!rootStore.state.copy_house.fecha_eta) {
    errores.push("Fecha ETA");
  }
  if (
    !itemsShipment.value.filter(
      (v: { id: number; code: string }) =>
        v.id == rootStore.state.copy_house.id_shipment && v.code == "FCL",
    ).length
  ) {
    if (!rootStore.state.copy_house.bultos) {
      errores.push("Nº de bultos");
    }
    if (!rootStore.state.copy_house.peso) {
      errores.push("Peso");
    }
    if (!rootStore.state.copy_house.volumen) {
      errores.push("Volumen");
    }
  }
  if (!rootStore.state.copy_house.monto) {
    errores.push("Monto");
  }

  if (!errores.length) {
    displayMenuNotificaciones.value = true;
  } else {
    Swal.fire({
      icon: "error",
      html: `
            <b>¡El Expediente House requiere los siguientes datos para mostrar el menú de notificaciones!</b>
            <br><br>
            ${errores.map((error) => `<p>${error}</p>`).join("")}
          `,
    });
  }
}
function openNotificaciones() {
  validarMenuNotificaciones();
  openMenuNotificaciones.value = displayMenuNotificaciones.value;
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

  await axios<ApiResponse<unknown[]>>(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      rootStore.state.copy_house =
        response.data.data && response.data.data[0];
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

          rootStore.state.itemsHouseServices = lstServices;
        } else {
          rootStore.state.itemsHouseServices = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
function sendNotificacion(notificacionSeleccionada: ItemNotificacion) {
  selected.value = [];
  notificacion.value = notificacionSeleccionada;
  abrirModalCuentasNotificacion.value = true;
}
async function enviarNotificacion(notificacion: ItemNotificacion) {
  errorCuentas.value = "";
  if (selected.value.length == 0) {
    errorCuentas.value = "Es necesario al menos una cuenta";
    return false;
  }

  loadingBotonNotificaciones.value = !loadingBotonNotificaciones.value;

  // await vm._getHouseById();
  const data = {
    id: rootStore.state.house_id,
    notificacion: notificacion.title,
    cuentasBancarias: selected.value.map((item) => item.id).join(","),
    id_branch: sessionBranchId(),
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "sendNotificacionHouse",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  let html = "";
  await axios<ApiResponse<{ html: string }[]>>(config)
    .then(function (response) {
      // console.log(response)
      sessionStorage.setItem("auth-token", response.data.token!);
      html = response.data.data[0]!.html;
      console.log(html);
      if (response.data.status == "401") {
        Swal.fire({
          icon: "error",
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
      } else {
        abrirModalCuentasNotificacion.value = false;
        // vm.$swal({
        //   icon: "success",
        //   title: "Excelente",
        //   text: "Notificación enviada éxitosamente",
        // });
      }
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: error,
      });
    })
    .finally(async function () {
      const blob = new Blob([html], { type: "text/html" });
      const data = [new ClipboardItem({ ["text/html"]: blob })];
      await navigator.clipboard.write(data);
      alert(
        "Información de copiada. Al aceptar, se abrirá Proveedor de Corre. (Luego presiona Ctrl+V)",
      );
      const subject = `Notificación: ${notificacion.title} - House BL: ${
        rootStore.state.copy_house.nro_hbl
          ? rootStore.state.copy_house.nro_hbl
          : ""
      } EXPEDIENTE: ${
        // @ts-expect-error this is undefined inside this function
        this.$store.state.house_master_expediente
      }`;
      // 4. ABRIR EL MAIL: Solo ocurre DESPUÉS de cerrar el alert
      const body = encodeURIComponent("CONTROL + V (PEGA LA TABLA AQUÍ)");
      window.location.href = `mailto:${
        rootStore.state.copy_house.emailaddress_clientefinal
      }?subject=${encodeURIComponent(subject)}&body=${body}`;
      loadingBotonNotificaciones.value = !loadingBotonNotificaciones.value;
    });
}

watch(() => rootStore.state.modalEntitie, (val) => {
  console.log("modalEntitie", rootStore.state.modalEntitie);
  console.log("val", val);
});
watch(() => housesStore.house, (val) => {
  if (val && (val.nro_hbl || val.consigner)) {
    const actionLabel =
      route.name == "controlHouseVer" ? "VER" : "EDITAR";
    rootStore.state.mainTitle = `N° BL House ${val.nro_hbl || ""} - ${
      val.consigner || ""
    } [${actionLabel}]`;
  }
});
watch(() => rootStore.state.copy_house, (val) => {
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
    rootStore.state.mainTitle = `N° BL House ${val.nro_hbl || ""} - ${
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
  rootStore.state.spiner = true;
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
    rootStore.state.mainTitle = `N° BL House ${
      (houseView && houseView.nro_hbl) || ""
    } - ${(houseView && houseView.consigner) || ""} [${actionLabel}]`;
  } else {
    // await this._getHouseById();
    const actionLabel =
      route.name == "controlHouseVer" ? "VER" : "EDITAR";
    rootStore.state.mainTitle = `N° BL House ${
      (rootStore.state.copy_house &&
        rootStore.state.copy_house.nro_hbl) ||
      ""
    } - ${
      rootStore.state.copy_house &&
      (rootStore.state.copy_house.consigner ||
        rootStore.state.copy_house.consigner_name ||
        rootStore.state.copy_house.namelong ||
        rootStore.state.copy_house.cliente ||
        "")
    } [${actionLabel}]`;
  }

  if (route.name == "controlHouseVer") {
    formControlHouseReadonly.value = true;
  }
  rootStore.state.spiner = false;
}
onMounted(async () => {
  if (route.name == "controlHouse") {
    rootStore.state.mainTitle = "CONTROL DE EXPEDIENTE HOUSE";
  } else if (
    (route.name == "controlHouseEditar" ||
      route.name == "controlHouseVer") &&
    route.params.id
  ) {
    rootStore.state.spiner = true;
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
      rootStore.state.mainTitle = `N° BL House ${
        (houseView && houseView.nro_hbl) || ""
      } - ${(houseView && houseView.consigner) || ""} [${actionLabel}]`;
    } else {
      // await this._getHouseById();
      const actionLabel =
        route.name == "controlHouseVer" ? "VER" : "EDITAR";
      rootStore.state.mainTitle = `N° BL House ${
        (rootStore.state.copy_house &&
          rootStore.state.copy_house.nro_hbl) ||
        ""
      } - ${
        rootStore.state.copy_house &&
        (rootStore.state.copy_house.consigner ||
          rootStore.state.copy_house.consigner_name ||
          rootStore.state.copy_house.namelong ||
          rootStore.state.copy_house.cliente ||
          "")
      } [${actionLabel}]`;
    }

    if (route.name == "controlHouseVer") {
      formControlHouseReadonly.value = true;
    }
    rootStore.state.spiner = false;
  }

  //this._getnroHouse();
  Promise.all([
    rootStore.dispatch("_getModality"),
    rootStore.dispatch("_getShipment"),
    pricingStore.getCargarEjecutivo(),
    rootStore.dispatch("getListBanksDetailsCargarPorSucursal"),
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
              <dataEmbar :is-form-actions-disabled="formControlHouseReadonly" />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-card>
            <v-card-text>
              <services :is-form-actions-disabled="formControlHouseReadonly" />
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
                  :loading="loadingBotonNotificaciones"
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

            <v-text-field
              v-if="rootStore.state.house_enlace_tracking"
              v-model="rootStore.state.house_enlace_tracking"
              label="Enlace de Tracking"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              class="mt-3"
            >
              <template #append-inner>
                <v-btn
                  variant="text"
                  icon
                  size="small"
                  color="primary"
                  @click="
                    _copyEnlaceTracking(rootStore.state.house_enlace_tracking)
                  "
                >
                  <v-icon size="small">
                    mdi-content-copy
                  </v-icon>
                </v-btn>
              </template>
            </v-text-field>

            <v-menu
              v-model="openMenuNotificaciones"
              location="top"
              content-class="elevation-0"
            >
              <template #activator="{ props }">
                <span v-bind="props" />
              </template>
              <v-list
                color="transparent"
                v-show="displayMenuNotificaciones"
              >
                <v-list-item
                  v-for="(item, index) in getItemsNotificaciones()"
                  :key="index"
                  class="px-0"
                >
                  <v-list-item-title>
                    <v-btn
                      variant="flat"
                      block
                      size="small"
                      color="primary"
                      @click="sendNotificacion(item)"
                    >
                      {{ item.title }}
                    </v-btn>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
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
        <v-fab-transition v-if="formControlHouseReadonly">
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
          v-else
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
        v-if="rootStore.state.house_enlace_tracking"
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
          v-model="rootStore.state.house_enlace_tracking"
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
              @click="_copyEnlaceTracking(rootStore.state.house_enlace_tracking)"
            >
              <v-icon size="small">
                mdi-content-copy
              </v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
      <!-- Menú de notificaciones reubicado fuera de la tarjeta oculta -->
      <v-menu
        v-model="openMenuNotificaciones"
        location="top"
        content-class="elevation-0"
      >
        <template #activator="{ props }">
          <span v-bind="props" />
        </template>
        <v-list
          color="transparent"
          v-show="displayMenuNotificaciones"
        >
          <v-list-item
            v-for="(item, index) in getItemsNotificaciones()"
            :key="index"
            class="px-0"
          >
            <v-list-item-title>
              <v-btn
                variant="flat"
                block
                size="small"
                color="primary"
                @click="sendNotificacion(item)"
              >
                {{ item.title }}
              </v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
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

    <v-dialog
      v-model="abrirModalCuentasNotificacion"
      persistent
      width="70%"
    >
      <v-card>
        <v-card-title primary-title>
          Seleccione las cuentas a utilizar
        </v-card-title>
        <v-card-text>
          <p class="text-red">
            {{ errorCuentas }}
          </p>
          <v-data-table
            v-model="selected"
            :headers="headers"
            :items="rootStore.state.cuentas_pic"
            item-value="id"
            return-object
            show-select
            class="elevation-1"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            :loading="loadingBotonNotificaciones"
            @click="enviarNotificacion(notificacion)"
          >
            Enviar Notificación
          </v-btn>
          <v-btn
            color="danger"
            @click="
              abrirModalCuentasNotificacion = !abrirModalCuentasNotificacion
            "
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
