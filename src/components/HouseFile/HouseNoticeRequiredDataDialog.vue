<script setup lang="ts">
import { ref, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useHouseEditStore } from "@/stores/houseEdit";
import { useHousesStore } from "@/stores/houses";
import { missingHouseNoticeRequirements } from "./houseNoticeRequirements";
import type { HouseDetalle } from "@/types/operaciones";

const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ saved: [] }>();

const appStore = useAppStore();
const housesStore = useHousesStore();
const houseEdit = useHouseEditStore();
const errorMessage = ref("");
const emailError = ref("");
const saving = ref(false);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

watch(
  open,
  async (isOpen) => {
    if (!isOpen) return;
    errorMessage.value = "";
    emailError.value = "";
    await houseEdit.start(housesStore.house);
  },
);

function validateEmail(): boolean {
  const email = houseEdit.form.emailaddress_clientefinal.trim();
  emailError.value = email && !EMAIL_PATTERN.test(email) ? "Ingresa un correo válido para el cliente." : "";
  return !emailError.value;
}

watch(
  () => houseEdit.form.emailaddress_clientefinal,
  () => {
    if (emailError.value) validateEmail();
  },
);

async function save() {
  if (saving.value) return;
  errorMessage.value = "";
  const form = houseEdit.form;
  const editableHouse: HouseDetalle = {
    id_proveedor: form.id_proveedor ?? undefined,
    emailaddress_clientefinal: form.emailaddress_clientefinal,
    fecha_etd: form.fecha_etd,
    fecha_eta: form.fecha_eta,
  };
  const missing = missingHouseNoticeRequirements(editableHouse);
  if (missing.length) {
    errorMessage.value = `Completa estos campos: ${missing.map(({ label }) => label).join(", ")}.`;
    return;
  }
  if (!validateEmail()) {
    errorMessage.value = emailError.value;
    return;
  }

  const houseId = Number(housesStore.house.id);
  if (!houseId) {
    errorMessage.value = "No pudimos identificar el House para guardar los cambios.";
    return;
  }
  saving.value = true;
  try {
    const response = await housesStore.updateHouseNotificationData(houseId, {
      id_proveedor: form.id_proveedor,
      emailaddress_clientefinal: form.emailaddress_clientefinal.trim(),
      fecha_etd: form.fecha_etd,
      fecha_eta: form.fecha_eta,
      ...(form.monto !== null ? { monto: form.monto } : {}),
    });
    if (!response.estadoflag) {
      errorMessage.value = response.mensaje || "No pudimos guardar los datos del House.";
      return;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "No pudimos guardar los datos del House. Revisa tu conexión e intenta de nuevo.";
    return;
  } finally {
    saving.value = false;
  }
  open.value = false;
  emit("saved");
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="460"
    persistent
    scrollable
    content-class="aco-ui"
  >
    <v-card class="aco-card">
      <v-card-title class="aco-title-card pt-5 px-6">
        Completa los datos del House
      </v-card-title>
      <v-card-text class="px-6">
        <p class="text-body-medium mb-4">
          Actualiza los datos necesarios para continuar con el envío de la notificación.
        </p>
        <v-row density="compact">
          <v-col cols="12">
            <v-autocomplete
              v-model="houseEdit.form.id_proveedor"
              :items="appStore.itemsProveedorRolShipper"
              item-title="namelong"
              item-value="id"
              label="Proveedor"
              :readonly="false"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="houseEdit.form.emailaddress_clientefinal"
              type="email"
              label="Correo del cliente"
              :error-messages="emailError"
              :readonly="false"
              @blur="validateEmail"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="houseEdit.form.fecha_etd"
              type="date"
              label="Fecha ETD"
              :readonly="false"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="houseEdit.form.fecha_eta"
              type="date"
              label="Fecha ETA"
              :readonly="false"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model.number="houseEdit.form.monto"
              type="number"
              min="0"
              label="Monto (opcional)"
              :readonly="false"
            />
          </v-col>
        </v-row>
        <v-alert
          v-if="errorMessage"
          type="warning"
          variant="tonal"
          class="mt-2"
          :text="errorMessage"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="saving"
          @click="open = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="houseEdit.loadingLists"
          @click="save"
        >
          Guardar y continuar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
