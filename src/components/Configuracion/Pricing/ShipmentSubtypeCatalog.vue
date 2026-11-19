<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { useDialogSave } from "@/composables/useDialogSave";
import { usePermissions } from "@/composables/usePermissions";
import { usePricingStore } from "@/stores/pricing";
import { useShipmentSubtypeStore } from "@/stores/shipmentSubtype";
import type { ShipmentSubtype, ShipmentSubtypeForm } from "@/types/shipmentSubtype";
import { hasFailed, notifySuccess } from "@/utils/request";

const SCREEN = "lstShipmentSubtype";
const NAME_MAX = 60;
const headers = [
  { title: "Código", key: "codigo", width: "15%" },
  { title: "Tipo de embarque", key: "shipment" },
  { title: "Sub tipo de embarque", key: "name" },
  { title: "Acciones", key: "actions", sortable: false, align: "end" },
] as const;

const store = useShipmentSubtypeStore();
const pricingStore = usePricingStore();
const { subtypes } = storeToRefs(store);
const { smAndDown, xs } = useDisplay();
const { can } = usePermissions();
const canCreate = can(SCREEN, "NUEVO");
const canEdit = can(SCREEN, "MODIFICAR");
const canDelete = can(SCREEN, "ELIMINAR");

const loading = shallowRef(false);
const shipmentFilter = ref<number | null>(null);
const dialog = shallowRef(false);
const viewing = ref<ShipmentSubtype | null>(null);
const draft = ref<ShipmentSubtypeForm>({ id: null, id_shipment: null, name: "" });
const form = useTemplateRef("form");
const { saving, serverError, save } = useDialogSave(dialog, form, persist);
const isEditing = computed(() => Boolean(draft.value.id));
const shownSubtypes = computed(() =>
  shipmentFilter.value ? subtypes.value.filter((subtype) => subtype.id_shipment === shipmentFilter.value) : subtypes.value,
);
const emptyText = computed(() =>
  canCreate ? "Aún no hay sub tipos de embarque. Crea el primero con Nuevo sub tipo." : "Aún no hay sub tipos de embarque.",
);
const shipmentRules = [(value: number | null) => Boolean(value) || "Elige el tipo de embarque."];
const nameRules = [(value: string) => value.trim().length > 0 || "Escribe el nombre del sub tipo."];
const dateOf = (value: string | null) => (value ? value.slice(0, 10) : null);

async function load() {
  loading.value = true;
  const answer = await store.load();
  loading.value = false;
  if (hasFailed(answer)) Swal.fire({ icon: "error", text: answer.mensaje });
}

async function persist() {
  const answer = await store.save(draft.value);
  if (!answer.estadoflag) return answer.mensaje;
  notifySuccess(answer.mensaje);
  await load();
  return null;
}

async function openDialog(subtype: ShipmentSubtype | null) {
  draft.value = subtype
    ? { id: subtype.id, id_shipment: subtype.id_shipment, name: subtype.name }
    : { id: null, id_shipment: shipmentFilter.value, name: "" };
  serverError.value = "";
  dialog.value = true;
  await nextTick();
  form.value?.resetValidation();
}

async function remove(subtype: ShipmentSubtype) {
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    titleText: `¿Eliminar el sub tipo «${subtype.name}» de ${subtype.shipment}?`,
    text: "Ya no podrás elegirlo en las cotizaciones nuevas. Las cotizaciones que ya lo tienen lo conservan.",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!isConfirmed) return;
  const answer = await store.remove(subtype.id);
  if (answer.estadoflag) notifySuccess(answer.mensaje);
  else Swal.fire({ icon: "warning", text: answer.mensaje });
  await load();
}

onMounted(() => Promise.all([load(), pricingStore.listShipment.length ? null : pricingStore.getShipment()]));
</script>

<template>
  <v-card class="px-3 px-sm-5 py-4">
    <div class="d-flex flex-wrap align-center ga-3 mb-4">
      <v-autocomplete
        id="shipment-subtype-filter"
        v-model="shipmentFilter"
        :items="pricingStore.listShipment"
        item-title="embarque"
        item-value="id"
        label="Filtrar por tipo de embarque"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        class="subtype-filter"
      />
      <v-spacer class="d-none d-sm-flex" />
      <v-btn
        v-if="canCreate"
        color="success"
        prepend-icon="mdi-plus"
        :block="xs"
        @click="openDialog(null)"
      >
        Nuevo sub tipo
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="shownSubtypes"
      item-value="id"
      :loading="loading"
      :mobile="smAndDown"
      loading-text="Cargando sub tipos de embarque…"
      :no-data-text="emptyText"
      class="elevation-1"
    >
      <template #[`item.actions`]="{ item }">
        <div class="d-flex justify-end">
          <v-btn
            icon="mdi-eye"
            variant="text"
            size="small"
            color="primary"
            :aria-label="`Ver ${item.name}`"
            @click="viewing = item"
          />
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
        </div>
      </template>
    </v-data-table>

    <v-dialog
      v-model="dialog"
      max-width="500"
      :fullscreen="xs"
    >
      <v-form
        ref="form"
        @submit.prevent="save"
      >
        <v-card>
          <v-card-title class="pt-5 px-6">
            {{ isEditing ? "Editar sub tipo de embarque" : "Nuevo sub tipo de embarque" }}
          </v-card-title>
          <v-card-text class="px-6">
            <v-autocomplete
              id="shipment-subtype-shipment"
              v-model="draft.id_shipment"
              :items="pricingStore.listShipment"
              item-title="embarque"
              item-value="id"
              label="Tipo de embarque"
              :rules="shipmentRules"
            />
            <v-text-field
              id="shipment-subtype-name"
              v-model="draft.name"
              label="Nombre"
              :rules="nameRules"
              :counter="NAME_MAX"
              :maxlength="NAME_MAX"
              hint="El código se genera solo al crear el sub tipo."
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
              {{ isEditing ? "Guardar cambios" : "Crear sub tipo" }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>

    <v-dialog
      :model-value="viewing !== null"
      max-width="500"
      :fullscreen="xs"
      @update:model-value="viewing = null"
    >
      <v-card
        v-if="viewing"
        :title="`Sub tipo ${viewing.codigo}`"
      >
        <v-card-text>
          <v-text-field
            label="Tipo de embarque"
            :model-value="viewing.shipment"
            readonly
          />
          <v-text-field
            label="Sub tipo de embarque"
            :model-value="viewing.name"
            readonly
          />
          <v-row density="compact">
            <v-col
              cols="12"
              sm="6"
            >
              <FormatFecha
                label="Creado el"
                :model-value="dateOf(viewing.created_at)"
                verflag
              />
            </v-col>
            <v-col
              v-if="viewing.updated_at"
              cols="12"
              sm="6"
            >
              <FormatFecha
                label="Modificado el"
                :model-value="dateOf(viewing.updated_at)"
                verflag
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="viewing = null">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.subtype-filter {
  flex: 1 1 260px;
  max-width: 360px;
}

@media (max-width: 599px) {
  .subtype-filter {
    max-width: none;
  }
}
</style>
