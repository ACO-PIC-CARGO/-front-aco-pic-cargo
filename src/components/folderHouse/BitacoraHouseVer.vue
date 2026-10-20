<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useHousesStore } from "@/stores/houses";
import axios from "@/api/http";
import moment from "moment";
import SweetAlert from "sweetalert2";
import type { SweetAlertResult } from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import type { ComentarioEstadoHouse } from "@/types/catalogos";
import type { RegistroBitacoraHouse } from "@/types/operaciones";

const componentProps = defineProps<{ isFormActionsDisabled?: boolean }>();

const housesStore = useHousesStore();
const route = useRoute();

const date = ref(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10));
const modal = ref(false);
const loadingBotonBitacora = ref(false);
const loadingBotonTracking = ref(false);
const disabledBotonBitacora = ref(false);
const dialogVerTodos = ref(false);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isBotonTrackingDisabled = computed(function () {
  return housesStore.house_enlace_tracking !== "" &&
    housesStore.house_enlace_tracking !== null
    ? true
    : componentProps.isFormActionsDisabled;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isBotonBitacoraDisabled = computed(function () {
  return componentProps.isFormActionsDisabled || disabledBotonBitacora.value;
});
const bitacoraOrdenada = computed(function () {
  const items = housesStore.itemsBitacora || [];
  return items.slice().sort(function (a: RegistroBitacoraHouse, b: RegistroBitacoraHouse) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return (dateB as unknown as number) - (dateA as unknown as number);
  });
});
const bitacoraLimitada = computed(function () {
  return bitacoraOrdenada.value.slice(0, 3);
});
const totalRegistros = computed(function () {
  return (housesStore.itemsBitacora || []).length;
});
const mostrarBotonVerMas = computed(function () {
  return totalRegistros.value > 3;
});

function setBitacoraFecha(value: moment.MomentInput) {
  housesStore.bitacora_fecha = moment(value).format("YYYY-MM-DD");
}
function ObtenerComentariosPredifinidos() {
  const comentarios: ComentarioEstadoHouse[] = [];
  // console.log("itemsBitacora", this.$store.state.itemsBitacora);
  // console.log(
  //   "itemsC omentariosPredefinidos",
  //   this.$store.state.itemsComentariosPredefinidos
  // );
  housesStore.itemsComentariosPredefinidos.forEach((element: ComentarioEstadoHouse) => {
    element.comentariousuado = housesStore.itemsBitacora.some(
      (v: RegistroBitacoraHouse) => v.comentario === element.comentario
    );
    comentarios.push(element);
  });
  return comentarios;
}
function cleanData() {
  housesStore.bitacora_id_bitacora = "";
  housesStore.bitacora_comentario_predefinido = "" as never;
  housesStore.bitacora_comentario_flag = false;
  housesStore.bitacora_comentario = "";
  housesStore.bitacora_visible_cliente = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _validaData() {
  if (route.params.id) {
    // vm._getBitacoraLineal();
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _deleteBitacora(id: number) {
  const data = {
    id: id,
  };

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "deleteBitacora",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then(async function (response) {
      sessionStorage.setItem("auth-token", response.data.token);
      if (response.data.status == 200) {
        await housesStore._getHouseBitacora().then(() => {
          _setDefaultBitacora();
        });
      }

      if (response.data.status == "401") {
        // @ts-expect-error Swal is not defined in this scope
        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal: SweetAlertResult) => {
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
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _changeStatusBitacora({ id, status }: { id: number; status: number }) {
  const data = {
    id: id,
    status: status,
  };

  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "changeStatusBitacora",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then(async function (response) {
      sessionStorage.setItem("auth-token", response.data.token);
      if (response.data.status == 200) {
        await housesStore._getHouseBitacora();
      }

      if (response.data.status == "401") {
        // @ts-expect-error Swal is not defined in this scope
        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal: SweetAlertResult) => {
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
    });
}
async function _changeStatusVisibleBitacora({ id, visible_cliente }: RegistroBitacoraHouse) {
  const data = {
    id: id,
    visible: visible_cliente,
  };

  const config = {
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "changeStatusVisibleBitacora",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  await axios(config)
    .then(async function (response) {
      
      sessionStorage.setItem("auth-token", response.data.token);
      if (response.data.status == 200) {
        await housesStore._getHouseBitacora();
      }

      if (response.data.status == "401") {
        // @ts-expect-error Swal is not defined in this scope
        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal: SweetAlertResult) => {
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
    });
}
function _setDefaultBitacora() {
  disabledBotonBitacora.value = false;
  if (!housesStore.itemsBitacora.length) {
    housesStore.bitacora_id_bitacora = 1;
  } else {
    if (
      housesStore.itemsBitacora.length <
      housesStore.itemsBitacoraLineal.length
    ) {
      const dataUltimaBitacora =
        housesStore.itemsBitacora[
          housesStore.itemsBitacora.length - 1
        ]!;
      if (Object.keys(dataUltimaBitacora).length) {
        housesStore.bitacora_id_bitacora =
          dataUltimaBitacora.id_bitacora + 1;
      }
    } else {
      disabledBotonBitacora.value = true;
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _handleFlagComentarioManual() {
  if (housesStore.bitacora_comentario_flag) {
    housesStore.bitacora_comentario_predefinido = null as never;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _setBitacora() {
  if (!housesStore.bitacora_id_bitacora) {
    SweetAlert.fire("", "¡La bitacora es requerida!", "error");
  } else {
    let ok = true;
    if (housesStore.itemsBitacora.length) {
      const dataUltimaBitacora =
        housesStore.itemsBitacora[
          housesStore.itemsBitacora.length - 1
        ]!;
      if (
        housesStore.bitacora_id_bitacora !=
        dataUltimaBitacora.id_bitacora + 1
      ) {
        ok = false;
      }
    } else {
      if (housesStore.bitacora_id_bitacora != 1) {
        ok = false;
      }
    }

    if (!ok) {
      SweetAlert.fire(
        "",
        "¡Debe registrar las bitácoras en el orden que aparecen en la lista!",
        "error"
      );
    } else if (
      housesStore.bitacora_comentario_flag &&
      !housesStore.bitacora_comentario
    ) {
      SweetAlert.fire("", "¡El comentario es requerido!", "error");
    } else {
      loadingBotonBitacora.value = !loadingBotonBitacora.value;

      const data = {
        id_house: route.params.id,
        id_bitacora: housesStore.bitacora_id_bitacora,
        id_comentario: !housesStore.bitacora_comentario_flag
          ? housesStore.bitacora_comentario_predefinido
          : "",
        comentario: housesStore.bitacora_comentario_flag
          ? housesStore.bitacora_comentario
          : "",
        fecha: housesStore.bitacora_fecha,
        visible_cliente: housesStore.bitacora_visible_cliente,
      };

      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "setBitacora",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      await axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);
          if (response.data.status == 200) {
            await housesStore._getHouseBitacora().then(() => {
              cleanData();
              _setDefaultBitacora();
            });
          }

          if (response.data.status == "401") {
            // @ts-expect-error Swal is not defined in this scope
            Swal.fire({
              icon: "error",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal: SweetAlertResult) => {
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
        })
        .finally(function () {
          loadingBotonBitacora.value = !loadingBotonBitacora.value;
        });
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  await axios(config)
    .then(function (response) {
      
      sessionStorage.setItem("auth-token", response.data.token);

      if (response.data.estadoflag) {
        housesStore.house_enlace_tracking =
          "https://aco.agentedecargaonline.com/tracking/" +
          response.data.data[0].token;
      } else {
        // @ts-expect-error Swal is not defined in this scope
        Swal.fire({
          icon: response.data.status == "401" ? "error" : "info",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal: SweetAlertResult) => {
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
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _copyEnlaceTracking(texto: string) {
  await navigator.clipboard.writeText(texto);
}

onMounted(async () => {
  // await this._getBitacoraLineal();
  await housesStore._getComentariosPredefinidos();
  await housesStore._getHouseBitacora().then(() => {
    _setDefaultBitacora();
  });
});
</script>

<template>
  <div style="min-height: 620px">
    <h3>Estatus del embarque</h3>

    <v-container style="padding: 0">
      <v-row density="compact">
        <v-col
          cols="12"
          md="12"
        >
          <v-autocomplete
            append-icon="mdi-plus"
            :items="housesStore.itemsBitacoraLineal"
            item-title="name"
            item-value="id"
            label="Estatus del embarque"
            v-model="housesStore.bitacora_id_bitacora"
            :disabled="true"
          >
            <template #selection="{ item, internalItem }">
              <span
                v-if="typeof item === 'object'"
                class="v-autocomplete__selection-text"
              >{{ internalItem.title }}</span>
            </template>
            <template #item="{ item, props }">
              <!-- @vue-expect-error BitacoraLinealHouse does not declare name -->
              <v-list-item
                v-bind="props"
                role="option"
                :title="item.name"
              >
                <template #prepend>
                  <v-avatar
                    color="indigo"
                    class="text-headline-medium font-weight-light text-white mr-3"
                  >
                    {{ housesStore.itemsBitacoraLineal.indexOf(item) + 1 }}
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col
          cols="12"
          md="12"
          style="width: 120px"
        >
          <v-autocomplete
            :items="ObtenerComentariosPredifinidos()"
            item-title="descripcion"
            item-value="id"
            label="Seleccione un comentario predefinido"
            v-model="housesStore.bitacora_comentario_predefinido"
            content-class="custom-autocomplete-menu"
            v-if="housesStore.bitacora_id_bitacora"
            return-object
            :disabled="true"
          >
            <template #item="{ item, props }">
              <v-list-item
                v-bind="props"
                role="option"
              >
                <template #title>
                  <span class="wrap-text">{{ item.descripcion }}</span>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>

        <v-col
          cols="12"
          md="12"
          v-if="housesStore.bitacora_comentario_flag"
        >
          <v-text-field
            v-model="housesStore.bitacora_comentario"
            label="Comentario"
            id="txtBitacoraComentario"
            readonly
            disabled
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-dialog
            v-model="modal"
            persistent
            width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="housesStore.bitacora_fecha"
                label="Fecha"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="props"
                :disabled="true"
              />
            </template>
            <v-date-picker
              :model-value="housesStore.bitacora_fecha"
              @update:model-value="setBitacoraFecha"
            >
              <template #actions>
                <v-spacer />
                <v-btn
                  variant="text"
                  color="primary"
                  @click="modal = false"
                >
                  Cancel
                </v-btn>
                <v-btn
                  variant="text"
                  color="primary"
                  @click="
                    date = housesStore.bitacora_fecha;
                    modal = false;
                  "
                >
                  OK
                </v-btn>
              </template>
            </v-date-picker>
          </v-dialog>
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <p class="mb-1">
            Visible para cliente
          </p>
          <v-switch
            class="mt-0"
            v-model="housesStore.bitacora_visible_cliente"
            :disabled="true"
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-btn
            color="primary"
            block
            :loading="false"
            disabled
            size="small"
          >
            Agregar
          </v-btn>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-table
            density="compact"
            fixed-header
          >
            <template #default>
              <thead>
                <tr>
                  <th class="text-left">
                    Grupo
                  </th>
                  <th class="text-left">
                    Nombre
                  </th>
                  <th class="text-left">
                    Comentario
                  </th>
                  <th class="text-left">
                    Fecha
                  </th>
                  <th class="text-left">
                    Visible/No Visible
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in bitacoraLimitada"
                  :key="item.id"
                >
                  <td>{{ item.namemodule }}</td>
                  <td>{{ item.namebitacora }}</td>
                  <td>{{ item.comentario }}</td>
                  <td>{{ item.date }}</td>
                  <td>
                    <v-switch
                      density="compact"
                      readonly
                      color="primary"
                      v-model="item.visible_cliente"
                      :value-comparator="(value, checked) => Boolean(value) === checked"
                      @click="_changeStatusVisibleBitacora(item)"
                      :disabled="isFormActionsDisabled"
                    />
                  </td>
                </tr>
              </tbody>
            </template>
          </v-table>
        </v-col>
        <v-col
          cols="12"
          class="text-center"
          v-if="mostrarBotonVerMas"
        >
          <v-btn
            size="small"
            color="primary"
            variant="outlined"
            @click="dialogVerTodos = true"
          >
            Ver más ({{ totalRegistros }} registros)
          </v-btn>
        </v-col>
      </v-row>

      <!-- Modal para ver todos los registros -->
      <v-dialog
        v-model="dialogVerTodos"
        max-width="900px"
        scrollable
      >
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap">
            Todos los registros de bitácora
            <v-spacer />
            <v-btn
              variant="text"
              icon
              @click="dialogVerTodos = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text style="max-height: 500px;">
            <v-table
              density="compact"
              fixed-header
            >
              <template #default>
                <thead>
                  <tr>
                    <th class="text-left">
                      Grupo
                    </th>
                    <th class="text-left">
                      Nombre
                    </th>
                    <th class="text-left">
                      Comentario
                    </th>
                    <th class="text-left">
                      Fecha
                    </th>
                    <th class="text-left">
                      Visible/No Visible
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in bitacoraOrdenada"
                    :key="item.id"
                  >
                    <td>{{ item.namemodule }}</td>
                    <td>{{ item.namebitacora }}</td>
                    <td>{{ item.comentario }}</td>
                    <td>{{ item.date }}</td>
                    <td>
                      <v-switch
                        density="compact"
                        readonly
                        color="primary"
                        v-model="item.visible_cliente"
                        :value-comparator="(value, checked) => Boolean(value) === checked"
                        :disabled="isFormActionsDisabled"
                      />
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-table>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              variant="text"
              @click="dialogVerTodos = false"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.dataBitacora {
  max-height: 430px;
  overflow-y: scroll;
}

.btn_add {
  cursor: pointer;
}
.comentarioUtilizado {
  background: #e8eaf6;
}
</style>
