import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { Component } from "vue";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import VerAduana from "@/views/Aduana/VerAduana.vue";
import EditarAduana from "@/views/Aduana/EditarAduana.vue";
import NewQuote from "@/views/Aduana/NewQuote.vue";
import ListAduana from "@/views/Aduana/ListAduana.vue";
import InstructivoComponent from "@/components/folderAduana/VerComponent/InstructivoComponent.vue";
import ListAduanaComponent from "@/components/folderAduana/ListAduanaComponent.vue";
import ListCallComponent from "@/components/folderAduana/ListCallComponent.vue";
import ImpuestosComponent from "@/components/folderAduana/Costos/ImpuestosComponent.vue";
import { useAppStore } from "@/stores/app";
import { useAduanaStore } from "@/stores/aduana";
import { usePricingStore } from "@/stores/pricing";
import { URL_MAIN, accepted, httpMock, rejected } from "@/stores/__tests__/catalogHttp";
import { ADUANA_APPROVED_MESSAGE, ADUANA_NOT_FOUND_MESSAGE } from "@/utils/aduanaScreen";
import type { AprobacionCotizacion } from "@/types/cotizacion";

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
  test("opening a pending aduana with a chosen option saves its final amounts so House can offer it", async () => {
    answerWith({ ver_aduana: accepted([ADUANA]), getShipment: accepted([{ id: 3, id_transport: 1 }]) });

    const { aduana } = await openScreen(VerAduana, (store) => {
      vi.spyOn(store, "GuardaCostosFinalesAduana").mockResolvedValue(undefined);
    });

    expect(aduana.GuardaCostosFinalesAduana).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["an approved aduana", { ...ADUANA, aprobadoflag: true }],
    ["an aduana without a chosen option", { ...ADUANA, opcioncostos: [{ ...ADUANA.opcioncostos[0], selected: false }] }],
  ])("opening %s saves no final amounts", async (_case, opened) => {
    answerWith({ ver_aduana: accepted([opened]), getShipment: accepted([{ id: 3, id_transport: 1 }]) });

    const { aduana } = await openScreen(VerAduana, (store) => {
      vi.spyOn(store, "GuardaCostosFinalesAduana").mockResolvedValue(undefined);
    });

    expect(aduana.GuardaCostosFinalesAduana).not.toHaveBeenCalled();
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

describe("Aprobar desde el instructivo", () => {
  test("a failed approval is retried with a new key and the approved aduana's final amounts are not saved again", async () => {
    const { vm, aduana } = await openScreen(InstructivoComponent);
    const approve = vi.spyOn(aduana, "aprobarCotizacionAduana").mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const saveFinalAmounts = vi.spyOn(aduana, "GuardaCostosFinalesAduana").mockResolvedValue(undefined);

    await vm.approveAduana!({ id_quote: "14" });
    await vm.approveAduana!({ id_quote: "14" });

    const [firstKey, retryKey] = approve.mock.calls.map(([data]) => (data as AprobacionCotizacion).IdempotencyKey);
    expect(firstKey).toBeTruthy();
    expect(retryKey).toBeTruthy();
    expect(retryKey).not.toBe(firstKey);
    expect(saveFinalAmounts).not.toHaveBeenCalled();
  });
});

describe("Listado de aduanas", () => {
  test("opening the list does not load Pricing's status summary", async () => {
    await openScreen(ListAduana);

    expect(requestsTo("resumen_por_estado")).toHaveLength(0);
  });

  test("deleting asks first, then deletes the aduana itself, never a Pricing quote, and reloads the aduana list", async () => {
    const { vm } = await openScreen(ListAduanaComponent);
    answerWith({ delete_aduana: { estadoflag: true, mensaje: "Cotización eliminada.", tipomensaje: "TMSGINF", data: [] } });
    httpMock.mockClear();

    await vm.eliminar!(14, "00000014");
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning", showCancelButton: true }));
    expect(requestsTo("delete_aduana").map(([config]) => config.data)).toEqual([{ id: 14 }]);
    expect(requestsTo("delQuote")).toHaveLength(0);
    expect(requestsTo("listar_aduana")).toHaveLength(1);
  });

  test("cancelling the delete leaves the aduana alone", async () => {
    const { vm } = await openScreen(ListAduanaComponent);
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    httpMock.mockClear();

    await vm.eliminar!(14, "00000014");
    await flushPromises();

    expect(requestsTo("delete_aduana")).toHaveLength(0);
  });

  test("a call registered from the list is saved on the aduana", async () => {
    const { vm, wrapper } = await openScreen(ListAduanaComponent, () => {}, { renderStubDefaultSlot: true });
    usePricingStore().id = 999;

    vm.registrarLlamada!(14);
    await wrapper.vm.$nextTick();
    await vm.guardarNota!();
    await flushPromises();

    expect(requestsTo("set_calls_aduana").map(([config]) => (config.data as { id_quote: number }).id_quote)).toEqual([14]);
    expect(usePricingStore().id).toBe(999);
  });

  test("a call registered from the calls tab is saved on the aduana, not on a Pricing quote", async () => {
    const { vm, wrapper } = await openScreen(ListCallComponent, () => {}, { renderStubDefaultSlot: true });

    vm.registrarLlamada!(14);
    await wrapper.vm.$nextTick();
    await vm.guardarNota!();
    await flushPromises();

    expect(requestsTo("set_calls_aduana").map(([config]) => (config.data as { id_quote: number }).id_quote)).toEqual([14]);
    expect(requestsTo("setCalls")).toHaveLength(0);
  });
});

describe("Impuestos de aduana", () => {
  test("are computed with the aduana's goods value and freight, not Pricing's", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const aduana = useAduanaStore();
    aduana.datosPrincipales.amount = 5000;
    aduana.totalFlete = 300;
    usePricingStore().datosPrincipales.amount = 1;
    usePricingStore().totalFlete = 1;
    const wrapper = shallowMount(ImpuestosComponent, {
      props: { impuestos: [{ codigo: "01", codigo01: 0, nro_propuesta: 1 }, { codigo: "02", codigo01: 0, nro_propuesta: 1 }] },
      global: { plugins: [pinia] },
    });
    const vm = wrapper.vm as unknown as { calcularImpuestos: (args: { item: { codigo: string } }) => string };

    expect([vm.calcularImpuestos({ item: { codigo: "01" } }), vm.calcularImpuestos({ item: { codigo: "02" } })]).toEqual(["5000.00", "300.00"]);
  });
});
