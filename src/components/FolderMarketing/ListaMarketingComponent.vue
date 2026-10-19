<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import axios from "@/api/http";
import { useMarketingStore } from "@/stores/marketing";
import type { ApiResponse } from "@/types/api";
import type { FiltroMarketing, FormMarketing, Marketing } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const marketingStore = useMarketingStore();
const rootStore = useStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Posición (Orden)", key: "position" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const showFilterDrawer = ref(false);
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const search = ref("");
const marketing_list = ref<FiltroMarketing>({
  name: "",
  description: "",
  position: "",
  status: 1,
});
const marketing = ref<FormMarketing>({
  id: "",
  id_branch: sessionBranchId(),
  name: "",
  description: "",
  position: "",
  status: 1,
});
const loading = ref(true);
const loading_as = ref(true);
const errorPosition = ref<string | null>(null);
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

watch(
  () => marketingStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { id, name, description, position, status } = newRecord;
      marketing.value = { id, name, description, position, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => marketingStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);
watch(
  showFilterDrawerNew,
  (newList) => {
    if (newList) {
      resetMarketing();
    }
  },
  { immediate: true },
);
watch(
  () => marketingStore.last_position,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      if (newRecord.maxposition! > 0) {
        marketing.value.position = newRecord.maxposition;
        loading_as.value = false;
      }
    }
  },
  { immediate: true },
);

const originalMarkting = ref<FormMarketing>({ ...marketing.value });
const originalMarktingList = ref<FiltroMarketing>({ ...marketing_list.value });

onMounted(async () => {
  await marketingStore.fetchDataMarketing(marketing_list.value);
  rootStore.state.mainTitle = `Tipo de Marketing`;
});

