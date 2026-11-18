import { beforeEach, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import InternalCommunicationBar from "../InternalCommunicationBar.vue";
import { getInternalMessages } from "../internalCommunicationApi";

vi.mock("../internalCommunicationApi", () => ({ getInternalMessages: vi.fn(), sendInternalMessage: vi.fn() }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const vuetify = createVuetify({ components, directives });
const message = (id: number) => ({ id, direction: "sales_to_pricing", body: "hola", author_name: "Ana", created_at: "2026-11-10T10:00:00Z" });

function mountBar(props: { quoteId: number | null; visible: boolean }) {
  const Host = defineComponent({
    props: { quoteId: { type: Number as PropType<number | null>, default: null }, visible: Boolean },
    setup: (hostProps) => () =>
      h(components.VLayout, null, () => h(InternalCommunicationBar, { quoteId: hostProps.quoteId, visible: hostProps.visible })),
  });
  return mount(Host, { props, global: { plugins: [vuetify] } });
}

const isHidden = (wrapper: ReturnType<typeof mountBar>) => wrapper.find("section").element.style.display === "none";

beforeEach(() => {
  vi.mocked(getInternalMessages).mockReset().mockResolvedValue({ estadoflag: true, mensaje: "", tipomensaje: "", data: [message(1), message(2)] } as never);
});

test("a quote that is not saved yet has no bar and loads nothing", async () => {
  const wrapper = mountBar({ quoteId: null, visible: true });
  await flushPromises();

  expect(isHidden(wrapper)).toBe(true);
  expect(getInternalMessages).not.toHaveBeenCalled();
});

test("the bar title shows how many messages the quote has", async () => {
  const wrapper = mountBar({ quoteId: 15, visible: true });
  await flushPromises();

  expect(isHidden(wrapper)).toBe(false);
  expect(wrapper.find("button[aria-controls='internal-bar-content']").text()).toContain("Historial de comunicación interna (2)");
});

test("an open bar closes when it leaves the tabs where it belongs", async () => {
  const wrapper = mountBar({ quoteId: 15, visible: true });
  const toggle = () => wrapper.find("button[aria-controls='internal-bar-content']");
  await toggle().trigger("click");
  expect(toggle().attributes("aria-expanded")).toBe("true");

  await wrapper.setProps({ visible: false });
  await wrapper.setProps({ visible: true });

  expect(toggle().attributes("aria-expanded")).toBe("false");
});
