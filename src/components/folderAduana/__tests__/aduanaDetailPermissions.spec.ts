import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Component } from "vue";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NotasComponent from "@/components/folderAduana/NotasComponent.vue";
import VerNotasComponent from "@/components/folderAduana/VerComponent/NotasComponent.vue";
import InstructivoComponent from "@/components/folderAduana/VerComponent/InstructivoComponent.vue";
import UnificarCotizacion from "@/components/folderAduana/VerComponent/UnificarCotizacion.vue";
import { useAduanaStore } from "@/stores/aduana";
import { usePricingStore } from "@/stores/pricing";

const route = vi.hoisted(() => ({ name: "VerAduana", params: { id: "9" } as Record<string, string> }));
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: {} }), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }), showLoading: vi.fn() } }));

const ADUANA_LIST = "lstQuoteAduanaAduana";
const OPTION = { nro_propuesta: 1, date_end: "2026-12-01", tiempo_transito: 30, listCostos: [], listImpuestos: [], listNotasQuote: [], selected: true };
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
});
afterEach(() => wrapper?.unmount());

const shownWith = async (screen: Component, aduanaScreen: string, actions: string[]) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: aduanaScreen, actions }], controlled: [aduanaScreen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  const aduana = useAduanaStore();
  aduana.opcionCostos = [{ ...OPTION }];
  aduana.listInstructivo = [{ expediente: "E-1", notas: [] }] as unknown as typeof aduana.listInstructivo;
  const instructivoOption = [{ nro_propuesta: 1, opcion: [] }] as never[];
  aduana.listIngresosInstructivo = instructivoOption;
  aduana.listCostosInstructivo = instructivoOption;
  aduana.listImpuestosInstructivo = instructivoOption;
  aduana.datosPrincipales.id_status = 1;
  usePricingStore().listQuoteStatus = [{ id: 1, name: "PENDIENTE" }] as never[];
  wrapper = shallowMount(screen, { global: { plugins: [pinia], renderStubDefaultSlot: true } });
  await flushPromises();
  return wrapper.text().replace(/\s+/g, " ").toUpperCase();
};

describe.each([
  ["a new customs quote", "newCotizacionAduana", {}, "newCotizacionAduana", "NUEVO"],
  ["an edited customs quote", "EditarAduana", { id: "9" }, ADUANA_LIST, "MODIFICAR"],
])("saving and printing %s", (_name, routeName, params, aduanaScreen, saveAction) => {
  beforeEach(() => {
    route.name = routeName;
    route.params = params;
  });

  test(`needs both ${saveAction} and EXPORTAR`, async () => {
    expect(await shownWith(NotasComponent, aduanaScreen, ["VER", saveAction])).not.toContain("IMPRIMIR COTIZACION");
    expect(await shownWith(NotasComponent, aduanaScreen, ["VER", "EXPORTAR"])).not.toContain("IMPRIMIR COTIZACION");
    expect(await shownWith(NotasComponent, aduanaScreen, ["VER", saveAction, "EXPORTAR"])).toContain("IMPRIMIR COTIZACION");
  });
});

describe.each([
  ["Imprimir cotización", VerNotasComponent, "IMPRIMIR COTIZACION", "EXPORTAR"],
  ["Enviar a operaciones", InstructivoComponent, "ENVIAR A OPERACIONES/ TRÁFICO", "MODIFICAR"],
  ["Unificar", UnificarCotizacion, "UNIFICAR COTIZACIÓN ASOCIADA A: UNIFICAR", "MODIFICAR"],
] as const)("%s on the customs quote", (_name, screen, control, action) => {
  beforeEach(() => {
    route.name = "VerAduana";
    route.params = { id: "9" };
  });

  test(`is hidden without ${action}`, async () => {
    expect(await shownWith(screen, ADUANA_LIST, ALL_ACTIONS.filter((granted) => granted !== action))).not.toContain(control);
  });

  test(`shows with ${action}`, async () => {
    expect(await shownWith(screen, ADUANA_LIST, ["VER", action])).toContain(control);
  });
});
