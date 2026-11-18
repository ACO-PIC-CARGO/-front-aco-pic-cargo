<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Swal from "sweetalert2";
import ReasonDialog from "../ReasonDialog.vue";
import { cancelPricingRequest } from "./quoteCancelApi";
import { cancelFailureMessage } from "./cancelFailureMessage";

const props = defineProps<{ quoteId: number | null }>();
const emit = defineEmits<{ cancelled: []; close: [] }>();

const CANCEL_FAILED = "No pudimos anular la solicitud. Revisa tu conexión e inténtalo de nuevo.";

const sending = ref(false);
const reason = ref("");
const error = ref<string | null>(null);

const open = computed(() => props.quoteId !== null);
const canSend = computed(() => reason.value.trim() !== "");

async function send() {
  if (props.quoteId === null || sending.value) return;
  sending.value = true;
  error.value = null;
  try {
    const response = await cancelPricingRequest(props.quoteId, reason.value.trim());
    if (!response.estadoflag) {
      error.value = response.mensaje || CANCEL_FAILED;
      return;
    }
    void Swal.fire({ icon: "success", text: response.mensaje });
    emit("cancelled");
  } catch (failure) {
    error.value = cancelFailureMessage(failure);
  } finally {
    sending.value = false;
  }
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  reason.value = "";
  error.value = null;
});
</script>

<template>
  <ReasonDialog
    v-model="reason"
    :open="open"
    title="Anular solicitud a pricing"
    placeholder="Cuéntale a tu equipo por qué anulas la solicitud"
    confirm-text="Anular solicitud"
    :can-confirm="canSend"
    :sending="sending"
    :error="error"
    @confirm="send"
    @close="emit('close')"
  />
</template>
