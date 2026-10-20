<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import dataGen from "@/components/folderHouse/DataGenVer.vue";
//import houselist from "./houselist.vue";
import dataEmbar from "@/components/folderHouse/DataEmbarVer.vue";
import Bitacora from "@/components/folderHouse/BitacoraHouseVer.vue";
import services from "@/components/folderHouse/ServicesHouseVer.vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { usePricingStore } from "@/stores/pricing";
import { useHousesStore } from "@/stores/houses";
import type { CuentaBancariaPic, ItemNotificacion, ServicioHouse } from "@/types/operaciones";
import { sessionBranchId, sessionSucursal, sessionUser } from "@/utils/sesion";
import { useBankStore } from "@/stores/bank";

//houselist,

const rootStore = useStore();
const bankStore = useBankStore();
const route = useRoute();
const appRouter = useRouter();
const housesStore = useHousesStore();
const pricingStore = usePricingStore();
const itemsShipment = computed(() => rootStore.state.itemsShipment);

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
const loadingBotonNotificaciones = ref(false);
const loadingBotonGuardarHouse = ref(false);
const loadingBotonEliminarHouse = ref(false);
const fab = ref(false);
const loadingBotonTracking = ref(false);
const openMenuNotificaciones = ref(false);
const dialogFormato = ref(false);
const formatoflag = ref(true);

async function irAVerMaster() {
  await appRouter.push({
    name: "controlHouseEditar",
    // @ts-expect-error id is not a property of a route location
    id: route.params.id,
  });
  window.location.reload();
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

  loadingBotonTracking.value = true;
  await _setTrackingToken(token);
  loadingBotonTracking.value = false;
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

  await axios(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      if (response.data.estadoflag) {
        rootStore.state.house_enlace_tracking =
          "https://aco.agentedecargaonline.com/tracking/" +
          response.data.data[0].token;

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
function openNotificaciones() {
  validarMenuNotificaciones();
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
    .then(function () {})
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: error as string,
      });
    });
}
async function _setHouseEdit() {
  loadingBotonGuardarHouse.value = !loadingBotonGuardarHouse.value;

  //vm._getnroMaster();
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
    lstservices: rootStore.state.itemsHouseServices || [],
    id: rootStore.state.house_id,
  });

  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "setHouseEdit",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then(async function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

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
      }

      statusData.value = true;
      await rootStore.dispatch("_getHouseList");
      await _getHouseById();
      await _getHouseServices();

      Swal.fire({
        icon: "success",
        title: "Excelente",
        text: "House actualizado éxitosamente",
      }).then(() => {
        if (housesStore.house.cantidad_houses_x_master! > 1) {
          Swal.fire({
            icon: "question",
            html: "<b>¿Desea actualizar los costos en el Control de Gastos ahora?</b>",
            showConfirmButton: true,
            confirmButtonText: "Sí",
            confirmButtonColor: "#4CAF50",
            showDenyButton: true,
            denyButtonText: "No, en otro momento",
            allowOutsideClick: false,
          }).then(({ isConfirmed }) => {
            if (isConfirmed) {
              // vm.$router.push("/home/folderBilling/editControlGastos/view/" + vm.$store.state.houses.house.id_master);
              appRouter.push({
                name: "editControlGasto",
                params: {
                  code_master: housesStore.house.code_master,
                  id_branch: sessionBranchId(),
                },
              });
            }
          });
        }
      });

      loadingBotonGuardarHouse.value = !loadingBotonGuardarHouse.value;
      // vm.$router.go(-1);
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: error as string,
      });
    });
}
function eliminarHouse() {
  if (housesStore.house.cantidad_houses_x_master! > 1) {
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

        const config = {
          method: "put",
          url:
            import.meta.env.VITE_URL_MAIN +
            "setHouseDelete/" +
            route.params.id,
          headers: {
            "Content-Type": "application/json",
          },
        };

        await axios(config).then(function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

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
          }

          if (response.data.statusBol) {
            Swal.fire({
              icon: "success",
              title: "REGISTRO ELIMINADO.",
            });

            loadingBotonEliminarHouse.value = !loadingBotonEliminarHouse.value;
            appRouter.go(-1);
          }
        });
      }
    });
  } else {
    Swal.fire({
      icon: "info",
      text: "Un expediente máster debe tener al menos un house asignado",
    });
  }
}
function isImportacion() {
  let val = false;
  const name = housesStore.house.modality;
  if (name == "Importación") {
    val = true;
  }

  return val;
}
function isExportacion() {
  let val = false;
  const name = housesStore.house.modality;
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
function getSentidoHouse() {
  return isImportacion()
    ? "Import"
    : isExportacion()
    ? "Export"
    : "";
}
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
  if (!housesStore.house.id_modality) {
    errores.push("Sentido");
  }
  if (!housesStore.house.id_shipment) {
    errores.push("Tipo de Embarque");
  }
  if (!housesStore.house.id_port_begin) {
    errores.push("Puerto de Origen");
  }
  if (!housesStore.house.id_port_end) {
    errores.push("Puerto de Destino");
  }
  if (!housesStore.house.id_proveedor) {
    errores.push("Proveedor");
  }
  if (!housesStore.house.id_consigner) {
    errores.push("Cliente");
  }
  if (!housesStore.house.emailaddress_clientefinal) {
    errores.push("El cliente debe tener asignado un correo electrónico");
  }
  if (!housesStore.house.id_operador) {
    errores.push("Operador");
  }
  if (!housesStore.house.fecha_etd) {
    errores.push("Fecha ETD");
  }
  if (!housesStore.house.fecha_eta) {
    errores.push("Fecha ETA");
  }
  if (
    !itemsShipment.value.filter(
      (v: { id: number; code: string }) =>
        v.id == housesStore.house.id_shipment && v.code == "FCL",
    ).length
  ) {
    if (!housesStore.house.bultos) {
      errores.push("Nº de bultos");
    }
    if (!housesStore.house.peso) {
      errores.push("Peso");
    }
    if (!housesStore.house.volumen) {
      errores.push("Volumen");
    }
  }
  if (!housesStore.house.monto) {
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

  await axios(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      housesStore.house =
        response.data.data && response.data.data[0];
    })
    .catch(function (error) {
      console.error(error);
    });
}
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

    await axios(config)
      .then(function (response) {
        sessionStorage.setItem("auth-token", response.data.token);

        if (response.data.estadoflag) {
          const lstServices: ServicioHouse[] = [];
          let itemImpuestos = null as ServicioHouse | null;
          response.data.data.map((item: ServicioHouse) => {
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

  await _getHouseById();
  const data = {
    id: rootStore.state.house_id,
    notificacion: notificacion,
    house: housesStore.house,
    user: sessionUser(),
    sentido: getSentidoHouse(),
    tipoEmbarque: getTipoEmbarqueHouse(),
    cuentasBancarias: selected.value,
    razonSocial:
      sessionSucursal().trade_name || "",
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "sendNotificacionHouse",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

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
        Swal.fire({
          icon: "success",
          title: "Excelente",
          text: "Notificación enviada éxitosamente",
        });
      }
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lo sentimos",
        text: error as string,
      });
    })
    .finally(function () {
      loadingBotonNotificaciones.value = !loadingBotonNotificaciones.value;
    });
}

