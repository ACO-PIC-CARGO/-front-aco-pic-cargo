import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useAirlinesStore } from "@/stores/airlines";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const lan = { id: 8, code: "LA", code_iata: "LA", code_icao: "LAN", code_three: "045", name: "LATAM", id_pais: 1, status: true };

describe("airlines store", () => {
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

  test("GetListAirline reads the current filters, keeps the trailing whitespace of the query and keeps the rows", async () => {
    respond({ listar_airlines: accepted([lan]) });
    const store = useAirlinesStore();

    await store.GetListAirline();
    store.AirlineFilter = { ...store.AirlineFilter, code: "LA", code_iata: "L", code_icao: "LA", name: "LAT", status: false, id_pais: 1 };
    await store.GetListAirline();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_airlines?id_branch=7&code=&code_iata=&code_icao=&name=&status=true&id_pais=\n        ",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_airlines?id_branch=7&code=LA&code_iata=L&code_icao=LA&name=LAT&status=&id_pais=1\n        ",
    );
    expect(store.lstAirline).toEqual([lan]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListAirline empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_airlines: rejected() });
    const store = useAirlinesStore();
    store.lstAirline = [lan];

    await store.GetListAirline();

    expect(store.lstAirline).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("GetListAirline sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_airlines: rejected("Token vencido", "401") });
    const store = useAirlinesStore();

    await store.GetListAirline();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("GetListAirline keeps the list when the request fails", async () => {
    respond({ listar_airlines: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useAirlinesStore();
    store.lstAirline = [lan];

    await store.GetListAirline();

    expect(store.lstAirline).toEqual([lan]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("the code validations ask about the model and return the answer", async () => {
    respond({
      validate_iata_airlines_nuevo: rejected("a"),
      validate_icao_airlines_nuevo: rejected("b"),
      validate_iata_airlines_editar: rejected("c"),
      validate_icao_airlines_editar: rejected("d"),
    });
    const store = useAirlinesStore();
    store.AirlineModel = { ...lan, id_branch: 5 };

    const answers = [
      await store.ValidateCodigoIATANuevo(),
      await store.ValidateCodigoICAONuevo(),
      await store.ValidateCodigoIATAEditar(),
      await store.ValidateCodigoICAOEditar(),
    ];

    expect(httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length))).toEqual([
      "validate_iata_airlines_nuevo?id_branch=7&code_iata=LA\n        ",
      "validate_icao_airlines_nuevo?id_branch=7&code_icao=LAN",
      "validate_iata_airlines_editar?id=8&id_branch=5&code_iata=LA\n        ",
      "validate_icao_airlines_editar?id=8&id_branch=5&code_icao=LAN",
    ]);
    expect(answers.map((answer) => answer?.mensaje)).toEqual(["a", "b", "c", "d"]);
  });

  test("a failed code validation rejects instead of answering", async () => {
    respond({ validate_iata_airlines_nuevo: new Error("network") });
    const store = useAirlinesStore();

    await expect(store.ValidateCodigoIATANuevo()).rejects.toBeInstanceOf(Error);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("setAirline and actualizarAirline stamp the session branch on the model, send it and show the answer", async () => {
    respond({ insert_airlines: accepted([]), actualizar_airlines: rejected("Duplicado") });
    const store = useAirlinesStore();
    store.AirlineModel = { ...lan, id_branch: 5 };

    await store.setAirline();
    await store.actualizarAirline();

    const sent = { ...lan, id_branch: 7 };
    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insert_airlines", data: sent, headers: JSON_HEADERS });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_airlines", data: sent, headers: JSON_HEADERS });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});