async function exportar() {
  await marketingStore.ExportMarketing(marketing_list.value);
}
function updateStatus(newValue: unknown) {
  marketing.value.status = newValue ? 1 : 0;
}
function open_insert() {
  loading_as.value = true;
  errorPosition.value = null;
  resetMarketing();
  resetForms();
  marketingStore.lastPositionMarketing();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
function submit_insert() {
  validateNuevoPositionAPI();
  setTimeout(async () => {
    if ((await formNew.value!.validate()).valid && errorPosition.value == null) {
      clear("filter");
      await marketingStore.insertMarketing(marketing.value);
    }
  }, 500);
}
async function open_read(id: number) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await marketingStore.readMarketing(id);
}
async function filtar() {
  const data = { ...marketing_list.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.name === null) data.name = "";
  if (data.position === null) data.position = "";
  if (data.description === null) data.description = "";
  await marketingStore.fetchDataMarketing(data);
  showFilterDrawer.value = false;
}
async function open_update(id: number) {
  loading_as.value = true;
  errorPosition.value = null;
  resetForms();
  await marketingStore.readMarketing(id);
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  marketing.value.id = id;
}
function submit_update() {
  validateEditarPositionAPI();
  setTimeout(async () => {
    if ((await form.value!.validate()).valid && errorPosition.value == null) {
      clear("filter");
      await marketingStore.updateMarketing(marketing.value);
    }
  }, 500);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function object_to_update(initialObject: Record<string, unknown>, finalObject: Record<string, unknown>) {
  const fields = Object.keys(finalObject);
  fields.forEach((field) => {
    finalObject[field] = initialObject[field];
    finalObject["id_branch"] = sessionBranchId();
  });
}
async function switch_status(item: Marketing) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
    confirmButtonColor: "red",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, inactivar",
    cancelButtonColor: "orange",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      item.status = 0;
      clear("filter");
      await marketingStore.updateMarketing(item);
    }
  });
}
async function validateNuevoPositionAPI() {
  await axios<ApiResponse>({
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar_nuevo_posicion_marketing?` +
      `id_branch=${sessionBranchId()}` +
      `&position=${marketing.value.position}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      const data_res = response.data;
      errorPosition.value = data_res.estadoflag ? null : data_res.mensaje;
      if (!data_res.estadoflag) marketing.value.position = "";
    })
    .catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
}
async function validateEditarPositionAPI() {
  await axios<ApiResponse>({
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar_editar_posicion_marketing?` +
      `id=${marketing.value.id}` +
      `&id_branch=${sessionBranchId()}` +
      `&position=${marketing.value.position}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      const data_res = response.data;
      errorPosition.value = data_res.estadoflag ? null : data_res.mensaje;
      if (!data_res.estadoflag) marketing.value.position = "";
    })
    .catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
}
function resetMarketing() {
  Object.assign(marketing.value, originalMarkting.value);
  Object.assign(marketing_list.value, originalMarktingList.value);
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
function validateName(v: string | null | undefined) {
  const length = 150;
  if (!v) {
    return "El nombre es requerido";
  } else if (v.length > length) {
    return `El nombre debe tener un máximo de ${length} caracteres`;
  } else {
    return true;
  }
}
function validateDescription(v: string | null | undefined) {
  const length = 455;
  if (!v) {
    return true;
  } else if (v.length > length) {
    return `La descripción debe tener un máximo de ${length} caracteres`;
  }
  return true;
}
function validatePosition(v: number | string | null | undefined) {
  if (!v) {
    return "La posición es requerida";
  } else {
    return true;
  }
}
async function clear(option?: string) {
  if (option == "filter") {
    // Kept: restores the form copy into the filter, as the Options version did.
    marketing_list.value = { ...originalMarkting.value } as unknown as FiltroMarketing;
  } else {
    marketing.value = { ...originalMarktingList.value } as unknown as FormMarketing;
  }
  await marketingStore.fetchDataMarketing(marketing_list.value);
  showFilterDrawer.value = false;
}
function resetForms() {
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function reset_records() {
  clear("filter");
  filtar();
}
</script>

<template>
  <v-card
    fluid
    class="px-5"
  >
    <v-card elevation="0">
      <v-container
        v-if="loading"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              rounded
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-card-title
        v-if="!loading"
        class="elevation-0 d-flex align-center flex-wrap"
      >
        <v-text-field
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          v-model="search"
        />
        <v-spacer />
        <v-btn
          size="small"
          color="success"
          @click="open_insert()"
        >
          Nuevo
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          @click="open_filter()"
        >
          Filtrar
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#004D40"
          @click="exportar"
        >
          Exportar
        </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="marketingStore.list"
        item-value="id"
        :search="search"
      >
        <template #[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="primary"
              @click="open_read(item.id)"
            >
              mdi-eye
            </v-icon>
          </v-btn>
          <v-btn
            variant="text"
            icon
          >
            <v-icon
              color="warning"
              @click="open_update(item.id)"
            >
              mdi-pencil
            </v-icon>
          </v-btn>

          <v-btn
            variant="text"
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Modificar: {{ marketingStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="marketingStore.record.code"
            />
          </v-row>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="marketing.name"
                clearable
                :rules="[(v) => validateName(v)]"
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="marketing.description"
                clearable
                :rules="[(v) => validateDescription(v)]"
              />
            </v-row>
          </v-form>

          <v-row>
            <v-text-field
              type="number"
              label="Posición (*)"
              v-model="marketing.position"
              :rules="[(v) => validatePosition(v)]"
              @blur="validateEditarPositionAPI"
              :error-messages="errorPosition"
              clearable
            />
          </v-row>
          <v-row>
            <v-switch
              :label="`Estado: ${marketing.status ? 'Activo' : 'Inactivo'}`"
              v-model="marketing.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="submit_update()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container
        v-if="loading_as"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              rounded
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Ver: {{ marketingStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="marketingStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="marketingStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="marketingStore.record.description"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Posición"
              readonly
              :model-value="marketingStore.record.position"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!marketingStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="marketingStore.record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerRead = !showFilterDrawerRead"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container
        v-if="loading_as"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              rounded
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar Registros
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Nombre"
              v-model="marketing_list.name"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="marketing_list.description"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              type="number"
              label="Posición"
              v-model="marketing_list.position"
              clearable
            />
          </v-row>
          <v-row>
            <v-radio-group
              v-model="marketing_list.status"
              inline
              density="compact"
            >
              <v-radio
                label="Activo"
                color="green"
                :value="1"
              />
              <v-radio
                label="Inactivo"
                color="red"
                :value="0"
              />
              <v-radio
                label="Todos"
                color="blue"
                value="null"
              />
            </v-radio-group>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="filtar()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="ligth"
            @click="clear('filter')"
          >
            Limpiar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Tipo de Marketing
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container v-if="!loading_as">
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="marketing.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="marketing.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="number"
                min="1"
                label="Posición (*)"
                v-model="marketing.position"
                :rules="[(v) => validatePosition(v)]"
                clearable
                @blur="validateNuevoPositionAPI"
                :error-messages="errorPosition"
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${marketing.status ? 'Activo' : 'Inactivo'}`"
              v-model="marketing.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              hide-details
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="submit_insert()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerNew = !showFilterDrawerNew"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container
        v-if="loading_as"
        style="height: 400px"
      >
        <v-row class="fill-height align-content-center justify-center">
          <v-col
            class="text-body-large text-center"
            cols="12"
          >
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              rounded
              height="6"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>
  </v-card>
</template>
