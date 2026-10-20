<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";
import Swal from "sweetalert2";
import { useHousesStore } from "@/stores/houses";
import type { ApiResponse } from "@/types/api";
import type { ServicioHouse, ServicioPorIncoterm } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";

const componentProps = defineProps<{ isFormActionsDisabled?: boolean }>();

const appStore = useAppStore();
const route = useRoute();
const housesStore = useHousesStore();

const loading = ref(false);
const mostrarBtnTelex = ref(false);
const selected_certificado = "";
const dialogConfirmarTelex = ref(false);
const cboConfirmaTelex = [
  { text: "Confirmado", value: true },
  { text: "Sin Confirmar", value: false },
];
const telexconfirmado = "";
const fechaconfirmaciontelex = ref<string | boolean>("");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalConfirmaTelex() {
  dialogConfirmarTelex.value = true;
}
async function confirmarTelex() {
  const { telexconfirmado: telexconfirmadoActual, fechaconfirmaciontelex: fechaconfirmaciontelexActual } = housesStore;
  if (!telexconfirmado) {
    fechaconfirmaciontelex.value = false;
  }

  if (telexconfirmadoActual && !fechaconfirmaciontelexActual) {
    Swal.fire({
      icon: "warning", // Cambiado a 'warning' porque es una omisión, no un error de sistema
      title: "Acción requerida",
      text: "Debe ingresar una fecha de confirmación para proceder con el estado 'Confirmado'.",
    });
    return;
  }

  if (!telexconfirmadoActual && fechaconfirmaciontelexActual) {
    Swal.fire({
      icon: "warning",
      title: "Inconsistencia en los datos",
      text: "No es posible establecer una fecha si el documento no ha sido confirmado.",
    });
    return;
  }
  appStore.spiner = true;
  loading.value = true;
  await housesStore.setConfirmarTelex({
    id: route.params.id,
    telexconfirmado: housesStore.telexconfirmado,
    fechaconfirmaciontelex: housesStore.fechaconfirmaciontelex,
  });
  loading.value = false;
  dialogConfirmarTelex.value = false;
  appStore.spiner = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDisabledPropServiceStatus(index: number | string) {
  return !!componentProps.isFormActionsDisabled;
}
function logNameService(value: ServicioHouse) {
  return value;
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
function getDateForPicker(val: moment.MomentInput) {
  if (!val) return null;
  try {
    const d = moment(val);
    if (!d.isValid()) return null;
    return d.format("YYYY-MM-DD");
  } catch {
    return null;
  }
}
async function updateServiceDate(item: ServicioHouse, newDate: moment.MomentInput) {
  if (!newDate) return;

  item.showDatePicker = false;

  const formattedDate = moment(newDate).format("YYYY-MM-DD");
  item.date_service = formattedDate;
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
  axios<ApiResponse>(config)
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
  axios<ApiResponse>(config)
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
  axios<ApiResponse>(config)
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
  axios<ApiResponse>(config)
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
    appStore.house_Id_get = route.params.id;
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

            if ((item.nameservice || "").toUpperCase() == "IMPUESTOS") {
              itemImpuestos = item;
            } else {
              lstServices.push(item);
            }
          });

          if (itemImpuestos !== null) {
            lstServices.push(itemImpuestos);
          }

          appStore.itemsHouseServices =
            _sortServicesByName(lstServices);
        } else {
          appStore.itemsHouseServices = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
function showModalServices() {
  housesStore.modalServices_manualMode = false;
  if (
    (!housesStore.house_cotizacion &&
      !appStore.itemsHouseServices.length) ||
    (!housesStore.house_incoterms &&
      !appStore.itemsHouseServices.length)
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
          if (housesStore.house_incoterms) {
            appStore.spiner = true;

            await _getServicesByIncoterms(
              housesStore.house_sentido as number,
              housesStore.house_id_trasnport as number,
              housesStore.house_incoterms as number,
            );

            appStore.spiner = false;
          }
        });
      }
    });
  } else {
    if (appStore.itemsHouseServices.length) {
      housesStore.modalServices_manualMode = true;
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toggleServiceStatusSwitch(item: ServicioHouse, index: number | string) {
  // Solo actualiza el estado local. La fecha mostrada proviene de update_at del backend.
  // El backend actualizará update_at cuando se guarde el House (setHouseEdit).
  const isOn =
    item.status === 1 || item.status === "1" || item.status === true;
  item.status = isOn ? 1 : 0;
}
function _sortServicesByName(list: ServicioHouse[]) {
  if (!Array.isArray(list)) return [];
  const sorted = list.slice().sort((a, b) => {
    const A = (a.nameservice || "").toString();
    const B = (b.nameservice || "").toString();
    return A.localeCompare(B, "es", { sensitivity: "base" });
  });
  const idx = sorted.findIndex(
    (s) => String(s.nameservice).toUpperCase() === "IMPUESTOS",
  );
  if (idx > -1) {
    const [imp] = sorted.splice(idx, 1);
    sorted.push(imp!);
  }
  return sorted;
}
function deleteService(index: number | string) {
  appStore.itemsHouseServices.splice(index as number, 1);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _activePort(id_transport: number) {
  await appStore._getPortBegin({ id_transport: id_transport });
  await appStore._getPortEnd({ id_transport: id_transport });
  if (appStore.master_id_trasnport.id == 1) {
    appStore.embar_title_nacn = "Aerolinea";
  } else if (appStore.master_id_trasnport.id == 2) {
    appStore.embar_title_nacn = "Naviera";
  } else if (appStore.master_id_trasnport.id == 3) {
    appStore.embar_title_nacn = "Coloader";
  } else {
    appStore.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
}
async function _getServicesByIncoterms(
  id_modality = 0,
  id_shipment = 0,
  id_incoterms = 0,
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
            namebegend: item.namebegend,
            position_begend: item.position_begend,
            nameservice: item.namegroupservice,
            status: 0,
            updated_at: null,
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

        appStore.itemsHouseServices =
          _sortServicesByName(lstServices);
      } else {
        appStore.itemsHouseServices = [];

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

watch(() => appStore.itemsHouseServices, (newValue) => {
  newValue.forEach((item: ServicioHouse) => {
    logNameService(item);
  });
}, { deep: true });
watch(() => housesStore.telexconfirmado, () => {
  mostrarBtnTelex.value = true;
  if (!housesStore.telexconfirmado) {
    housesStore.fechaconfirmaciontelex = null;
  }
});

onMounted(async () => {
  await _validaData();
});
</script>

<template>
  <div>
    <p>{{ selected_certificado }}</p>
    <h3>Servicios a Realizar</h3>

    <v-fab-transition>
      <v-btn
        @click="showModalServices"
        color="green"
        class="mt-4 mr-4"
        position="absolute"
        location="top right"
        size="small"
        icon
        :disabled="isFormActionsDisabled"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>
    <v-table density="compact">
      <template #default>
        <thead>
          <tr>
            <!-- <th width="25%" class="text-left">Ubicación/Tramo</th> -->
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
            <th
              width="5%"
              class="text-center"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            :style="`background:${item.color}`"
            v-for="(item, index) in appStore.itemsHouseServices"
            :key="item.id"
          >
            <!-- <td>{{ item.namebegend }}</td> -->
            <td>
              <v-menu
                ref="menu"
                v-model="item.showDatePicker"
                :close-on-content-click="false"
                transition="scale-transition"
                min-width="auto"
                :disabled="isFormActionsDisabled"
              >
                <template #activator="{ props }">
                  <v-text-field
                    :model-value="formatFecha(item.date_service || item.updated_at)"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    density="compact"
                    :disabled="isFormActionsDisabled"
                    hide-details
                    style="max-width: 140px"
                  />
                </template>
                <v-locale-provider locale="es">
                  <v-date-picker
                    :model-value="
                      getDateForPicker(item.date_service || item.updated_at)
                    "
                    @update:model-value="updateServiceDate(item, $event)"
                    :first-day-of-week="1"
                  />
                </v-locale-provider>
              </v-menu>
            </td>
            <td>{{ item.nameservice }}</td>

            <td>
              <div class="d-flex justify-center">
                <v-switch
                  v-if="item.nameservice != 'CERTIFICADO DE ORIGEN'"
                  density="compact"
                  color="primary"
                  :true-value="1"
                  :false-value="0"
                  v-model="item.status"
                  :disabled="getDisabledPropServiceStatus(index)"
                  @update:model-value="toggleServiceStatusSwitch(item, index)"
                />
              </div>

              <v-menu
                v-if="item.nameservice == 'CERTIFICADO DE ORIGEN'"
              >
                <template #activator="{ props }">
                  <v-btn
                    size="large"
                    color="default"
                    v-bind="props"
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
                    @click="_editServices(item.id!, 1)"
                    link
                  >
                    <v-list-item-title>SI</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    @click="_editServices(item.id!, 0)"
                    link
                  >
                    <v-list-item-title>NO</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    @click="_editServices(item.id!, 2)"
                    link
                  >
                    <v-list-item-title>NO APLICA</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
            <td class="text-center">
              <v-icon
                class="btn_add"
                size="small"
                color="red"
                @click="deleteService(index)"
                :disabled="isFormActionsDisabled"
              >
                mdi-delete
              </v-icon>
            </td>
          </tr>
        </tbody>
      </template>
    </v-table>

    <!-- Campos de Aduana -->
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
              v-model="housesStore.house_nro_declaracion_aduana"
              label="N° Declaración de Aduana"
              prepend-icon="mdi-file-document-outline"
              :disabled="isFormActionsDisabled"
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
              v-model="housesStore.house_canal_aduana"
              label="Canal de Aduana"
              prepend-icon="mdi-traffic-light"
              :disabled="isFormActionsDisabled"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card class="mt-2">
      <v-card-title primary-title>
        BL TELEXT
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="3">
            <v-switch
              :label="housesStore.telexconfirmado ? 'Si' : 'No'"
              v-model="housesStore.telexconfirmado"
            />
          </v-col>
          <v-col cols="9">
            <FormatFecha
              v-if="housesStore.telexconfirmado"
              :outlined="true"
              label="Fecha de confirmación"
              v-model="housesStore.fechaconfirmaciontelex"
              :clearable="true"
            />
          </v-col>

          <v-btn
            v-if="mostrarBtnTelex"
            :loading="loading"
            color="success"
            @click="confirmarTelex()"
          >
            Confirmar Telex
          </v-btn>
        </v-row>
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="dialogConfirmarTelex"
      max-width="30%"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Confirmar liberación de Telex
          <v-spacer />
          <v-btn
            variant="text"
            icon
            @click="dialogConfirmarTelex = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmConfirmar">
            <v-select
              item-title="text"
              :items="cboConfirmaTelex"
              v-model="housesStore.telexconfirmado"
              label="Estado del documento"
              variant="outlined"
              density="compact"
            />
            <FormatFecha
              :outlined="true"
              :dense="true"
              label="Fecha de confirmación"
              v-model="housesStore.fechaconfirmaciontelex"
              :clearable="true"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :loading="loading"
            color="success"
            @click="confirmarTelex()"
          >
            Confirmar
          </v-btn>
          <v-btn
            :loading="loading"
            color="error"
            @click="dialogConfirmarTelex = false"
            variant="text"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Botón "Imprimir Formato" movido a sección de Acciones en controlHouse.vue -->
  </div>
</template>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}

.btn_add {
  cursor: pointer;
}
</style>
