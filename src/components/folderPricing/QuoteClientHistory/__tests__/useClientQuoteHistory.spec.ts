import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";
import { LOAD_FAILED, useClientQuoteHistory } from "../useClientQuoteHistory";
import type { ClientQuoteHistoryRow } from "../useClientQuoteHistory";
import { URL_MAIN, accepted, flushPromises, httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));

const DEBOUNCE = 300;

const historyRow = (id: number, fields: Partial<ClientQuoteHistoryRow> = {}): ClientQuoteHistoryRow => ({
  id,
  quote_code: String(id).padStart(8, "0"),
  created_date: "01/01/2026",
  cursor_created_at: `2026-01-01 10:00:${String(id).padStart(2, "0")}.123456`,
  transport_name: "Marítimo",
  shipment_name: "LCL",
  group_flag: false,
  individual_flag: true,
  weight: 1000,
  volume: 2,
  amount: 1000,
  containers: [],
  origin: "SHANGHAI",
  destination: "CALLAO",
  status_name: "APROBADA",
  approved_flag: true,
  multipliers: [{ id: 1, code: 1, valor: 1 }],
  costs: [{ id_multiplicador: 1, costounitario: 100, status: 1, esopcionflag: 1, esventaflag: 0, esorigenflag: 1 }],
  total_count: null,
  has_more: false,
  ...fields,
});

const page = (rows: ClientQuoteHistoryRow[]) => ({ data: accepted(rows) });

function mountHistory(initial: number | null) {
  const clientId = ref<number | null>(initial);
  let history!: ReturnType<typeof useClientQuoteHistory>;
  mount(defineComponent({ setup() { history = useClientQuoteHistory(clientId); return () => null; } }));
  return { clientId, history };
}

const settle = async () => {
  await vi.advanceTimersByTimeAsync(DEBOUNCE);
  await flushPromises();
};

describe("useClientQuoteHistory", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    httpMock.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  test("picking a client loads its first page with totals and the total count", async () => {
    httpMock.mockResolvedValueOnce(page([historyRow(9, { total_count: "7", has_more: true })]));
    const { history } = mountHistory(41);
    await settle();

    const [config] = httpMock.mock.calls[0]!;
    expect(config.url).toBe(`${URL_MAIN}quote_client_history`);
    expect(config.params).toMatchObject({ entitie_id: 41, limit: 5 });
    expect(config.params?.cursor_created_at).toBeUndefined();
    expect(history.items.value).toEqual([expect.objectContaining({ id: 9, cost: 100, sale: 0, profit: -100 })]);
    expect(history.totalCount.value).toBe(7);
    expect(history.hasMore.value).toBe(true);
  });

  test("Ver más asks for the page after the last row and appends it", async () => {
    httpMock
      .mockResolvedValueOnce(page([historyRow(9, { total_count: "2", has_more: true })]))
      .mockResolvedValueOnce(page([historyRow(8)]));
    const { history } = mountHistory(41);
    await settle();

    history.loadMore();
    await flushPromises();

    const [config] = httpMock.mock.calls[1]!;
    expect(config.params).toMatchObject({ entitie_id: 41, cursor_created_at: historyRow(9).cursor_created_at, cursor_id: 9 });
    expect(history.items.value.map((item) => item.id)).toEqual([9, 8]);
    expect(history.totalCount.value).toBe(2);
    expect(history.hasMore.value).toBe(false);
  });

  test("a second Ver más while loading sends nothing", async () => {
    httpMock.mockResolvedValueOnce(page([historyRow(9, { total_count: "3", has_more: true })]));
    const { history } = mountHistory(41);
    await settle();
    httpMock.mockReturnValueOnce(new Promise(() => {}));

    history.loadMore();
    history.loadMore();

    expect(httpMock).toHaveBeenCalledTimes(2);
  });

  test("picking another client aborts the pending request and shows only the new client", async () => {
    let resolveFirst!: (value: unknown) => void;
    httpMock.mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)));
    const { clientId, history } = mountHistory(41);
    await settle();
    httpMock.mockResolvedValueOnce(page([historyRow(5, { total_count: "1" })]));

    clientId.value = 42;
    await settle();
    resolveFirst(page([historyRow(9, { total_count: "1" })]));
    await flushPromises();

    expect((httpMock.mock.calls[0]![0] as { signal?: AbortSignal }).signal?.aborted).toBe(true);
    expect(history.items.value.map((item) => item.id)).toEqual([5]);
  });

  test("returning to a client already loaded does not ask again", async () => {
    httpMock
      .mockResolvedValueOnce(page([historyRow(9, { total_count: "1" })]))
      .mockResolvedValueOnce(page([historyRow(5, { total_count: "1" })]));
    const { clientId, history } = mountHistory(41);
    await settle();
    clientId.value = 42;
    await settle();

    clientId.value = 41;
    await settle();

    expect(httpMock).toHaveBeenCalledTimes(2);
    expect(history.items.value.map((item) => item.id)).toEqual([9]);
  });

  test("a client without quotes is an empty history, not an error", async () => {
    httpMock.mockResolvedValueOnce({ data: rejected() });
    const { history } = mountHistory(41);
    await settle();

    expect(history.loaded.value).toBe(true);
    expect(history.items.value).toEqual([]);
    expect(history.totalCount.value).toBe(0);
    expect(history.errorMessage.value).toBeNull();
  });

  test("a failed request shows the friendly message and Reintentar asks again", async () => {
    httpMock.mockRejectedValueOnce(new Error("Network Error")).mockResolvedValueOnce(page([historyRow(9, { total_count: "1" })]));
    const { history } = mountHistory(41);
    await settle();

    expect(history.errorMessage.value).toBe(LOAD_FAILED);

    history.retry();
    await flushPromises();

    expect(history.errorMessage.value).toBeNull();
    expect(history.items.value.map((item) => item.id)).toEqual([9]);
  });

  test("a rejected session shows the message the server wrote", async () => {
    httpMock.mockResolvedValueOnce({ data: { ...rejected("Tu sesión no tiene acceso a esta empresa."), tipomensaje: "TMSGADV" } });
    const { history } = mountHistory(41);
    await settle();

    expect(history.errorMessage.value).toBe("Tu sesión no tiene acceso a esta empresa.");
  });

  test("no client means no request and no history", async () => {
    const { history } = mountHistory(null);
    await settle();

    expect(httpMock).not.toHaveBeenCalled();
    expect(history.loaded.value).toBe(false);
  });
});
