import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import DatosCargaComponent from "@/components/folderPricing/DatosCargaComponent.vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "editQuote", params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

const LCL_GRUPAL = 1;
const LCL_INDIVIDUAL = 2;

let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 1 }]));
  httpMock.mockResolvedValue({ data: accepted([]) });
});

afterEach(() => {
  wrapper?.unmount();
  vi.useRealTimers();
});

async function openCargo() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  useMasterusuariosStore().lstPercepcionAduana = [{ id: 7, codigo: "02", descripcion: "2da IMPORTACIÓN" }] as never;
  pricing.datosPrincipales = {
    ...pricing.datosPrincipales,
    id: 50,
    idtipocarga: 3,
    id_shipment_subtype: LCL_GRUPAL,
    esgrupalflag: false,
    esindividualflag: true,
  };
  wrapper = mount(
    defineComponent({ components: { DatosCargaComponent }, template: "<v-app><DatosCargaComponent /></v-app>" }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
  return pricing;
}

async function askForGrupal(pricing: ReturnType<typeof usePricingStore>) {
  pricing.solicitudSubTipo = { grupal: true, anterior: LCL_INDIVIDUAL };
  await flushPromises();
  vi.runAllTimers();
  await flushPromises();
}

test("Datos de Carga takes over the switch while it is on screen, and lets go when it closes", async () => {
  const pricing = await openCargo();
  expect(pricing.datosCargaActiva).toBe(true);

  wrapper!.unmount();
  wrapper = undefined;

  expect(pricing.datosCargaActiva).toBe(false);
});

test("the Individual and Grupal checks are no longer on the form", async () => {
  await openCargo();

  const labels = wrapper!.findAllComponents({ name: "VCheckbox" }).map((box) => box.props("label"));
  expect(labels).not.toContain("Individual");
  expect(labels).not.toContain("Grupal");
});

test("a confirmed GRUPAL subtype switches the quote to grupal", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  const pricing = await openCargo();

  await askForGrupal(pricing);

  expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ confirmButtonText: "SI CAMBIAR A GRUPAL" });
  expect(pricing.datosPrincipales).toMatchObject({ esgrupalflag: true, esindividualflag: false, id_shipment_subtype: LCL_GRUPAL });
  expect(pricing.solicitudSubTipo).toBeNull();
});

test("cancelling the switch puts back the subtype the quote had", async () => {
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  const pricing = await openCargo();

  await askForGrupal(pricing);

  expect(pricing.datosPrincipales).toMatchObject({ esgrupalflag: false, esindividualflag: true, id_shipment_subtype: LCL_INDIVIDUAL });
});
