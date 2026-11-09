import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { sessionBranchId } from "@/utils/sesion";
import { listPendingQuoteNotifications, markQuoteNotificationSeen } from "./quoteNotificationApi";
import type { QuoteNotice } from "./quoteNotificationApi";

export const QUOTE_NOTIFICATION_EVENT = "aviso-cotizacion";
export const DISMISS_GUARD_MS = 400;

type NoticeListener = (notice: QuoteNotice) => void;

interface NoticeSource {
  on(event: string, listener: NoticeListener): unknown;
  off(event: string, listener: NoticeListener): unknown;
}

export function useQuoteNotificationInbox(socket: NoticeSource) {
  const queue = ref<QuoteNotice[]>([]);
  const handled = new Set<string>();
  let shownAt = 0;

  function enqueue(notice: QuoteNotice) {
    const id = String(notice.notification_id);
    if (handled.has(id) || Number(notice.branch_id) !== Number(sessionBranchId())) return;
    if (queue.value.some((queued) => String(queued.notification_id) === id)) return;
    if (!queue.value.length) shownAt = Date.now();
    queue.value.push(notice);
  }

  onMounted(async () => {
    socket.on(QUOTE_NOTIFICATION_EVENT, enqueue);
    try {
      (await listPendingQuoteNotifications()).forEach(enqueue);
    } catch {
      // Unseen notices stay stored and show again the next time ACO opens.
    }
  });

  onBeforeUnmount(() => socket.off(QUOTE_NOTIFICATION_EVENT, enqueue));

  function dismiss(): QuoteNotice | null {
    const [notice] = queue.value;
    if (!notice || Date.now() - shownAt < DISMISS_GUARD_MS) return null;
    handled.add(String(notice.notification_id));
    queue.value = queue.value.slice(1);
    shownAt = Date.now();
    markQuoteNotificationSeen(notice.notification_id).catch(() => {
      // Unseen notices stay stored and show again the next time ACO opens.
    });
    return notice;
  }

  return { current: computed(() => queue.value[0] ?? null), dismiss };
}
