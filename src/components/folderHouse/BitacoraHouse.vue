<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useHousesStore } from "@/stores/houses";
import axios from "@/api/http";
import moment from "moment";
import Swal from "sweetalert2";
import { usePricingStore } from "@/stores/pricing";
import { useStatushouseStore } from "@/stores/statushouse";
import type { ComentarioEstadoHouse } from "@/types/catalogos";
import type { BitacoraLinealHouse, RegistroBitacoraHouse } from "@/types/operaciones";

const componentProps = defineProps<{ isFormActionsDisabled?: boolean }>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EstadoHouseForm = defineAsyncComponent(() => import("./../StatusHouse/EstadoHouseForm.vue"));

const appStore = useAppStore();
const housesStore = useHousesStore();
const route = useRoute();
const pricingStore = usePricingStore();
const statushouseStore = useStatushouseStore();

const date = ref(
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .substr(0, 10),
);
const modal = ref(false);
const loadingBotonBitacora = ref(false);
const disabledBotonBitacora = ref(false);
const id = ref<number | string>("");
const exw = ref(false);
const fob = ref(false);
const fca = ref(false);
const cfr = ref(false);
const cif = ref(false);
const ddp = ref(false);
const nroorden = ref<number | string | undefined>("");
const items = ref<ComentarioEstadoHouse[]>([]);
const id_modality = ref<number | string>("");
const id_shipment = ref<number | string>("");
const dialog = ref(false);
const dialogVerTodos = ref(false);
const errorInconterms = ref("");
const name = ref("");
const frmStatus = useTemplateRef("frmStatus");
// moveUp and moveDown are not defined, so their buttons throw when clicked.
const moveUp = undefined as unknown as (index: number) => void;
const moveDown = undefined as unknown as (index: number) => void;

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars, vue/return-in-computed-property
const iraComentarioManual = computed(() => {
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  housesStore.bitacora_comentario_flag = true;
});
const anadirComentarioFlag = computed(() => {
  return !(
    exw.value ||
    fob.value ||
    fca.value ||
    cfr.value ||
    cif.value ||
    ddp.value
  );
});

