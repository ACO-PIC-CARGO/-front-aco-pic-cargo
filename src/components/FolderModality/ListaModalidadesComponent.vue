<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useModalityStore } from "@/stores/modality";
import type { FiltroModalidad, FormModalidad, Modalidad } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";

const modalityStore = useModalityStore();
const appStore = useAppStore();

const headers = [
  { title: "Código", align: "start", key: "code" },
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
const records = ref<FiltroModalidad>({
  code: "",
  name: "",
  description: "",
  status: 1,
});
const record = ref<FormModalidad>({
  id_branch: sessionBranchId(),
  code: "",
  name: "",
  description: "",
  status: 1,
});
const showFilterDrawerNew = ref(false);
const showFilterDrawerRead = ref(false);
const showFilterDrawerUpdate = ref(false);
const showFilterDrawer = ref(false);
const id = ref<number | "">("");
const formNew = useTemplateRef("formNew");
const form = useTemplateRef("form");

watch(
  () => modalityStore.record,
  (newRecord) => {
    if (newRecord && Object.keys(newRecord).length > 0) {
      const { code, name, description, status } = newRecord;
      record.value = { code, name, description, status };
      loading_as.value = false;
    }
  },
  { immediate: true },
);
watch(
  () => modalityStore.loading,
  (newList) => {
    loading.value = newList == true ? false : true;
  },
  { immediate: true },
);

const originalRecord = ref<FormModalidad>({ ...record.value });
const originalRecords = ref<FiltroModalidad>({ ...records.value });

onMounted(async () => {
  await modalityStore.fetchDataModality(records.value);
  appStore.mainTitle = `Modalidad`;
});

function updateStatus(newValue: unknown) {
  record.value.status = newValue ? 1 : 0;
}
async function submit_insert() {
  if ((await formNew.value!.validate()).valid) {
    resetRecord("filter");
    await modalityStore.insertModality(record.value);
  }
}
async function resetRecord(option?: string) {
  if (option == "filter") {
    records.value = { ...originalRecords.value };
  } else {
    record.value = { ...originalRecord.value };
  }
  await modalityStore.fetchDataModality(records.value);
  showFilterDrawer.value = false;
}

async function reset_records() {
  resetRecord("filter");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function switch_status(item: Modalidad) {
  const status = item.status;
  record.value.status = status ? 1 : 0;

  const data = {
    id: item.id,
    id_branch: sessionBranchId(),
    code: item.code,
    name: item.name,
    description: item.description,
    status: record.value.status,
  };

  if (record.value.status == 0) {
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
        resetRecord("filter");
        await modalityStore.updateModality(data);
      } else {
        item.status = !status;
      }
    });
  } else {
    resetRecord("filter");
    await modalityStore.updateModality(data);
  }
}
async function open_read(itemId: number) {
  showFilterDrawerRead.value = !showFilterDrawerRead.value;
  await modalityStore.readModality(itemId);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function open_update(itemId: number) {
  loading_as.value = true;
  resetForms();
  showFilterDrawerUpdate.value = !showFilterDrawerUpdate.value;
  await modalityStore.readModality(itemId);
  id.value = itemId;
}
async function submit_update() {
  if ((await form.value!.validate()).valid) {
    const data = {
      id: id.value as number,
      id_branch: sessionBranchId(),
      code: record.value.code,
      name: record.value.name,
      description: record.value.description,
      status: record.value.status,
    };
    resetRecord("filter");
    await modalityStore.updateModality(data);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function open_new() {
  resetRecord();
  resetForms();
  showFilterDrawerNew.value = !showFilterDrawerNew.value;
}
function open_filter() {
  showFilterDrawer.value = !showFilterDrawer.value;
}
async function submit_filter() {
  const data = { ...records.value };
  data.status = data.status == "null" ? "" : data.status;
  if (data.code === null) data.code = "";
  if (data.name === null) data.name = "";
  if (data.description === null) data.description = "";

  await modalityStore.fetchDataModality(data);
  showFilterDrawer.value = false;
}
function validateCode(v: string | null | undefined) {
  if (!v) {
    return "El Código es requerido";
  } else if (v.length > 3) {
    return "El Código permite hasta 3 caracteres";
  } else {
    return true;
  }
}
function validateName(v: string | null | undefined) {
  if (!v) {
    return "El nombre es requerido";
  } else if (v.length > 50) {
    return "El nombre permite hasta  50 caracteres ";
  } else {
    return true;
  }
}
function validateDescription(v: string | null | undefined) {
  if (!v) {
    return true;
  } else if (v.length > 50) {
    return "La descripción permite hasta 50 caracteres";
  }
  return true;
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
        <!-- <v-btn small color="success" @click="open_new()">
          Nuevo
        </v-btn> -->
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
        :items="modalityStore.list"
        item-value="id"
        :search="search"
      >
        <template #[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template #[`item.action`]="{ item }">
          <!-- <v-btn icon>
            <v-icon  color="warning" @click="open_update(item.id)">mdi-pencil</v-icon>
          </v-btn> -->
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
          <!-- <v-btn icon>
            <v-switch
              v-model="item.status"
              color="success"
              @change="switch_status(item)"
            ></v-switch>
          </v-btn> -->
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
          Nueva Modalidad
        </v-list-item-title>
      </v-list-item>

      <v-spacer />

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="record.code"
                :rules="[(v) => validateCode(v)]"
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
              label="Activo/Inactivo"
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
            Ver: {{ modalityStore.record.name }}
          </v-list-item-title>
        </v-list-item>

        <v-spacer />
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="modalityStore.record.code"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :model-value="modalityStore.record.name"
            />
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="modalityStore.record.description"
            />
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!modalityStore.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="modalityStore.record.status"
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
            Modificar: {{ modalityStore.record.name }}
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
              label="Activo / Inactivo"
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
            size="small"
            class="mx-1"
            color="success"
            @click="submit_filter()"
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
