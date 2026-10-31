import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ModelCostos from "@/components/Configuracion/Pricing/ModelCostos.vue";
import { useConfiguracionStore } from "@/stores/configuracion";
import { usePricingStore } from "@/stores/pricing";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const SAVE_PATH = "costo_pricing_actualizar";
const cost = {
  id: 31,
  id_costo: 4,
  costo: "FLETE",
  id_multiplicador: 2,
  id_proveedor: 9,
  precio: "10",
  minimo: 0,
  status: 1,
  eslocalflag: true,
  considerarvalorminimoflag: false,
};
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  respond({ [SAVE_PATH]: accepted([]), cargar_proveedor_pricing: accepted([]) });
});

afterEach(() => wrapper?.unmount());

const mountModal = async (costs: Record<string, unknown>[]) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useConfiguracionStore().lstCostos = costs as never;
  usePricingStore().listTipoCostos = [{ codigo: "LO", name: "DESTINO: GASTOS NAVIEROS" }] as never;
  wrapper = mount(
    defineComponent({
      components: { ModelCostos },
      template: '<v-app><ModelCostos :id-modality="1" :id-shipment="2" :id-incoterms="3" /></v-app>',
    }),
    { global: { plugins: [createVuetify({ components, directives }), pinia] }, attachTo: document.body },
  );
  await flushPromises();
};

const buttonNamed = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>("button")].find((element) => element.textContent?.trim() === name);
const saveRequests = () => httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + SAVE_PATH);
const closedAfterSaving = () => wrapper!.findComponent(ModelCostos).emitted("cerrarModalGuardar");

test.each(["", "-5"])("a price of %j keeps the dialog open and sends nothing", async (price) => {
  await mountModal([{ ...cost, precio: price }]);

  buttonNamed("Guardar")!.click();
  await flushPromises();

  expect(saveRequests()).toHaveLength(0);
  expect(closedAfterSaving()).toBeUndefined();
}, 15_000);

test("a rejected save shows why and keeps the dialog open", { timeout: 15_000 }, async () => {
  respond({
    [SAVE_PATH]: rejected("Ya hay un costo «FLETE» con ese multiplicador en este incoterm."),
    cargar_proveedor_pricing: accepted([]),
  });
  await mountModal([cost]);

  buttonNamed("Guardar")!.click();
  await flushPromises();

  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ icon: "error", text: "Ya hay un costo «FLETE» con ese multiplicador en este incoterm." }),
  );
  expect(closedAfterSaving()).toBeUndefined();
});

test("a second click while saving sends one request, and the accepted save closes the dialog", { timeout: 15_000 }, async () => {
  await mountModal([cost]);

  buttonNamed("Guardar")!.click();
  buttonNamed("Guardar")!.click();
  await flushPromises();

  expect(saveRequests()).toHaveLength(1);
  expect(closedAfterSaving()).toHaveLength(1);
});

test("an incoterm with no costs offers every cost type, so its first cost can be added", { timeout: 15_000 }, async () => {
  await mountModal([]);

  expect(buttonNamed("Añadir Costo DESTINO: GASTOS NAVIEROS")).toBeDefined();
});