// abrirRegistroBitacora() {
//   this.$refs.EstadoHouseForm.dialog = true;
// },
function abrirRegistroBitacora() {
  dialog.value = true;
  // this.$refs.frmStatus.reset();
  items.value = [];
}
async function obtenerOrden() {
  if (id_modality.value && id_shipment.value) {
    await statushouseStore.getObtenerOrdenStatusHouse({
      id_modalidad: id_modality.value,
      id_shipment: id_shipment.value,
    });
    const orden = { ...statushouseStore.orden };
    nroorden.value = orden.orden;
  }
}
function anadirComentario() {
  items.value.push({ descripcion: "" });
  nextTick(() => {
    const index = items.value.length;
    console.log(index);
    const input = document.getElementById(`description${index - 1}`);
    input!.focus();
  });
}
async function guardarStatus() {
  errorInconterms.value = "";
  if ((await frmStatus.value!.validate()).valid) {
    if (!exw.value && !fca.value && !cfr.value && !cif.value && !ddp.value) {
      errorInconterms.value =
        "Es necesario seleccionar al menos un Incoterms";
      return false;
    }
    items.value.map((item, index) => {
      item.orden = index + 1;
    });
    const data = {
      id: id.value,
      id_modality: id_modality.value,
      id_shipment: id_shipment.value,
      name: name.value,
      nroorden: nroorden.value,
      exw: exw.value,
      fob: fob.value,
      fca: fca.value,
      cfr: cfr.value,
      cif: cif.value,
      ddp: ddp.value,
      lstComentatios: items.value,
    };
    await statushouseStore.GuardarStatusHouse(data);
    await housesStore._getBitacoraLineal({
      id_modalidad: housesStore.house_sentido,
      id_shipment: housesStore.house_id_trasnport,
      id_incoterms: housesStore.house_incoterms,
    });
    dialog.value = false;
  }
}
function eliminarComentario(comentario: ComentarioEstadoHouse, index: number) {
  if (!comentario.id) {
    items.value.splice(index, 1);
    return;
  }
  Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, eliminarlo!",
  }).then(async (result) => {
    if (result.isConfirmed) {
      appStore.spiner = true;
      await statushouseStore.EliminarComentario(comentario);
      appStore.spiner = false;
      dialog.value = false;
    }
  });
}
function setBitacoraFecha(value: moment.MomentInput) {
  housesStore.bitacora_fecha = moment(value).format("YYYY-MM-DD");
}
function existeEnBitacora(item: { id: number }) {
  const val = housesStore.itemsBitacora.some(
    (v: RegistroBitacoraHouse) => v.id_bitacora == item.id
  );

  // console.log(val);
  return val;
}
function ObtenerComentariosPredifinidos(): ComentarioEstadoHouse[] {
  const bitacora = (housesStore.itemsBitacoraLineal || []).find(
    (v: BitacoraLinealHouse) => v && v.id == housesStore.bitacora_id_bitacora
  );
  if (!bitacora || !Array.isArray(bitacora.comentarios)) {
    return [];
  }
  if (!bitacora.comentarios.some((v: ComentarioEstadoHouse) => v && v.id == -1)) {
    bitacora.comentarios.push({
      id: -1,
      descripcion: "Comentario Manual",
    });
  }
  return bitacora.comentarios;
}
function activarComentarioFlag() {
  const data = { ...housesStore.bitacora_comentario_predefinido };
  if (data.id == -1) {
    housesStore.bitacora_comentario_flag = true;
    nextTick(() => {
      const txtBitacoraComentario = document.getElementById(
        "txtBitacoraComentario"
      );
      txtBitacoraComentario!.focus();
    });
  } else {
    housesStore.bitacora_comentario = "";
    housesStore.bitacora_comentario_flag = false;
  }
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
    housesStore._getBitacoraLineal({
      id_modalidad: housesStore.house_sentido,
      id_shipment: housesStore.house_id_trasnport,
      id_incoterms: housesStore.house_incoterms,
    });
  }
}
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
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _setDefaultBitacora() {
  disabledBotonBitacora.value = false;
  // if (!vm.$store.state.itemsBitacora.length) {
  //   vm.$store.state.bitacora_id_bitacora = 1;
  // } else {
  //   if (
  //     vm.$store.state.itemsBitacora.length <
  //     vm.$store.state.itemsBitacoraLineal.length
  //   ) {
  //     const dataUltimaBitacora =
  //       vm.$store.state.itemsBitacora[
  //         vm.$store.state.itemsBitacora.length - 1
  //       ];
  //     if (Object.keys(dataUltimaBitacora).length) {
  //       vm.$store.state.bitacora_id_bitacora =
  //         dataUltimaBitacora.id_bitacora + 1;
  //     }
  //   } else {
  //     vm.disabledBotonBitacora = true;
  //   }
  // }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _handleFlagComentarioManual() {
  if (housesStore.bitacora_comentario_flag) {
    housesStore.bitacora_comentario_predefinido = null as never;
  }
}
async function _setBitacora() {
  if (!housesStore.bitacora_id_bitacora) {
    Swal.fire("", "¡La bitacora es requerida!", "error");
  } else {
    let ok = true;
    if (housesStore.itemsBitacora.length == 0) {
      ok =
        housesStore.itemsBitacoraLineal[0]!.id ==
        housesStore.bitacora_id_bitacora;
    }

    if (housesStore.itemsBitacora.length > 0) {
      const index = housesStore.itemsBitacoraLineal.findIndex(
        (v: BitacoraLinealHouse) => v.id == housesStore.bitacora_id_bitacora
      );
      const preBitacora = housesStore.itemsBitacoraLineal[index - 1];
      ok = preBitacora
        ? housesStore.itemsBitacora.some(
            (v: RegistroBitacoraHouse) => v.orden == preBitacora.orden
          )
        : true;
    }
    // return;
    if (!ok) {
      Swal.fire(
        "",
        "¡Debe registrar las bitácoras en el orden que aparecen en la lista!",
        "error"
      );
    } else if (
      housesStore.bitacora_comentario_flag &&
      !housesStore.bitacora_comentario
    ) {
      Swal.fire("", "¡El comentario es requerido!", "error");
    } else {
      loadingBotonBitacora.value = !loadingBotonBitacora.value;

      const data = {
        id_house: route.params.id,
        id_bitacora: housesStore.bitacora_id_bitacora,
        id_comentario: !housesStore.bitacora_comentario_flag
          ? housesStore.bitacora_comentario_predefinido.id
          : "",
        comentario: housesStore.bitacora_comentario_flag
          ? housesStore.bitacora_comentario
          : "",
        fecha: housesStore.bitacora_fecha,
        visible_cliente: housesStore.bitacora_visible_cliente,
      };
      
      // return;
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

onMounted(async () => {
  await housesStore._getHouseBitacora().then(() => {
    _setDefaultBitacora();
  });
  pricingStore.getModality();
  pricingStore.getShipment();
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
            v-model="housesStore.bitacora_id_bitacora"
            @click:append="abrirRegistroBitacora"
            :items="housesStore.itemsBitacoraLineal"
            item-title="name"
            item-value="id"
            label="Estatus del embarque"
          >
            <template #item="{ item, props }">
              <!-- @vue-expect-error item is unknown because the items come from untyped root state -->
              <v-list-item
                v-bind="props"
                role="option"
                :title="item.name"
              >
                <template #prepend>
                  <v-avatar
                    :class="existeEnBitacora(item) ? 'bg-selected' : 'bg-indigo'"
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
          <!-- @click:append-outer="abrirRegistroBitacora" -->
          <!-- @click:append-outer="iraComentarioManual" -->
          <v-autocomplete
            :items="ObtenerComentariosPredifinidos()"
            item-title="descripcion"
            item-value="id"
            label="Seleccione un comentario predefinido"
            v-model="housesStore.bitacora_comentario_predefinido"
            content-class="custom-autocomplete-menu"
            v-if="housesStore.bitacora_id_bitacora"
            return-object
            @update:model-value="activarComentarioFlag"
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
                :disabled="isFormActionsDisabled"
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
            :disabled="isFormActionsDisabled"
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-btn
            color="primary"
            block
            :loading="loadingBotonBitacora"
            @click="_setBitacora"
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
                  <th class="text-left">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in bitacoraLimitada"
                  :key="item.id"
                >
                  <td>{{ item.namebitacora }}</td>
                  <td>{{ item.comentario }}</td>
                  <td>{{ item.date }}</td>
                  <td>
                    <v-switch
                      density="compact"
                      color="primary"
                      v-model="item.visible_cliente"
                      :value-comparator="(value, checked) => Boolean(value) === checked"
                      @update:model-value="_changeStatusVisibleBitacora(item)"
                      :disabled="isFormActionsDisabled"
                    />
                  </td>
                  <td class="text-center">
                    <v-icon
                      class="btn_add"
                      size="small"
                      color="red"
                      @click="_deleteBitacora(item.id)"
                      :disabled="isFormActionsDisabled"
                    >
                      mdi-delete
                    </v-icon>
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
                    <th class="text-left">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in bitacoraOrdenada"
                    :key="item.id"
                  >
                    <td>{{ item.namebitacora }}</td>
                    <td>{{ item.comentario }}</td>
                    <td>{{ item.date }}</td>
                    <td>
                      <v-switch
                        density="compact"
                        color="primary"
                        v-model="item.visible_cliente"
                        :value-comparator="(value, checked) => Boolean(value) === checked"
                        @update:model-value="_changeStatusVisibleBitacora(item)"
                        :disabled="isFormActionsDisabled"
                      />
                    </td>
                    <td class="text-center">
                      <v-icon
                        class="btn_add"
                        size="small"
                        color="red"
                        @click="_deleteBitacora(item.id)"
                        :disabled="isFormActionsDisabled"
                      >
                        mdi-delete
                      </v-icon>
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
      <!-- Botones de Tracking movidos a sección de Acciones en controlHouse.vue -->
    </v-container>

    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          primary-title
          v-if="!id"
        >
          Agregar Status
        </v-card-title>
        <v-card-title
          primary-title
          v-else
        >
          Editar Status
        </v-card-title>
        <v-card-text>
          <v-form ref="frmStatus">
            <v-row>
              <v-col cols="6">
                <v-autocomplete
                  :items="pricingStore.listModality"
                  label="Sentido*"
                  item-title="name"
                  item-value="id"
                  v-model="id_modality"
                  @update:model-value="obtenerOrden()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="6">
                <v-autocomplete
                  :items="pricingStore.listShipment"
                  label="Tipo de Embarque*"
                  item-title="embarque"
                  item-value="id"
                  v-model="id_shipment"
                  @update:model-value="obtenerOrden"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Estatus"
                  v-model="name"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-if="nroorden"
                  label="Orden"
                  type="number"
                  v-model="nroorden"
                  :rules="[
                    (v) => !!v || 'Dato Requerido',
                    (v) => v > 0 || 'No puede ser 0 o menor',
                  ]"
                  min="1"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <h4>Incoterms</h4>
              </v-col>
              <v-col
                cols="12"
                v-if="errorInconterms"
              >
                <span class="text-red">
                  {{ errorInconterms }}
                </span>
              </v-col>
            </v-row>
            <v-row>
              <v-checkbox
                row
                label="EXW"
                class="mx-2"
                v-model="exw"
                :value="true"
              />
              <v-checkbox
                row
                label="FOB"
                class="mx-2"
                v-model="fob"
                :value="true"
              />
              <v-checkbox
                row
                label="FCA"
                class="mx-2"
                v-model="fca"
                :value="true"
              />
              <v-checkbox
                row
                label="CFR"
                class="mx-2"
                v-model="cfr"
                :value="true"
              />
              <v-checkbox
                row
                label="CIF"
                class="mx-2"
                v-model="cif"
                :value="true"
              />
              <v-checkbox
                row
                label="DDP"
                class="mx-2"
                v-model="ddp"
                :value="true"
              />
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn
                  color="success"
                  :disabled="anadirComentarioFlag"
                  size="small"
                  @click="anadirComentario()"
                >
                  Añadir Comentario
                </v-btn>
              </v-col>
              <v-col cols="12">
                <v-table>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Comentario</th>
                      <th>Mover</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in items"
                      :key="index"
                    >
                      <td>{{ index + 1 }}</td>
                      <td>
                        <v-textarea
                          auto-grow
                          v-model="item.descripcion"
                          density="compact"
                          hide-details
                          variant="solo"
                          rows="1"
                          :id="`description${index}`"
                        />
                      </td>
                      <td>
                        <v-btn
                          variant="text"
                          color="error"
                          icon
                          @click="moveUp(index)"
                          :disabled="index === 0"
                        >
                          <v-icon>mdi-arrow-up-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          variant="text"
                          color="success"
                          icon
                          @click="moveDown(index)"
                          :disabled="index === items.length - 1"
                        >
                          <v-icon>mdi-arrow-down-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          variant="text"
                          icon
                          color="error"
                          @click="eliminarComentario(item, index)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions v-if="!id">
          <v-spacer />
          <v-btn
            size="small"
            class="mx-1"
            color="success"
            @click="guardarStatus()"
          >
            Guardar
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            color="error"
            @click="dialog = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
        <v-card-actions v-else>
          <v-spacer />
          <v-btn
            size="small"
            class="mx-1"
            color="success"
            @click="guardarStatus()"
          >
            Actualizar
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            color="error"
            @click="dialog = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card class="pa-5">
        <v-row no-gutters>
          <v-col cols="12"> <p>Estado House</p> </v-col>
          <v-col cols="6">
            <v-row>
              <v-col cols="12" class="py-1">
                <v-text-field
                  outlined
                  dense
                  label="Descripción Estado"
                  hide-details
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-0"> Tipo de embarque* </v-col>
            </v-row>
          </v-col>
          <v-col cols="6" class="px-5">
            <v-row>
              <v-col cols="12" class="py-0 my-0"> Incoterms </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="EXW"
                  class="mx-2 py-0"
                  v-model="exw"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="FOB"
                  class="mx-2 py-0"
                  v-model="fob"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="FCA"
                  class="mx-2 py-0"
                  v-model="fca"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="CFR"
                  class="mx-2 py-0"
                  v-model="cfr"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="CIF"
                  class="mx-2 py-0"
                  v-model="cif"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
              <v-col cols="12" class="py-0 my-0">
                <v-checkbox
                  label="DDP"
                  class="mx-2 py-0"
                  v-model="ddp"
                  :value="true"
                  dense
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="4">sss</v-col>
        </v-row>
      </v-card>
    </v-dialog> -->
  </div>
</template>

<style scoped>
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
.wrap-text {
  white-space: normal !important;
}
.custom-autocomplete-menu {
  width: auto;
  max-width: 500px; /* Ancho máximo */
  white-space: normal;
}
.bg-selected {
  background: #1b5e20 !important;
  color: white !important;
  width: 100%;
}
</style>
