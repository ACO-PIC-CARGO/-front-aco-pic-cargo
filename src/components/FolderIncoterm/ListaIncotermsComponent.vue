<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useIncotermStore } from "@/stores/incoterm";
import type { FiltroIncoterms, FormIncoterm } from "@/types/catalogos";
import type { Incoterm } from "@/types/cotizacion";
import { sessionBranchId } from "@/utils/sesion";

const incotermStore = useIncotermStore();
const appStore = useAppStore();

const headers = [
  { title: "Código", align: "start", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroIncoterms>({
  name: "",
  description: "",
  status: 1,
});
const record = ref<FormIncoterm>({
  name: "",
  description: "",
  status: 1,
  id_branch: sessionBranchId(),
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<Incoterm["id"] | "">("");
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

watch(
  () => incotermStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { name, description, status } = newRecord;
      record.value = { name, description, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => incotermStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormIncoterm>({ ...record.value });
const originalRecords = ref<FiltroIncoterms>({ ...records.value });

onMounted(async () => {
  await incotermStore.fetchDataIncoterms(records.value);
  appStore.mainTitle = `Incoterm`;
});

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
async function insert() {
  if ((await formNew.value!.validate()).valid) {
    resetRecord("filter");
    await incotermStore.insertIncoterms(record.value);
  }
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
  } else {
    record.value = { ...originalRecord.value };
  }
  await incotermStore.fetchDataIncoterms(records.value);
  showFilterDrawer.value = false;
}
async function reset_records() {
  resetRecord("filter");
}
async function switch_status(item: Incoterm) {
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
      resetRecord("filter");
      await incotermStore.updateIncoterms(item);
    }
  });
}
async function open_read(itemId: Incoterm["id"]) {
  loading_as.value = true;
  resetRecord();
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await incotermStore.readIncoterms(itemId);
}
async function open_update(itemId: Incoterm["id"]) {
  loading_as.value = true;
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await incotermStore.readIncoterms(itemId);
  id.value = itemId;
}
async function btnUpdate() {
  const data = {
    id: id.value as Incoterm["id"],
    description: record.value.description,
    status: record.value.status,
    id_branch: sessionBranchId(),
  };
  if ((await form.value!.validate()).valid) {
    resetRecord("filter");
    await incotermStore.updateIncoterms(data);
  }
}
function open_new() {
  resetRecord();
  resetForms();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";

  await incotermStore.fetchDataIncoterms(data);
  showFilterDrawer.value = false;
}
function validateName(v: string | null) {
  const length = 3;
  if (!v) {
    return "El código es requerido";
  } else if (v.length > length) {
    return `El código debe tener un máximo de ${length} caracteres`;
  } else {
    return true;
  }
}
function validateDescription(v: string | null) {
  const length = 50;
  if (!v) {
    return "La descripción es requerida";
  } else if (v.length > length) {
    return `La descripción debe tener un máximo de ${length} caracteres`;
  } else {
    return true;
  }
}
function resetForms() {
  if (formNew.value) formNew.value.reset();
  if (form.value) form.value.reset();
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
          @click="open_new()"
        >
          Nuevo
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          @click="open_filter()"
        >
          Fitrar
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#004D40"
        >
          Exportar
        </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="incotermStore.list"
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
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Incoterm
        </v-list-item-title>
      </v-list-item>

      <v-spacer />
      <v-container class="">
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción (*)"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              label="Activo/Inactivo"
              v-model="record.status"
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
            @click="insert()"
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
            Ver: {{ incotermStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="incotermStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="incotermStore.record.description"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!incotermStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="incotermStore.record.status"
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
      v-model="showFilterDrawerUpdate"
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Modificar: {{ incotermStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="record.name"
              readonly
            />
          </v-row>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Descripción (*)"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            size="small"
            class="mx-1"
            color="success"
            @click="btnUpdate"
          >
            Aceptar
          </v-btn>
          <v-btn
            size="small"
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
      v-model="showFilterDrawer"
      location="right"
      temporary
      
      width="30%"
    >
      <v-container>
        <v-list-item class="px-0">
          <v-list-item-title class="text-headline-small">
            Filtrar Registros
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              v-model="records.name"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="records.description"
              clearable
            />
          </v-row>
          <v-row>
            <v-radio-group
              v-model="records.status"
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
            size="small"
            class="mx-1"
            color="success"
            @click="filter()"
          >
            Aceptar
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            color="ligth"
            @click="reset_records()"
          >
            Limpiar
          </v-btn>

          <v-btn
            size="small"
            class="mx-1"
            color="warning"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>
  </v-card>
</template>
