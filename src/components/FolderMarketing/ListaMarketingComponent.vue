<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import type { Ref } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import { useMarketingStore } from "@/stores/marketing";
import type { ApiResponse } from "@/types/api";
import type { FiltroMarketing, FormMarketing, Marketing } from "@/types/catalogos";
import { sessionBranchId } from "@/utils/sesion";
import { usePermissions } from "@/composables/usePermissions";

const marketingStore = useMarketingStore();
const { can } = usePermissions();
const appStore = useAppStore();

const headers = [
  { title: "Acciones", key: "action", sortable: false },
  { title: "Código", align: "start", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Posición (Orden)", key: "position" },
  { title: "Estado", key: "status" },
  { title: "Creación", key: "created_at" },

  { title: "Última Actualización", key: "updated_at" },
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
const saving = ref(false);
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
  appStore.mainTitle = `Tipo de Marketing`;
});

async function exportar() {
  await marketingStore.ExportMarketing(marketing_list.value);
}
function marketingActivo(status: unknown): boolean {
  return status === 1 || status === true || status === "1";
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
async function save(form: typeof formNew.value, saveRecord: (data: FormMarketing) => Promise<boolean>, drawer: Ref<boolean>) {
  if (saving.value) return;
  saving.value = true;
  try {
    if (!(await form!.validate()).valid || !(await saveRecord(marketing.value))) return;
    drawer.value = false;
    await clear("filter");
  } finally {
    saving.value = false;
  }
}
function submit_insert() {
  return save(formNew.value, marketingStore.insertMarketing, showFilterDrawerNew);
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
  return save(form.value, marketingStore.updateMarketing, showFilterDrawerUpdate);
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
      await marketingStore.updateMarketing({ ...item, status: 0 });
      await clear("filter");
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
    // Restores the form copy into the filter.
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
  <v-card class="marketing-list-card px-5">
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
        class="marketing-list-toolbar d-flex align-center flex-wrap"
      >
        <v-text-field
          class="marketing-list-search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar marketing"
          variant="outlined"
          density="compact"
          single-line
          hide-details
          clearable
          v-model="search"
        />
        <v-spacer />
        <v-btn
          v-if="can('listMarketing', 'EXPORTAR')"
          class="marketing-export-button"
          variant="flat"
          prepend-icon="mdi-download"
          @click="exportar"
        >
          Exportar
        </v-btn>
        <v-btn
          class="marketing-filter-button"
          variant="flat"
          prepend-icon="mdi-filter-outline"
          @click="open_filter()"
        >
          Filtrar
        </v-btn>
        <v-btn
          v-if="can('listMarketing', 'NUEVO')"
          class="marketing-new-button"
          color="#075ae0"
          prepend-icon="mdi-plus"
          @click="open_insert()"
        >
          Nuevo
        </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="marketing-list-table"
        :headers="headers"
        :items="marketingStore.list"
        item-value="id"
        :search="search"
        :items-per-page="10"
      >
        <template #[`item.status`]="{ item }">
          <v-chip
            size="small"
            :color="marketingActivo(item.status) ? 'success' : 'grey'"
            :prepend-icon="marketingActivo(item.status) ? 'mdi-check-circle' : 'mdi-close-circle'"
          >
            {{ marketingActivo(item.status) ? "Activo" : "Inactivo" }}
          </v-chip>
        </template>
        <template #[`item.action`]="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              class="marketing-action marketing-action-view"
              variant="flat"
              size="small"
              icon="mdi-eye"
              color="primary"
              aria-label="Ver marketing"
              @click="open_read(item.id)"
            />
            <v-btn
              v-if="can('listMarketing', 'MODIFICAR')"
              class="marketing-action marketing-action-edit"
              variant="flat"
              size="small"
              icon="mdi-pencil"
              color="warning"
              aria-label="Editar marketing"
              @click="open_update(item.id)"
            />
            <v-btn
              v-if="marketingActivo(item.status) && can('listMarketing', 'ELIMINAR')"
              class="marketing-action marketing-action-delete"
              variant="flat"
              size="small"
              icon="mdi-delete"
              color="error"
              aria-label="Inactivar marketing"
              @click="switch_status(item)"
            />
          </div>
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
            :loading="saving"
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
            :loading="saving"
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

<style scoped>
.marketing-list-card {
  border-radius: 18px;
}

.marketing-list-toolbar {
  gap: 12px;
  padding: 20px 4px 16px;
}

.marketing-list-search {
  flex: 0 1 400px;
  min-width: 220px;
}

.marketing-list-toolbar .v-btn {
  text-transform: none;
  letter-spacing: normal;
}

.marketing-filter-button {
  color: #17448e;
  background-color: #e8f0fe;
}

.marketing-export-button {
  color: #00695c;
  background-color: #e0f2f1;
}

.marketing-new-button {
  font-weight: 600;
}

.marketing-list-table {
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  overflow: hidden;
}

.marketing-list-table :deep(> .v-table__wrapper > table > thead) {
  color: #14264e;
  background-color: #e8effb;
}

.marketing-list-table :deep(> .v-table__wrapper > table > tbody > tr:nth-of-type(even)) {
  background-color: #f5f7fb;
}

.marketing-list-table :deep(> .v-table__wrapper > table > tbody > tr > td) {
  padding-top: 8px;
  padding-bottom: 8px;
}

.marketing-action {
  border-radius: 9px;
}

.marketing-action-view {
  color: #0758b8 !important;
  background-color: #e8efff !important;
}

.marketing-action-edit {
  color: #ad5700 !important;
  background-color: #fff3da !important;
}

.marketing-action-delete {
  color: #bd2424 !important;
  background-color: #ffebeb !important;
}
</style>
