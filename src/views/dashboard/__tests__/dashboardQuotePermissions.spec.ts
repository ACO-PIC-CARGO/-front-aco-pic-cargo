import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DashboardMain from "@/views/dashboard/DashboardMain.vue";
import { useAduanaStore } from "@/stores/aduana";
import { usePricingStore } from "@/stores/pricing";

const route = vi.hoisted(() => ({ name: "verQuote", params: { id: "77" }, fullPath: "/" }));
vi.mock("vue-router", () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn(), resolve: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn().mockResolvedValue({ data: {} }), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }) } }));
vi.mock("socket.io-client", () => ({ io: () => ({ on: vi.fn(), emit: vi.fn() }) }));

const ALL_ACTIONS = ["VER", "NUEVO", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"];
let wrapper: VueWrapper | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, esnuevoflag: false }]));
});
afterEach(() => wrapper?.unmount());

const appBarWith = async (screen: string, actions: string[]) => {
  wrapper?.unmount();
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: screen, actions }], controlled: [screen] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  usePricingStore().btnRegistrar = true;
  useAduanaStore().mostrarBtnActualizarFlag = true;
  wrapper = shallowMount(DashboardMain, { global: { plugins: [pinia], renderStubDefaultSlot: true, stubs: { RouterView: true } } });
  await flushPromises();
  return wrapper.find("v-app-bar-stub").text().replace(/\s+/g, " ").toUpperCase();
};

describe.each([
  ["newQuote", "Guardar", "newQuote", "GUARDAR", "NUEVO"],
  ["editQuote", "Guardar", "lstQuote", "MDI-CONTENT-SAVE-ALL GUARDAR", "MODIFICAR"],
  ["editQuote", "Automático", "lstQuote", "MDI-SEND AUTOMATICO", "MODIFICAR"],
  ["verQuote", "Editar", "lstQuote", "MDI-PENCIL EDITAR", "MODIFICAR"],
  ["verQuote", "Copiar", "lstQuote", "MDI-CONTENT-COPY COPIAR", "COPIAR"],
  ["EditarAduana", "Guardar", "lstQuoteAduanaAduana", "MDI-SAVE GUARDAR", "MODIFICAR"],
  ["VerAduana", "Editar", "lstQuoteAduanaAduana", "MDI-ACCOUNT-TIE-HAT EDITAR", "MODIFICAR"],
])("on %s, %s in the top bar", (routeName, _control, screen, control, action) => {
  beforeEach(() => {
    route.name = routeName;
  });

  test(`is hidden without ${action}`, async () => {
    expect(await appBarWith(screen, ALL_ACTIONS.filter((granted) => granted !== action))).not.toContain(control);
  });

  test(`shows with ${action}`, async () => {
    expect(await appBarWith(screen, ["VER", action])).toContain(control);
  });
});
