import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import Swal from "sweetalert2";
import SendToTrackingButton from "@/components/HouseFile/SendToTrackingButton.vue";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

let wrapper: VueWrapper | undefined;

beforeEach(() => vi.clearAllMocks());
afterEach(() => wrapper?.unmount());

function mountReady(send: () => Promise<string | null>) {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(SendToTrackingButton, {
    props: { state: "ready", sentAt: null, blockedHint: "", confirmText: "¿Enviar «ETD» al tracking del cliente?", send },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  return wrapper.findAll("button").find((button) => button.text().includes("Enviar a tracking"))!;
}

test("nothing is sent when the user cancels the confirmation", async () => {
  const send = vi.fn(async () => null);
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  await mountReady(send).trigger("click");
  await flushPromises();
  expect(send).not.toHaveBeenCalled();
});

test("a confirmed send that the server rejects shows its reason", async () => {
  const send = vi.fn(async () => "Primero confirma «ETD».");
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as never);
  await mountReady(send).trigger("click");
  await flushPromises();
  expect(send).toHaveBeenCalledTimes(1);
  expect(vi.mocked(Swal.fire).mock.calls[1]![0]).toMatchObject({ icon: "warning", text: "Primero confirma «ETD»." });
});
