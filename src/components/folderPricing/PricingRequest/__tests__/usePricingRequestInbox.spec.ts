import { beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { PRICING_REQUEST_EVENT, usePricingRequestInbox } from "../usePricingRequestInbox";
import { listPendingPricingRequests, markPricingRequestSeen } from "../pricingRequestApi";
import type { PricingRequestNotice } from "../pricingRequestApi";

vi.mock("../pricingRequestApi", () => ({ listPendingPricingRequests: vi.fn(), markPricingRequestSeen: vi.fn() }));

const notice = (id: number): PricingRequestNotice => ({
  request_id: String(id), quote_id: id, quote_code: `${id}-P`, client_name: "CLIENTE", requested_by_name: "VENTAS", pricing_notes: null, created_at: "09/11/2026 10:00",
});

function mountInbox() {
  const listeners = new Map<string, (n: PricingRequestNotice) => void>();
  const socket = { on: vi.fn((event: string, fn: (n: PricingRequestNotice) => void) => listeners.set(event, fn)), off: vi.fn() };
  let inbox!: ReturnType<typeof usePricingRequestInbox>;
  const wrapper = mount(defineComponent({ setup() { inbox = usePricingRequestInbox(socket); return () => null; } }));
  return { inbox, push: (n: PricingRequestNotice) => listeners.get(PRICING_REQUEST_EVENT)!(n), socket, wrapper };
}

beforeEach(() => {
  vi.mocked(listPendingPricingRequests).mockReset().mockResolvedValue([]);
  vi.mocked(markPricingRequestSeen).mockReset().mockResolvedValue();
});

test("pending requests show first, then live ones, one at a time", async () => {
  vi.mocked(listPendingPricingRequests).mockResolvedValue([notice(1)]);
  const { inbox, push } = mountInbox();
  await flushPromises();
  push(notice(2));

  expect(inbox.current.value?.quote_id).toBe(1);
  await inbox.dismiss();
  expect(inbox.current.value?.quote_id).toBe(2);
  await inbox.dismiss();
  expect(inbox.current.value).toBeNull();
});

test("a request that arrives twice shows once", async () => {
  vi.mocked(listPendingPricingRequests).mockResolvedValue([notice(1)]);
  const { inbox, push } = mountInbox();
  await flushPromises();
  push(notice(1));

  await inbox.dismiss();
  expect(inbox.current.value).toBeNull();
});

test("dismissing marks the request seen and still advances when that fails", async () => {
  vi.mocked(listPendingPricingRequests).mockResolvedValue([notice(1), notice(2)]);
  vi.mocked(markPricingRequestSeen).mockRejectedValueOnce(new Error("Network Error"));
  const { inbox } = mountInbox();
  await flushPromises();

  const dismissed = await inbox.dismiss();

  expect(dismissed?.quote_id).toBe(1);
  expect(markPricingRequestSeen).toHaveBeenCalledWith("1");
  expect(inbox.current.value?.quote_id).toBe(2);
});

test("leaving the screen stops listening", () => {
  const { socket, wrapper } = mountInbox();
  wrapper.unmount();
  expect(socket.off).toHaveBeenCalledWith(PRICING_REQUEST_EVENT, expect.any(Function));
});
