<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { usePermissions } from "@/composables/usePermissions";
import { notifySuccess } from "@/utils/request";
import QuotePriorityChip from "@/components/folderPricing/QuotePriorityChip.vue";
import { priorityChipStyle } from "@/components/folderPricing/priorityColor";
import { deleteQuotePriority, listQuotePriorities, saveQuotePriority } from "./quotePriorityApi";
import type { QuotePriority } from "./quotePriorityApi";

type ColorKey = "color_all" | "color_requested" | "color_sent" | "color_returned";

const SCREEN = "quotePriorities";
const COLORS: { key: ColorKey; label: string }[] = [
  { key: "color_all", label: "Todas" },
  { key: "color_requested", label: "Solicitadas" },
  { key: "color_sent", label: "Enviadas" },
  { key: "color_returned", label: "Observadas" },
];
const HEADERS = [
  { title: "Nombre", key: "name" },
  ...COLORS.map(({ key, label }) => ({ title: label, key, sortable: false })),
  { title: "Orden", key: "position" },
  { title: "Activa", key: "active" },
  { title: "Acciones", key: "actions", sortable: false },
];
const DEFAULT_COLOR = "#9E9E9E";
const ORDER_HINT = "El 1 es la prioridad más importante. En Solicitadas por Ventas las cotizaciones se ordenan por este número, del más bajo al más alto.";

const appStore = useAppStore();
const { can } = usePermissions();

const priorities = ref<QuotePriority[]>([]);
const loading = ref(false);
const saving = ref(false);
const loadError = ref<string | null>(null);
const dialog = ref(false);
const draft = ref<QuotePriority>(emptyDraft());
const formError = ref<string | null>(null);

function emptyDraft(): QuotePriority {
  return {
    id: null,
    name: "",
    color_all: DEFAULT_COLOR,
    color_requested: DEFAULT_COLOR,
    color_sent: DEFAULT_COLOR,
    color_returned: DEFAULT_COLOR,
    position: priorities.value.length + 1,
    active: true,
  };
}

async function load() {
  loading.value = true;
  const response = await listQuotePriorities();
  loading.value = false;
  priorities.value = response.estadoflag ? response.data : [];
  loadError.value = response.estadoflag || response.tipomensaje === "TMSGINF" ? null : response.mensaje;
}

function openNew() {
  draft.value = emptyDraft();
  formError.value = null;
  dialog.value = true;
}

function openEdit(priority: QuotePriority) {
  draft.value = { ...priority };
  formError.value = null;
  dialog.value = true;
}

const hexOnly = (color: string) => color.slice(0, 7);

async function save() {
  if (!draft.value.name.trim()) {
    formError.value = "Escribe un nombre para la prioridad.";
    return;
  }
  saving.value = true;
  const response = await saveQuotePriority({
    ...draft.value,
    name: draft.value.name.trim(),
    color_all: hexOnly(draft.value.color_all),
    color_requested: hexOnly(draft.value.color_requested),
    color_sent: hexOnly(draft.value.color_sent),
    color_returned: hexOnly(draft.value.color_returned),
  });
  saving.value = false;
  if (!response.estadoflag) {
    formError.value = response.mensaje;
    return;
  }
  dialog.value = false;
  notifySuccess(response.mensaje);
  await load();
}

async function remove(priority: QuotePriority) {
  const { isConfirmed } = await Swal.fire({
    title: "Eliminar prioridad",
    text: `¿Quieres eliminar la prioridad "${priority.name}"?`,
    icon: "warning",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Sí, eliminar",
  });
  if (!isConfirmed || priority.id === null) return;
  const response = await deleteQuotePriority(priority.id);
  if (response.estadoflag) {
    notifySuccess(response.mensaje);
    await load();
  } else {
    await Swal.fire({ icon: "warning", text: response.mensaje });
  }
}

onMounted(() => {
  appStore.mainTitle = "Prioridades de cotización";
  load();
});
</script>

<template>
  <v-alert
    v-if="loadError"
    type="warning"
    variant="tonal"
    class="ma-4"
  >
    {{ loadError }} Recarga la página para intentarlo de nuevo.
  </v-alert>
  <v-card
    v-else
    :loading="loading"
    class="ma-4"
  >
    <v-card-title class="d-flex align-center flex-wrap ga-3">
      <p class="text-body-medium text-medium-emphasis text-wrap flex-1-1">
        {{ ORDER_HINT }}
      </p>
      <v-btn
        v-if="can(SCREEN, 'NUEVO')"
        color="primary"
        prepend-icon="mdi-plus"
        @click="openNew"
      >
        Nueva prioridad
      </v-btn>
    </v-card-title>
    <v-data-table
      :headers="HEADERS"
      :items="priorities"
      :loading="loading"
      no-data-text="Todavía no hay prioridades. Crea la primera con Nueva prioridad."
      loading-text="Cargando prioridades…"
      items-per-page-text="Prioridades por página:"
      page-text="{0}-{1} de {2}"
      :items-per-page-options="[10, 25, 50, 100]"
    >
      <template #[`item.name`]="{ item }">
        {{ item.name }}
      </template>
      <template
        v-for="{ key } in COLORS"
        :key="key"
        #[`item.${key}`]="{ item }"
      >
        <QuotePriorityChip
          :name="item.name"
          :color="item[key]"
        />
      </template>
      <template #[`item.active`]="{ item }">
        {{ item.active ? "Sí" : "No" }}
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn
          v-if="can(SCREEN, 'MODIFICAR')"
          icon="mdi-pencil"
          variant="text"
          size="small"
          title="Editar"
          @click="openEdit(item)"
        />
        <v-btn
          v-if="can(SCREEN, 'ELIMINAR')"
          icon="mdi-delete"
          variant="text"
          size="small"
          title="Eliminar"
          @click="remove(item)"
        />
      </template>
    </v-data-table>
  </v-card>

  <v-dialog
    v-model="dialog"
    max-width="520"
  >
    <v-card :title="draft.id === null ? 'Nueva prioridad' : 'Editar prioridad'">
      <v-card-text>
        <v-text-field
          v-model="draft.name"
          label="Nombre"
          maxlength="50"
        />
        <div
          v-for="{ key, label } in COLORS"
          :key="key"
          class="d-flex align-center ga-3 mb-2"
        >
          <span style="width: 96px">{{ label }}</span>
          <v-menu :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                :style="priorityChipStyle(draft[key]) ?? undefined"
                size="small"
                :aria-label="`Color de ${label}`"
              >
                {{ draft[key] }}
              </v-btn>
            </template>
            <v-color-picker
              v-model="draft[key]"
              mode="hex"
              :modes="['hex']"
              hide-alpha
            />
          </v-menu>
          <QuotePriorityChip
            :name="draft.name || 'Vista previa'"
            :color="draft[key]"
          />
        </div>
        <v-text-field
          v-model.number="draft.position"
          label="Orden"
          type="number"
          min="1"
          :hint="ORDER_HINT"
          persistent-hint
          class="mb-2"
        />
        <v-switch
          v-model="draft.active"
          label="Activa"
          color="primary"
          hide-details
        />
        <v-alert
          v-if="formError"
          type="warning"
          variant="tonal"
          class="mt-4"
        >
          {{ formError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false">
          Cancelar
        </v-btn>
        <v-btn
          color="success"
          :loading="saving"
          @click="save"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
