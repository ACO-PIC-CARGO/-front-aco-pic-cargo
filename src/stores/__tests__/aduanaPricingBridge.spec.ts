import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import { createStore } from "vuex";
import aduana from "@/store/modules/aduana";
import { usePricingStore } from "@/stores/pricing";
import { accepted, flushPromises, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: false })) } }));
vi.mock("@/store", () => ({ default: { state: {}, commit: vi.fn(), dispatch: vi.fn() } }));

describe("aduana mutations that pricing shared while both were Vuex modules", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1 }]));
  });
  const vuex = () => createStore({ modules: { aduana } });

  test.each([
    ["SET_LIST_EJECUTIVO", "listEjecutivo"],
    ["PRE_SERVICES", "preServices"],
    ["PRE_COSTOS", "preCostos"],
    ["SET_LIST_COSTES", "listCostos"],
    ["SET_CARGAR_IMPUESTOS", "listImpuestos"],
    ["ACTUALIZAR_IMPUEST", "listImpuestos"],
    ["SET_LIST_MODALITY", "listModality"],
    ["SET_LIST_PORT_BEGIN", "listPortBegin"],
    ["SET_LIST_PORT_END", "listPortEnd"],
    ["SET_LIST_SHIPMENT", "listShipment"],
    ["SET_LIST_INCOTERMS", "listIncoterms"],
    ["SET_CARGAR_NOTAS_COTIZACION", "listNotasQuote"],
    ["setInstructivo", "listInstructivo"],
    ["SET_MULTPLICADOR", "listMultiplicador"],
  ] as const)("%s hands aduana's rows to pricing's %s", (mutation, key) => {
    const rows = [{ id: 1 }];

    vuex().commit(mutation, rows);

    expect(toRaw(usePricingStore()[key])).toBe(rows);
  });

  test("SET_LIST_SERVICES and SET_TIPO_COSTOS fill both pricing lists that their pricing mutations set", () => {
    const services = [{ id: 1 }];
    const tipos = [{ codigo: "FL", name: "FLETE" }];
    const store = vuex();

    store.commit("SET_LIST_SERVICES", services);
    store.commit("SET_TIPO_COSTOS", tipos);

    const pricing = usePricingStore();
    expect([toRaw(pricing.listServices), toRaw(pricing.copylistServices)]).toEqual([services, services]);
    expect(toRaw(pricing.listServices)).toBe(services);
    expect(toRaw(pricing.listTipoCostos)).toBe(tipos);
    expect(toRaw(pricing.namesection)).toBe(tipos);
  });

  test("SET_LIST_QUOTES keeps aduana's raw rows and gives pricing the rows keyed by id and position", () => {
    const rows = [{ id: 9 }, { code: "A" }];
    const store = vuex();

    store.commit("SET_LIST_QUOTES", rows);

    expect(toRaw(store.state.aduana.listQuotes)).toBe(rows);
    expect(usePricingStore().listQuotes).toEqual([
      { id: 9, rowId: "9_0" },
      { code: "A", rowId: "quote_1" },
    ]);
  });

  test("getQuoteCallAduana fills pricing's calls list, keyed like pricing's own loader, or empties it on a rejection", async () => {
    respond({ list_calls_aduana: accepted([{ id: 7 }, { id: 7 }]) });
    const store = vuex();

    await store.dispatch("getQuoteCallAduana", {});
    expect(usePricingStore().listCall).toEqual([
      { id: 7, rowId: "7_0" },
      { id: 7, rowId: "7_1" },
    ]);

    respond({ list_calls_aduana: rejected() });
    await store.dispatch("getQuoteCallAduana", {});
    await flushPromises();
    expect(usePricingStore().listCall).toEqual([]);
  });
});
