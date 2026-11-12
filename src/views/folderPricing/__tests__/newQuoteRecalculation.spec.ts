import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import NewQuote from "@/views/folderPricing/NewQuote.vue";
import { useAppStore } from "@/stores/app";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";
import type { OpcionCosto } from "@/types/cotizacion";

const push = vi.hoisted(() => vi.fn());
vi.mock("vue-router", () => ({ useRoute: () => ({ name: "newQuote", params: {} }), useRouter: () => ({ push }) }));
vi.mock("@/router", () => ({ default: { push, currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showLoading: vi.fn(), close: vi.fn() } }));

type Screen = Record<string, (...args: unknown[]) => Promise<void>>;
const ROUTE = { id_incoterms: 1, id_modality: 1, id_shipment: 3 };
const PROFIT = { esindividualflag: true, profitprimeraimportacion: 10, profitsegundaimportacion: 20 };
let responses: Record<string, unknown>;

const option = (nro_propuesta: number): OpcionCosto => ({
  nro_propuesta,
  date_end: "2099-01-01",
  tiempo_transito: 30,
  selected: false,
  listCostos: [],
  listImpuestos: [],
  listNotasQuote: [],
});

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, id_pais: 1 }]));
  sessionStorage.setItem("permissions", JSON.stringify({ screens: [{ route: "newQuote", actions: ["VER", "NUEVO"] }], controlled: ["newQuote"] }));
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false, isDismissed: true } as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
  responses = {};
  httpMock.mockImplementation(async (config) => {
    const body = responses[config.url.slice(URL_MAIN.length).split("?")[0]!];
    if (body instanceof Error) throw body;
    return { data: body ?? accepted([]) };
  });
});
afterEach(() => vi.restoreAllMocks());

async function openNewQuote() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = shallowMount(NewQuote, { global: { plugins: [pinia] } });
  await flushPromises();
  vi.mocked(Swal.fire).mockClear();
  return wrapper.vm as unknown as Screen;
}

function quoteWithFreight({ grupal = false } = {}) {
  const pricing = usePricingStore();
  pricing.listShipment = [{ id: 3, code: "LCL", id_transport: 1 }] as never;
  pricing.listPortBegin = [{ id_port: 10, puerto: "SHANGHAI" }] as never;
  pricing.listPortEnd = [{ id_port: 20, puerto: "CALLAO" }] as never;
  pricing.listServices = [{ code_service: "1", status: 1 }] as never;
  pricing.preCostos = [
    { ...ROUTE, code_service: "1", code_cost: 4, costounitario: "0", profit_ganancia_pricing: [PROFIT] },
  ] as never;
  pricing.listImpuestos = [{ codigo: "05", codigo01: "6" }] as never;
  Object.assign(pricing.datosPrincipales, {
    esindividualflag: !grupal,
    esgrupalflag: grupal,
    idtipocarga: { id: 3 },
    idincoterms: 1,
    idsentido: 1,
    idorigen: 10,
    iddestino: 20,
    volumen: 2,
    peso: 500,
    containers: [],
    id_percepcionaduana: 2,
    id_status: 1,
  });
  useMasterusuariosStore().lstPercepcionAduana = [{ id: 2, codigo: "02", codigo01: "3.5" }] as never;
  pricing.opcionCostos = [option(1), option(2)];
  responses["calc/flete/obtener_flete"] = accepted([{ monto_flete: 1200, vigencia: "2026-12-01" }]);
  return pricing;
}

test("a service change rebuilds option 1 with the calculator freight", async () => {
  const screen = await openNewQuote();
  const pricing = quoteWithFreight();

  await screen.recargarCostos!();
  await flushPromises();

  const [cost, sale] = pricing.opcionCostos[0]!.listCostos;
  expect(pricing.opcionCostos).toHaveLength(1);
  expect([Number(cost!.costounitario), Number(sale!.costounitario)]).toEqual([1200, 1220]);
  expect(sale!.tienefleteflag).toBe(true);
});

test("after a service change, editing option 1's taxes leaves the company's tax list untouched", async () => {
  const screen = await openNewQuote();
  const pricing = quoteWithFreight();

  await screen.recargarCostos!();
  pricing.opcionCostos[0]!.listImpuestos[0]!.codigo01 = "11";

  expect(pricing.listImpuestos[0]!.codigo01).toBe("6");
});

test("continuing without ports asks for them and frees the screen", async () => {
  const screen = await openNewQuote();
  const pricing = quoteWithFreight();
  pricing.datosPrincipales.idorigen = "";

  await screen.activarLlenadoCostos!();
  await flushPromises();

  expect(useAppStore().spiner).toBe(false);
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ text: expect.stringContaining("puerto de origen y de destino") }),
  );
});

test("continuing with a district that has a transport tariff marks the quote as priced again", async () => {
  const screen = await openNewQuote();
  const pricing = quoteWithFreight();
  pricing.listServices = [...pricing.listServices, { code_service: "14", status: 1 }] as never;
  Object.assign(pricing.datosPrincipales, { id_town: 5, tienefleteflag: false });
  useCalculadorasStore().lstTransporte = [{ id_distrito: 5, opcion: 1, peso_desde: 0, peso_hasta: 1000, tarifadolar: 80 }] as never;

  await screen.activarLlenadoCostos!();
  await flushPromises();

  expect(pricing.datosPrincipales.tienefleteflag).toBe(true);
});

test("an incoterm change on a Grupal quote adds destination transport unchecked", async () => {
  const screen = await openNewQuote();
  const pricing = quoteWithFreight({ grupal: true });
  pricing.preServices = [{ ...ROUTE, id: 30, code_service: 14, status: 1 }] as never;
  pricing.listServices = [];

  (screen.recargarServicios as unknown as () => void)();

  expect(pricing.listServices.find((service) => service.code_service == 14)!.status).toBe(0);
});

test("a draft whose OneDrive link fails is still reported as saved and leaves the screen", async () => {
  const screen = await openNewQuote();
  quoteWithFreight();
  responses.setQuote = { ...accepted([]), insertId: 55, nro_quote: "1234-P", msg: "Cotización ingresada" };
  responses["crear-carpeta-cotizacion"] = accepted("https://onedrive.example/1234-P");
  responses.actualizar_quote_folderonedrive = new Error("Network Error");
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);

  await screen.guardar!();
  await flushPromises();

  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Cotización guardada", text: expect.stringContaining("OneDrive") }),
  );
  expect(push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 55 } });
});

test("closing the saved-draft notice opens the saved quote instead of the list", async () => {
  const screen = await openNewQuote();
  quoteWithFreight();
  responses.setQuote = { ...accepted([]), insertId: 56, nro_quote: "1235-P", msg: "Cotización ingresada" };

  await screen.guardar!();
  await flushPromises();

  expect(push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 56 } });
  expect(push).not.toHaveBeenCalledWith({ name: "lstQuote" });
});

test("opening the comparison from the stepper header recalculates it", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = shallowMount(NewQuote, { global: { plugins: [pinia], renderStubDefaultSlot: true } });
  await flushPromises();
  const before = usePricingStore().actualizarComparativa;

  wrapper.findComponent({ name: "VStepper" }).vm.$emit("update:modelValue", 3);
  await flushPromises();

  expect(usePricingStore().actualizarComparativa).toBe(!before);
});
