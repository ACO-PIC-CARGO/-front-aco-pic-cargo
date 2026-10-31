import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { Component } from "vue";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import VerAduana from "@/views/Aduana/VerAduana.vue";
import EditarAduana from "@/views/Aduana/EditarAduana.vue";
import NewQuote from "@/views/Aduana/NewQuote.vue";
import { useAppStore } from "@/stores/app";
import { useAduanaStore } from "@/stores/aduana";
import { URL_MAIN, accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";
import { ADUANA_APPROVED_MESSAGE, ADUANA_NOT_FOUND_MESSAGE } from "@/utils/aduanaScreen";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "14" } }), useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const ADUANA = {
  id: 14,
  quote: "14-A",
  statusmain: 1,
  aprobadoflag: false,
  idtipocarga: 3,
  containers: [],
  servicios: [],
  opcioncostos: [{ id: 1, nro_propuesta: 1, date_end: "2026-12-01", tiempo_transito: 30, listcostos: [], listimpuestos: [], listnotasquote: [], selected: true }],
};
const LIST = { name: "lstQuoteAduanaAduana" };
const FormStub = { template: "<form><slot /></form>", methods: { validate: async () => ({ valid: true }), reset: () => {} } };

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
  sessionStorage.setItem("ConfigEmpresa", JSON.stringify({ existecot: true, existemaster: true }));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  answerWith({});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function openScreen(
  screen: Component,
  prepare: (aduana: ReturnType<typeof useAduanaStore>) => void = () => {},
  options: { props?: Record<string, unknown>; renderStubDefaultSlot?: boolean } = {},
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const aduana = useAduanaStore();
  vi.spyOn(aduana, "generaInstructivoAduana").mockImplementation(() => {});
  vi.spyOn(aduana, "generaInstructivoparaguardataAduana").mockResolvedValue(undefined);
  prepare(aduana);
  const wrapper = shallowMount(screen, {
    props: options.props,
    global: {
      plugins: [pinia],
      renderStubDefaultSlot: options.renderStubDefaultSlot,
      stubs: { VForm: FormStub },
      config: { errorHandler: () => {} },
    },
  });
  await flushPromises();
  return { wrapper, aduana, app: useAppStore(), vm: wrapper.vm as unknown as Record<string, (...args: unknown[]) => Promise<unknown>> };
}

describe.each([
  ["Ver", VerAduana],
  ["Editar", EditarAduana],
])("%s of an aduana that cannot be opened", (_name, screen) => {
  test("stops loading and offers the way back to the aduana list", async () => {
    answerWith({ ver_aduana: rejected() });

    const { app } = await openScreen(screen);

    expect(app.spiner).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: ADUANA_NOT_FOUND_MESSAGE, confirmButtonText: "Volver al listado" }));
    expect(push).toHaveBeenCalledWith(LIST);
  });
});

describe("Ver", () => {
  test("opening an aduana with a chosen option never saves its final amounts", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    answerWith({ ver_aduana: accepted([ADUANA]), getShipment: accepted([{ id: 3, id_transport: 1 }]) });

    const { aduana } = await openScreen(VerAduana);
    const saveFinalAmounts = vi.spyOn(aduana, "GuardaCostosFinalesAduana").mockResolvedValue(undefined);
    vi.advanceTimersByTime(5000);
    await flushPromises();

    expect(saveFinalAmounts).not.toHaveBeenCalled();

    expect(vi.mocked(http.post)).not.toHaveBeenCalled();
  });
});

describe("Editar", () => {
  test("refuses an approved aduana opened by its address and offers the way back to the list", async () => {
    answerWith({ ver_aduana: accepted([{ ...ADUANA, aprobadoflag: true }]) });

    await openScreen(EditarAduana);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: ADUANA_APPROVED_MESSAGE, confirmButtonText: "Volver al listado" }));
    expect(push).toHaveBeenCalledWith(LIST);
  });
});

describe("Nueva cotización de aduana", () => {
  test("starts empty even after another aduana was open", async () => {
    const { aduana } = await openScreen(NewQuote, (store) => {
      store.id = 14;
      store.nro_quote = "14-A";
      store.aprobadoflag = true;
    });

    expect([aduana.id, aduana.nro_quote, aduana.aprobadoflag]).toEqual(["", "", false]);
  });

  test("saving a draft saves an aduana, never a pricing quote", async () => {
    answerWith({ "insert_aduana  ": { estadoflag: true, insertId: 15, nro_quote: "15-A", msg: "Cotización ingresada con el número 15-A" } });
    const { vm, aduana } = await openScreen(NewQuote);

    await vm.guardar!();
    await flushPromises();

    expect(requestsTo("insert_aduana  ")).toHaveLength(1);
    expect(requestsTo("setQuote")).toHaveLength(0);
    expect(aduana.id).toBe(15);
    expect(push).toHaveBeenCalledWith(LIST);
  });
});
