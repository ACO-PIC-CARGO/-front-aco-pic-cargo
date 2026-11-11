<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useDialogSave } from "@/composables/useDialogSave";
import { usePermissions } from "@/composables/usePermissions";
import { useTipoProveedorStore } from "@/stores/tipoProveedor";
import type { FiltroTipoProveedor, TipoProveedor, TipoProveedorForm } from "@/types/tipoProveedor";
import { hasFailed, notifySuccess } from "@/utils/request";

const SCREEN = "tipoProveedor";
const NAME_MAX = 100;
const headers = [
  { title: "Acciones", key: "actions", sortable: false },
  { title: "Código", key: "code" },
  { title: "Nombre", key: "name" },
  { title: "Descripción", key: "description" },
  { title: "Estado", key: "status", align: "center" },
  { title: "Creación", key: "created_at" },
  { title: "Última Actualización", key: "updated_at" },
] as const;
const STATUS_OPTIONS = [
  { label: "Activo", value: 1, color: "green" },
  { label: "Inactivo", value: 0, color: "red" },
  { label: "Todos", value: null, color: "blue" },
];

const store = useTipoProveedorStore();
const { tipos } = storeToRefs(store);
const { can } = usePermissions();
const canCreate = can(SCREEN, "NUEVO");
const canEdit = can(SCREEN, "MODIFICAR");
const canDelete = can(SCREEN, "ELIMINAR");

const emptyFilters = (): FiltroTipoProveedor => ({ code: "", name: "", status: 1 });
const emptyDraft = (): TipoProveedorForm => ({
  id: null,
  code: null,
  id_proveedor: null,
  name: "",
  description: "",
  status: 1,
});

const loading = shallowRef(false);
const search = shallowRef("");
const filterDrawer = shallowRef(false);
const filters = ref<FiltroTipoProveedor>(emptyFilters());

const drawer = shallowRef(false);
const draft = ref<TipoProveedorForm>(emptyDraft());
const form = useTemplateRef("form");
const { saving, serverError, save } = useDialogSave(drawer, form, persist);
const isNew = computed(() => !draft.value.id);
const nameRules = [(value: string) => (value ?? "").trim().length > 0 || "Escribe el nombre del tipo de proveedor."];

const isActive = (tipo: TipoProveedor) => Number(tipo.status) === 1;
const day = (value: string | null) => (value ? value.slice(0, 10) : "");

async function load() {
  loading.value = true;
  const answer = await store.loadTipos(filters.value);
  loading.value = false;
  if (hasFailed(answer)) Swal.fire({ icon: "error", text: answer.mensaje });
}

async function applyFilters() {
  filterDrawer.value = false;
  await load();
}

async function clearFilters() {
  filters.value = emptyFilters();
  await applyFilters();
}

async function openForm(tipo?: TipoProveedor) {
  draft.value = tipo
    ? {
        id: tipo.id,
        code: tipo.code,
        id_proveedor: tipo.id_proveedor,
        name: tipo.name,
        description: tipo.description ?? "",
        status: Number(tipo.status),
      }
    : emptyDraft();
  serverError.value = "";
  drawer.value = true;
  await nextTick();
  form.value?.resetValidation();
}

async function persist() {
  const answer = await store.saveTipo({
    ...draft.value,
    name: draft.value.name.trim(),
    description: (draft.value.description ?? "").trim(),
  });
  if (!answer.estadoflag) return answer.mensaje;
  notifySuccess(answer.mensaje);
  await load();
  return null;
}

async function remove(tipo: TipoProveedor) {
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    titleText: `¿Eliminar el tipo de proveedor «${tipo.name}»?`,
    text: "Ya no podrás asignarlo a los proveedores.",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!isConfirmed) return;
  const answer = await store.deleteTipo(tipo);
  if (answer.estadoflag) notifySuccess(answer.mensaje);
  else Swal.fire({ icon: "warning", text: answer.mensaje });
  await load();
}

onMounted(load);
</script>

