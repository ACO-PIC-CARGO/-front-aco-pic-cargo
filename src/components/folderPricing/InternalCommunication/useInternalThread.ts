import { computed, ref, watch, type Ref } from "vue";
import { getInternalMessages, sendInternalMessage, type InternalMessage, type SentMessage } from "./internalCommunicationApi";

const EMPTY_TYPE = "TMSGINF";
const LOAD_FAILED = "No pudimos cargar los mensajes. Revisa tu conexión e intenta de nuevo.";
const SEND_FAILED = "No pudimos enviar el mensaje. Revisa tu conexión e intenta de nuevo.";

export function useInternalThread(quoteId: Ref<number>, onSent: (message: SentMessage) => void) {
  const messages = ref<InternalMessage[]>([]);
  const draft = ref("");
  const sending = ref(false);
  const errorText = ref("");
  const count = computed(() => messages.value.length);
  const canSend = computed(() => draft.value.trim() !== "" && !sending.value);

  async function load() {
    const requested = quoteId.value;
    try {
      const response = await getInternalMessages(requested);
      if (requested !== quoteId.value) return;
      if (response.estadoflag) {
        messages.value = response.data;
        errorText.value = "";
      } else if (response.tipomensaje === EMPTY_TYPE) {
        messages.value = [];
        errorText.value = "";
      } else {
        errorText.value = response.mensaje;
      }
    } catch {
      if (requested === quoteId.value) errorText.value = LOAD_FAILED;
    }
  }

  async function send() {
    if (!canSend.value) return;
    const requested = quoteId.value;
    sending.value = true;
    errorText.value = "";
    try {
      const response = await sendInternalMessage(requested, draft.value.trim());
      if (requested !== quoteId.value) return;
      if (!response.estadoflag) {
        errorText.value = response.mensaje;
        return;
      }
      draft.value = "";
      if (response.data[0]) onSent(response.data[0]);
      await load();
    } catch {
      if (requested === quoteId.value) errorText.value = SEND_FAILED;
    } finally {
      if (requested === quoteId.value) sending.value = false;
    }
  }

  watch(quoteId, () => {
    messages.value = [];
    draft.value = "";
    errorText.value = "";
    sending.value = false;
    load();
  }, { immediate: true });

  return { messages, draft, sending, errorText, count, canSend, send };
}
