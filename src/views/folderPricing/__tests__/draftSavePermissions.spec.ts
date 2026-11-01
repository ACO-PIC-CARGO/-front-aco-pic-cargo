import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import NewQuote from "@/views/folderPricing/NewQuote.vue";
import NewAduana from "@/views/Aduana/NewQuote.vue";
import { useAduanaStore } from "@/stores/aduana";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("vue-router", () => ({ useRoute: () => ({ name: "newQuote", params: {} }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const OPTION = { nro_propuesta: 1, date_end: "", tiempo_transito: 30, listCostos: [], listImpuestos: [], listNotasQuote: [], selected: true };

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7, id_pais: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
  httpMock.mockResolvedValue({ data: accepted([]) });
});
afterEach(() => vi.restoreAllMocks());

const draftOffered = () =>
  vi.mocked(Swal.fire).mock.calls.some(([options]) => {
    const prompt = options as { denyButtonText?: string; showDenyButton?: boolean };
    return prompt.denyButtonText === "Guardar Borrador" && prompt.showDenyButton === true;
  });
const openWith = async (screen: typeof NewQuote, route: string, actions: string[]) => {
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route, actions }], controlled: [route] }));
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = shallowMount(screen, { global: { plugins: [pinia] } });
  await flushPromises();
  vi.mocked(Swal.fire).mockClear();
  return wrapper.vm as unknown as Record<string, (...args: unknown[]) => Promise<void>>;
};

describe.each([
  [
    "a pricing quote",
    NewQuote,
    "newQuote",
    async (screen: Record<string, (...args: unknown[]) => Promise<void>>) => {
      const pricing = usePricingStore();
      pricing.datosPrincipales.containers = [];
      pricing.opcionCostos = [{ ...OPTION }];
      await screen.activarLlenadoCostosIndividual!(0, true);
    },
  ],
  [
    "a customs quote",
    NewAduana,
    "newCotizacionAduana",
    async (screen: Record<string, (...args: unknown[]) => Promise<void>>) => {
      useAduanaStore().opcionCostos = [{ ...OPTION }];
      await screen.activarLlenadoCostos!();
    },
  ],
] as const)("the prompt that moves %s to costing", (_name, screen, route, reachPrompt) => {
  test("offers to save a draft only with NUEVO", async () => {
    await reachPrompt(await openWith(screen, route, ["VER", "MODIFICAR", "ELIMINAR", "COPIAR", "EXPORTAR"]));
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Cotizar" }));
    expect(draftOffered()).toBe(false);

    await reachPrompt(await openWith(screen, route, ["VER", "NUEVO"]));
    expect(draftOffered()).toBe(true);
  });
});
