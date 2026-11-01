import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Component } from "vue";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NotasComponent from "@/components/folderPricing/NotasComponent.vue";
import VerNotasComponent from "@/components/folderPricing/VerComponent/NotasComponent.vue";
import InstructivoComponent from "@/components/folderPricing/VerComponent/InstructivoComponent.vue";
import UnificarCotizacion from "@/components/folderPricing/VerComponent/UnificarCotizacion.vue";
import { usePricingStore } from "@/stores/pricing";

const route = vi.hoisted(() => ({ name: "verQuote", params: { id: "77" } }));
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn(), resolve: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: {} }), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }), showLoading: vi.fn() } }));

const OPTION = { nro_propuesta: 1, date_end: "2026-12-01", tiempo_transito: 30, listCostos: [], listImpuestos: [], listNotasQuote: [], selected: true };
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
});
afterEach(() => wrapper?.unmount());

const shownWith = async (screen: Component, quoteScreen: string, actions: string[], approved = false) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: quoteScreen, actions }], controlled: [quoteScreen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  pricing.opcionCostos = [{ ...OPTION }];
  pricing.aprobadoflag = approved;
  pricing.listInstructivo = [{ expediente: "E-1", notas: [] }] as unknown as typeof pricing.listInstructivo;
  vi.spyOn(pricing, "generaInstructivoparaguardata").mockResolvedValue(undefined);
  wrapper = shallowMount(screen, { global: { plugins: [pinia], renderStubDefaultSlot: true } });
  await flushPromises();
  return wrapper.text().replace(/\s+/g, " ").toUpperCase();
};

describe.each([
  ["newQuote", "newQuote", "NUEVO"],
  ["editQuote", "lstQuote", "MODIFICAR"],
])("saving and printing the quote on %s", (routeName, quoteScreen, saveAction) => {
  beforeEach(() => {
    route.name = routeName;
  });

  test.each(["GUARDAR EN CARPETA", "GUARDAR EN FOLDER", "IMPRIMIR COTIZACION"])(
    `%s needs both ${saveAction} and EXPORTAR`,
    async (control) => {
      expect(await shownWith(NotasComponent, quoteScreen, ["VER", saveAction])).not.toContain(control);
      expect(await shownWith(NotasComponent, quoteScreen, ["VER", "EXPORTAR"])).not.toContain(control);
      expect(await shownWith(NotasComponent, quoteScreen, ["VER", saveAction, "EXPORTAR"])).toContain(control);
    },
  );
});

describe.each([
  ["Guardar en folder", VerNotasComponent, "GUARDAR EN FOLDER", "EXPORTAR", false],
  ["Imprimir cotización", VerNotasComponent, "IMPRIMIR COTIZACION", "EXPORTAR", false],
  ["Imprimir instructivo", InstructivoComponent, "MDI-PRINTER-OUTLINE", "EXPORTAR", false],
  ["Enviar a operaciones", InstructivoComponent, "ENVIAR A OPERACIONES/ TRÁFICO", "MODIFICAR", false],
  ["Instructivo por correo", InstructivoComponent, "MDI-EMAIL-OUTLINE INSTRUCTIVO", "MODIFICAR", true],
  ["Agregar nota especial", InstructivoComponent, "NOTAS ESPECIALES: MDI-PLUS", "MODIFICAR", false],
  ["Unificar", UnificarCotizacion, "UNIFICAR COTIZACIÓN ASOCIADA A: UNIFICAR", "MODIFICAR", false],
] as const)("%s on the quote", (_name, screen, control, action, approved) => {
  beforeEach(() => {
    route.name = "verQuote";
  });

  test(`is hidden without ${action}`, async () => {
    const actions = ALL_ACTIONS.filter((granted) => granted !== action);

    expect(await shownWith(screen, "lstQuote", actions, approved)).not.toContain(control);
  });

  test(`shows with ${action}`, async () => {
    expect(await shownWith(screen, "lstQuote", ["VER", action], approved)).toContain(control);
  });
});

test("sending the quote by WhatsApp shows only with EXPORTAR", async () => {
  route.name = "verQuote";
  const whatsapp = () => wrapper!.find("enviar-cotizacion-whatsapp-stub").exists();

  await shownWith(VerNotasComponent, "lstQuote", ALL_ACTIONS.filter((granted) => granted !== "EXPORTAR"));
  expect(whatsapp()).toBe(false);

  await shownWith(VerNotasComponent, "lstQuote", ["VER", "EXPORTAR"]);
  expect(whatsapp()).toBe(true);
});
