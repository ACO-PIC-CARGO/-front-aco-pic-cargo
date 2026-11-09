import { expect, test } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ListPricing from "../ListPricing.vue";
import { usePricingStore } from "@/stores/pricing";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };

const QuoteListPanel = defineComponent({
  props: { pricingView: { type: String, default: "" } },
  setup: (props) => () => h("div", { class: "panel-stub" }, `view:${props.pricingView}`),
});

const panels = (wrapper: ReturnType<typeof mount>) => wrapper.findAll(".panel-stub").map((panel) => panel.text());

test("each tab mounts the only listing panel, with its pricing view", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(ListPricing, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { QuoteListPanel } },
  });
  expect(panels(wrapper)).toEqual(["view:"]);

  await wrapper.findAll("button").find((tab) => tab.text() === "Pendientes de envío")!.trigger("click");
  expect(panels(wrapper)).toEqual(["view:pending_send"]);

  await wrapper.findAll("button").find((tab) => tab.text() === "Solicitadas a pricing")!.trigger("click");
  expect(panels(wrapper)).toEqual(["view:pricing_requested"]);
});

test("coming back to the list reopens the tab the user was working in", () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  usePricingStore().pricingView = "pending_send";

  const wrapper = mount(ListPricing, {
    global: { plugins: [createVuetify({ components, directives }), pinia], stubs: { QuoteListPanel } },
  });

  expect(panels(wrapper)).toEqual(["view:pending_send"]);
});
