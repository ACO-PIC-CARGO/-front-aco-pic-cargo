import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useSexStore } from "@/stores/sex";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 3, code: "F", name: "Femenino", acronym: "F", description: "", status: 1 };
const filters = { code: "F 1", name: "Fem & más", acronym: "F/M", description: "a/b", status: 1 };
const defaultFilters = "listar_sex?id_branch=7&code=&name=&acronym=&description=&status=1";

describe("sex store", () => {
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

  test("fetchDataSex lists with the encoded filters, keeps the rows and marks the list loaded", async () => {
    const sex = useSexStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = sex.loading;
      return { data: accepted([row]) };
    });
    sex.loading = true;

    await sex.fetchDataSex(filters);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_sex?id_branch=7&code=F%201&name=Fem%20%26%20m%C3%A1s&acronym=F%2FM&description=a%2Fb&status=1",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(sex.list).toEqual([row]);
    expect(sex.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataSex empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_sex: rejected() });
    const sex = useSexStore();
    sex.list = [row];

    await sex.fetchDataSex(filters);

    expect(sex.list).toEqual([]);
    expect(sex.loading).toBe(true);
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

  test("fetchDataSex sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_sex: rejected("Token vencido", "401") });
    const sex = useSexStore();

    await sex.fetchDataSex(filters);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataSex keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_sex: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const sex = useSexStore();
    sex.list = [row];

    await sex.fetchDataSex(filters);

    expect(sex.list).toEqual([row]);
    expect(sex.loading).toBe(false);
    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("insertSex posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_sex: accepted([]), listar_sex: accepted([row]) });
    const sex = useSexStore();

    await sex.insertSex({ code: "F", name: "Femenino", acronym: "F", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_sex",
      headers: JSON_HEADERS,
      data: { code: "F", name: "Femenino", acronym: "F", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("updateSex puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_sex: rejected("Duplicado"), listar_sex: accepted([]) });
    const sex = useSexStore();

    await sex.updateSex({ code: "F", name: "Femenino", acronym: "F", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_sex",
      headers: JSON_HEADERS,
      data: { code: "F", name: "Femenino", acronym: "F", status: 1 },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaultFilters);
  });

  test("readSex keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_sex: accepted([row]) });
    const sex = useSexStore();

    await sex.readSex(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_sex?id=3", headers: JSON_HEADERS });
    expect(sex.record).toEqual(row);

    respond({ ver_sex: rejected("No existe") });
    await sex.readSex(9);
    expect(sex.record).toEqual(row);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});
