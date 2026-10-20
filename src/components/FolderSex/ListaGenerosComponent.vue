<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import { useSexStore } from "@/stores/sex";
import type { ApiResponse } from "@/types/api";
import type { FiltroSexo, FormSexo, Sexo } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const sexStore = useSexStore();
const appStore = useAppStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
  { title: "Acrónimo", key: "acronym" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
  { title: "Acciones", key: "action" },
] as const;
const loading = ref(true);
const loading_as = ref(true);
const search = ref("");
const records = ref<FiltroSexo>({
  code: "",
  name: "",
  acronym: "",
  description: "",
  status: 1,
});
const record = ref<FormSexo>({
  id_branch: sessionBranchId(),
  acronym: "",
  name: "",
  code: "",
  description: "",
  status: 1,
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | "">("");
const errorAcronym = ref<string | null>(null);
const form1 = useTemplateRef("form1");
const form = useTemplateRef("form");

watch(
  () => sexStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      record.value.code = newRecord.code;
      record.value.acronym = newRecord.acronym;
      record.value.name = newRecord.name;
      record.value.description = newRecord.description;
      record.value.status = newRecord.status;
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => sexStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormSexo>({ ...record.value });
const originalRecords = ref<FiltroSexo>({ ...records.value });

onMounted(async () => {
  await sexStore.fetchDataSex(records.value);
  appStore.mainTitle = `Género`;
});

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
function insert() {
  validate_nuevo_acronym();
  setTimeout(async () => {
    if ((await form1.value!.validate()).valid && errorAcronym.value == null) {
      resetRecord("filter");
      await sexStore.insertSex(record.value);
    }
  }, 500);
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
  } else {
    record.value = { ...originalRecord.value };
  }
  await sexStore.fetchDataSex(records.value);
  showFilterDrawer.value = false;
}

async function reset_records() {
  resetRecord("filter");
}

async function switch_status(item: Sexo) {
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
      await sexStore.updateSex(item);
    }
  });
}
async function open_read(itemId: number) {
  loading_as.value = true;
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await sexStore.readSex(itemId);
}
async function open_update(itemId: number) {
  loading_as.value = true;
  errorAcronym.value = null;
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await sexStore.readSex(itemId);
  id.value = itemId;
}
async function btnUpdate() {
  validate_editar_acronym();
  setTimeout(async () => {
    if ((await form.value!.validate()).valid && errorAcronym.value == null) {
      const data = {
        id: id.value as number,
        id_branch: sessionBranchId(),
        acronym: record.value.acronym,
        name: record.value.name,
        description: record.value.description,
        status: record.value.status,
      };
      resetRecord("filter");
      await sexStore.updateSex(data);
    }
  }, 500);
}

function open_new() {
  loading_as.value = true;
  resetRecord();
  errorAcronym.value = null;
  if (form1.value) {
    form1.value.reset();
  }
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}

function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.code === null) data.code = "";
  if (data.acronym === null) data.acronym = "";
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";
  await sexStore.fetchDataSex(data);
  showFilterDrawer.value = false;
}
function validateAcronym(v: string | null | undefined) {
  if (!v) {
    return "El acrónimo es requerido";
  } else if (v.length > 4) {
    return "El acrónimo permite hasta 4 caracteres";
  } else {
    return true;
  }
}
function validateName(v: string | null | undefined) {
  if (!v) {
    return "El nombre es requerido";
  } else if (v.length > 255) {
    return "El nombre permite hasta  255 caracteres ";
  } else {
    return true;
  }
}
function validateDescription(v: string | null | undefined) {
  if (!v) {
    return true;
  } else if (v.length > 255) {
    return "La descripción permite hasta 255 caracteres";
  }
  return true;
}
async function validate_nuevo_acronym() {
  errorAcronym.value = null;

  await axios<ApiResponse>({
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar_nuevo_acronimo_sex?` +
      `acronym=${encodeURIComponent(String(record.value.acronym))}` +
      `&id_branch=${record.value.id_branch}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      const data = response.data;
      errorAcronym.value = data.estadoflag ? null : data.mensaje;
      if (!data.estadoflag) record.value.acronym = "";
    })
    .catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
}
async function validate_editar_acronym() {
  errorAcronym.value = null;

  await axios<ApiResponse>({
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `validar_editar_acronimo_sex?` +
      `id=${id.value}` +
      `&acronym=${encodeURIComponent(String(record.value.acronym))}` +
      `&id_branch=${record.value.id_branch}`,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      const data = response.data;
      errorAcronym.value = data.estadoflag ? null : data.mensaje;
      if (!data.estadoflag) record.value.acronym = "";
    })
    .catch((error) => {
      console.log("Error al obtener los datos:", error);
    });
}
function close_drawer(param: "new" | "update") {
  switch (param) {
    case "new":
      form1.value!.reset();
      showFilterDrawerNew.value = !showFilterDrawerNew.value;
      break;
    case "update":
      form.value!.reset();
      showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
      break;
  }
}
</script>

<template>
  <v-card
    fluid
    class="px-5"
  >
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
      :items="sexStore.list"
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

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Nuevo Género
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-form ref="form1">
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                @blur="validate_nuevo_acronym()"
                :rules="[(v) => validateAcronym(v)]"
                :error-messages="errorAcronym"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                clearable
              />
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              hide-details
              color="success"
              @update:model-value="updateStatus"
            />
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
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
            @click="close_drawer('new')"
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
            Ver: {{ sexStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="sexStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="sexStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              readonly
              :model-value="sexStore.record.acronym"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="sexStore.record.description"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!sexStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="sexStore.record.status"
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
            Modificar: {{ sexStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="record.code"
              readonly
            />
          </v-row>

          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                @blur="validate_editar_acronym()"
                :rules="[(v) => validateAcronym(v)]"
                :error-messages="errorAcronym"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                clearable
              />
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
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
            class="mx-1"
            color="success"
            @click="btnUpdate"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="warning"
            @click="close_drawer('update')"
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
              label="Código"
              v-model="records.code"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              v-model="records.acronym"
              clearable
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
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
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="success"
            @click="filter()"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            color="ligth"
            @click="reset_records()"
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
  </v-card>
</template>
