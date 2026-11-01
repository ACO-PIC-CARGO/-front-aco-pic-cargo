import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Component } from "vue";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PricingDatosPrincipales from "@/components/folderPricing/DatosPrincipales.vue";
import PricingCostos from "@/components/folderPricing/Costos/CostosComponent.vue";
import AduanaDatosPrincipales from "@/components/folderAduana/DatosPrincipales.vue";
import AduanaCostos from "@/components/folderAduana/Costos/CostosComponent.vue";

const route = vi.hoisted(() => ({ name: "newQuote", params: {} as Record<string, string> }));
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: {} }), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));

const ORIGIN_COST = { id: 1, code_cost: 1, nameservice: "ORIGEN", esorigenflag: 1, esopcionflag: 1, esventaflag: 0, status: 1, costounitario: 0 };
const AutocompleteWithAppend = { template: "<div><slot name=\"append-inner\" /></div>" };
const FormStub = { template: "<form><slot /></form>", methods: { validate: async () => ({ valid: true }), resetValidation: () => {} } };
const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, id_pais: 1 }]));
});
afterEach(() => wrapper?.unmount());

const mountWith = async (screen: Component, quoteScreen: string, actions: string[], state: Record<string, unknown>) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: quoteScreen, actions }], controlled: [quoteScreen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = shallowMount(screen, {
    props: { valores: [{ ...ORIGIN_COST }] },
    global: { plugins: [pinia], renderStubDefaultSlot: true, stubs: { VAutocomplete: AutocompleteWithAppend, VForm: FormStub } },
  });
  await flushPromises();
  Object.assign(wrapper.vm as unknown as Record<string, unknown>, state);
  await flushPromises();
};
const newClientShown = () => wrapper!.text().replace(/\s+/g, " ").toUpperCase().includes("NUEVO CLIENTE");
const newProviderShown = () => wrapper!.find('v-icon-stub[icon="mdi-plus"]').exists();

describe.each([
  ["Nuevo cliente on a new quote", PricingDatosPrincipales, "newQuote", "newQuote", "NUEVO", { buscarClienteDialog: true }, newClientShown],
  ["Nuevo cliente on an edited quote", PricingDatosPrincipales, "editQuote", "lstQuote", "MODIFICAR", { buscarClienteDialog: true }, newClientShown],
  ["Nuevo proveedor on a new quote", PricingCostos, "newQuote", "newQuote", "NUEVO", { mostrarOrigenFlag: true }, newProviderShown],
  ["Nuevo proveedor on an edited quote", PricingCostos, "editQuote", "lstQuote", "MODIFICAR", { mostrarOrigenFlag: true }, newProviderShown],
  ["Nuevo cliente on a new customs quote", AduanaDatosPrincipales, "newCotizacionAduana", "newCotizacionAduana", "NUEVO", { buscarClienteDialog: true }, newClientShown],
  ["Nuevo cliente on an edited customs quote", AduanaDatosPrincipales, "EditarAduana", "lstQuoteAduanaAduana", "MODIFICAR", { buscarClienteDialog: true }, newClientShown],
  ["Nuevo proveedor on a new customs quote", AduanaCostos, "newCotizacionAduana", "newCotizacionAduana", "NUEVO", { mostrarOrigenFlag: true }, newProviderShown],
  ["Nuevo proveedor on an edited customs quote", AduanaCostos, "EditarAduana", "lstQuoteAduanaAduana", "MODIFICAR", { mostrarOrigenFlag: true }, newProviderShown],
] as const)("%s", (_name, screen, routeName, quoteScreen, action, state, shown) => {
  beforeEach(() => {
    route.name = routeName;
  });

  test(`is hidden without ${action}`, async () => {
    await mountWith(screen, quoteScreen, ALL_ACTIONS.filter((granted) => granted !== action), state);

    expect(shown()).toBe(false);
  });

  test(`shows with ${action}`, async () => {
    await mountWith(screen, quoteScreen, ["VER", action], state);

    expect(shown()).toBe(true);
  });
});
