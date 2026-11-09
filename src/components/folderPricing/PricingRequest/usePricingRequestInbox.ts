import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { listPendingPricingRequests, markPricingRequestSeen } from "./pricingRequestApi";
import type { PricingRequestNotice } from "./pricingRequestApi";

export const PRICING_REQUEST_EVENT = "solicitud-pricing";

type NoticeListener = (notice: PricingRequestNotice) => void;

interface NoticeSource {
  on(event: string, listener: NoticeListener): unknown;
  off(event: string, listener: NoticeListener): unknown;
}

export function usePricingRequestInbox(socket: NoticeSource) {
  const queue = ref<PricingRequestNotice[]>([]);

  function enqueue(notice: PricingRequestNotice) {
    if (!queue.value.some((queued) => String(queued.request_id) === String(notice.request_id))) queue.value.push(notice);
  }

  onMounted(async () => {
    socket.on(PRICING_REQUEST_EVENT, enqueue);
    try {
      (await listPendingPricingRequests()).forEach(enqueue);
    } catch {
      // Unseen requests stay stored and show again the next time ACO opens.
    }
  });

  onBeforeUnmount(() => socket.off(PRICING_REQUEST_EVENT, enqueue));

  async function dismiss(): Promise<PricingRequestNotice | null> {
    const [notice] = queue.value;
    if (!notice) return null;
    queue.value = queue.value.slice(1);
    try {
      await markPricingRequestSeen(notice.request_id);
    } catch {
      // Unseen requests stay stored and show again the next time ACO opens.
    }
    return notice;
  }

  return { current: computed(() => queue.value[0] ?? null), dismiss };
}
