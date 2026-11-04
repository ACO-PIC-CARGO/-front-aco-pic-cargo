import { beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import NewQuote from "@/views/folderPricing/NewQuote.vue";
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

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7, id_pais: 1 }]));
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "newQuote", actions: ["VER", "NUEVO"] }], controlled: ["newQuote"] }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  httpMock.mockResolvedValue({ data: accepted([]) });
});

test("opening a new quote after viewing another one shows no required-field errors", { timeout: 20_000 }, async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  Object.assign(usePricingStore().datosPrincipales, { id_marketing: 2, nombre: "Cliente anterior", idsentido: 1, idtipocarga: 3, idincoterms: 9 });

  const wrapper = mount(defineComponent({ components: { NewQuote }, template: "<v-app><NewQuote /></v-app>" }), {
    global: {
      plugins: [createVuetify({ components, directives }), pinia],
      stubs: { DatosCargaComponent: true, ServicesComponent: true, DatosCostosComponent: true, ComparativaComponent: true, NotasComponent: true },
    },
    attachTo: document.body,
  });
  await flushPromises();

  expect(wrapper.findAll(".v-input--error").map((field) => field.find("label").text())).toEqual([]);
  wrapper.unmount();
});