onMounted(async () => {
  rootStore.state.spiner = true;
  await housesStore.verHouse(route.params);
  await pricingStore.getCargarEjecutivo();
  if (route.name == "controlHouseVer") {
    formControlHouseReadonly.value = true;
  }
  const actionLabel =
    route.name == "controlHouseEditar" ? "EDITAR" : "VER";
  rootStore.state.mainTitle = `N° BL House ${
    (housesStore.house &&
      housesStore.house.nro_hbl) ||
    ""
  } - ${
    (housesStore.house &&
      housesStore.house.consigner) ||
    ""
  } [${actionLabel}]`;
  rootStore.state.spiner = false;
  await bankStore.fetchDataBank({
    code: "",
    name: "",
    acronym: "",
    description: "",
    status: 1,
  });
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
          <v-card class="mt-5">
            <v-card-text>
              <dataEmbar :is-form-actions-disabled="formControlHouseReadonly" />
            </v-card-text>
          </v-card>

          <v-row class="mt-2">
            <template v-if="$route.name != 'controlHouseVer'">
              <v-col
                cols="4"
                md="4"
              >
                <v-btn
                  color="success"
                  @click="_setHouseEdit()"
                  block
                  size="small"
                  :loading="loadingBotonGuardarHouse"
                >
                  GUARDAR CAMBIOS
                </v-btn>
              </v-col>
              <v-col
                cols="4"
                md="4"
              >
                <v-btn
                  color="red"
                  @click="eliminarHouse()"
                  block
                  size="small"
                  :loading="loadingBotonEliminarHouse"
                >
                  ELIMINAR
                </v-btn>
              </v-col>
            </template>
            <template
              v-if="
                $route.name == 'controlHouseEditar' ||
                  $route.name == 'controlHouseVer'
              "
            >
              <v-col
                cols="4"
                md="4"
              >
                <!-- <v-btn color="orange" @click="atras()" block dark small>
                  REGRESAR
                </v-btn> -->
              </v-col>
            </template>
            <!-- <v-col cols="6" md="6">
                <v-btn color="orange" block class="mr-2" dark>Limpiar </v-btn>
              </v-col> -->
          </v-row>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-card>
            <v-card-text>
              <services
                :is-form-actions-disabled="formControlHouseReadonly"
                :items-notificaciones="getItemsNotificaciones()"
                @send-notificacion="sendNotificacion"
                @ir-editar="irAVerMaster"
              />
            </v-card-text>
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
        <v-speed-dial
          v-model="fab"
          location="top end"
          transition="slide-y-reverse-transition"
          content-class="acciones-dial"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="info"
              icon
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
            key="editar"
            color="light-green-lighten-1"
            @click="irAVerMaster()"
          >
            <v-icon start>
              mdi-pencil
            </v-icon>
            Editar
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
      <!-- Menú de notificaciones -->
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
    </v-container>

    <!-- <v-footer app color="white" elevation="5" height="72" inset>
        <router-link class="div__button_bottom" to="">
          <img width="30" :src="$store.state.imgFolder" alt="" />
          <p class="title_button_bottom">Abrir carpeta</p>
        </router-link>
        <router-link class="div__button_bottom" to="">
          <img width="30" :src="$store.state.imgMailbox" alt="" />
          <p class="title_button_bottom">Linea de correos</p>
        </router-link>
      </v-footer> -->
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
