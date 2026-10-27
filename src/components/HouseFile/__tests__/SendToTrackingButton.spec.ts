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

function mountButton(
  state: "ready" | "sent",
  send: () => Promise<string | null>,
  withdraw: () => Promise<string | null> = async () => null,
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(SendToTrackingButton, {
    props: {
      state,
      sentAt: state === "sent" ? "2026-10-27T15:00:00.000Z" : null,
      blockedHint: "",
      confirmText: "¿Enviar «ETD» al tracking del cliente?",
      send,
      withdrawConfirmText: "¿Retirar «ETD» del tracking del cliente?",
      withdraw,
    },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
}

const button = (label: string) => wrapper!.findAll("button").find((item) => item.text().includes(label))!;

function mountReady(send: () => Promise<string | null>) {
  mountButton("ready", send);
  return button("Enviar a tracking");
}

test("a sent item is withdrawn only after the user confirms", async () => {
  const withdraw = vi.fn(async () => null);
  mountButton("sent", vi.fn(async () => null), withdraw);
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  await button("Retirar").trigger("click");
  await flushPromises();
  expect(withdraw).not.toHaveBeenCalled();

  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as never);
  await button("Retirar").trigger("click");
  await flushPromises();
  expect(withdraw).toHaveBeenCalledTimes(1);
  expect(vi.mocked(Swal.fire).mock.calls[1]![0]).toMatchObject({ titleText: "¿Retirar «ETD» del tracking del cliente?" });
});

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

test("the confirmation shows the step name as plain text, never as HTML", async () => {
  vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as never);
  await mountReady(vi.fn(async () => null)).trigger("click");
  await flushPromises();
  const options = vi.mocked(Swal.fire).mock.calls[0]![0] as unknown as Record<string, unknown>;
  expect(options.titleText).toBe("¿Enviar «ETD» al tracking del cliente?");
  expect(options).not.toHaveProperty("title");
});
