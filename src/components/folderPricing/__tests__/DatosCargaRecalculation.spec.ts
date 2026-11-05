import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DatosCargaComponent from "@/components/folderPricing/DatosCargaComponent.vue";
import { usePricingStore } from "@/stores/pricing";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { accepted, httpMock, URL_MAIN } from "@/stores/__tests__/catalogHttp";
import type { Costo } from "@/types/cotizacion";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({}) } }));

const FREIGHT_BY_ORIGIN: Record<string, number> = { SHANGHAI: 1200, NINGBO: 900 };
const PROFIT = { esindividualflag: true, profitprimeraimportacion: 10, profitsegundaimportacion: 20 };
const BASE = { id_incoterms: 1, id_modality: 1, id_shipment: 3 };

function freightCalls() {
  return httpMock.mock.calls
    .map(([config]) => config)
    .filter((config) => config.url === `${URL_MAIN}calc/flete/obtener_flete`);
}

function lineAmounts() {
  return usePricingStore().opcionCostos[0]!.listCostos.map((line) => Number(line.costounitario));
}

async function openWithCosts() {
  const pinia = createPinia();
  setActivePinia(pinia);
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7, id_pais: 1 }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 7 }]));
  sessionStorage.setItem("iso_pais", "9589");
  httpMock.mockImplementation(async (config) => {
    if (config.url === `${URL_MAIN}calc/flete/obtener_flete`) {
      const origin = String((config.params as { puerto_origen: string }).puerto_origen);
      return { data: accepted([{ monto_flete: FREIGHT_BY_ORIGIN[origin], vigencia: "2026-12-01" }]) };
    }
    return { data: accepted([]) };
  });

  const pricing = usePricingStore();
  pricing.listShipment = [{ id: 3, code: "LCL", id_transport: 1 }] as never;
  pricing.listModality = [{ id: 1, code: "I" }] as never;
  pricing.listPortBegin = [
    { id_port: 10, puerto: "SHANGHAI", name: "Shanghai" },
    { id_port: 11, puerto: "NINGBO", name: "Ningbo" },
  ] as never;
  pricing.listPortEnd = [{ id_port: 20, puerto: "CALLAO", name: "Callao", id_pais: 1 }] as never;
  pricing.listServices = [{ code_service: "1", status: 1 }, { code_service: "14", status: 1 }] as never;
  pricing.preCostos = [
    { ...BASE, code_service: "1", code_cost: 4, costounitario: "0", profit_ganancia_pricing: [PROFIT] },
    { ...BASE, code_service: "14", code_cost: 13, costounitario: "0", profit_ganancia_pricing: [] },
  ] as Costo[];
  Object.assign(pricing.datosPrincipales, {
    id: "",
    esindividualflag: true,
    esgrupalflag: false,
    idtipocarga: { id: 3 },
    idincoterms: 1,
    idsentido: 1,
    idorigen: 10,
    iddestino: 20,
    id_town: 7,
    volumen: 2,
    peso: 500,
    containers: [],
    id_percepcionaduana: 2,
  });
  pricing.opcionCostos = [
    {
      nro_propuesta: 1,
      date_end: "",
      tiempo_transito: 30,
      selected: true,
      listImpuestos: [],
      listNotasQuote: [],
      listCostos: [
        { code_cost: 4, esopcionflag: 1, esventaflag: 0, costounitario: 1200 },
        { code_cost: 4, esopcionflag: 0, esventaflag: 1, costounitario: 1220 },
        { code_cost: 13, esopcionflag: 1, esventaflag: 0, costounitario: 50 },
      ],
    },
  ];
  useCalculadorasStore().fletePricing = { monto_flete: 1200, vigencia: "2026-12-01" };
  useMasterusuariosStore().lstPercepcionAduana = [
    { id: 1, codigo: "01", codigo01: "10" },
    { id: 2, codigo: "02", codigo01: "3.5" },
  ] as never;

  const wrapper = shallowMount(DatosCargaComponent, { global: { plugins: [pinia], renderStubDefaultSlot: true } });
  await flushPromises();
  httpMock.mockClear();
  return wrapper;
}

function selectByLabel(wrapper: Awaited<ReturnType<typeof openWithCosts>>, label: string) {
  const select = wrapper
    .findAllComponents({ name: "VAutocomplete" })
    .concat(wrapper.findAllComponents({ name: "VSelect" }))
    .find((field) => field.props("label") === label);
  if (!select) throw new Error(`no field labelled ${label}`);
  return select;
}

beforeEach(() => vi.clearAllMocks());

test("choosing another origin port prices the freight of the new route", async () => {
  const wrapper = await openWithCosts();

  selectByLabel(wrapper, "Puerto Origen").vm.$emit("update:modelValue", 11);
  await flushPromises();

  expect(freightCalls().map((config) => (config.params as { puerto_origen: string }).puerto_origen)).toEqual(["NINGBO"]);
  expect(lineAmounts().slice(0, 2)).toEqual([900, 920]);
});

test("choosing another destination port drops the previous district's transport price", async () => {
  const wrapper = await openWithCosts();

  selectByLabel(wrapper, "Puerto Destino").vm.$emit("update:modelValue", 20);
  await flushPromises();

  expect(usePricingStore().datosPrincipales.id_town).toBeNull();
  expect(lineAmounts()[2]).toBe(0);
});

test("accepting the measures calculator asks for the freight of the new weight and volume", async () => {
  const wrapper = await openWithCosts();
  const screen = wrapper.vm as unknown as { tblTotal: unknown; guardarDatosCalculadora: () => Promise<void> };

  screen.tblTotal = { descripcion: "Total:", uni: 3, peso: 800, volumen: 4 };
  await screen.guardarDatosCalculadora();
  await flushPromises();

  expect(freightCalls().map((config) => config.params)).toEqual([
    expect.objectContaining({ peso: 800, volumen: 4, puerto_origen: "SHANGHAI" }),
  ]);
});

test("switching between first and second import reprices the sale profit", async () => {
  const wrapper = await openWithCosts();

  selectByLabel(wrapper, "Primera o Segunda Importación").vm.$emit("update:modelValue", 1);
  await flushPromises();

  expect(lineAmounts()[1]).toBe(1210);
});
