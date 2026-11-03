import { computed, readonly, ref, shallowRef } from "vue";
import Swal from "sweetalert2";
import router from "@/router";
import { useTrafficStore } from "@/stores/traffic";
import type { QuoteKind, TrafficSendPayload, TrafficToOperationsPayload } from "@/types/traffic";
import { generateIdempotencyKey } from "@/utils/idempotencia";
import { sendTargetsFor, type SendTarget, type TrafficFileOfQuote } from "@/utils/trafficSend";

export type ApprovalAmounts = Omit<TrafficSendPayload, "quote_kind" | "id_quote">;

interface QuoteTrafficOptions {
  quoteKind: QuoteKind;
  quoteId: () => number | string;
  approved: () => boolean;
}

export function useQuoteTrafficSend({ quoteKind, quoteId, approved }: QuoteTrafficOptions) {
  const trafficStore = useTrafficStore();
  const trafficFile = ref<TrafficFileOfQuote | null>(null);
  const target = shallowRef<SendTarget>("OPERATIONS");
  let idempotencyKey = generateIdempotencyKey();

  const targets = computed(() => sendTargetsFor(approved(), trafficFile.value));
  const pendingFile = computed(() => (trafficFile.value && !trafficFile.value.sent ? trafficFile.value : null));
  const goesToTraffic = computed(() => target.value === "TRAFFIC");

  async function load() {
    trafficFile.value = await trafficStore.fileOfQuote(quoteKind, quoteId());
    target.value = targets.value[0] ?? "OPERATIONS";
  }

  const showWorking = (title: string) => Swal.fire({ icon: "info", title, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const refuse = (mensaje: string) => {
    idempotencyKey = generateIdempotencyKey();
    Swal.fire({ icon: "error", title: "No se pudo enviar", text: mensaje });
    return false;
  };

  async function sendQuote(amounts: ApprovalAmounts): Promise<boolean> {
    showWorking("Enviando a Tráfico");
    const answer = await trafficStore.sendQuote({ quote_kind: quoteKind, id_quote: quoteId(), ...amounts }, idempotencyKey);
    if (!answer.estadoflag || !answer.data[0]) return refuse(answer.mensaje);

    const { id_house } = answer.data[0];
    const choice = await Swal.fire({
      icon: "success",
      title: "Cotización en Tráfico",
      text: `${answer.mensaje} Desde ahí puedes llevar el seguimiento y el control de gastos.`,
      confirmButtonText: "Ver expediente de tráfico",
      showCancelButton: true,
      cancelButtonText: "Quedarme en la cotización",
    });
    if (choice.isConfirmed) router.push({ name: "trafficVer", params: { id: id_house } });
    else await load();
    return true;
  }

  async function sendToOperations(payload: TrafficToOperationsPayload): Promise<boolean> {
    const file = pendingFile.value;
    if (!file) return refuse("Esta cotización ya no está pendiente en Tráfico. Recarga la página.");

    showWorking("Enviando a Operaciones");
    const answer = await trafficStore.sendToOperations(file.id_traffic, payload, idempotencyKey);
    if (!answer.estadoflag) return refuse(answer.mensaje);

    const choice = await Swal.fire({
      icon: "success",
      title: "Enviado a Operaciones",
      text: answer.mensaje,
      confirmButtonText: "Ver house",
      showCancelButton: true,
      cancelButtonText: "Quedarme en la cotización",
    });
    if (choice.isConfirmed) router.push({ name: "controlHouseVer", params: { id: file.id_house } });
    else await load();
    return true;
  }

  return {
    trafficFile: readonly(trafficFile),
    target,
    targets,
    pendingFile,
    goesToTraffic,
    load,
    sendQuote,
    sendToOperations,
  };
}
