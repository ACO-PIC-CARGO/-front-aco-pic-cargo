import { beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import NewQuote from "@/views/folderPricing/NewQuote.vue";
import DatosPrincipales from "@/components/folderPricing/DatosPrincipales.vue";
import DatosCargaComponent from "@/components/folderPricing/DatosCargaComponent.vue";
import ImportantNoteField from "@/components/folderPricing/InternalCommunication/ImportantNoteField.vue";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({ useRoute: () => ({ name: "newQuote", params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});
Element.prototype.scrollIntoView ??= () => {};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7, id_pais: 1 }]));
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [], controlled: [] }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  httpMock.mockResolvedValue({ data: accepted([]) });
});

test("the important note and the Continuar button stay hidden after the services show, until Agregar Notas Importantes is clicked", { timeout: 20_000 }, async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = mount(defineComponent({ components: { NewQuote }, template: "<v-app><NewQuote /></v-app>" }), {
    global: {
      plugins: [createVuetify({ components, directives }), pinia],
      stubs: {
        DatosPrincipales: true,
        DatosCargaComponent: true,
        ServicesComponent: true,
        ImportantNoteField: true,
        DatosCostosComponent: true,
        ComparativaComponent: true,
        NotasComponent: true,
      },
    },
    attachTo: document.body,
  });
  const buttons = (name: string) => wrapper.findAll("button").filter((button) => button.text() === name);

  wrapper.findComponent(DatosPrincipales).vm.$emit("activar-datos-carga");
  await flushPromises();
  const pricingStore = usePricingStore();
  pricingStore.datosPrincipales.idtipocarga = 3;
  pricingStore.listShipment = [{ id: 3, code: "LCL" }] as typeof pricingStore.listShipment;
  wrapper.findComponent(DatosCargaComponent).vm.$emit("activar-servicios");
  await flushPromises();

  expect(wrapper.findComponent(ImportantNoteField).exists()).toBe(false);
  expect(buttons("Continuar")).toHaveLength(0);

  await buttons("Agregar Notas Importantes")[0]!.trigger("click");

  expect(wrapper.findComponent(ImportantNoteField).exists()).toBe(true);
  expect(buttons("Continuar")).toHaveLength(1);
  expect(buttons("Agregar Notas Importantes")).toHaveLength(0);
  wrapper.unmount();
});
