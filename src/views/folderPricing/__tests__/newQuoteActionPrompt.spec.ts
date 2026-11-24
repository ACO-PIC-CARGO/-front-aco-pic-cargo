import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent } from "vue";
import { flushPromises, shallowMount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import NewQuote from "@/views/folderPricing/NewQuote.vue";
import { NO_CALCULATOR_FREIGHT } from "@/components/folderPricing/quoteRules";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "newQuote", params: {} }), useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

const askAction = vi.fn();
const ActionDialogStub = defineComponent({
  name: "NewQuoteActionDialog",
  props: { canSave: Boolean, canRequest: Boolean, warning: { type: String, default: null } },
  setup(_, { expose }) {
    expose({ ask: askAction });
    return () => null;
  },
});

const OPTION = { nro_propuesta: 1, date_end: "2099-01-01", tiempo_transito: 30, listCostos: [], listImpuestos: [], listNotasQuote: [], selected: true };
const SAVED_DRAFT = { ...accepted([]), insertId: 57, nro_quote: "1236-P", msg: "Cotización ingresada" };
let responses: Record<string, unknown>;
let wrapper: VueWrapper;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7, id_pais: 1 }]));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
  askAction.mockResolvedValue(null);
  responses = {};
  httpMock.mockImplementation(async (config) => ({ data: responses[config.url.slice(URL_MAIN.length).split("?")[0]!] ?? accepted([]) }));
});
afterEach(() => vi.restoreAllMocks());

async function reachPrompt(actions: Record<string, string[]> = { newQuote: ["VER", "NUEVO"], lstQuote: ["VER", "MODIFICAR"] }) {
  sessionStorage.setItem(
    "permissions",
    JSON.stringify({ screens: Object.entries(actions).map(([route, granted]) => ({ route, actions: granted })), controlled: Object.keys(actions) }),
  );
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = shallowMount(NewQuote, { global: { plugins: [pinia], renderStubDefaultSlot: true, stubs: { NewQuoteActionDialog: ActionDialogStub } } });
  await flushPromises();
  httpMock.mockClear();
  vi.mocked(Swal.fire).mockClear();
  const pricing = usePricingStore();
  Object.assign(pricing.datosPrincipales, { containers: [], id_status: 1 });
  pricing.opcionCostos = [{ ...OPTION }];
  const screen = wrapper.vm as unknown as { activarLlenadoCostosIndividual(index: number, confirm: boolean): Promise<void> };
  await screen.activarLlenadoCostosIndividual(0, true);
  await flushPromises();
  return pricing;
}

const prompt = () => wrapper.findComponent(ActionDialogStub);
const calls = (path: string) => httpMock.mock.calls.filter(([config]) => config.url === URL_MAIN + path);
const pricingRequests = () => httpMock.mock.calls.filter(([config]) => config.url.startsWith(URL_MAIN + "quote_pricing_request/"));

test("Solicitar a Pricing saves the draft, asks pricing for that quote and opens it", async () => {
  askAction.mockResolvedValue("save_and_request");
  responses.setQuote = SAVED_DRAFT;
  responses["quote_pricing_request/57"] = { ...accepted([]), mensaje: "Le avisamos a ANA que revise la cotización 1236-P." };

  await reachPrompt();

  expect(calls("setQuote")).toHaveLength(1);
  expect(pricingRequests().map(([config]) => [config.method, config.url])).toEqual([["post", URL_MAIN + "quote_pricing_request/57"]]);
  expect(push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 57 } });
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Solicitud enviada", text: "Le avisamos a ANA que revise la cotización 1236-P." }),
  );
});

test("a refused pricing request still leaves the draft saved and says why", async () => {
  askAction.mockResolvedValue("save_and_request");
  responses.setQuote = SAVED_DRAFT;
  responses["quote_pricing_request/57"] = {
    estadoflag: false,
    mensaje: "Esta cotización no tiene pricing asignado. Edítala y elige uno en el campo Pricing.",
    tipomensaje: "TMSGADV",
    data: [],
  };

  await reachPrompt();

  expect(push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 57 } });
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ title: "No se envió la solicitud a pricing", text: expect.stringContaining("no tiene pricing asignado") }),
  );
});

test("Guardar saves the draft without asking pricing", async () => {
  askAction.mockResolvedValue("save_only");
  responses.setQuote = SAVED_DRAFT;

  await reachPrompt();

  expect(calls("setQuote")).toHaveLength(1);
  expect(pricingRequests()).toHaveLength(0);
  expect(push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 57 } });
});

test("a draft the server refuses to save asks pricing for nothing", async () => {
  askAction.mockResolvedValue("save_and_request");
  responses.setQuote = { estadoflag: false, mensaje: "Falta el cliente.", tipomensaje: "TMSGADV", data: [] };

  await reachPrompt();

  expect(pricingRequests()).toHaveLength(0);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "No se guardó la cotización" }));
  expect(push).not.toHaveBeenCalled();
});

test("Pasar a Cotizar moves to costing without saving", async () => {
  askAction.mockResolvedValue("quote");

  const pricing = await reachPrompt();

  expect(pricing.step).toBe(2);
  expect(calls("setQuote")).toHaveLength(0);
});

test("saving and requesting are offered only with their permissions", async () => {
  await reachPrompt({ newQuote: ["VER", "NUEVO"], lstQuote: ["VER", "MODIFICAR"] });
  expect(prompt().props()).toMatchObject({ canSave: true, canRequest: true });

  await reachPrompt({ newQuote: ["VER", "NUEVO"], lstQuote: ["VER"] });
  expect(prompt().props()).toMatchObject({ canSave: true, canRequest: false });

  await reachPrompt({ newQuote: ["VER", "MODIFICAR"], lstQuote: ["VER", "MODIFICAR"] });
  expect(prompt().props()).toMatchObject({ canSave: false, canRequest: false });
});

test("the prompt warns when the calculator has no LCL freight for the route", async () => {
  const pricing = await reachPrompt();
  pricing.listShipment = [{ id: 3, code: "LCL", id_transport: 1 }] as never;
  pricing.datosPrincipales.idtipocarga = { id: 3 } as never;
  pricing.datosPrincipales.esgrupalflag = false;
  await flushPromises();

  expect(prompt().props("warning")).toBe(NO_CALCULATOR_FREIGHT);
});
