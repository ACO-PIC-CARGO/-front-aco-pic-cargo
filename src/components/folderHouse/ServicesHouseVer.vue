<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from "@/api/http";
import moment from "moment";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse } from "@/types/api";
import type { ItemNotificacion, ServicioHouse, ServicioPorIncoterm } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";

withDefaults(defineProps<{ isFormActionsDisabled?: boolean; itemsNotificaciones?: ItemNotificacion[] }>(), {
  itemsNotificaciones: () => [],
});
const emit = defineEmits<{
  "ir-editar": [];
  "guardar-house": [];
  "eliminar-house": [];
  "send-notificacion": [item: ItemNotificacion];
}>();

const rootStore = useStore();
const route = useRoute();
const contenedorServicios = useTemplateRef("contenedorServicios");

const selected_certificado = "";
const dialogFormato = ref(false);
const formatoflag = ref(true);
const dialogNotificacionesLista = ref(false);
const loadingBotonTracking = ref(false);
const directionSpeedDial = ref("bottom");

// The earlier computed block was shadowed by the later one and never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getDisabledPropServiceStatusSombreado = computed(() => {
  return () => true;
});
const tipoAreo = computed(() => {
  const val = rootStore.state.itemsShipment.filter(
    (v: { id: number; code: string }) => v.id == rootStore.state.house_id_trasnport
  );
  if (val.length > 0) {
    return val[0]!.code == "Aéreo";
  }
  console.log(val);
  return true;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function irEditar() {
  emit("ir-editar");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function guardarHouse() {
  emit("guardar-house");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function eliminarHouse() {
  emit("eliminar-house");
}
function updateSpeedDialDirection() {
  nextTick(() => {
    const cont = contenedorServicios.value;
    if (!cont) return;

    const height = cont.clientHeight || 0;

    const threshold = 400; // si el contenedor es muy alto, abrir hacia arriba
    directionSpeedDial.value = height > threshold ? "top" : "bottom";
  });
}
function seleccionarNotificacion(item: ItemNotificacion) {
  dialogNotificacionesLista.value = false;
  emit("send-notificacion", item);
}
function formatFecha(val: moment.MomentInput) {
  if (!val) return "";
  try {
    const d = moment(val);
    if (!d.isValid()) return String(val);
    return d.format("DD/MM/YYYY");
  } catch {
    return String(val);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generarTracking() {
  try {
    loadingBotonTracking.value = true;
    const token = uuidv4();
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
      data,
    };
    const response = await axios<ApiResponse<{ token: string }[]>>(config);
    sessionStorage.setItem("auth-token", response.data.token!);
    if (response.data.estadoflag) {
      rootStore.state.house_enlace_tracking =
        "https://aco.agentedecargaonline.com/tracking/" +
        response.data.data[0]!.token;
      Swal.fire({ icon: "success", text: "Enlace de tracking generado" });
    } else {
      Swal.fire({ icon: "info", text: response.data.mensaje || "No se pudo generar tracking" });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: "error", text: "Error al generar tracking" });
  } finally {
    loadingBotonTracking.value = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function send() {
  alert("Jpla");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _deleteServices(id: number) {
  const data = {
    id: id,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "deleteServices",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(async function (response) {
      if (response.data.status == 200) {
        await _validaData();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _activeServices(id: number) {
  const data = {
    id: id,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "activeServices",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(async function (response) {
      if (response.data.status == 200) {
        await _validaData();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _inactiveServices(id: number) {
  const data = {
    id: id,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "inactiveServices",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(async function (response) {
      if (response.data.status == 200) {
        await _validaData();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _editServices(id: number, status: number) {
  const data = {
    id: id,
    status: status,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "editServices",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      if (response.data.status == 200) {
        _validaData();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _validaData() {
  if (route.params.id) {
    rootStore.state.house_Id_get = route.params.id;
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
          response.data.data.map((it) => {
            // Regla: todos en 0 (No) excepto si updated_at y created_at son distintos,
            // en cuyo caso se respeta el status que viene del backend.
            const changed =
              it.updated_at &&
              it.created_at &&
              it.updated_at !== it.created_at;

            const item = {
              ...it,
              status: changed ? it.status : 0,
            };

            if ((item.nameservice || '').toUpperCase() == "IMPUESTOS") {
              itemImpuestos = item;
            } else {
              lstServices.push(item);
            }
          });

          if (itemImpuestos !== null) {
            lstServices.push(itemImpuestos);
          }

          rootStore.state.itemsHouseServices = _sortServicesByName(
            lstServices
          );
        } else {
          rootStore.state.itemsHouseServices = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
function _sortServicesByName(list: ServicioHouse[]) {
  if (!Array.isArray(list)) return [];
  const sorted = list.slice().sort((a, b) => {
    const A = (a.nameservice || '').toString();
    const B = (b.nameservice || '').toString();
    return A.localeCompare(B, 'es', { sensitivity: 'base' });
  });
  const idx = sorted.findIndex(
    (s: ServicioHouse) => String(s.nameservice).toUpperCase() === 'IMPUESTOS'
  );
  if (idx > -1) {
    const [imp] = sorted.splice(idx, 1);
    sorted.push(imp!);
  }
  return sorted;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showModalServices() {
  rootStore.state.modalServices_manualMode = false;
  if (
    (!rootStore.state.house_cotizacion &&
      !rootStore.state.itemsHouseServices.length) ||
    (!rootStore.state.house_incoterms &&
      !rootStore.state.itemsHouseServices.length)
  ) {
    Swal.fire({
      icon: "question",
      html: "<b>¿Desea asociar una cotización para cargar los servicios?</b>",
      showConfirmButton: true,
      confirmButtonText: "Sí",
      confirmButtonColor: "#4CAF50",
      showDenyButton: true,
      denyButtonText: "No tengo una cotización",
      allowOutsideClick: false,
    }).then(({ isDenied }) => {
      if (isDenied) {
        Swal.fire({
          icon: "info",
          html: "<b>Los servicios se cargarán según el incoterm seleccionado. Si no ha seleccionado un incoterm, seleccione uno para cargar los servicios.</b>",
          showConfirmButton: true,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#4CAF50",
          allowOutsideClick: false,
        }).then(async () => {
          if (rootStore.state.house_incoterms) {
            rootStore.state.spiner = true;

            await _getServicesByIncoterms(
              rootStore.state.house_sentido,
              rootStore.state.house_id_trasnport,
              rootStore.state.house_incoterms
            );

            rootStore.state.spiner = false;
          }
        });
      }
    });
  } else {
    if (rootStore.state.itemsHouseServices.length) {
      rootStore.state.modalServices_manualMode = true;
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toggleServiceStatusSwitch(item: ServicioHouse, index: number) {
  if (!item.status) {
    rootStore.state.itemsHouseServices =
      rootStore.state.itemsHouseServices.map((itemHS: ServicioHouse, i: number) => {
        return {
          ...itemHS,
          status: i > index ? 0 : itemHS.status,
        };
      });
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function deleteService(index: number) {
  rootStore.state.itemsHouseServices.splice(index, 1);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _activePort(id_transport: number) {
  await rootStore.dispatch("_getPortBegin", { id_transport: id_transport });
  await rootStore.dispatch("_getPortEnd", { id_transport: id_transport });
  if (rootStore.state.master_id_trasnport.id == 1) {
    rootStore.state.embar_title_nacn = "Aerolinea";
  } else if (rootStore.state.master_id_trasnport.id == 2) {
    rootStore.state.embar_title_nacn = "Naviera";
  } else if (rootStore.state.master_id_trasnport.id == 3) {
    rootStore.state.embar_title_nacn = "Coloader";
  } else {
    rootStore.state.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
}
async function _getServicesByIncoterms(
  id_modality = 0,
  id_shipment = 0,
  id_incoterms = 0
) {
  const data = {
    id_branch: sessionBranchId(),
    id_modality: id_modality,
    id_shipment: id_shipment,
    id_incoterms: id_incoterms,
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + `getServicesByIncoterms`,
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios<ApiResponse<ServicioPorIncoterm[]>>(config)
    .then(function (response) {
      sessionStorage.setItem("auth-token", response.data.token!);

      if (response.data.estadoflag) {
        const lstServices: ServicioHouse[] = [];
        let itemImpuestos = null as ServicioHouse | null;

        response.data.data.map((item) => {
          const dataService = {
            id_begend: item.id_begend,
            updated_at: item.updated_at,
            namebegend: item.namebegend,
            position_begend: item.position_begend,
            nameservice: item.namegroupservice,
            status: 0,
          };

          if (item.namegroupservice.toUpperCase() == "IMPUESTOS") {
            itemImpuestos = dataService;
          } else {
            lstServices.push(dataService);
          }
        });

        if (itemImpuestos !== null) {
          lstServices.push(itemImpuestos);
        }

        rootStore.state.itemsHouseServices = lstServices;
      } else {
        rootStore.state.itemsHouseServices = [];

        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
        });
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abriModalaFormato() {
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
      headers: {
       
      },
      responseType: "blob", // 👈 importante
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    const timestamp = moment().format("YYYY_MM_DD_HH_mm_ss");
    const filename = `formato_awb_${timestamp}.xlsx`;
    link.download = filename; // nombre del archivo
    link.click();

    // Limpieza opcional
    window.URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Error exportando archivo:", err);
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
      headers: {
       
      },
      responseType: "blob", // 👈 importante
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    const timestamp = moment().format("YYYY_MM_DD_HH_mm_ss");
    const filename = `formato_bl_${timestamp}.xlsx`;
    link.download = filename; // nombre del archivo
    link.click();

    // Limpieza opcional
    window.URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Error exportando archivo:", err);
  }
  dialogFormato.value = false;
}

onMounted(async () => {
  await _validaData();
  updateSpeedDialDirection();
  window.addEventListener("resize", updateSpeedDialDirection);
  window.addEventListener("scroll", updateSpeedDialDirection, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", updateSpeedDialDirection);
  window.removeEventListener("scroll", updateSpeedDialDirection, true);
});
</script>

<template>
  <div ref="contenedorServicios">
    <p>{{ selected_certificado }}</p>

    <h3>Servicios a Realizar</h3>

    <v-table density="compact">
      <template #default>
        <thead>
          <tr>
            <th
              width="20%"
              class="text-left"
            >
              Fecha realizado
            </th>
            <th
              width="40%"
              class="text-left"
            >
              Servicio
            </th>
            <th
              width="25%"
              class="text-center"
            >
              Realizado (Sí/No)
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in rootStore.state.itemsHouseServices"
            :key="item.id"
            :style="`background:${item.color}`"
          >
            <td>
              <v-text-field
                :model-value="formatFecha(item.date_service || item.updated_at)"
                prepend-icon="mdi-calendar"
                readonly
                density="compact"
                disabled
                hide-details
                style="max-width: 140px;"
              />
            </td>
            <td>{{ item.nameservice }}</td>

            <td>
              <div class="d-flex justify-center">
                <!-- Switch normal -->
                <v-switch
                  v-if="item.nameservice != 'CERTIFICADO DE ORIGEN'"
                  density="compact"
                  color="primary"
                  v-model="item.status"
                  :value-comparator="(value, checked) => Boolean(value) === checked"
                  :disabled="true"
                  readonly
                />

                <!-- Menú especial -->
                <v-menu v-else>
                  <template #activator="{ props }">
                    <v-btn
                      size="large"
                      color="default"
                      v-bind="props"
                      :disabled="true"
                    >
                      {{
                        item.status == 1
                          ? "SI"
                          : item.status == 0
                            ? "NO"
                            : item.status == 2
                              ? "NO APLICA"
                              : ""
                      }}
                    </v-btn>
                  </template>

                  <v-list>
                    <v-list-item
                      @click="_editServices(item.id, 1)"
                      link
                    >
                      <v-list-item-title>SI</v-list-item-title>
                    </v-list-item>

                    <v-list-item
                      @click="_editServices(item.id, 0)"
                      link
                    >
                      <v-list-item-title>NO</v-list-item-title>
                    </v-list-item>

                    <v-list-item
                      @click="_editServices(item.id, 2)"
                      link
                    >
                      <v-list-item-title>NO APLICA</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </v-table>

    <!-- Campos de Aduana (solo lectura) -->
    <v-card
      class="mt-4"
      border
    >
      <v-card-title class="py-2 d-flex align-center flex-wrap">
        <v-icon
          start
          color="indigo"
        >
          mdi-ferry
        </v-icon>
        Datos de Aduana
        <v-spacer />
        <span class="text-body-small text-grey-darken-1">Información SUNAT</span>
      </v-card-title>
      <v-card-text class="pt-0">
        <v-row density="compact">
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="rootStore.state.house_nro_declaracion_aduana"
              label="N° Declaración de Aduana"
              prepend-icon="mdi-file-document-outline"
              readonly
              disabled
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-text-field
              :model-value="rootStore.state.house_canal_aduana"
              label="Canal de Aduana"
              prepend-icon="mdi-traffic-light"
              readonly
              disabled
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="dialogFormato"
      max-width="30%"
      v-if="false"
    >
      <v-card>
        <v-card-title primary-title>
          Imprimir Formato {{ tipoAreo ? "Guía aérea" : "BL" }}
        </v-card-title>

        <v-card-text>
          Imprimir con fondo
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
          <v-btn
            color="success"
            v-if="tipoAreo"
            block
            @click="exportarFormatoAWB"
          >
            Imprimir Formato Guía Aérea
          </v-btn>

          <v-btn
            color="success"
            v-else
            block
            @click="exportarFormatoHBL"
          >
            Imprimir Formato BL
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogNotificacionesLista"
      max-width="500"
      v-if="false"
    >
      <v-card>
        <v-card-title class="text-headline-small d-flex align-center flex-wrap">
          Seleccione notificación
          <v-spacer />
          <v-btn
            variant="text"
            icon
            @click="dialogNotificacionesLista = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-list
            density="compact"
            lines="two"
          >
            <v-list-item
              v-for="(item, idx) in itemsNotificaciones"
              :key="idx"
              @click="seleccionarNotificacion(item)"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
              <template #append>
                <v-icon color="primary">
                  mdi-chevron-right
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}

.btn_add {
  cursor: pointer;
}

.acciones-dial :deep(.v-speed-dial__list) {
  align-items: flex-start !important;
}
.acciones-dial :deep(.v-speed-dial__list .v-btn) {
  align-self: flex-start;
  min-width: 180px;
}
.acciones-dial :deep(.v-speed-dial__list .v-btn .v-btn__content) {
  justify-content: flex-start;
  width: 100%;
  font-size: 0.98rem;
  line-height: 1.2;
}
.acciones-dial :deep(.v-speed-dial__list .v-btn .v-icon) {
  font-size: 22px !important;
}
</style>
