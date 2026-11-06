<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useBancosStore } from "@/stores/bancos";
import { useHousesStore } from "@/stores/houses";
import { notifySuccess } from "@/utils/request";
import type { HouseNotice } from "@/types/operaciones";

const props = defineProps<{ houseId: number; modality?: string; notice?: HouseNotice | null; fecha?: string | null }>();
const emit = defineEmits<{ sent: [] }>();
const open = defineModel<boolean>({ required: true });

const IMPORT_NOTICES = ["Aviso de Salida", "Actualización de Salida", "Pre-Aviso de Llegada", "Aviso de Llegada", "Actualización de Llegada"];
const EXPORT_NOTICES = ["Aviso de Salida", "Actualización de Salida", "Aviso de Llegada"];
const MISSING_CHOICE = "Elige el aviso y al menos una cuenta bancaria.";

const housesStore = useHousesStore();
const bancosStore = useBancosStore();
const { cuentas } = storeToRefs(bancosStore);
const noticeType = ref<string | null>(null);
const accountIds = ref<number[]>([]);
const sending = ref(false);
const errorMessage = ref("");
const notices = computed(() => (props.modality === "Exportación" ? EXPORT_NOTICES : IMPORT_NOTICES));

watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    noticeType.value = props.notice?.title ?? null;
    accountIds.value = [];
    errorMessage.value = "";
    bancosStore.getListBanksDetailsCargar();
  },
  { immediate: true },
);

async function send() {
  if (!noticeType.value || !accountIds.value.length) {
    errorMessage.value = MISSING_CHOICE;
    return;
  }
  sending.value = true;
  const notice = { id: props.notice?.id ?? null, title: noticeType.value };
  const response = await housesStore.sendArrivalNotice(props.houseId, notice, accountIds.value, props.fecha ?? null);
  sending.value = false;
  if (!response.estadoflag) {
    errorMessage.value = response.mensaje;
    return;
  }
  notifySuccess(response.mensaje);
  emit("sent");
  open.value = false;
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="640"
    persistent
    content-class="aco-ui"
  >
    <v-card class="aco-card">
      <v-card-title class="aco-title-card pt-5 px-6">
        Enviar {{ notice ? notice.title : "aviso" }} al cliente
      </v-card-title>
      <v-card-text class="px-6">
        <v-select
          v-if="!notice"
          v-model="noticeType"
          :items="notices"
          label="Aviso"
          :readonly="false"
        />
        <p class="text-body-medium mb-1">
          Cuentas bancarias que verá el cliente
        </p>
        <v-checkbox
          v-for="account in cuentas"
          :key="account.id"
          v-model="accountIds"
          :value="account.id"
          :label="`${account.label} · CCI ${account.cci}`"
          density="compact"
          hide-details
          :readonly="false"
        />
        <p
          v-if="!cuentas.length"
          class="text-body-medium text-medium-emphasis"
        >
          Tu empresa no tiene cuentas bancarias activas. Regístralas en Bancos para poder enviar el aviso.
        </p>
        <v-alert
          v-if="errorMessage"
          type="warning"
          variant="tonal"
          class="mt-3"
          :text="errorMessage"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="sending"
          @click="open = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="sending"
          @click="send"
        >
          Enviar aviso
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
