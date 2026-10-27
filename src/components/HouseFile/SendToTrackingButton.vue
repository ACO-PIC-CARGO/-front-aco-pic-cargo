<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { stepDateTimeLabel } from "./houseTrackingFormat";
import type { SendState } from "@/types/houseTracking";

const props = defineProps<{
  state: SendState;
  sentAt: string | null;
  blockedHint: string;
  confirmText: string;
  send: () => Promise<string | null>;
  withdrawConfirmText: string;
  withdraw: () => Promise<string | null>;
}>();

const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const busy = ref(false);
const sentLabel = computed(() => (props.sentAt ? `Enviado el ${stepDateTimeLabel(props.sentAt, timeZone.value)}` : ""));

async function confirmAndRun(titleText: string, confirmButtonText: string, action: () => Promise<string | null>) {
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    titleText,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancelar",
  });
  if (!isConfirmed) return;
  busy.value = true;
  const reason = await action();
  busy.value = false;
  if (reason) Swal.fire({ icon: "warning", text: reason });
}

const confirmAndSend = () => confirmAndRun(props.confirmText, "Enviar", props.send);
const confirmAndWithdraw = () => confirmAndRun(props.withdrawConfirmText, "Retirar", props.withdraw);
</script>

<template>
  <v-chip
    v-if="state === 'internal'"
    size="small"
    variant="tonal"
    color="neutral-ink"
  >
    Interno
    <v-tooltip
      activator="parent"
      location="top"
    >
      Este paso no se muestra al cliente.
    </v-tooltip>
  </v-chip>
  <span
    v-else-if="state === 'sent'"
    class="d-inline-flex align-center ga-1"
  >
    <v-chip
      size="small"
      variant="tonal"
      color="success-ink"
      prepend-icon="mdi-check"
    >
      Enviado
      <v-tooltip
        activator="parent"
        location="top"
      >
        {{ sentLabel }}
      </v-tooltip>
    </v-chip>
    <v-btn
      variant="text"
      size="small"
      color="error"
      prepend-icon="mdi-undo-variant"
      class="text-none"
      :loading="busy"
      @click="confirmAndWithdraw"
    >
      Retirar
    </v-btn>
  </span>
  <span
    v-else
    class="d-inline-block"
  >
    <v-btn
      color="primary"
      variant="outlined"
      size="small"
      prepend-icon="mdi-send-outline"
      class="text-none"
      :disabled="state === 'blocked'"
      :loading="busy"
      @click="confirmAndSend"
    >
      Enviar a tracking
    </v-btn>
    <v-tooltip
      v-if="state === 'blocked'"
      activator="parent"
      location="top"
    >
      {{ blockedHint }}
    </v-tooltip>
  </span>
</template>
