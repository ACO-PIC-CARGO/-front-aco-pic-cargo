import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import type { PropType } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import InternalCommunicationFab from "../InternalCommunicationFab.vue";
import { getInternalMessages } from "../internalCommunicationApi";

vi.mock("../internalCommunicationApi", () => ({ getInternalMessages: vi.fn(), sendInternalMessage: vi.fn() }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const vuetify = createVuetify({ components, directives });
const message = (id: number) => ({ id, direction: "sales_to_pricing", body: "hola", author_name: "Ana", created_at: "2026-11-10T10:00:00Z" });

function mountFab(props: { quoteId: number | null; visible: boolean }) {
  const Host = defineComponent({
    props: { quoteId: { type: Number as PropType<number | null>, default: null }, visible: Boolean },
    setup: (hostProps) => () =>
      h(components.VApp, null, () => h(InternalCommunicationFab, { quoteId: hostProps.quoteId, visible: hostProps.visible })),
  });
  return mount(Host, { props, attachTo: document.body, global: { plugins: [vuetify] } });
}

const historyButton = () => document.querySelector<HTMLElement>("button[aria-label='Historial de comunicación interna']");
const isShown = (element: HTMLElement | null) => !!element && !element.closest("[style*='display: none']");
const historyModal = () =>
  document.querySelector<HTMLElement>("[role='dialog'][aria-label='Historial de comunicación interna'] .v-overlay__content");

async function openHistory() {
  historyButton()!.click();
  await nextTick();
  await flushPromises();
}

beforeEach(() => {
  vi.mocked(getInternalMessages).mockReset().mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "", data: [message(1), message(2)] } as never);
});

afterEach(() => {
  document.body.innerHTML = "";
});

test("a quote that is not saved yet has no history button and loads nothing", async () => {
  mountFab({ quoteId: null, visible: true });
  await flushPromises();

  expect(isShown(historyButton())).toBe(false);
  expect(getInternalMessages).not.toHaveBeenCalled();
});

test("the history button opens the thread with its message count", async () => {
  mountFab({ quoteId: 15, visible: true });
  await flushPromises();
  expect(isShown(historyModal())).toBe(false);

  await openHistory();

  expect(isShown(historyModal())).toBe(true);
  expect(historyModal()!.textContent).toContain("Historial de comunicación interna (2)");
  expect(historyModal()!.textContent).toContain("hola");
});

test("an open history closes when it leaves the tabs where it belongs", async () => {
  const wrapper = mountFab({ quoteId: 15, visible: true });
  await flushPromises();
  await openHistory();

  await wrapper.setProps({ visible: false });
  expect(isShown(historyButton())).toBe(false);
  await wrapper.setProps({ visible: true });
  await flushPromises();

  expect(isShown(historyButton())).toBe(true);
  expect(isShown(historyModal())).toBe(false);
});
