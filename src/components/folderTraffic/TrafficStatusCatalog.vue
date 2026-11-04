<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useDialogSave } from "@/composables/useDialogSave";
import { usePermissions } from "@/composables/usePermissions";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficStatus, TrafficStatusForm } from "@/types/traffic";
import { hasFailed, notifySuccess } from "@/utils/request";

const SCREEN = "lstTrafficStatus";
const NAME_MAX = 80;
const headers = [
  { title: "Nombre", key: "name" },
  { title: "Posición", key: "position" },
  { title: "Acciones", key: "actions", sortable: false, align: "end" },
] as const;

const store = useTrafficStore();
const { statuses } = storeToRefs(store);
const { can } = usePermissions();
const canCreate = can(SCREEN, "NUEVO");
const canEdit = can(SCREEN, "MODIFICAR");
const canDelete = can(SCREEN, "ELIMINAR");
const emptyText = canCreate
  ? "Aún no hay estatus de tráfico. Crea el primero con Nuevo estatus."
  : "Aún no hay estatus de tráfico.";

const loading = shallowRef(false);
const dialog = shallowRef(false);
const draft = ref<TrafficStatusForm>({ id: null, name: "", position: null });
const form = useTemplateRef("form");
const { saving, serverError, save } = useDialogSave(dialog, form, persist);
const isEditing = computed(() => Boolean(draft.value.id));
const nameRules = [(value: string) => value.trim().length > 0 || "Escribe el nombre del estatus."];

async function load() {
  loading.value = true;
  const answer = await store.loadStatuses();
  loading.value = false;
  if (hasFailed(answer)) Swal.fire({ icon: "error", text: answer.mensaje });
}

async function persist() {
  const answer = await store.saveStatus(draft.value);
  if (!answer.estadoflag) return answer.mensaje;
  notifySuccess(answer.mensaje);
  await load();
  return null;
}

async function openDialog(status: TrafficStatus | null) {
  draft.value = status ? { ...status } : { id: null, name: "", position: null };
  serverError.value = "";
  dialog.value = true;
  await nextTick();
  form.value?.resetValidation();
}

async function remove(status: TrafficStatus) {
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    titleText: `¿Eliminar el estatus «${status.name}»?`,
    text: "Ya no podrás asignarlo a los archivos de Tráfico.",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!isConfirmed) return;
  const answer = await store.deleteStatus(status.id);
  if (answer.estadoflag) notifySuccess(answer.mensaje);
  else Swal.fire({ icon: "warning", text: answer.mensaje });
  await load();
}

onMounted(load);
</script>

<template>
  <v-card class="px-5 py-4">
    <div class="d-flex justify-end mb-4">
      <v-btn
        v-if="canCreate"
        color="success"
        prepend-icon="mdi-plus"
        @click="openDialog(null)"
      >
        Nuevo estatus
      </v-btn>
    </div>
    <v-data-table
      :headers="headers"
      :items="statuses"
      item-value="id"
      :loading="loading"
      loading-text="Cargando estatus de tráfico…"
      :no-data-text="emptyText"
      class="elevation-1"
    >
      <template #[`item.actions`]="{ item }">
        <v-btn
          v-if="canEdit"
          icon="mdi-pencil"
          variant="text"
          size="small"
          color="warning"
          :aria-label="`Editar ${item.name}`"
          @click="openDialog(item)"
        />
        <v-btn
          v-if="canDelete"
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          :aria-label="`Eliminar ${item.name}`"
          @click="remove(item)"
        />
      </template>
    </v-data-table>

    <v-dialog
      v-model="dialog"
      max-width="500"
    >
      <v-form
        ref="form"
        @submit.prevent="save"
      >
        <v-card>
          <v-card-title class="pt-5 px-6">
            {{ isEditing ? "Editar estatus" : "Nuevo estatus" }}
          </v-card-title>
          <v-card-text class="px-6">
            <v-text-field
              id="traffic-status-name"
              v-model="draft.name"
              label="Nombre"
              :rules="nameRules"
              :counter="NAME_MAX"
              :maxlength="NAME_MAX"
              autofocus
            />
            <v-number-input
              id="traffic-status-position"
              v-model="draft.position"
              label="Posición"
              :min="1"
              hint="Ordena la lista: el 1 aparece primero. Si la dejas vacía, va al final."
              persistent-hint
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
              @click="dialog = false"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="success"
              variant="flat"
              :loading="saving"
            >
              {{ isEditing ? "Guardar cambios" : "Crear estatus" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-card>
</template>
