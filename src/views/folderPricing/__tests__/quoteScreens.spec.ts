import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { Component } from "vue";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import EditarPricing from "@/views/folderPricing/EditarPricing.vue";
import VerPricing from "@/views/folderPricing/VerPricing.vue";
import NotasComponent from "@/components/folderPricing/VerComponent/NotasComponent.vue";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import { URL_MAIN, accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";
import { APPROVED_QUOTE_MESSAGE } from "@/utils/quoteApproval";
import { QUOTE_NOT_FOUND_MESSAGE } from "@/utils/quoteScreen";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "77" }, name: "verQuote" }), useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const QUOTE = {
  id: 77,
  quote: "14779-P",
  statusmain: 1,
  aprobadoflag: false,
  idtipocarga: 3,
  containers: [],
  cliente: [{ id: 4159 }],
  servicios: [],
  opcioncostos: [{ id: 1, nro_propuesta: 1, date_end: "2026-12-01", tiempo_transito: 30, listcostos: [], listimpuestos: [], listnotasquote: [], selected: true }],
};

const answerWith = (answers: Record<string, unknown>) =>
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0]!;
    const answer = answers[path] ?? accepted([]);
    if (answer instanceof Error) throw answer;
    return { data: answer };
  });
const requestsTo = (path: string) => httpMock.mock.calls.filter(([config]) => config.url.slice(URL_MAIN.length).split("?")[0] === path);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, id_pais: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

async function openScreen(
  screen: Component,
  prepare: (pricing: ReturnType<typeof usePricingStore>) => void = () => {},
  renderStubDefaultSlot = false,
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const pricing = usePricingStore();
  vi.spyOn(pricing, "generaInstructivo").mockResolvedValue(undefined as never);
  prepare(pricing);
  const errors: unknown[] = [];
  const wrapper = shallowMount(screen, {
    global: { plugins: [pinia], renderStubDefaultSlot, config: { errorHandler: (error) => errors.push(error) } },
  });
  await flushPromises();
  return { wrapper, pricing, app: useAppStore(), errors };
}

describe.each([
  ["Ver", VerPricing],
  ["Editar", EditarPricing],
])("%s of a quote that is not found", (_name, screen) => {
  test("stops loading and offers the way back to the list", async () => {
    answerWith({ getQuoteId: rejected() });

    const { app } = await openScreen(screen);

    expect(app.spiner).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: QUOTE_NOT_FOUND_MESSAGE, confirmButtonText: "Volver al listado" }));
    expect(push).toHaveBeenCalledWith({ name: "lstQuote" });
    expect(requestsTo("getMarketingList")).toHaveLength(0);
  });
});

describe("Ver", () => {
  test("keeps loading the rest of the quote when one of its lists fails and warns once", async () => {
    answerWith({ getQuoteId: accepted([QUOTE]) });

    const { pricing } = await openScreen(VerPricing, (store) => {
      vi.spyOn(store, "getModality").mockRejectedValue(new Error("Network Error"));
    });

    expect(pricing.step2).toBe(true);
    const warnings = vi.mocked(Swal.fire).mock.calls.filter(([options]) => (options as { icon?: string }).icon === "warning");
    expect(warnings).toHaveLength(1);
  });

  test("opening a pending quote with a chosen option saves its final amounts so House can offer it", async () => {
    answerWith({ getQuoteId: accepted([QUOTE]) });

    const { pricing } = await openScreen(VerPricing, (store) => {
      vi.spyOn(store, "GuardaCostosFinalesQuote").mockResolvedValue(undefined);
    });

    expect(pricing.GuardaCostosFinalesQuote).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["an approved quote", { ...QUOTE, aprobadoflag: true }],
    ["a quote without a chosen option", { ...QUOTE, opcioncostos: [{ ...QUOTE.opcioncostos[0], selected: false }] }],
  ])("opening %s saves no final amounts", async (_case, quote) => {
    answerWith({ getQuoteId: accepted([quote]) });

    const { pricing } = await openScreen(VerPricing, (store) => {
      vi.spyOn(store, "GuardaCostosFinalesQuote").mockResolvedValue(undefined);
    });

    expect(pricing.GuardaCostosFinalesQuote).not.toHaveBeenCalled();
  });

  test("starts on the first option even if another quote was left on a later one", async () => {
    answerWith({ getQuoteId: accepted([QUOTE]) });

    const { pricing } = await openScreen(VerPricing, (store) => {
      store.page = 3;
    });

    expect(pricing.page).toBe(1);
  });

  test("the notes of a quote render even when the page points past its options", async () => {
    const { errors } = await openScreen(NotasComponent, (store) => {
      store.page = 3;
      store.opcionCostos = [{ nro_propuesta: 1, date_end: "", tiempo_transito: 30, listCostos: [], listImpuestos: [], listNotasQuote: [], selected: true }];
    }, true);

    expect(errors).toEqual([]);
  });
});

describe("Editar", () => {
  test("refuses an approved quote opened by its address and offers the way back to the list", async () => {
    answerWith({ getQuoteId: accepted([{ ...QUOTE, aprobadoflag: true }]) });

    const { app } = await openScreen(EditarPricing);

    expect(app.spiner).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: APPROVED_QUOTE_MESSAGE, confirmButtonText: "Volver al listado" }));
    expect(push).toHaveBeenCalledWith({ name: "lstQuote" });
    expect(requestsTo("getMarketingList")).toHaveLength(0);
  });
});