<template>
  <v-card
    class="tipo-card px-5"
    elevation="2"
  >
    <div class="tipo-toolbar">
      <v-text-field
        v-model="search"
        class="tipo-search"
        prepend-inner-icon="mdi-magnify"
        label="Buscar tipo de proveedor"
        variant="outlined"
        density="compact"
        single-line
        hide-details
        clearable
      />
      <v-spacer />
      <v-btn
        class="tipo-filter-button"
        variant="flat"
        prepend-icon="mdi-filter-outline"
        @click="filterDrawer = true"
      >
        Filtrar
      </v-btn>
      <v-btn
        v-if="canCreate"
        class="tipo-new-button"
        color="#075ae0"
        prepend-icon="mdi-plus"
        @click="openForm()"
      >
        Nuevo
      </v-btn>
    </div>

    <v-data-table
      class="tipo-table mb-4"
      :headers="headers"
      :items="tipos"
      item-value="id"
      :search="search"
      :loading="loading"
      loading-text="Cargando tipos de proveedor…"
      no-data-text="No hay tipos de proveedor para mostrar."
      hover
    >
      <template #[`item.actions`]="{ item }">
        <div class="d-flex align-center ga-1">
          <v-btn
            v-if="canEdit"
            class="tipo-action tipo-action-edit"
            variant="flat"
            size="small"
            icon="mdi-pencil"
            :aria-label="`Editar ${item.name}`"
            @click="openForm(item)"
          />
          <v-btn
            v-if="canDelete && isActive(item)"
            class="tipo-action tipo-action-delete"
            variant="flat"
            size="small"
            icon="mdi-delete"
            :aria-label="`Eliminar ${item.name}`"
            @click="remove(item)"
          />
        </div>
      </template>
      <template #[`item.status`]="{ item }">
        <v-chip
          size="small"
          :color="isActive(item) ? 'success' : 'grey'"
          :prepend-icon="isActive(item) ? 'mdi-check-circle' : 'mdi-close-circle'"
        >
          {{ isActive(item) ? "Activo" : "Inactivo" }}
        </v-chip>
      </template>
      <template #[`item.created_at`]="{ item }">
        {{ day(item.created_at) }}
      </template>
      <template #[`item.updated_at`]="{ item }">
        {{ day(item.updated_at) }}
      </template>
    </v-data-table>

    <v-navigation-drawer
      v-model="filterDrawer"
      class="tipo-filter-drawer"
      location="right"
      temporary
      width="380"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar tipos de proveedor
        </v-list-item-title>
      </v-list-item>
      <v-container class="d-flex flex-column ga-2">
        <v-text-field
          id="filtro-code"
          v-model="filters.code"
          label="Código"
          clearable
        />
        <v-text-field
          id="filtro-name"
          v-model="filters.name"
          label="Nombre"
          clearable
        />
        <div class="text-label-large">
          Estado
        </div>
        <v-radio-group
          v-model="filters.status"
          inline
          density="compact"
          hide-details
        >
          <v-radio
            v-for="option in STATUS_OPTIONS"
            :key="option.label"
            :label="option.label"
            :color="option.color"
            :value="option.value"
          />
        </v-radio-group>
      </v-container>
      <v-card-actions class="justify-end px-4">
        <v-btn
          color="success"
          variant="flat"
          @click="applyFilters"
        >
          Aceptar
        </v-btn>
        <v-btn @click="clearFilters">
          Limpiar
        </v-btn>
        <v-btn
          color="warning"
          @click="filterDrawer = false"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="drawer"
      class="tipo-drawer"
      location="right"
      temporary
      width="420"
    >
      <v-form
        ref="form"
        @submit.prevent="save"
      >
        <v-card flat>
          <v-card-title class="text-headline-small pt-5 px-6">
            {{ isNew ? "Nuevo tipo de proveedor" : "Editar tipo de proveedor" }}
          </v-card-title>
          <v-card-text class="px-6">
            <v-text-field
              v-if="!isNew"
              :model-value="draft.code"
              label="Código"
              readonly
              variant="plain"
            />
            <v-text-field
              id="tipo-name"
              v-model="draft.name"
              label="Nombre"
              :rules="nameRules"
              :counter="NAME_MAX"
              :maxlength="NAME_MAX"
              autofocus
            />
            <v-textarea
              id="tipo-description"
              v-model="draft.description"
              label="Descripción"
              rows="2"
              auto-grow
            />
            <v-switch
              v-if="!isNew"
              v-model="draft.status"
              color="success"
              density="compact"
              hide-details
              :true-value="1"
              :false-value="0"
              :label="draft.status == 1 ? 'Activo' : 'Inactivo'"
            />
            <v-alert
              v-if="serverError"
              type="warning"
              variant="tonal"
              class="mt-4"
              :text="serverError"
            />
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-spacer />
            <v-btn
              variant="text"
              @click="drawer = false"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="success"
              variant="flat"
              :loading="saving"
            >
              {{ isNew ? "Crear tipo" : "Guardar cambios" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-navigation-drawer>
  </v-card>
</template>

<style scoped>
.tipo-card {
  border-radius: 18px;
}

.tipo-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 4px 16px;
}

.tipo-search {
  flex: 0 1 400px;
  min-width: 220px;
}

.tipo-toolbar .v-btn {
  text-transform: none;
  letter-spacing: normal;
}

.tipo-filter-button {
  color: #17448e;
  background-color: #e8f0fe;
}

.tipo-new-button {
  font-weight: 600;
}

.tipo-table {
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  overflow: hidden;
}

.tipo-table :deep(thead th) {
  color: #14264e;
  background-color: #e8effb !important;
  font-weight: 700 !important;
}

.tipo-table :deep(tbody tr:nth-of-type(even)) {
  background-color: #f5f7fb;
}

.tipo-action {
  border-radius: 9px;
}

.tipo-action-edit {
  color: #ad5700 !important;
  background-color: #fff3da !important;
}

.tipo-action-delete {
  color: #bd2424 !important;
  background-color: #ffebeb !important;
}
</style>
