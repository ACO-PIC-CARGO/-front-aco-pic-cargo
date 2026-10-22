<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import dataGen from "@/components/folderHouse/DataGenVer.vue";
//import houselist from "./houselist.vue";
import dataEmbar from "@/components/folderHouse/DataEmbarVer.vue";
import "@/styles/aco-ui.css";
import HouseFileHeader from "@/components/HouseFile/HouseFileHeader.vue";
import HousePhaseProgress from "@/components/HouseFile/HousePhaseProgress.vue";
import HouseStepList from "@/components/HouseFile/HouseStepList.vue";
import ClientTrackingPreview from "@/components/HouseFile/ClientTrackingPreview.vue";
import HouseCustomsCard from "@/components/HouseFile/HouseCustomsCard.vue";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { usePricingStore } from "@/stores/pricing";
import { useHousesStore } from "@/stores/houses";
import type { CuentaBancariaPic, ItemNotificacion, ServicioHouse } from "@/types/operaciones";
import { sessionBranchId, sessionSucursal, sessionUser } from "@/utils/sesion";
import { useBankStore } from "@/stores/bank";

//houselist,

const appStore = useAppStore();
const bankStore = useBankStore();
const route = useRoute();
const appRouter = useRouter();
const housesStore = useHousesStore();
const pricingStore = usePricingStore();
const houseTrackingStore = useHouseTrackingStore();
const branchTimeZoneStore = useBranchTimeZoneStore();
const houseId = computed(() => Number(route.params.id));
const trackingError = ref("");
const itemsShipment = computed(() => appStore.itemsShipment);

async function loadTracking() {
  trackingError.value = (await houseTrackingStore.load(houseId.value)) ?? "";
}

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
    lstservices: appStore.itemsHouseServices || [],
    id: housesStore.house_id,
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
      await appStore._getHouseList();
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
    id: housesStore.house_id,
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
  appStore.spiner = true;
  await housesStore.verHouse(route.params);
  await Promise.all([loadTracking(), branchTimeZoneStore.load()]);
  await pricingStore.getCargarEjecutivo();
  if (route.name == "controlHouseVer") {
    formControlHouseReadonly.value = true;
  }
  const actionLabel =
    route.name == "controlHouseEditar" ? "EDITAR" : "VER";
  appStore.mainTitle = `N° BL House ${
    (housesStore.house &&
      housesStore.house.nro_hbl) ||
    ""
  } - ${
    (housesStore.house &&
      housesStore.house.consigner) ||
    ""
  } [${actionLabel}]`;
  appStore.spiner = false;
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
  <v-theme-provider
    theme="aco"
    with-background
    class="aco-ui house-file"
  >
    <v-form
      ref="formControlHouse"
      :readonly="formControlHouseReadonly"
    >
      <v-container fluid>
        <v-row density="compact">
          <v-col
            cols="12"
            md="8"
            lg="9"
          >
            <div class="house-file__main">
              <HouseFileHeader :house-id="houseId" />
              <HousePhaseProgress />
              <HouseStepList
                :house-id="houseId"
                :load-error="trackingError"
                @retry="loadTracking"
              />
            </div>
          </v-col>
          <v-col
            cols="12"
            md="4"
            lg="3"
          >
            <ClientTrackingPreview />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <section class="aco-card house-file__section">
              <dataGen />
            </section>
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <section class="aco-card house-file__section">
              <dataEmbar :is-form-actions-disabled="formControlHouseReadonly" />
            </section>
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <HouseCustomsCard />

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
            </v-row>
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
              :items="appStore.cuentas_pic"
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
  </v-theme-provider>
</template>

<style lang="scss" scoped>
.house-file__main {
  display: grid;
  gap: var(--aco-space-3);
}

.house-file__section {
  height: 100%;
  padding: var(--aco-space-3);
}

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
