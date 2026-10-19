import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useCoinsStore } from "@/stores/coins";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const usd = { id: 1, code: "6001", symbol: "USD", acronym: "USD", name: "Dólares", description: "", status: 1 };
const filters = { code: "60 01", symbol: "S/.", acronym: "PEN", name: "Soles & más", description: "a/b", status: 1 };
const defaultFilters =
  "listar_coins?id_branch=7&code=&symbol=&acronym=&name=&description=&status=1";

describe("coins store", () => {
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

  test("fetchDataCoins lists with the encoded filters, keeps the rows and marks the list loaded", async () => {
    const coins = useCoinsStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = coins.loading;
      return { data: accepted([usd]) };
    });
    coins.loading = true;

    await coins.fetchDataCoins(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url:
        URL_MAIN +
        "listar_coins?id_branch=7&code=60%2001&symbol=S%2F.&acronym=PEN&name=Soles%20%26%20m%C3%A1s&description=a%2Fb&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(coins.list).toEqual([usd]);
    expect(coins.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataCoins empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_coins: rejected() });
    const coins = useCoinsStore();
    coins.list = [usd];

    await coins.fetchDataCoins(filters);

    expect(coins.list).toEqual([]);
    expect(coins.loading).toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "info",
      text: "No se encontraron registros",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    await flushPromises();
    expect(router.push).not.toHaveBeenCalled();
  });

  test("fetchDataCoins sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_coins: rejected("Token vencido", "401") });
    const coins = useCoinsStore();

    await coins.fetchDataCoins(filters);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataCoins keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_coins: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const coins = useCoinsStore();
    coins.list = [usd];

    await coins.fetchDataCoins(filters);

    expect(coins.list).toEqual([usd]);
    expect(coins.loading).toBe(false);
    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("insertCoins posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_coins: accepted([]), listar_coins: accepted([usd]) });
    const coins = useCoinsStore();

    await coins.insertCoins({ ...usd, id_branch: 7 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_coins",
      headers: JSON_HEADERS,
      data: { ...usd, id_branch: 7 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
    expect(coins.list).toEqual([usd]);
  });

  test("updateCoins puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_coins: rejected("Duplicado"), listar_coins: accepted([usd]) });
    const coins = useCoinsStore();

    await coins.updateCoins({ id: 1, name: "Dólares" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_coins",
      headers: JSON_HEADERS,
      data: { id: 1, name: "Dólares" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readCoins keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_coins: accepted([usd, { id: 2 }]) });
    const coins = useCoinsStore();

    await coins.readCoins(1);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_coins?id=1", headers: JSON_HEADERS });
    expect(coins.record).toEqual(usd);
    expect(Swal.fire).not.toHaveBeenCalled();

    respond({ ver_coins: rejected("No existe") });
    await coins.readCoins(9);

    expect(coins.record).toEqual(usd);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });

  test("getCoinsListCargar fills itemsCoinsList, empties it on rejection and keeps it on failure", async () => {
    respond({ getCoinsList: accepted([usd]) });
    const coins = useCoinsStore();

    await coins.getCoinsListCargar();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "getCoinsList?id_branch=7", headers: JSON_HEADERS });
    expect(coins.itemsCoinsList).toEqual([usd]);

    respond({ getCoinsList: rejected() });
    await coins.getCoinsListCargar();
    expect(coins.itemsCoinsList).toEqual([]);

    coins.itemsCoinsList = [usd];
    respond({ getCoinsList: new Error("network") });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await coins.getCoinsListCargar();
    expect(coins.itemsCoinsList).toEqual([usd]);
    expect(error).toHaveBeenCalled();
  });
});
