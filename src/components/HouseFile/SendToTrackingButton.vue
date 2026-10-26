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
}>();

const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const sending = ref(false);
const sentLabel = computed(() => (props.sentAt ? `Enviado el ${stepDateTimeLabel(props.sentAt, timeZone.value)}` : ""));

async function confirmAndSend() {
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: props.confirmText,
    text: "No se puede deshacer.",
    showCancelButton: true,
    confirmButtonText: "Enviar",
    cancelButtonText: "Cancelar",
  });
  if (!isConfirmed) return;
  sending.value = true;
  const reason = await props.send();
  sending.value = false;
  if (reason) Swal.fire({ icon: "warning", text: reason });
}
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
  <v-chip
    v-else-if="state === 'sent'"
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
      :loading="sending"
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
