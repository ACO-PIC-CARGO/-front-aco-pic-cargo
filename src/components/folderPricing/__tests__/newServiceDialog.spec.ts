import { afterEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ServicesComponent from "@/components/folderPricing/ServicesComponent.vue";
import { usePricingStore } from "@/stores/pricing";

vi.mock("@/api/http", () => ({ default: vi.fn().mockResolvedValue({ data: { estadoflag: true, data: [] } }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "newQuote", params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

let wrapper: VueWrapper;
afterEach(() => wrapper.unmount());

test("a new service starts with no category shown and is saved as uncategorized when none is chosen", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.begEndList = [{ id: 1, code: "OR", name: "ORIGEN" }] as never;
  pricing.listServices = [];
  wrapper = mount(defineComponent({ components: { ServicesComponent }, template: "<v-app><ServicesComponent /></v-app>" }), {
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await flushPromises();
  await wrapper.find("button .mdi-plus").element.closest("button")!.click();
  await flushPromises();

  const category = wrapper.findAllComponents({ name: "VSelect" }).find((field) => field.props("label") === "Categoria...")!;
  expect(category.props("modelValue")).toBeNull();

  wrapper.findAllComponents({ name: "VTextField" }).find((field) => field.props("label") === "Descripción")!.vm.$emit("update:modelValue", "INSPECCION");
  [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Guardar")!.click();
  await flushPromises();

  expect(pricing.listServices.at(-1)).toMatchObject({ service: "INSPECCION", id_begend: "0", codebegend: "OP" });
});
