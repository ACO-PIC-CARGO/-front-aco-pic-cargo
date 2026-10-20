import { describe, expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete } from "vuetify/components";
import CboPais from "@/components/comun/CboPais.vue";
import { useAppStore } from "@/stores/app";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function mountCboPais(props: Record<string, unknown> = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const appStore = useAppStore();
  appStore.itemsPais = [{ id: 1, name: "Peru" }, { id: 2, name: "Chile" }] as never;
  const getPais = vi.spyOn(appStore, "_getPais").mockResolvedValue();
  const wrapper = mount(CboPais, {
    props,
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  return { wrapper, getPais };
}

describe("CboPais", () => {
  test("loads the countries when mounted", async () => {
    const { wrapper, getPais } = mountCboPais();
    await flushPromises();
    expect(getPais).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  test("emits the selected country id", async () => {
    const { wrapper } = mountCboPais();
    wrapper.findComponent(VAutocomplete).vm.$emit("update:modelValue", 2);
    expect(wrapper.emitted("paisSeleccionado")).toEqual([[2]]);
    wrapper.unmount();
  });

  test("selects the country passed through newId", async () => {
    const { wrapper } = mountCboPais();
    await wrapper.setProps({ newId: 1 });
    expect(wrapper.findComponent(VAutocomplete).props("modelValue")).toBe(1);
    wrapper.unmount();
  });
});
