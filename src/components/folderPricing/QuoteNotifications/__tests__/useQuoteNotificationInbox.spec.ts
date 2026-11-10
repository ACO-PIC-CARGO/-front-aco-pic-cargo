import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { DISMISS_GUARD_MS, QUOTE_NOTIFICATION_EVENT, useQuoteNotificationInbox } from "../useQuoteNotificationInbox";
import { listPendingQuoteNotifications, markQuoteNotificationSeen } from "../quoteNotificationApi";
import type { QuoteNotice } from "../quoteNotificationApi";

vi.mock("../quoteNotificationApi", () => ({ listPendingQuoteNotifications: vi.fn(), markQuoteNotificationSeen: vi.fn() }));
vi.mock("@/utils/sesion", () => ({ sessionBranchId: () => 1 }));

const notice = (id: number, fields: Partial<QuoteNotice> = {}): QuoteNotice => ({
  notification_id: String(id), kind: "pricing_request", branch_id: 1, quote_id: id, quote_code: `${id}-P`,
  client_name: "CLIENTE", created_by_name: "VENTAS", pricing_notes: null, created_at: "09/11/2026 10:00",
  client_phone: null, transport_name: null, shipment_name: null, individual_flag: false, group_flag: false,
  containers: [], origin: null, goods_value: null, weight: null, volume: null, ...fields,
});

function mountInbox() {
  const listeners = new Map<string, (n: QuoteNotice) => void>();
  const socket = { on: vi.fn((event: string, fn: (n: QuoteNotice) => void) => listeners.set(event, fn)), off: vi.fn() };
  let inbox!: ReturnType<typeof useQuoteNotificationInbox>;
  const wrapper = mount(defineComponent({ setup() { inbox = useQuoteNotificationInbox(socket); return () => null; } }));
  return { inbox, push: (n: QuoteNotice) => listeners.get(QUOTE_NOTIFICATION_EVENT)!(n), socket, wrapper };
}

const ready = () => vi.advanceTimersByTime(DISMISS_GUARD_MS);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.mocked(listPendingQuoteNotifications).mockReset().mockResolvedValue([]);
  vi.mocked(markQuoteNotificationSeen).mockReset().mockResolvedValue();
});
afterEach(() => vi.useRealTimers());

test("pending and live notices queue once and show one at a time", async () => {
  vi.mocked(listPendingQuoteNotifications).mockResolvedValue([notice(1)]);
  const { inbox, push } = mountInbox();
  await flushPromises();
  push(notice(2));
  push(notice(1));

  ready();
  expect(inbox.dismiss()?.quote_id).toBe(1);
  ready();
  expect(inbox.dismiss()?.quote_id).toBe(2);
  expect(inbox.current.value).toBeNull();
});

test("a notice of another branch is not shown", async () => {
  const { inbox, push } = mountInbox();
  await flushPromises();
  push(notice(3, { branch_id: 2 }));
  expect(inbox.current.value).toBeNull();
});

test("a quick second click does not dismiss the next notice unseen", async () => {
  vi.mocked(listPendingQuoteNotifications).mockResolvedValue([notice(1), notice(2)]);
  const { inbox } = mountInbox();
  await flushPromises();
  ready();

  expect(inbox.dismiss()?.quote_id).toBe(1);
  expect(inbox.dismiss()).toBeNull();
  expect(inbox.current.value?.quote_id).toBe(2);
});

test("a dismissed notice is marked seen and never comes back", async () => {
  vi.mocked(listPendingQuoteNotifications).mockResolvedValue([notice(1)]);
  const { inbox, push } = mountInbox();
  await flushPromises();
  ready();

  inbox.dismiss();
  push(notice(1));

  expect(markQuoteNotificationSeen).toHaveBeenCalledWith("1");
  expect(inbox.current.value).toBeNull();
});

test("leaving the screen stops listening", () => {
  const { socket, wrapper } = mountInbox();
  wrapper.unmount();
  expect(socket.off).toHaveBeenCalledWith(QUOTE_NOTIFICATION_EVENT, expect.any(Function));
});
