import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useTrafficStore } from "@/stores/traffic";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));

const pendingFile = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, sent: false };
const listed = { id_traffic: 4, code_traffic: "TR-00004", sent_at: null, status_name: null };

const sentConfig = (path: string) => httpMock.mock.calls.find(([config]) => config.url === URL_MAIN + path)?.[0];

describe("traffic store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  test("fileOfQuote returns the quote's Tráfico file", async () => {
    respond({ traffic_by_quote: accepted([pendingFile]) });

    const file = await useTrafficStore().fileOfQuote("PRICING", 15376);

    expect(file).toEqual(pendingFile);
    expect(sentConfig("traffic_by_quote")!.params).toEqual({ quote_kind: "PRICING", id_quote: 15376 });
  });

  test("fileOfQuote returns nothing for a quote that never went to Tráfico", async () => {
    respond({ traffic_by_quote: rejected() });

    expect(await useTrafficStore().fileOfQuote("ADUANA", 8)).toBeNull();
  });

  test("fileOfHouse returns the house's Tráfico file with its quote", async () => {
    const file = { id_traffic: 4, code_traffic: "TR-00004", id_house: 90, quote_kind: "ADUANA", id_quote: 31, sent: false };
    respond({ traffic_by_house: accepted([file]) });

    expect(await useTrafficStore().fileOfHouse(90)).toEqual(file);
    expect(sentConfig("traffic_by_house")!.params).toEqual({ id_house: 90 });
  });

  test("mastersFor returns the masters the file can join, or none", async () => {
    const master = { id: 3831, code_master: "2026MBL01741" };
    respond({ "traffic/4/masters": accepted([master]) });
    const store = useTrafficStore();

    expect(await store.mastersFor(4)).toEqual([master]);

    respond({ "traffic/4/masters": rejected() });
    expect(await store.mastersFor(4)).toEqual([]);
  });

  test("sendQuote posts the approval data with the idempotency key", async () => {
    respond({ traffic_send: accepted([{ id_traffic: 4, code_traffic: "TR-00004", id_house: 90 }]) });
    const payload = {
      quote_kind: "PRICING" as const,
      id_quote: 15376,
      totalIngreso: 100,
      igvIngreso: 0,
      valorIngreso: 100,
      id_opcion: null,
      listCostosInstructivo: [],
      listVentasInstructivo: [],
    };

    const answer = await useTrafficStore().sendQuote(payload, "key-1");

    expect(answer.estadoflag).toBe(true);
    expect(sentConfig("traffic_send")).toMatchObject({
      method: "post",
      headers: { ...JSON_HEADERS, "idempotency-key": "key-1" },
      data: payload,
    });
  });

  test("sendToOperations puts the master choice on the file with the idempotency key", async () => {
    respond({ "traffic/4/send_to_operations": accepted([{ code_master: "2026MBL01742", id_master: 2701, id_house: 90 }]) });

    await useTrafficStore().sendToOperations(4, { nuevoexpediente: true, id_exp: null, fecha_validez: "2026-12-01" }, "key-2");

    expect(sentConfig("traffic/4/send_to_operations")).toMatchObject({
      method: "put",
      headers: { ...JSON_HEADERS, "idempotency-key": "key-2" },
      data: { nuevoexpediente: true, id_exp: null, fecha_validez: "2026-12-01" },
    });
  });

  test("loadFiles keeps the page asked, the totals of every file found, and empties the list when there are none", async () => {
    const counted = { ...listed, totalregistro: "25", totalenviados: "5" };
    respond({ traffic_list: accepted([counted]) });
    const store = useTrafficStore();

    await store.loadFiles({ state: "PENDING" }, { pagina: 2, limit: 10 });
    expect(store.files).toEqual([counted]);
    expect({ total: store.totalFiles, sent: store.sentFiles }).toEqual({ total: 25, sent: 5 });
    expect(sentConfig("traffic_list")!.params).toEqual({ state: "PENDING", pagina: 2, limit: 10 });

    respond({ traffic_list: rejected() });
    await store.loadFiles({}, { pagina: 1, limit: 10 });
    expect(store.files).toEqual([]);
    expect(store.totalFiles).toBe(0);
  });

  test("a slower earlier load does not replace the page asked last", async () => {
    let releaseFirst = () => {};
    httpMock
      .mockImplementationOnce(
        () => new Promise((resolve) => (releaseFirst = () => resolve({ data: accepted([{ ...listed, code_traffic: "TR-OLD" }]) }))),
      )
      .mockImplementationOnce(async () => ({ data: accepted([{ ...listed, code_traffic: "TR-NEW" }]) }));
    const store = useTrafficStore();

    const first = store.loadFiles({}, { pagina: 1, limit: 10 });
    await store.loadFiles({}, { pagina: 2, limit: 10 });
    releaseFirst();
    await first;

    expect(store.files.map((file) => file.code_traffic)).toEqual(["TR-NEW"]);
  });

  test("saveStatus creates a new status and updates an existing one", async () => {
    respond({ traffic_status: accepted([{ id: 1 }]), "traffic_status/1": accepted([{ id: 1 }]) });
    const store = useTrafficStore();

    await store.saveStatus({ name: "Nunca embarcó" });
    await store.saveStatus({ id: 1, name: "Nunca embarcó (cliente)" });

    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url.slice(URL_MAIN.length)])).toEqual([
      ["post", "traffic_status"],
      ["put", "traffic_status/1"],
    ]);
  });

  test("setCorrelative saves the starting number and the manual choice", async () => {
    respond({ traffic_correlative: accepted([]) });

    await useTrafficStore().setCorrelative(null, true);

    expect(sentConfig("traffic_correlative")).toMatchObject({ method: "put", data: { correlativo: null, manual: true } });
  });

  test("correlative returns the next file code", async () => {
    respond({ traffic_correlative: accepted([{ correlativo: null, last_used: 3, next_code: "TR-00004" }]) });

    expect(await useTrafficStore().correlative()).toEqual({ correlativo: null, last_used: 3, next_code: "TR-00004" });
  });
});
