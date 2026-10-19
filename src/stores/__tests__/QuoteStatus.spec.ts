import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const lead = { id: 4, name: "Nuevo", code: "NEW", position: 2, position_calls: 3, position_report: 4, position_select: 5, status: 1 };

describe("QuoteStatus store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("GetListQuoteStatus sends the filters with the session branch, keeps the rows and then asks for the highest positions", async () => {
    respond({ list_quote_status: accepted([lead]), max_position_quote_status: accepted([lead]) });
    const store = useQuoteStatusStore();
    store.StatusFilter = { ...store.StatusFilter, name: "Nue", status: "0", id_branch: 99 };

    await store.GetListQuoteStatus();
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "list_quote_status",
      params: { ...store.StatusFilter, id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[0]![0].params).toMatchObject({ name: "Nue", status: "0", id_branch: 7 });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "max_position_quote_status?id_branch=7");
    expect(store.statusQuoteList).toEqual([lead]);
    expect([store.max_position, store.max_position_calls, store.max_position_report, store.max_position_select]).toEqual([2, 3, 4, 5]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListQuoteStatus empties the list and tells the user when the backend rejects, without asking for positions", async () => {
    respond({ list_quote_status: rejected() });
    const store = useQuoteStatusStore();
    store.statusQuoteList = [lead];

    await store.GetListQuoteStatus();
    await flushPromises();

    expect(store.statusQuoteList).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
    expect(httpMock).toHaveBeenCalledTimes(1);
  });

  test("GetListQuoteStatus sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ list_quote_status: rejected("Token vencido", "401") });
    const store = useQuoteStatusStore();

    await store.GetListQuoteStatus();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListQuoteStatus keeps the list when the request fails", async () => {
    respond({ list_quote_status: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useQuoteStatusStore();
    store.statusQuoteList = [lead];

    await store.GetListQuoteStatus();

    expect(store.statusQuoteList).toEqual([lead]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("MaxPositionQuoteStatus keeps the previous maxima and shows nothing when the backend rejects", async () => {
    respond({ max_position_quote_status: rejected() });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useQuoteStatusStore();
    store.max_position = 8;

    await store.MaxPositionQuoteStatus();

    expect(store.max_position).toBe(8);
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
  });

  test("the position validations ask about the model and return the answer, or nothing on failure", async () => {
    const paths = [
      "validate_position_status_quote",
      "validate_position_select_status_quote",
      "validate_position_report_status_quote",
      "validate_position_calls_status_quote",
      "validate_position_actualizar_status_quote",
      "validate_position_select_actualizar_status_quote",
      "validate_position_report_actualizar_status_quote",
      "validate_position_calls_actualizar_status_quote",
    ];
    respond(Object.fromEntries(paths.map((path) => [path, rejected(path)])));
    const store = useQuoteStatusStore();
    store.StatusModel = lead;

    const answers = [
      await store.getValidatePositionQuoteStatus(),
      await store.getValidatePositionSelectQuoteStatus(),
      await store.getValidatePositionReportQuoteStatus(),
      await store.getValidatePositionCallsQuoteStatus(),
      await store.getValidatePositionActualizarQuoteStatus(),
      await store.getValidatePositionSelectActualizarQuoteStatus(),
      await store.getValidatePositionReportActualizarQuoteStatus(),
      await store.getValidatePositionCallsActualizarQuoteStatus(),
    ];

    expect(httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length))).toEqual([
      "validate_position_status_quote?id_branch=7&position=2",
      "validate_position_select_status_quote?id_branch=7&position_select=5",
      "validate_position_report_status_quote?id_branch=7&position_report=4",
      "validate_position_calls_status_quote?id_branch=7&position_calls=3",
      "validate_position_actualizar_status_quote?id_branch=7&id=4&position=2",
      "validate_position_select_actualizar_status_quote?id_branch=7&id=4&position_select=5",
      "validate_position_report_actualizar_status_quote?id_branch=7&id=4&position_report=4",
      "validate_position_calls_actualizar_status_quote?id_branch=7&id=4&position_calls=3",
    ]);
    expect(answers.map((answer) => answer?.mensaje)).toEqual(paths);

    vi.spyOn(console, "error").mockImplementation(() => {});
    respond({ validate_position_status_quote: new Error("network") });
    expect(await store.getValidatePositionQuoteStatus()).toBeUndefined();
  });

  test("setQuoteStatus posts and actualizarQuoteStatus puts the current model, each showing the answer", async () => {
    respond({ insertar_position_calls: accepted([]), actualizar_position_calls: rejected("Duplicado") });
    const store = useQuoteStatusStore();
    store.StatusModel = lead;

    await store.setQuoteStatus();
    await store.actualizarQuoteStatus();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_position_calls", headers: JSON_HEADERS, data: lead });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_position_calls", headers: JSON_HEADERS, data: lead });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});
