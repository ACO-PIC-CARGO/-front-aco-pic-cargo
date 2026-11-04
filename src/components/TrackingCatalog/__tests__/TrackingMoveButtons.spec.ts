import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import TrackingMoveButtons from "@/components/TrackingCatalog/TrackingMoveButtons.vue";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mountButtons = () =>
  mount(TrackingMoveButtons, {
    props: { label: "paso Pago", isFirst: false, isLast: false, busy: false },
    global: { plugins: [createVuetify({ components, directives })] },
  });

const isBusy = (wrapper: ReturnType<typeof mountButtons>, name: string) =>
  wrapper.get(`[aria-label="${name} paso Pago"]`).attributes("aria-busy") === "true";

test("the clicked arrow shows it is working until the change finishes", async () => {
  const wrapper = mountButtons();

  await wrapper.get('[aria-label="Bajar paso Pago"]').trigger("click");
  await wrapper.setProps({ busy: true });

  expect(wrapper.emitted("move")).toEqual([["down"]]);
  expect(isBusy(wrapper, "Bajar")).toBe(true);
  expect(isBusy(wrapper, "Subir")).toBe(false);

  await wrapper.setProps({ busy: false });

  expect(isBusy(wrapper, "Bajar")).toBe(false);
});
