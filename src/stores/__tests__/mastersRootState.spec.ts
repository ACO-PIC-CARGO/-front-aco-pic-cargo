import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import type { TipoEmbarqueRaiz } from "@/types/app";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const lastConfig = () => httpMock.mock.lastCall![0];
const embarque = (id: number): TipoEmbarqueRaiz => ({ id, code: "FCL", id_transport: 1 });

describe("masters store, root state part", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 21, id_branch: 7 }]));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  test("_getServicesBegin sends null for each empty field and reads the transport from the app store", async () => {
    respond({ getItemsServices: accepted(["b", "a"]) });
    const masters = useMastersStore();

    await masters._getServicesBegin();
    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getItemsServices",
      headers: JSON_HEADERS,
      data: { id_modality: null, id_shipment: null, id_incoterms: null, id_branch: 7 },
    });

    masters.master_sentido = 1;
    useAppStore().master_id_trasnport = embarque(2);
    masters.master_incoterms = 3;
    await masters._getServicesBegin();
    expect(lastConfig().data).toEqual({ id_modality: 1, id_shipment: 2, id_incoterms: 3, id_branch: 7 });
    expect(masters.itemsServicesBegin).toEqual(["a", "b"]);
  });

  test("_getServicesBegin keeps the services when the answer carries no rows", async () => {
    const masters = useMastersStore();
    masters.itemsServicesBegin = [{ id: 1 }];
    respond({ getItemsServices: { estadoflag: false } });

    await masters._getServicesBegin();

    expect(masters.itemsServicesBegin).toEqual([{ id: 1 }]);
  });

  test("_getServicesList sends the raw direction, transport id and incoterm", async () => {
    const masters = useMastersStore();
    masters.master_sentido = 1;
    useAppStore().master_id_trasnport = embarque(2);
    masters.master_incoterms = 3;
    respond({ getItemsServicesList: accepted([{ id: 9 }]) });

    await masters._getServicesList();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getItemsServicesList",
      headers: JSON_HEADERS,
      data: { id_modality: 1, id_shipment: 2, id_incoterms: 3, id_branch: 7 },
    });
    expect(masters.itemsServicesList).toEqual([{ id: 9 }]);
  });

  test("_getTotalMasterList counts with the master filter and reads a missing total as zero", async () => {
    const masters = useMastersStore();
    respond({ getTotalMasterList: { ...accepted([]), total: "15" } });

    await masters._getTotalMasterList();
    expect(lastConfig().url).toBe(
      URL_MAIN +
        "getTotalMasterList?id_branch=7&id_canal=&id_sentido=&id_tipo_embarque=&id_origen=&id_destino=&id_agente=&fecha_etd=&fecha_eta=&status_op=&status_adm=&busqueda="
    );
    expect(masters.totalItemsMasterList).toBe(15);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");

    masters.master_filtro = {
      fecha_etd_desde: null,
      fecha_eta_desde: null,
      fecha_etd_hasta: null,
      fecha_eta_hasta: null,
      id_canal: 1,
      id_sentido: 2,
      id_tipo_embarque: embarque(3),
      id_origen: 4,
      id_destino: 5,
      id_agente: 6,
      fecha_etd: "2026-01-01",
      fecha_eta: "2026-02-01",
      status_operativo: 0,
      status_administrativo: 1,
      busqueda: "x",
    };
    respond({ getTotalMasterList: accepted([]) });
    await masters._getTotalMasterList();
    expect(lastConfig().url).toBe(
      URL_MAIN +
        "getTotalMasterList?id_branch=7&id_canal=1&id_sentido=2&id_tipo_embarque=3&id_origen=4&id_destino=5&id_agente=6&fecha_etd=2026-01-01&fecha_eta=2026-02-01&status_op=0&status_adm=1&busqueda=x"
    );
    expect(masters.totalItemsMasterList).toBe(0);
  });

  test("_getnroMaster builds the file number from the current year", async () => {
    const masters = useMastersStore();
    respond({ getNroMaster: accepted([{ nro_master: 41 }]) });

    await masters._getnroMaster();

    expect(lastConfig()).toEqual({
      method: "post",
      url: URL_MAIN + "getNroMaster",
      headers: JSON_HEADERS,
      data: { id_branch: 7 },
    });
    expect(masters.master_expediente).toBe(new Date().getFullYear() + "MBL41");
    expect(masters.master_nro_expediente).toBe(41);
  });
});
